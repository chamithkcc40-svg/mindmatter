/**
 * GlassRenderer — one WebGL2 layer.
 *
 * Frame pipeline (mirrors the reference lab, with an analytic instanced pass):
 *   pass 1: procedural field → offscreen FBO texture
 *   pass 2: blit that texture to the screen (backdrop layers only)
 *   pass 3: instanced glass surfaces sampling the FBO at refracted coordinates
 *
 * The renderer owns its listeners, observers and GPU resources and can be
 * disposed cleanly. React never re-renders per frame.
 */

import { BLIT_FS, FIELD_FS, FULLSCREEN_VS, GLASS_FS, GLASS_VS } from './glsl';
import { FILL_LIGHT, GLASS_DPR_CAP, GLASS_PIXEL_BUDGET, KEY_LIGHT } from './presets';
import {
  advanceSurfaceEmphasis,
  setReducedMotionPreference,
  startSurfaceRegistry,
  stopSurfaceRegistry,
  subscribeSurfaces,
  surfacesAnimating,
  surfacesForLayer,
  surfaceVersion,
  type GlassSurface,
} from './registry';
import { pointerState, subscribeTicker } from './ticker';
import { reportGlassFailure, reportGlassReady } from './state';

export type LayerBounds = 'viewport' | 'auto' | 'host';

export interface GlassRendererOptions {
  canvas: HTMLCanvasElement;
  layer: string;
  bounds: LayerBounds;
  quality: 'high' | 'low';
  reducedMotion: boolean;
}

interface VisibleSurface {
  surface: GlassSurface;
  x: number;
  y: number;
  w: number;
  h: number;
}

const FLOATS_PER_INSTANCE = 16;
const INSTANCE_CAPACITY = 96;

interface GpuProgram {
  program: WebGLProgram;
  uniforms: Map<string, WebGLUniformLocation | null>;
}

export class GlassRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly layer: string;
  private readonly bounds: LayerBounds;
  private readonly quality: 'high' | 'low';
  private readonly reducedMotion: boolean;

  private gl: WebGL2RenderingContext | null = null;
  private field: GpuProgram | null = null;
  private blit: GpuProgram | null = null;
  private glass: GpuProgram | null = null;

  private triangleVao: WebGLVertexArrayObject | null = null;
  private triangleBuf: WebGLBuffer | null = null;
  private glassVao: WebGLVertexArrayObject | null = null;
  private cornerBuf: WebGLBuffer | null = null;
  private instanceBuf: WebGLBuffer | null = null;
  private instanceCapacity = 0;
  private instanceData = new Float32Array(INSTANCE_CAPACITY * FLOATS_PER_INSTANCE);

  private fbo: WebGLFramebuffer | null = null;
  private fboTex: WebGLTexture | null = null;
  private bufW = 0;
  private bufH = 0;

  private pointer: [number, number] = [0, 0];
  private t0 = 0;
  private dirty = true;
  private disposed = false;
  private contextLost = false;
  private box = { left: 0, top: 0, width: 0, height: 0 };
  private lastVersion = -1;

  private unsubTicker: (() => void) | null = null;
  private unsubSurfaces: (() => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;

  private readonly onScroll = (): void => {
    this.dirty = true;
  };
  private readonly onResize = (): void => {
    this.dirty = true;
  };
  private readonly onContextLost = (event: Event): void => {
    event.preventDefault();
    this.contextLost = true;
    reportGlassFailure();
  };
  private readonly onContextRestored = (): void => {
    this.contextLost = false;
    try {
      this.createPrograms();
      this.createGeometry();
      this.releaseTarget();
      this.dirty = true;
      reportGlassReady();
    } catch (error) {
      reportGlassFailure();
      if (import.meta.env.DEV) console.warn('[liquid-glass] restore failed', error);
    }
  };

  constructor(options: GlassRendererOptions) {
    this.canvas = options.canvas;
    this.layer = options.layer;
    this.bounds = options.bounds;
    this.quality = options.quality;
    this.reducedMotion = options.reducedMotion;

    const gl = this.canvas.getContext('webgl2', {
      alpha: this.bounds !== 'viewport',
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('WebGL2 context unavailable');
    this.gl = gl;

    setReducedMotionPreference(this.reducedMotion);
    this.createPrograms();
    this.createGeometry();

    this.canvas.addEventListener('webglcontextlost', this.onContextLost);
    this.canvas.addEventListener('webglcontextrestored', this.onContextRestored);
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onResize, { passive: true });
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.dirty = true;
      });
      this.resizeObserver.observe(this.canvas);
    }

    startSurfaceRegistry();
    this.unsubSurfaces = subscribeSurfaces(() => {
      this.dirty = true;
    });
    this.unsubTicker = subscribeTicker((now) => this.frame(now));
    reportGlassReady();
  }

  /* ------------------------------------------------------------------ frame */

  private frame(now: number): void {
    if (this.disposed || this.contextLost || !this.gl) return;
    if (this.t0 === 0) this.t0 = now;

    advanceSurfaceEmphasis(now);
    this.pointer = pointerState(now, this.reducedMotion);

    const version = surfaceVersion();
    if (version !== this.lastVersion) {
      this.lastVersion = version;
      this.dirty = true;
    }

    if (this.reducedMotion && !this.dirty && !surfacesAnimating()) return;

    try {
      this.render(now);
      this.dirty = false;
    } catch (error) {
      if (import.meta.env.DEV) console.warn('[liquid-glass] frame failed', error);
    }
  }

  private surfaceBox(): { left: number; top: number; width: number; height: number } | null {
    const viewportW = Math.max(1, window.innerWidth);
    const viewportH = Math.max(1, window.innerHeight);

    if (this.bounds === 'viewport') {
      return { left: 0, top: 0, width: viewportW, height: viewportH };
    }
    if (this.bounds === 'host') {
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return null;
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const surface of surfacesForLayer(this.layer)) {
      const rect = surface.el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;
      if (rect.right < 0 || rect.bottom < 0 || rect.left > viewportW || rect.top > viewportH) {
        continue;
      }
      minX = Math.min(minX, rect.left);
      minY = Math.min(minY, rect.top);
      maxX = Math.max(maxX, rect.right);
      maxY = Math.max(maxY, rect.bottom);
    }
    if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null;

    const pad = 2;
    const left = Math.max(0, Math.floor(minX - pad));
    const top = Math.max(0, Math.floor(minY - pad));
    const right = Math.min(viewportW, Math.ceil(maxX + pad));
    const bottom = Math.min(viewportH, Math.ceil(maxY + pad));
    if (right - left < 2 || bottom - top < 2) return null;
    return { left, top, width: right - left, height: bottom - top };
  }

  private applyBox(box: { left: number; top: number; width: number; height: number }): void {
    if (this.bounds !== 'auto') {
      this.box = box;
      return;
    }
    const prev = this.box;
    if (
      Math.abs(prev.left - box.left) < 0.5 &&
      Math.abs(prev.top - box.top) < 0.5 &&
      Math.abs(prev.width - box.width) < 0.5 &&
      Math.abs(prev.height - box.height) < 0.5
    ) {
      return;
    }
    this.box = box;
    const style = this.canvas.style;
    style.left = `${box.left}px`;
    style.top = `${box.top}px`;
    style.width = `${box.width}px`;
    style.height = `${box.height}px`;
  }

  private pixelRatio(box: { width: number; height: number }): number {
    const device = window.devicePixelRatio || 1;
    let dpr = Math.min(device, GLASS_DPR_CAP[this.quality]);
    const pixels = Math.max(box.width * box.height, 1) * dpr * dpr;
    if (pixels > GLASS_PIXEL_BUDGET) {
      dpr *= Math.sqrt(GLASS_PIXEL_BUDGET / pixels);
    }
    return Math.max(0.75, dpr);
  }

  private render(now: number): void {
    const gl = this.gl;
    if (!gl) return;

    const box = this.surfaceBox();
    if (!box) {
      this.clearCanvas();
      return;
    }
    this.applyBox(box);

    const dpr = this.pixelRatio(box);
    const width = Math.max(2, Math.round(box.width * dpr));
    const height = Math.max(2, Math.round(box.height * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.ensureTarget(width, height);

    const surfaces = surfacesForLayer(this.layer);
    const visible: VisibleSurface[] = [];
    const viewportW = Math.max(1, window.innerWidth);
    const viewportH = Math.max(1, window.innerHeight);

    for (const surface of surfaces) {
      const rect = surface.el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      if (rect.right <= box.left || rect.bottom <= box.top) continue;
      if (rect.left >= box.left + box.width || rect.top >= box.top + box.height) continue;
      if (rect.right < 0 || rect.bottom < 0 || rect.left > viewportW || rect.top > viewportH) continue;
      if (rect.right - rect.left < 2) continue;
      visible.push({
        surface,
        x: (rect.left - box.left) * dpr,
        y: (rect.top - box.top) * dpr,
        w: rect.width * dpr,
        h: rect.height * dpr,
      });
    }

    /*
      Paint containers before their contents. Glass is blended, so a sheet that
      draws after the controls it holds would dim them; sorting large → small
      keeps nesting correct without needing a z-index on every surface.
    */
    visible.sort((a, b) => b.w * b.h - a.w * a.h);

    const time = (now - this.t0) / 1000;
    const scroll = window.scrollY || document.documentElement.scrollTop || 0;

    /* pass 1 — field → FBO */
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, width, height);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(this.field?.program ?? null);
    if (this.field) {
      this.uniform2f(this.field, 'uRes', width, height);
      this.uniform2f(this.field, 'uViewport', viewportW, viewportH);
      this.uniform2f(this.field, 'uOrigin', box.left, box.top);
      this.uniform1f(this.field, 'uDpr', dpr);
      this.uniform1f(this.field, 'uTime', time);
      this.uniform1f(this.field, 'uScroll', scroll);
      this.uniform2f(this.field, 'uPointer', this.pointer[0], this.pointer[1]);
      this.uniform1f(this.field, 'uMotion', this.reducedMotion ? 0 : 1);
      this.uniform1f(this.field, 'uQuality', this.quality === 'high' ? 1 : 0);
    }
    gl.bindVertexArray(this.triangleVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    /* pass 2 — present */
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    if (this.bounds === 'viewport') {
      gl.useProgram(this.blit?.program ?? null);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.fboTex);
      if (this.blit) this.uniform1i(this.blit, 'uTex', 0);
      gl.bindVertexArray(this.triangleVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    /* pass 3 — glass bodies */
    if (visible.length > 0 && this.glass) {
      this.uploadInstances(visible, dpr);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(this.glass.program);
      this.uniform1i(this.glass, 'uBg', 0);
      this.uniform2f(this.glass, 'uRes', width, height);
      this.uniform1f(this.glass, 'uDpr', dpr);
      this.uniform1f(this.glass, 'uTime', time);
      this.uniform1f(this.glass, 'uMotion', this.reducedMotion ? 0 : 1);
      this.uniform1f(this.glass, 'uQuality', this.quality === 'high' ? 1 : 0);
      this.uniform2f(this.glass, 'uPointer', this.pointer[0], this.pointer[1]);
      this.uniform3f(this.glass, 'uKey', KEY_LIGHT[0], KEY_LIGHT[1], KEY_LIGHT[2]);
      this.uniform3f(this.glass, 'uFill', FILL_LIGHT[0], FILL_LIGHT[1], FILL_LIGHT[2]);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.fboTex);
      gl.bindVertexArray(this.glassVao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, visible.length);
      gl.bindVertexArray(null);
      gl.disable(gl.BLEND);
    }
  }

  private clearCanvas(): void {
    const gl = this.gl;
    if (!gl) return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  private uploadInstances(visible: VisibleSurface[], dpr: number): void {
    const gl = this.gl;
    if (!gl) return;
    const needed = visible.length * FLOATS_PER_INSTANCE;
    if (this.instanceData.length < needed) {
      this.instanceData = new Float32Array(needed * 2);
    }
    const data = this.instanceData;
    let offset = 0;
    for (const item of visible) {
      const { surface } = item;
      const preset = surface.preset;
      const radius =
        surface.radius === 'pill'
          ? Math.min(item.w, item.h) * 0.5
          : Math.min(surface.radius, Math.min(item.w, item.h) * 0.5) * dpr;

      data[offset++] = item.x;
      data[offset++] = item.y;
      data[offset++] = item.w;
      data[offset++] = item.h;

      data[offset++] = radius;
      data[offset++] = preset.curvature;
      data[offset++] = surface.emphasis;
      data[offset++] = preset.thickness;

      data[offset++] = surface.tint[0];
      data[offset++] = surface.tint[1];
      data[offset++] = surface.tint[2];
      data[offset++] = surface.alpha;

      data[offset++] = preset.refraction;
      data[offset++] = preset.dispersion;
      data[offset++] = preset.rim;
      data[offset++] = preset.glow;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuf);
    if (this.instanceCapacity < visible.length) {
      this.instanceCapacity = Math.max(visible.length, INSTANCE_CAPACITY);
      gl.bufferData(gl.ARRAY_BUFFER, this.instanceData.byteLength, gl.DYNAMIC_DRAW);
    }
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.instanceData.subarray(0, needed));
  }

  /* ------------------------------------------------------------- GL objects */

  private compile(type: number, source: string): WebGLShader {
    const gl = this.gl;
    if (!gl) throw new Error('No GL context');
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Unable to create shader');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader) ?? 'unknown shader error';
      gl.deleteShader(shader);
      throw new Error(`Shader compile failed: ${log}`);
    }
    return shader;
  }

  private link(vertexSource: string, fragmentSource: string): GpuProgram {
    const gl = this.gl;
    if (!gl) throw new Error('No GL context');
    const program = gl.createProgram();
    if (!program) throw new Error('Unable to create program');
    const vs = this.compile(gl.VERTEX_SHADER, vertexSource);
    const fs = this.compile(gl.FRAGMENT_SHADER, fragmentSource);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program) ?? 'unknown link error';
      gl.deleteProgram(program);
      throw new Error(`Program link failed: ${log}`);
    }
    return { program, uniforms: new Map() };
  }

  private createPrograms(): void {
    this.field = this.link(FULLSCREEN_VS, FIELD_FS);
    this.blit = this.link(FULLSCREEN_VS, BLIT_FS);
    this.glass = this.link(GLASS_VS, GLASS_FS);
  }

  private createGeometry(): void {
    const gl = this.gl;
    if (!gl) return;

    this.triangleVao = gl.createVertexArray();
    gl.bindVertexArray(this.triangleVao);
    this.triangleBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.triangleBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    this.glassVao = gl.createVertexArray();
    gl.bindVertexArray(this.glassVao);
    this.cornerBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.cornerBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.instanceBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuf);
    this.instanceCapacity = INSTANCE_CAPACITY;
    gl.bufferData(
      gl.ARRAY_BUFFER,
      this.instanceData.byteLength,
      gl.DYNAMIC_DRAW,
    );
    const stride = FLOATS_PER_INSTANCE * 4;
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, stride, 0);
    gl.vertexAttribDivisor(1, 1);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, stride, 16);
    gl.vertexAttribDivisor(2, 1);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 4, gl.FLOAT, false, stride, 32);
    gl.vertexAttribDivisor(3, 1);
    gl.enableVertexAttribArray(4);
    gl.vertexAttribPointer(4, 4, gl.FLOAT, false, stride, 48);
    gl.vertexAttribDivisor(4, 1);
    gl.bindVertexArray(null);
  }

  private ensureTarget(width: number, height: number): void {
    const gl = this.gl;
    if (!gl) return;
    if (this.fbo && this.bufW === width && this.bufH === height) return;
    this.releaseTarget();
    this.fboTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.fboTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.fboTex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.bufW = width;
    this.bufH = height;
  }

  private releaseTarget(): void {
    const gl = this.gl;
    if (!gl) return;
    if (this.fbo) gl.deleteFramebuffer(this.fbo);
    if (this.fboTex) gl.deleteTexture(this.fboTex);
    this.fbo = null;
    this.fboTex = null;
    this.bufW = 0;
    this.bufH = 0;
  }

  /* ---------------------------------------------------------------- uniforms */

  private location(program: GpuProgram, name: string): WebGLUniformLocation | null {
    if (!program.uniforms.has(name)) {
      program.uniforms.set(name, this.gl?.getUniformLocation(program.program, name) ?? null);
    }
    return program.uniforms.get(name) ?? null;
  }

  private uniform1f(program: GpuProgram, name: string, value: number): void {
    this.gl?.uniform1f(this.location(program, name), value);
  }

  private uniform1i(program: GpuProgram, name: string, value: number): void {
    this.gl?.uniform1i(this.location(program, name), value);
  }

  private uniform2f(program: GpuProgram, name: string, x: number, y: number): void {
    this.gl?.uniform2f(this.location(program, name), x, y);
  }

  private uniform3f(program: GpuProgram, name: string, x: number, y: number, z: number): void {
    this.gl?.uniform3f(this.location(program, name), x, y, z);
  }

  /* ---------------------------------------------------------------- teardown */

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubTicker?.();
    this.unsubTicker = null;
    this.unsubSurfaces?.();
    this.unsubSurfaces = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored);

    const gl = this.gl;
    if (gl) {
      this.releaseTarget();
      for (const program of [this.field, this.blit, this.glass]) {
        if (program) gl.deleteProgram(program.program);
      }
      if (this.triangleBuf) gl.deleteBuffer(this.triangleBuf);
      if (this.triangleVao) gl.deleteVertexArray(this.triangleVao);
      if (this.cornerBuf) gl.deleteBuffer(this.cornerBuf);
      if (this.instanceBuf) gl.deleteBuffer(this.instanceBuf);
      if (this.glassVao) gl.deleteVertexArray(this.glassVao);

      /*
        Only hand the context back to the browser once the canvas is really
        gone. React (and StrictMode double-invocation in development) reuses the
        same canvas element, and a lost context cannot be re-created on it.
      */
      const canvas = this.canvas;
      const context = gl;
      setTimeout(() => {
        if (!canvas.isConnected) context.getExtension('WEBGL_lose_context')?.loseContext();
      }, 0);
    }
    this.field = null;
    this.blit = null;
    this.glass = null;
    this.triangleVao = null;
    this.triangleBuf = null;
    this.glassVao = null;
    this.cornerBuf = null;
    this.instanceBuf = null;
    this.gl = null;
    stopSurfaceRegistry();
  }
}

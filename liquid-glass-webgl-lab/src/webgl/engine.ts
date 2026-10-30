/**
 * GlassEngine — a self-contained WebGL2 renderer.
 *
 * Frame pipeline (no feedback loop):
 *   pass 1: procedural environment → offscreen FBO texture
 *   pass 2: blit FBO texture → default framebuffer (the visible background)
 *   pass 3: glass bodies sample the FBO texture with displaced coordinates
 *
 * The engine owns its own listeners, observers and GPU resources and can be
 * disposed cleanly. React never re-renders per frame — material params are
 * pushed via setMaterial() and consumed directly by the render loop.
 */

import {
  mat4LookAt,
  mat4Multiply,
  mat4Perspective,
  mat4RotateX,
  mat4RotateY,
  mat4Scale,
  mat4Translate,
  clamp,
  type Mat4,
} from "./math";
import { buildSphere, buildSquircleDome, type MeshData } from "./geometry";
import { BLIT_FS, ENV_FS, FULLSCREEN_VS, GLASS_FS, GLASS_VS } from "./shaders";
import {
  ENVS,
  QUALITY_DPR,
  type CompareMode,
  type EnvId,
  type MaterialParams,
  type Quality,
} from "../lib/presets";

export interface BodyOpts {
  kind: "dome" | "sphere";
  pos: [number, number, number];
  scale: number;
  floatAmp: number;
  floatSpeed: number;
  phase: number;
  /** spheres ignore the global curvature parameter */
  useGlobalCurvature?: boolean;
}

export interface EngineOpts {
  env: EnvId;
  interactive: boolean;
  bodies: BodyOpts[];
  camDist?: number;
  fovDeg?: number;
  maxDpr?: number;
  animate?: boolean;
  autoRotate?: boolean;
  /** initial rotation (rad) */
  rotX?: number;
  rotY?: number;
  onError?: (msg: string) => void;
}

const ENV_INDEX: Record<EnvId, number> = {
  studio: 0,
  geometric: 1,
  abstract: 2,
  light: 3,
};

interface GpuMesh {
  vao: WebGLVertexArrayObject;
  count: number;
  indexType: number;
  buffers: WebGLBuffer[];
}

export class GlassEngine {
  private static progId = 1;

  private canvas: HTMLCanvasElement;
  private opts: EngineOpts;
  private gl: WebGL2RenderingContext | null = null;

  private envProg: WebGLProgram | null = null;
  private blitProg: WebGLProgram | null = null;
  private glassProg: WebGLProgram | null = null;
  private locs = new Map<string, WebGLUniformLocation | null>();

  private quadVao: WebGLVertexArrayObject | null = null;
  private quadBuf: WebGLBuffer | null = null;
  private meshes: Partial<Record<"dome" | "sphere", GpuMesh>> = {};

  private fbo: WebGLFramebuffer | null = null;
  private fboTex: WebGLTexture | null = null;
  private bufW = 0;
  private bufH = 0;

  private material: MaterialParams;
  private env: EnvId;
  private compare: CompareMode = "on";
  private splitFrac = 0.5;
  private animate: boolean;
  private autoRotate: boolean;
  private quality: Quality = "high";

  // interaction state (engine-internal, never touches React)
  private ptx = 0;
  private pty = 0;
  private px = 0;
  private py = 0;
  private tRotX: number;
  private tRotY: number;
  private rotX: number;
  private rotY: number;
  private autoAngle = 0;

  private rafId = 0;
  private running = false;
  private inView = true;
  private lastNow = 0;
  private t0 = 0;
  private disposed = false;
  private contextLost = false;

  private ro: ResizeObserver | null = null;
  private io: IntersectionObserver | null = null;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;

  private onPointerMove: (e: PointerEvent) => void;
  private onPointerDown: (e: PointerEvent) => void;
  private onPointerUp: (e: PointerEvent) => void;
  private onVisibility: () => void;
  private onLost: (e: Event) => void;
  private onRestored: () => void;

  constructor(canvas: HTMLCanvasElement, material: MaterialParams, opts: EngineOpts) {
    this.canvas = canvas;
    this.opts = opts;
    this.material = { ...material, tint: [...material.tint] as [number, number, number] };
    this.env = opts.env;
    this.animate = opts.animate ?? true;
    this.autoRotate = opts.autoRotate ?? false;
    this.tRotX = this.rotX = opts.rotX ?? 0;
    this.tRotY = this.rotY = opts.rotY ?? 0;

    this.onPointerMove = (e) => this.handlePointerMove(e);
    this.onPointerDown = (e) => this.handlePointerDown(e);
    this.onPointerUp = (e) => this.handlePointerUp(e);
    this.onVisibility = () => {
      if (document.hidden) this.stop();
      else if (!this.disposed) this.start();
    };
    this.onLost = (e) => {
      e.preventDefault();
      this.contextLost = true;
      this.stop();
    };
    this.onRestored = () => {
      this.contextLost = false;
      try {
        this.initGlResources();
        this.resize();
        this.start();
      } catch (err) {
        this.opts.onError?.(err instanceof Error ? err.message : String(err));
      }
    };

    try {
      const gl = canvas.getContext("webgl2", {
        antialias: true,
        alpha: false,
        depth: true,
        stencil: false,
        powerPreference: "high-performance",
      });
      if (!gl) throw new Error("WebGL2 is not available in this browser.");
      this.gl = gl;
      this.initGlResources();
    } catch (err) {
      this.opts.onError?.(err instanceof Error ? err.message : String(err));
      return;
    }

    canvas.addEventListener("webglcontextlost", this.onLost);
    canvas.addEventListener("webglcontextrestored", this.onRestored);
    document.addEventListener("visibilitychange", this.onVisibility);

    if (opts.interactive) {
      canvas.addEventListener("pointerdown", this.onPointerDown);
      canvas.addEventListener("pointermove", this.onPointerMove);
      canvas.addEventListener("pointerup", this.onPointerUp);
      canvas.addEventListener("pointercancel", this.onPointerUp);
      canvas.style.cursor = "grab";
    }

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.io = new IntersectionObserver(
      (entries) => {
        this.inView = entries[0]?.isIntersecting ?? true;
        if (this.inView) this.start();
        else this.stop();
      },
      { rootMargin: "80px" }
    );
    this.io.observe(canvas);

    this.resize();
    this.start();
  }

  /* ---------------- public API ---------------- */

  setMaterial(p: Partial<MaterialParams>): void {
    Object.assign(this.material, p);
  }

  setEnv(env: EnvId): void {
    this.env = env;
  }

  setCompare(mode: CompareMode, splitFrac?: number): void {
    this.compare = mode;
    if (splitFrac !== undefined) this.splitFrac = clamp(splitFrac, 0.06, 0.94);
  }

  setAnimate(on: boolean): void {
    this.animate = on;
  }

  setAutoRotate(on: boolean): void {
    this.autoRotate = on;
  }

  setQuality(q: Quality): void {
    this.quality = q;
    this.resize();
  }

  resetView(): void {
    this.tRotX = this.opts.rotX ?? 0;
    this.tRotY = this.opts.rotY ?? 0;
  }

  start(): void {
    if (this.running || this.disposed || this.contextLost || !this.gl || !this.inView) return;
    this.running = true;
    this.lastNow = performance.now();
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  dispose(): void {
    this.disposed = true;
    this.stop();
    this.ro?.disconnect();
    this.io?.disconnect();
    document.removeEventListener("visibilitychange", this.onVisibility);
    const c = this.canvas;
    c.removeEventListener("webglcontextlost", this.onLost);
    c.removeEventListener("webglcontextrestored", this.onRestored);
    c.removeEventListener("pointerdown", this.onPointerDown);
    c.removeEventListener("pointermove", this.onPointerMove);
    c.removeEventListener("pointerup", this.onPointerUp);
    c.removeEventListener("pointercancel", this.onPointerUp);
    this.releaseGlResources();
    this.gl = null;
  }

  /* ---------------- GL setup ---------------- */

  private compile(type: number, src: string): WebGLShader {
    const gl = this.gl!;
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh) || "unknown shader error";
      gl.deleteShader(sh);
      throw new Error(`Shader compile failed: ${log}`);
    }
    return sh;
  }

  private link(vs: string, fs: string): WebGLProgram {
    const gl = this.gl!;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, this.compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, this.compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(`Program link failed: ${gl.getProgramInfoLog(prog)}`);
    }
    (prog as unknown as { __id: number }).__id = GlassEngine.progId++;
    return prog;
  }

  private createMesh(data: MeshData): GpuMesh {
    const gl = this.gl!;
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const vb = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, data.vertices, gl.STATIC_DRAW);
    const ib = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.indices, gl.STATIC_DRAW);
    const stride = 7 * 4;
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 12);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, stride, 24);
    gl.bindVertexArray(null);
    return {
      vao,
      count: data.count,
      indexType: data.indices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT,
      buffers: [vb, ib],
    };
  }

  private initGlResources(): void {
    const gl = this.gl!;
    this.locs.clear();
    this.envProg = this.link(FULLSCREEN_VS, ENV_FS);
    this.blitProg = this.link(FULLSCREEN_VS, BLIT_FS);
    this.glassProg = this.link(GLASS_VS, GLASS_FS);

    this.quadVao = gl.createVertexArray();
    gl.bindVertexArray(this.quadVao);
    this.quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    this.meshes = {};
    for (const b of this.opts.bodies) {
      if (!this.meshes[b.kind]) {
        this.meshes[b.kind] = this.createMesh(
          b.kind === "dome" ? buildSquircleDome() : buildSphere()
        );
      }
    }

    gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);
  }

  private releaseGlResources(): void {
    const gl = this.gl;
    if (!gl) return;
    for (const p of [this.envProg, this.blitProg, this.glassProg]) {
      if (p) gl.deleteProgram(p);
    }
    if (this.quadBuf) gl.deleteBuffer(this.quadBuf);
    if (this.quadVao) gl.deleteVertexArray(this.quadVao);
    for (const key of Object.keys(this.meshes) as ("dome" | "sphere")[]) {
      const m = this.meshes[key];
      if (m) {
        m.buffers.forEach((b) => gl.deleteBuffer(b));
        gl.deleteVertexArray(m.vao);
      }
    }
    if (this.fbo) gl.deleteFramebuffer(this.fbo);
    if (this.fboTex) gl.deleteTexture(this.fboTex);
    this.envProg = this.blitProg = this.glassProg = null;
    this.fbo = this.fboTex = null;
    this.quadVao = this.quadBuf = null;
    this.meshes = {};
  }

  private ensureFbo(w: number, h: number): void {
    const gl = this.gl!;
    if (this.fbo && this.bufW === w && this.bufH === h) return;
    if (this.fbo) gl.deleteFramebuffer(this.fbo);
    if (this.fboTex) gl.deleteTexture(this.fboTex);
    this.fboTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.fboTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.fboTex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.bufW = w;
    this.bufH = h;
  }

  private resize(): void {
    const gl = this.gl;
    if (!gl || this.disposed) return;
    const rect = this.canvas.getBoundingClientRect();
    const cap = Math.min(QUALITY_DPR[this.quality], this.opts.maxDpr ?? 2);
    const dpr = Math.min(window.devicePixelRatio || 1, cap);
    const w = Math.max(2, Math.round(rect.width * dpr));
    const h = Math.max(2, Math.round(rect.height * dpr));
    if (this.canvas.width === w && this.canvas.height === h && this.fbo) return;
    this.canvas.width = w;
    this.canvas.height = h;
    this.ensureFbo(w, h);
  }

  /* ---------------- interaction ---------------- */

  private normPointer(e: PointerEvent): [number, number] {
    const r = this.canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / Math.max(r.width, 1)) * 2 - 1;
    const y = -(((e.clientY - r.top) / Math.max(r.height, 1)) * 2 - 1);
    return [clamp(x, -1, 1), clamp(y, -1, 1)];
  }

  private handlePointerDown(e: PointerEvent): void {
    this.dragging = true;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.canvas.setPointerCapture(e.pointerId);
    this.canvas.style.cursor = "grabbing";
  }

  private handlePointerMove(e: PointerEvent): void {
    const [nx, ny] = this.normPointer(e);
    this.ptx = nx;
    this.pty = ny;
    if (this.dragging) {
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.tRotY += dx * 0.0055;
      this.tRotX = clamp(this.tRotX + dy * 0.0045, -0.9, 0.9);
    }
  }

  private handlePointerUp(e: PointerEvent): void {
    this.dragging = false;
    try {
      this.canvas.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    this.canvas.style.cursor = "grab";
  }

  /* ---------------- frame ---------------- */

  private frame = (now: number): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.frame);
    const dt = Math.min(0.05, (now - this.lastNow) / 1000);
    this.lastNow = now;
    if (this.t0 === 0) this.t0 = now;
    const t = (now - this.t0) / 1000;

    // critically-damped-ish smoothing
    this.px += (this.ptx - this.px) * 0.06;
    this.py += (this.pty - this.py) * 0.06;
    this.rotX += (this.tRotX - this.rotX) * 0.085;
    this.rotY += (this.tRotY - this.rotY) * 0.085;
    if (this.autoRotate) this.autoAngle += dt * 0.28;

    try {
      this.render(t);
    } catch {
      /* a single bad frame must not kill the loop */
    }
  };

  private u(prog: WebGLProgram, name: string): WebGLUniformLocation | null {
    const key = `${(prog as unknown as { __id?: number }).__id ?? ""}:${name}`;
    if (!this.locs.has(key)) this.locs.set(key, this.gl!.getUniformLocation(prog, name));
    return this.locs.get(key) ?? null;
  }

  private render(t: number): void {
    const gl = this.gl!;
    if (this.bufW < 4 || this.bufH < 4) return;
    const w = this.bufW;
    const h = this.bufH;
    const animT = this.animate ? t : 0;

    /* pass 1 — environment → FBO */
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, w, h);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(this.envProg);
    gl.uniform2f(this.u(this.envProg!, "uRes"), w, h);
    gl.uniform1f(this.u(this.envProg!, "uTime"), animT);
    gl.uniform1i(this.u(this.envProg!, "uType"), ENV_INDEX[this.env]);
    gl.uniform2f(this.u(this.envProg!, "uPointer"), this.px, this.py);
    gl.bindVertexArray(this.quadVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    /* pass 2 — blit to screen */
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, w, h);
    gl.useProgram(this.blitProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fboTex);
    gl.uniform1i(this.u(this.blitProg!, "uTex"), 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    /* pass 3 — glass bodies */
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.glassProg);
    const gp = this.glassProg!;

    const aspect = w / h;
    const fov = ((this.opts.fovDeg ?? 34) * Math.PI) / 180;
    const dist = this.opts.camDist ?? 4.4;
    const proj = mat4Perspective(fov, aspect, 0.1, 30);
    const eye: [number, number, number] = [
      this.px * dist * 0.075,
      this.py * dist * 0.055,
      dist,
    ];
    const view = mat4LookAt(eye, [0, 0, 0], [0, 1, 0]);

    gl.uniformMatrix4fv(this.u(gp, "uProj"), false, proj);
    gl.uniformMatrix4fv(this.u(gp, "uView"), false, view);
    gl.uniform3f(this.u(gp, "uCamPos"), eye[0], eye[1], eye[2]);
    gl.uniform2f(this.u(gp, "uRes"), w, h);
    gl.uniform2f(this.u(gp, "uPointer"), this.px, this.py);
    gl.uniform1i(this.u(gp, "uBg"), 0);

    const m = this.material;
    gl.uniform1f(this.u(gp, "uIor"), m.ior);
    gl.uniform1f(this.u(gp, "uStrength"), this.compare === "off" ? 0 : m.strength);
    gl.uniform1f(this.u(gp, "uThickness"), m.thickness);
    gl.uniform1f(this.u(gp, "uReflect"), m.reflect);
    gl.uniform1f(this.u(gp, "uEdge"), m.edge);
    gl.uniform1f(this.u(gp, "uChroma"), m.chroma ? 0.009 : 0);
    gl.uniform1f(this.u(gp, "uFrost"), m.frost);
    gl.uniform1f(this.u(gp, "uAbsorb"), m.absorb);
    gl.uniform3f(this.u(gp, "uTint"), m.tint[0], m.tint[1], m.tint[2]);
    gl.uniform1f(this.u(gp, "uF0"), m.f0);
    gl.uniform1f(this.u(gp, "uSplit"), this.compare === "split" ? 1 : 0);
    gl.uniform1f(this.u(gp, "uSplitX"), this.splitFrac * w);

    const envDef = ENVS.find((e) => e.id === this.env) ?? ENVS[0];
    gl.uniform3f(this.u(gp, "uReflLo"), ...envDef.reflLo);
    gl.uniform3f(this.u(gp, "uReflHi"), ...envDef.reflHi);
    gl.uniform3f(this.u(gp, "uReflStrip"), ...envDef.reflStrip);

    const rot = mat4Multiply(
      mat4RotateY(this.rotY + this.autoAngle),
      mat4RotateX(this.rotX)
    );

    for (const body of this.opts.bodies) {
      const mesh = this.meshes[body.kind];
      if (!mesh) continue;
      const bob = Math.sin(t * body.floatSpeed + body.phase) * body.floatAmp;
      const model: Mat4 = mat4Multiply(
        mat4Translate(body.pos[0], body.pos[1] + bob, body.pos[2]),
        mat4Multiply(rot, mat4Scale(body.scale, body.scale, body.scale))
      );
      gl.uniformMatrix4fv(this.u(gp, "uModel"), false, model);
      const curv = body.useGlobalCurvature === false ? 1 : m.curvature;
      gl.uniform1f(this.u(gp, "uCurvature"), body.kind === "sphere" ? 1 : curv);
      gl.bindVertexArray(mesh.vao);
      gl.drawElements(gl.TRIANGLES, mesh.count, mesh.indexType, 0);
    }
    gl.bindVertexArray(null);
  }
}

export function webgl2Available(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!c.getContext("webgl2");
  } catch {
    return false;
  }
}

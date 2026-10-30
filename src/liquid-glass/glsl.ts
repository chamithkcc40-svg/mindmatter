/**
 * GLSL sources for the Mind Matter liquid glass interface.
 *
 * The technique is adapted from the `liquid-glass-webgl-lab` reference study in
 * this repository (see its `src/webgl/shaders.ts`):
 *
 *   1. FIELD_FS  — a procedural environment (deep-space field, nebula light
 *                  pools, parallax star layers, optics plate markings) is
 *                  rendered into an offscreen texture. It is the *actual*
 *                  backdrop: what you see behind the page and what the glass
 *                  refracts are the same field.
 *   2. BLIT_FS   — copies that texture to the screen (backdrop layers only).
 *   3. GLASS_FS  — draws each registered UI surface as a curved glass body:
 *                  Snell refraction of the field, Schlick Fresnel, studio +
 *                  pointer speculars, Beer–Lambert absorption through the
 *                  apparent optical path, dispersion (RGB IOR split), a
 *                  polished rim and a caustic band inside the lower bevel.
 *
 * Everything is analytic (a rounded-box SDF per instance) so one instanced
 * draw call renders every surface and no meshes are uploaded per frame.
 */

/** Fullscreen triangle (no attributes other than the clip-space position). */
export const FULLSCREEN_VS = `#version 300 es
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main(){
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

/**
 * Mind Matter deep-space field.
 * Screen anchored: every layer (backdrop, header chrome, explorer stage) runs
 * the same shader with the same origin, so a glass surface in any layer
 * refracts the same field that is visible around it.
 */
export const FIELD_FS = `#version 300 es
precision highp float;

uniform vec2  uRes;        // drawing buffer size (device px)
uniform vec2  uViewport;   // CSS viewport size
uniform vec2  uOrigin;     // canvas top-left inside the viewport (CSS px)
uniform float uDpr;
uniform float uTime;       // seconds, frozen by uMotion
uniform float uScroll;     // document scrollY (CSS px)
uniform vec2  uPointer;    // smoothed pointer, -1..1
uniform float uMotion;     // 1 = animate, 0 = still frame
uniform float uQuality;    // 1 = high, 0 = reduced

out vec4 frag;

float hash21(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p){
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++){
    s += a * vnoise(p);
    p = p * 2.03 + vec2(37.1, 17.7);
    a *= 0.5;
    if (i == 1 && uQuality < 0.5) break;
  }
  return s;
}

vec3 pool(vec2 p, vec2 c, float r, vec3 col){
  float d = length(p - c) / max(r, 0.001);
  return col * exp(-d * d * 1.55);
}

float ringLine(vec2 p, vec2 c, float r, float w){
  float d = abs(length(p - c) - r);
  float aa = fwidth(d) * 1.6 + 0.0004;
  return 1.0 - smoothstep(w - aa, w + aa, d);
}

float stars(vec2 p, float density, float seed, float time){
  vec2 g = p * density;
  vec2 cell = floor(g);
  vec2 f = fract(g) - 0.5;
  float h = hash21(cell + seed);
  float present = smoothstep(0.952, 0.999, h);
  vec2 jit = vec2(hash21(cell + seed + 3.7), hash21(cell + seed + 9.1)) - 0.5;
  float d = length(f - jit * 0.62);
  float core = smoothstep(0.105, 0.0, d);
  float halo = exp(-d * d * 22.0) * 0.42;
  float tw = 0.62 + 0.38 * sin(time * (0.7 + h * 2.4) + h * 32.0);
  return present * (core + halo) * tw;
}

void main(){
  vec2 local = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  vec2 vp = local + uOrigin;
  vec2 p = (vp - 0.5 * uViewport) / max(uViewport.y, 1.0);
  float aspect = uViewport.x / max(uViewport.y, 1.0);
  float t = uTime * uMotion;
  float sy = uScroll / max(uViewport.y, 1.0);

  /* ---- deep field: near-black, cool, with a faint upper atmosphere ---- */
  vec3 col = mix(vec3(0.017, 0.021, 0.042), vec3(0.004, 0.005, 0.012),
                 clamp(0.48 + p.y * 0.52, 0.0, 1.0));
  col += vec3(0.007, 0.012, 0.030) * smoothstep(0.5, -0.8, p.y);

  /* ---- slow colour fields: the light the glass has to bend ---- */
  vec2 drift = 0.055 * vec2(sin(t * 0.07), cos(t * 0.055));
  float cloudA = fbm(p * 2.1 + vec2(3.4, sy * 0.26) + drift);
  float cloudB = fbm(p * 1.35 - vec2(sy * 0.15, 1.7) - drift * 0.6);
  float maskA = 0.45 + 0.85 * cloudA;
  float maskB = 0.45 + 0.85 * cloudB;

  col += pool(p, vec2(0.44 * aspect + 0.06, -0.30) + drift, 0.72,
              vec3(0.030, 0.060, 0.150)) * maskA;
  col += pool(p, vec2(-0.34, 0.14) - drift * 0.8, 0.66,
              vec3(0.060, 0.028, 0.130)) * maskB;
  col += pool(p, vec2(0.12, 0.58) + drift * 1.2, 0.52,
              vec3(0.010, 0.055, 0.090)) * maskA;
  col += pool(p, uPointer * vec2(0.32, 0.24) + vec2(0.0, 0.05), 0.42,
              vec3(0.014, 0.022, 0.052));

  /* ---- studio light bands: broad, very low contrast ---- */
  float bandA = exp(-pow((p.x * 0.72 + p.y * 0.66 - 0.44) / 0.24, 2.0));
  col += vec3(0.026, 0.038, 0.072) * bandA;
  float bandB = exp(-pow((p.x * -0.5 + p.y * 0.85 - 0.08) / 0.18, 2.0));
  col += vec3(0.016, 0.024, 0.048) * bandB;

  /* ---- optics plate: rings + arcs + registration grid ---- */
  vec2 c = vec2(0.30 * aspect - 0.14, -0.20) + vec2(0.0, sy * 0.05);
  col += vec3(0.16, 0.24, 0.46) * ringLine(p, c, 0.52, 0.0009) * 0.34;
  col += vec3(0.14, 0.21, 0.42) * ringLine(p, c, 0.70, 0.0011) * 0.22;
  col += vec3(0.12, 0.18, 0.38) * ringLine(p, c, 0.90, 0.0013) * 0.12;
  float ang = atan(p.y - c.y, p.x - c.x);
  float arcs = step(0.58, fract(ang * 5.0 + 0.15));
  col += vec3(0.15, 0.23, 0.45) * ringLine(p, c, 0.61, 0.0015) * 0.22 * arcs;

  /* fine lattice: sub-pixel detail that only reads through the glass */
  vec2 lattice = abs(fract(vp / 22.0) - 0.5) / 22.0;
  float dots = 1.0 - smoothstep(0.0006, 0.0016, length(lattice));
  col += vec3(0.14, 0.20, 0.36) * dots * 0.10;

  vec2 gq = abs(fract(p * 13.0) - 0.5) / 13.0;
  float grid = 1.0 - smoothstep(0.0004, 0.0011, min(gq.x, gq.y));
  col += vec3(0.11, 0.16, 0.30) * grid * 0.05 * smoothstep(0.55, -0.15, p.y);

  /* ---- parallax star layers ---- */
  float s1 = stars(p + vec2(0.0, sy * 0.16), 138.0, 3.0, t);
  float s2 = stars(p + vec2(5.31, sy * 0.30), 76.0, 41.0, t * 0.8);
  float s3 = stars(p + vec2(11.7, sy * 0.46), 38.0, 91.0, t * 0.55);
  col += vec3(0.82, 0.89, 1.00) * s1 * 0.72;
  col += vec3(0.66, 0.78, 0.98) * s2 * 0.40;
  col += vec3(0.82, 0.74, 1.00) * s3 * 0.26;

  /* ---- distant atmosphere, upper right: a halo, never a bright disc ---- */
  vec2 bodyC = vec2(aspect * 0.40 + 0.06, -0.36);
  float bd = length(p - bodyC);
  col += vec3(0.030, 0.070, 0.170) * exp(-pow(bd / 0.62, 1.7));
  col += vec3(0.10, 0.18, 0.34) * exp(-pow((bd - 0.30) / 0.05, 2.0)) * 0.35;

  /* ---- vignette + grain ---- */
  col *= 1.0 - 0.50 * pow(length(p * vec2(0.60, 1.0)), 2.0);
  col += (hash21(gl_FragCoord.xy + fract(t) * 13.0) - 0.5) * 0.010;

  frag = vec4(max(col, 0.0), 1.0);
}`;

export const BLIT_FS = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
out vec4 frag;
void main(){ frag = texture(uTex, vUv); }`;

/**
 * Instanced glass surface.
 *   aCorner 0..1 within the surface rect
 *   aRect   x, y, w, h                (device px, canvas space, y down)
 *   aShape  radius, curvature, emphasis, thickness
 *   aTint   rgb transmittance, opacity
 *   aOptics refraction, dispersion, rim, glow
 */
export const GLASS_VS = `#version 300 es
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec4 aRect;
layout(location = 2) in vec4 aShape;
layout(location = 3) in vec4 aTint;
layout(location = 4) in vec4 aOptics;

uniform vec2 uRes;

out vec2 vLocal;
flat out vec2 vSize;
flat out vec4 vShape;
flat out vec4 vTint;
flat out vec4 vOptics;

void main(){
  vec2 px = aRect.xy + aCorner * aRect.zw;
  vec2 clip = px / uRes * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  vLocal = aCorner * aRect.zw;
  vSize = aRect.zw;
  vShape = aShape;
  vTint = aTint;
  vOptics = aOptics;
}`;

export const GLASS_FS = `#version 300 es
precision highp float;

in vec2 vLocal;
flat in vec2 vSize;
flat in vec4 vShape;
flat in vec4 vTint;
flat in vec4 vOptics;

uniform sampler2D uBg;
uniform vec2  uRes;
uniform float uDpr;
uniform float uTime;
uniform float uMotion;
uniform float uQuality;
uniform vec2  uPointer;
uniform vec3  uKey;    // key light (cool white)
uniform vec3  uFill;   // fill light (blue)

out vec4 frag;

const float IOR = 1.52;
const float F0 = 0.045;

float sdRoundBox(vec2 p, vec2 b, float r){
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

float hash21(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}

vec3 sampleBg(vec2 uv){
  return texture(uBg, clamp(uv, vec2(0.0018), vec2(0.9982))).rgb;
}

void main(){
  vec2 halfSize = max(vSize * 0.5, vec2(1.0));
  vec2 q = vLocal - halfSize;

  float radius = clamp(vShape.x, 0.0, min(halfSize.x, halfSize.y));
  float sdf = sdRoundBox(q, halfSize, radius);
  float aa = fwidth(sdf) * 1.15 + 0.0002;
  if (sdf > aa) discard;
  float cover = 1.0 - smoothstep(-aa, aa, sdf);

  float edge = max(-sdf, 0.0);
  float span = min(halfSize.x, halfSize.y);
  float depth = clamp(edge / max(span, 1.0), 0.0, 1.0);   // 0 rim, 1 centre
  float px = max(uDpr, 0.6);

  /* outward surface gradient from the SDF */
  float e = max(px * 0.9, 1.0);
  vec2 g = vec2(
    sdRoundBox(q + vec2(e, 0.0), halfSize, radius) - sdRoundBox(q - vec2(e, 0.0), halfSize, radius),
    sdRoundBox(q + vec2(0.0, e), halfSize, radius) - sdRoundBox(q - vec2(0.0, e), halfSize, radius)
  );
  g = normalize(g + vec2(1e-5));

  float emphasis = clamp(vShape.z, 0.0, 1.0);

  /*
    Surface normal = gentle overall bow + a narrow rim bevel.
    The bow is what stops a flat plate from mirroring a single light straight
    back at the viewer (the classic "grey slab" failure), and it makes the
    speculars travel as the pointer moves.
  */
  float bevelPx = clamp(min(span * 0.30, 24.0 * px), 4.0 * px, 24.0 * px);
  float bevel = pow(1.0 - smoothstep(0.0, bevelPx, edge), 1.4);
  vec2 nq = q / halfSize;
  float bow = 0.14 * (0.6 + 0.7 * vShape.y);
  float rimTilt = bevel * (0.92 + 0.55 * emphasis) * vShape.y;
  vec3 N = normalize(vec3(nq * bow + g * rimTilt, 1.0));
  float ndv = clamp(N.z, 0.0, 1.0);

  /* liquid micro-warp, motion only */
  float wobble = 0.0;
  if (uMotion > 0.5) {
    float n = vnoise(q / (34.0 * px) + vec2(uTime * 0.20, uTime * 0.12));
    wobble = (n - 0.5) * 2.0;
  }

  /* Snell refraction, screen-space lateral displacement */
  vec3 I = vec3(0.0, 0.0, -1.0);
  vec3 R = refract(I, N, 1.0 / IOR);
  float bevelBoost = 0.35 + 1.35 * bevel;
  vec2 bend = R.xy * (vShape.w * 155.0 * vOptics.x * bevelBoost * px);
  vec2 magnify = -q / halfSize * (2.3 * vShape.w * px);
  vec2 liquid = vec2(wobble, wobble * 0.7) * (0.7 + 1.5 * emphasis) * vOptics.x * px;
  vec2 off = bend + magnify + liquid;

  /* dispersion: three refractive indices */
  float disp = vOptics.y * (0.4 + 0.6 * bevel);
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 trans;
  if (uQuality > 0.5 && disp > 0.0004) {
    vec3 sr = sampleBg(uv + off * (1.0 + disp * 4.0) / uRes);
    vec3 sg = sampleBg(uv + off / uRes);
    vec3 sb = sampleBg(uv + off * (1.0 - disp * 4.0) / uRes);
    trans = vec3(sr.r, sg.g, sb.b);
  } else {
    trans = sampleBg(uv + off / uRes);
  }

  /* Beer–Lambert absorption along the apparent optical path */
  vec3 tint = clamp(vTint.rgb, 0.0, 1.0);
  float path = (0.55 + 1.95 * (1.0 - depth) * (1.0 - depth)) * vShape.w;
  vec3 sigma = (1.0 - tint) * 0.85;
  trans *= exp(-sigma * path);
  trans += tint * 0.014;

  /* Schlick Fresnel */
  float F = F0 + (1.0 - F0) * pow(1.0 - ndv, 5.0);

  /*
    Environment reflection: a dark studio gradient (so the slab stays clear)
    plus two narrow softbox strips that only appear at grazing angles.
  */
  vec3 Rf = reflect(I, N);
  vec3 refl = mix(vec3(0.013, 0.016, 0.030), vec3(0.070, 0.098, 0.180),
                  smoothstep(-0.6, 0.95, Rf.y));
  refl += uKey * exp(-pow((Rf.y - 0.52) * 6.5, 2.0)) * 0.34;
  refl += uFill * exp(-pow((Rf.y + 0.60) * 7.5, 2.0)) * 0.22;
  refl += uKey * exp(-pow((Rf.x - 0.62) * 4.5, 2.0)) * 0.07;

  vec3 L1 = normalize(vec3(-0.42, 0.78, 0.52));
  vec3 L2 = normalize(vec3(0.66, -0.42, 0.55));
  /* pointer light sits off-axis so it glints on tilted glass, never floods */
  vec3 Lp = normalize(vec3(0.60 + uPointer.x * 0.85, 0.46 - uPointer.y * 0.80, 0.46));
  float sTight = pow(max(dot(Rf, L1), 0.0), 220.0) * 0.55;
  float sSoft  = pow(max(dot(Rf, L1), 0.0), 24.0) * 0.05;
  float sFill  = pow(max(dot(Rf, L2), 0.0), 60.0) * 0.10;
  float sPoint = pow(max(dot(Rf, Lp), 0.0), 90.0) * (0.35 + 0.65 * emphasis) * 0.55;

  float kR = clamp(F * 1.5, 0.0, 0.92);
  vec3 col = trans * (1.0 - kR) + refl * kR;
  col += uKey * (sTight + sSoft + sPoint);
  col += uFill * sFill;

  /* polished rim: brighter on the edge that faces the key light */
  float topBias = clamp(0.5 - 0.5 * g.y, 0.0, 1.0);
  float rim = 1.0 - smoothstep(0.0, 1.7 * px, edge);
  col += uKey * rim * (0.10 + 0.62 * topBias) * vOptics.z;
  col += mix(uFill, uKey, 0.55) * rim * (0.05 + 0.26 * (1.0 - topBias)) * vOptics.z;

  /* light scattered through the thick rim */
  float rimHalo = exp(-edge / (7.0 * px)) * (0.35 + 0.65 * topBias);
  col += uKey * rimHalo * 0.045 * vOptics.z;
  col += tint * rimHalo * vOptics.w * 0.20;

  /* focused caustic just inside the lower bevel */
  float bottomBias = clamp(0.5 + 0.5 * g.y, 0.0, 1.0);
  float caustic = exp(-pow((edge - 4.5 * px) / (7.5 * px), 2.0)) * bottomBias;
  col += uKey * caustic * 0.20 * vOptics.z;

  /*
    Lit liquid glass (primary controls). An accent control has to look the same
    on every backdrop, so above a threshold the surface stops transmitting and
    becomes self-luminous: the pigment stays the brand blue, the dome adds a
    vertical falloff, and the crown picks up the rim light.
  */
  float lit = clamp(vOptics.w, 0.0, 1.6);
  if (lit > 0.001) {
    vec3 emissive = tint * 1.16 + vec3(0.012, 0.030, 0.070);
    emissive *= 1.0 - 0.16 * depth;
    /* edge light takes the pigment's hue, so the rim reads as glass, not neon */
    emissive += mix(uKey, tint, 0.55) * rimHalo * 0.14 * lit;
    float litMix = clamp(lit, 0.0, 1.0) * (0.82 + 0.18 * (1.0 - depth));
    col = mix(col, emissive, litMix);
    col += mix(uKey, tint, 0.6) * caustic * 0.22 * lit;
  }

  /* contact shading gives the plate thickness */
  col *= 1.0 - 0.20 * bottomBias * (1.0 - smoothstep(0.0, 22.0 * px, edge));

  /*
   Top-surface sheen: a faint gradient of skylight across the upper third,
   not a wash. Keeps the centre transparent while the plate reads as solid.
  */
  float upper = 1.0 - smoothstep(-0.15, 0.62, vLocal.y / max(vSize.y, 1.0));
  col += mix(uKey, uFill, 0.35) * upper * 0.030;

  /* faint internal scatter so thick regions never read pure black */
  col += tint * 0.010 * (1.0 - ndv);

  /* fine grain so large panes never band */
  col += (hash21(gl_FragCoord.xy * 0.7 + 3.0) - 0.5) * 0.010;

  float alpha = clamp(vTint.a, 0.0, 1.0);
  alpha = mix(alpha, 1.0, 1.0 - smoothstep(0.0, 6.0 * px, edge));
  alpha = mix(alpha, 1.0, clamp(vOptics.w * 0.45, 0.0, 0.45));

  float a = cover * alpha;
  frag = vec4(max(col, 0.0) * a, a);
}`;

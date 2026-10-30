/**
 * GLSL sources for the Liquid Glass Lab.
 *
 * Pipeline:
 *  1. ENV_FS renders a rich procedural environment into an offscreen texture.
 *  2. BLIT_FS copies that texture to the default framebuffer.
 *  3. GLASS_FS renders curved glass geometry, sampling the environment texture
 *     with refraction-displaced coordinates (Snell-based screen-space approximation),
 *     Schlick Fresnel, Beer–Lambert absorption and dispersion-based chromatic aberration.
 */

export const FULLSCREEN_VS = `#version 300 es
layout(location=0) in vec2 aPos;
out vec2 vUv;
void main(){
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

export const ENV_FS = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;      // seconds (0 when animation disabled)
uniform int uType;        // 0 studio dark | 1 geometric | 2 abstract | 3 light
uniform vec2 uPointer;    // smoothed pointer, -1..1
out vec4 frag;

float gridL(vec2 p, float sp, float w){
  vec2 q = abs(fract(p / sp) - 0.5) * sp;
  float d = min(q.x, q.y);
  float aa = fwidth(d) * 1.4 + 0.3;
  return 1.0 - smoothstep(w - aa, w + aa, d);
}

float rectSdf(vec2 p, vec2 b){
  vec2 d = abs(p) - b;
  return max(d.x, d.y);
}

float aastep(float d){
  float aa = fwidth(d) * 1.4 + 0.35;
  return 1.0 - smoothstep(-aa, aa, d);
}

float ringL(vec2 p, vec2 c, float r, float w){
  float d = abs(length(p - c) - r);
  float aa = fwidth(d) * 1.4 + 0.3;
  return 1.0 - smoothstep(w - aa, w + aa, d);
}

float crossMark(vec2 p, float sp, float len, float w){
  vec2 q = mod(p, sp) - sp * 0.5;
  float d = min(rectSdf(q, vec2(len, w)), rectSdf(q, vec2(w, len)));
  return aastep(d);
}

vec3 blob(vec2 pc, vec2 c, float r, vec3 col){
  float d = length(pc - c) / r;
  return col * exp(-d * d);
}

void main(){
  vec2 p  = gl_FragCoord.xy;
  vec2 pc = (p - 0.5 * uRes) / uRes.y;   // centered, aspect-corrected (unit = height)
  float t = uTime;
  vec3 col;

  if (uType == 0) {
    /* -------- STUDIO DARK -------- */
    vec2 drift = 0.06 * vec2(sin(t * 0.21), cos(t * 0.17));
    col = mix(vec3(0.040, 0.043, 0.058), vec3(0.012, 0.013, 0.020),
              clamp(0.5 - pc.y * 0.9, 0.0, 1.0));
    // controlled coloured light pools
    col += blob(pc, vec2(-0.62, 0.38) + drift, 0.55, vec3(0.14, 0.28, 0.62));
    col += blob(pc, vec2(0.66, -0.05) - drift * 0.8, 0.5, vec3(0.38, 0.18, 0.06));
    col += blob(pc, vec2(0.05, -0.55), 0.62, vec3(0.15, 0.09, 0.4));
    col += blob(pc, uPointer * 0.35 + vec2(0.0, 0.1), 0.5, vec3(0.06, 0.08, 0.14));
    // structural marks
    col += vec3(0.5, 0.62, 0.9) * gridL(p, 28.0, 0.55) * 0.06;
    col += vec3(0.55, 0.66, 0.95) * gridL(p, 140.0, 0.8) * 0.10;
    col += vec3(0.7, 0.78, 1.0) * crossMark(p + 70.0, 140.0, 5.0, 0.7) * 0.42;
    col += vec3(0.55, 0.68, 1.0) * ringL(pc, vec2(0.0), 0.30, 0.0012) * 0.42;
    col += vec3(0.45, 0.55, 0.95) * ringL(pc, vec2(-0.44, -0.26), 0.11, 0.0010) * 0.5;
    col += vec3(1.0, 0.72, 0.4)  * ringL(pc, vec2(0.47, 0.24), 0.075, 0.0010) * 0.55;
    // small solid reference tiles (distortion proof)
    float tile = aastep(rectSdf(pc - vec2(0.485, -0.30), vec2(0.028)));
    col = mix(col, vec3(0.85, 0.6, 0.25), tile * 0.85);
    float tile2 = aastep(rectSdf(pc - vec2(-0.5, 0.32), vec2(0.02, 0.055)));
    col = mix(col, vec3(0.4, 0.62, 1.0), tile2 * 0.7);
    // vignette
    col *= 1.0 - 0.45 * pow(length(pc * vec2(0.75, 1.0)), 2.2);
  }
  else if (uType == 1) {
    /* -------- GEOMETRIC (high contrast engineering plate) -------- */
    col = vec3(0.020, 0.021, 0.026);
    col += vec3(0.8) * gridL(p, 24.0, 0.5) * 0.13;
    col += vec3(0.9) * gridL(p, 120.0, 0.8) * 0.22;
    // concentric rings
    for (int i = 1; i <= 4; i++) {
      col += vec3(0.75, 0.82, 0.95) * ringL(pc, vec2(0.0), float(i) * 0.095, 0.0011) * 0.34;
    }
    // diagonals
    float diag = aastep(abs(pc.x - pc.y) - 0.0009);
    col += vec3(0.6, 0.7, 0.9) * diag * 0.22;
    float diag2 = aastep(abs(pc.x + pc.y) - 0.0009);
    col += vec3(0.6, 0.7, 0.9) * diag2 * 0.22;
    // accent geometry
    col += vec3(0.1, 0.85, 1.0) * ringL(pc, vec2(-0.42, 0.24), 0.07, 0.0016) * 0.9;
    col += vec3(1.0, 0.3, 0.62) * ringL(pc, vec2(0.44, -0.22), 0.05, 0.0016) * 0.9;
    col += vec3(0.1, 0.85, 1.0) * aastep(length(pc - vec2(0.44, 0.26)) - 0.008) * 0.9;
    col += vec3(1.0, 0.3, 0.62) * aastep(length(pc - vec2(-0.4, -0.3)) - 0.008) * 0.9;
    // checker patch
    vec2 ck = floor((pc - vec2(-0.75, -0.42)) / 0.035);
    float inPatch = aastep(rectSdf(pc - vec2(-0.61, -0.28), vec2(0.14)));
    float checker = mod(ck.x + ck.y, 2.0);
    col = mix(col, vec3(0.16 + 0.5 * checker), inPatch * 0.6);
    // cross registration marks
    col += vec3(0.9) * crossMark(p, 120.0, 4.5, 0.6) * 0.4;
    col *= 1.0 - 0.35 * pow(length(pc * vec2(0.8, 1.0)), 2.0);
  }
  else if (uType == 2) {
    /* -------- ABSTRACT COLOUR FIELD -------- */
    float x = pc.x, y = pc.y;
    float f1 = sin(x * 2.6 + t * 0.24) + sin(y * 3.1 - t * 0.19);
    float f2 = sin((x + y) * 3.4 - t * 0.15) + sin(length(pc - vec2(0.3, -0.2)) * 5.0 - t * 0.3);
    vec3 cA = vec3(0.05, 0.10, 0.30);
    vec3 cB = vec3(0.24, 0.07, 0.38);
    vec3 cC = vec3(0.02, 0.30, 0.30);
    vec3 cD = vec3(0.42, 0.20, 0.06);
    col = mix(cA, cB, 0.5 + 0.5 * sin(f1));
    col = mix(col, cC, 0.5 + 0.5 * sin(f2 * 0.7 + 1.3));
    col = mix(col, cD, 0.35 + 0.35 * sin(f1 * 0.5 - f2));
    col *= 0.85;
    // drifting light sources
    col += blob(pc, vec2(0.45 * sin(t * 0.3), 0.3 * cos(t * 0.23)), 0.18, vec3(0.9, 0.55, 0.2)) * 0.9;
    col += blob(pc, vec2(-0.4 * cos(t * 0.26), -0.28 * sin(t * 0.33)), 0.15, vec3(0.3, 0.6, 1.0)) * 0.9;
    col += blob(pc, vec2(0.1, 0.42), 0.12, vec3(0.9, 0.3, 0.6)) * 0.55;
    // fine structure for distortion legibility
    col += vec3(1.0) * gridL(p, 26.0, 0.45) * 0.06;
    col += vec3(1.0) * ringL(pc, vec2(0.02, -0.04), 0.24, 0.0011) * 0.35;
    col += vec3(1.0) * crossMark(p + 60.0, 120.0, 4.0, 0.6) * 0.25;
    col *= 1.0 - 0.3 * pow(length(pc * vec2(0.8, 1.0)), 2.2);
  }
  else {
    /* -------- CLEAN LIGHT STUDIO -------- */
    vec2 drift = 0.05 * vec2(sin(t * 0.2), cos(t * 0.16));
    col = mix(vec3(0.965, 0.968, 0.975), vec3(0.90, 0.912, 0.93),
              clamp(0.5 - pc.y, 0.0, 1.0));
    col += blob(pc, vec2(-0.55, 0.4) + drift, 0.6, vec3(0.10, 0.12, 0.16));
    col += blob(pc, vec2(0.6, -0.3) - drift, 0.55, vec3(0.09, 0.06, 0.02));
    col -= vec3(0.10) * gridL(p, 32.0, 0.5) * 0.5;
    col -= vec3(0.12) * gridL(p, 160.0, 0.9) * 0.7;
    col -= vec3(0.35) * ringL(pc, vec2(0.0), 0.32, 0.0014) * 0.8;
    col -= vec3(0.30) * ringL(pc, vec2(0.42, 0.2), 0.10, 0.0012) * 0.7;
    col -= vec3(0.45) * crossMark(p + 80.0, 160.0, 5.0, 0.7) * 0.8;
    float t1 = aastep(rectSdf(pc - vec2(-0.46, -0.28), vec2(0.030, 0.06)));
    col = mix(col, vec3(0.15, 0.35, 0.85), t1 * 0.85);
    float t2 = aastep(rectSdf(pc - vec2(0.5, 0.28), vec2(0.024)));
    col = mix(col, vec3(0.9, 0.45, 0.15), t2 * 0.8);
    col *= 1.0 - 0.10 * pow(length(pc * vec2(0.8, 1.0)), 2.0);
  }

  frag = vec4(col, 1.0);
}`;

export const BLIT_FS = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
out vec4 frag;
void main(){ frag = texture(uTex, vUv); }`;

export const GLASS_VS = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNormal;
layout(location=2) in float aThick;
uniform mat4 uProj;
uniform mat4 uView;
uniform mat4 uModel;
uniform float uCurvature;   // z-scale applied to the baked unit dome
out vec3 vN;
out vec3 vP;
out float vT;
void main(){
  vec3 p = vec3(aPos.xy, aPos.z * uCurvature);
  vec4 wp = uModel * vec4(p, 1.0);
  vP = wp.xyz;
  // co-normal for the non-uniform z scale, then rigid model transform
  vec3 n = normalize(vec3(aNormal.xy, aNormal.z / max(uCurvature, 0.06)));
  vN = mat3(uModel) * n;
  vT = aThick;
  gl_Position = uProj * uView * wp;
}`;

export const GLASS_FS = `#version 300 es
precision highp float;

in vec3 vN;
in vec3 vP;
in float vT;
out vec4 frag;

uniform sampler2D uBg;
uniform vec2 uRes;          // drawing buffer size (matches gl_FragCoord space)
uniform vec3 uCamPos;
uniform vec2 uPointer;      // smoothed, -1..1

uniform float uIor;
uniform float uStrength;    // refraction strength (0 disables displacement)
uniform float uThickness;   // apparent thickness
uniform float uCurvature;
uniform float uReflect;     // reflection intensity
uniform float uEdge;        // rim highlight intensity
uniform float uChroma;      // dispersion amount (0 = off)
uniform float uFrost;       // rough transmission amount 0..1
uniform float uAbsorb;      // absorption coefficient
uniform vec3  uTint;        // unit-path transmittance colour
uniform float uF0;          // Fresnel base reflectance

uniform float uSplit;       // 1 = comparison split active
uniform float uSplitX;      // split position in device px

uniform vec3 uReflLo;       // procedural studio reflection gradient
uniform vec3 uReflHi;
uniform vec3 uReflStrip;

vec3 sampleBg(vec2 uv){
  return texture(uBg, clamp(uv, vec2(0.0015), vec2(0.9985))).rgb;
}

/* Snell refraction → screen-space displacement approximation.
   The refracted ray's lateral drift scales with apparent thickness. */
vec2 refrOffset(float ior, vec3 N, vec3 V, float strength, float thick){
  vec3 I = -V;
  vec3 r = refract(I, N, 1.0 / ior);
  if (dot(r, r) < 1e-8) r = I;              // total internal reflection fallback
  return r.xy * strength * 0.20 * thick;
}

vec3 envRefl(vec3 R){
  float up = R.y * 0.5 + 0.5;
  vec3 base = mix(uReflLo, uReflHi, smoothstep(0.05, 0.95, up));
  float s1 = exp(-pow((R.y - 0.36) * 5.2, 2.0));
  float s2 = exp(-pow((R.y + 0.55) * 7.0, 2.0));
  return base + uReflStrip * (s1 + s2 * 0.5);
}

void main(){
  vec2 suv = gl_FragCoord.xy / uRes;

  vec3 N = normalize(vN);
  vec3 V = normalize(uCamPos - vP);
  if (dot(N, V) < 0.0) N = -N;              // open shell: face the viewer
  float ndv = clamp(dot(N, V), 0.0, 1.0);

  float strength = uStrength;
  if (uSplit > 0.5 && gl_FragCoord.x < uSplitX) strength = 0.0;

  /* apparent optical path: thicker crown, longer at grazing angles */
  float path = uThickness * mix(0.55, 1.9, vT) * (0.45 + 0.55 * uCurvature) / max(ndv, 0.5);

  float ca = uChroma * min(strength, 1.6);
  vec2 offR = refrOffset(uIor * (1.0 + ca), N, V, strength, uThickness);
  vec2 offG = refrOffset(uIor,              N, V, strength, uThickness);
  vec2 offB = refrOffset(uIor * (1.0 - ca), N, V, strength, uThickness);

  vec3 transmitted;
  if (uFrost > 0.003) {
    /* Poisson-disc approximation of rough transmission */
    float rad = uFrost * (0.0045 + 0.014 * uThickness);
    vec2 o = offG;
    vec3 acc = sampleBg(suv + o) * 0.22;
    acc += sampleBg(suv + o + vec2( 0.94,  0.34) * rad) * 0.13;
    acc += sampleBg(suv + o + vec2(-0.34,  0.94) * rad) * 0.13;
    acc += sampleBg(suv + o + vec2(-0.94, -0.34) * rad) * 0.13;
    acc += sampleBg(suv + o + vec2( 0.34, -0.94) * rad) * 0.13;
    acc += sampleBg(suv + o + vec2( 0.63,  0.63) * rad * 1.8) * 0.065;
    acc += sampleBg(suv + o + vec2(-0.63,  0.63) * rad * 1.8) * 0.065;
    acc += sampleBg(suv + o + vec2(-0.63, -0.63) * rad * 1.8) * 0.065;
    acc += sampleBg(suv + o + vec2( 0.63, -0.63) * rad * 1.8) * 0.065;
    transmitted = acc;
    if (ca > 0.0004) {
      transmitted.r = mix(transmitted.r, sampleBg(suv + offR).r, 0.55);
      transmitted.b = mix(transmitted.b, sampleBg(suv + offB).b, 0.55);
    }
  } else if (ca > 0.0004) {
    transmitted = vec3(
      sampleBg(suv + offR).r,
      sampleBg(suv + offG).g,
      sampleBg(suv + offB).b);
  } else {
    transmitted = sampleBg(suv + offG);
  }

  /* Beer–Lambert absorption along the apparent optical path */
  vec3 sigma = (1.0 - clamp(uTint, 0.0, 1.0)) * uAbsorb;
  transmitted *= exp(-sigma * path);

  /* Schlick Fresnel */
  float F = uF0 + (1.0 - uF0) * pow(1.0 - ndv, 5.0);

  /* environment reflection + analytic studio speculars */
  vec3 R = reflect(-V, N);
  vec3 refl = envRefl(R);

  vec3 L1 = normalize(vec3(-0.52, 0.74, 0.42));
  vec3 L2 = normalize(vec3( 0.64, -0.38, 0.57));
  vec3 Lp = normalize(vec3(uPointer * 1.9, 1.15));
  float sTight = pow(max(dot(R, L1), 0.0), 160.0);
  float sSoft  = pow(max(dot(R, L1), 0.0), 18.0) * 0.05;
  float sFill  = pow(max(dot(R, L2), 0.0), 48.0) * 0.4;
  float sPoint = pow(max(dot(R, Lp), 0.0), 220.0);
  vec3 spec = (sTight + sFill) * uReflStrip
            + sPoint * vec3(1.0, 0.98, 0.95) * 0.9
            + sSoft * uReflStrip;

  float kR = clamp(F * uReflect * 1.45, 0.0, 1.0);
  vec3 col = transmitted * (1.0 - kR) + refl * kR;
  col += spec * uReflect * (0.22 + 0.78 * F);

  /* polished rim: grazing-angle brightening localised to the lens edge */
  float rim = smoothstep(0.2, 0.015, vT);
  float edge = rim * pow(1.0 - ndv, 3.0) * uEdge;
  col += uReflStrip * edge * 0.8;

  /* faint internal scatter so thick regions don't render pure black */
  col += uTint * uAbsorb * 0.012 * (1.0 - ndv);

  frag = vec4(col, 1.0);
}`;

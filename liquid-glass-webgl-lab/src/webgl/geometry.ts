/**
 * Procedural geometry for the glass lab.
 * Meshes are interleaved: [x,y,z, nx,ny,nz, thick]
 * `thick` is a normalized optical-thickness attribute (1 = thickest, 0 = rim).
 */

export interface MeshData {
  vertices: Float32Array;
  indices: Uint16Array | Uint32Array;
  count: number;
}

const STRIDE = 7;

/** Superellipse boundary radius for angle theta with exponent n (n=4 → squircle). */
function squircleRadius(theta: number, n: number): number {
  const c = Math.abs(Math.cos(theta));
  const s = Math.abs(Math.sin(theta));
  return Math.pow(Math.pow(c, n) + Math.pow(s, n), -1 / n);
}

/**
 * A squircle "pebble" lens: domed front over a rounded-square footprint,
 * plus a short polished rim skirt descending from the edge.
 * Baked with unit height — actual curvature is applied in the vertex shader.
 */
export function buildSquircleDome(
  radialSegs = 56,
  angularSegs = 192,
  exponent = 4.6,
  skirtDepth = 0.1
): MeshData {
  const verts: number[] = [];
  const idx: number[] = [];

  // Dome height profile, unit height: flat-ish crown rolling off steeply at rim.
  const profile = (r: number): number => Math.pow(Math.cos(r * Math.PI * 0.5), 0.72);

  // Position for polar (r, theta)
  const pos = (r: number, theta: number): [number, number, number] => {
    const R = squircleRadius(theta, exponent);
    return [r * R * Math.cos(theta), r * R * Math.sin(theta), profile(r)];
  };

  // Numeric normal from partial derivatives of the parametrization.
  const normalAt = (r: number, theta: number): [number, number, number] => {
    const e = 1e-4;
    const [x0, y0, z0] = pos(r, theta);
    const rIn = Math.max(0, r - e);
    const rOut = Math.min(1, r + e);
    const a = pos(rOut, theta);
    const b = pos(rIn, theta);
    const c = pos(r, theta + e);
    const d = pos(r, theta - e);
    const dr: [number, number, number] = [
      (a[0] - b[0]) / (rOut - rIn || 1),
      (a[1] - b[1]) / (rOut - rIn || 1),
      (a[2] - b[2]) / (rOut - rIn || 1),
    ];
    const dt: [number, number, number] = [
      c[0] - d[0],
      c[1] - d[1],
      c[2] - d[2],
    ];
    // n = dr × dt, oriented upward
    let nx = dr[1] * dt[2] - dr[2] * dt[1];
    let ny = dr[2] * dt[0] - dr[0] * dt[2];
    let nz = dr[0] * dt[1] - dr[1] * dt[0];
    void x0; void y0; void z0;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len;
    ny /= len;
    nz /= len;
    if (nz < 0) {
      nx = -nx;
      ny = -ny;
      nz = -nz;
    }
    return [nx, ny, nz];
  };

  // Center vertex
  verts.push(0, 0, profile(0), 0, 0, 1, 1);

  // Rings
  for (let i = 1; i <= radialSegs; i++) {
    const r = i / radialSegs;
    for (let j = 0; j < angularSegs; j++) {
      const theta = (j / angularSegs) * Math.PI * 2;
      const [x, y, z] = pos(r, theta);
      const [nx, ny, nz] = normalAt(r, theta);
      verts.push(x, y, z, nx, ny, nz, profile(r));
    }
  }

  const ringStart = (i: number) => 1 + (i - 1) * angularSegs;

  // Center fan
  for (let j = 0; j < angularSegs; j++) {
    idx.push(0, ringStart(1) + j, ringStart(1) + ((j + 1) % angularSegs));
  }
  // Ring strips
  for (let i = 1; i < radialSegs; i++) {
    for (let j = 0; j < angularSegs; j++) {
      const a = ringStart(i) + j;
      const b = ringStart(i) + ((j + 1) % angularSegs);
      const c = ringStart(i + 1) + j;
      const d = ringStart(i + 1) + ((j + 1) % angularSegs);
      idx.push(a, c, b, b, c, d);
    }
  }

  // Rim skirt: drop a vertical band from the boundary with outward squircle normals.
  const skirtStart = verts.length / STRIDE;
  for (let j = 0; j < angularSegs; j++) {
    const theta = (j / angularSegs) * Math.PI * 2;
    const [x, y] = pos(1, theta);
    // Outward normal of superellipse level set: grad(|x|^n + |y|^n)
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    const gx = Math.sign(c) * Math.pow(Math.abs(c), exponent - 1);
    const gy = Math.sign(s) * Math.pow(Math.abs(s), exponent - 1);
    const gl = Math.hypot(gx, gy) || 1;
    verts.push(x, y, 0.001, gx / gl, gy / gl, 0, 0);
    verts.push(x, y, -skirtDepth, gx / gl, gy / gl, 0, 0);
  }
  for (let j = 0; j < angularSegs; j++) {
    const j2 = (j + 1) % angularSegs;
    const top0 = skirtStart + j * 2;
    const bot0 = skirtStart + j * 2 + 1;
    const top1 = skirtStart + j2 * 2;
    const bot1 = skirtStart + j2 * 2 + 1;
    idx.push(top0, bot0, top1, top1, bot0, bot1);
  }

  const vertices = new Float32Array(verts);
  const use32 = vertices.length / STRIDE > 65535;
  return {
    vertices,
    indices: use32 ? new Uint32Array(idx) : new Uint16Array(idx),
    count: idx.length,
  };
}

/** UV sphere for lens / orb demonstrations. thick = 1 everywhere. */
export function buildSphere(stacks = 64, slices = 96): MeshData {
  const verts: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= stacks; i++) {
    const phi = (i / stacks) * Math.PI;
    for (let j = 0; j <= slices; j++) {
      const theta = (j / slices) * Math.PI * 2;
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.sin(theta);
      verts.push(x, y, z, x, y, z, 1);
    }
  }
  for (let i = 0; i < stacks; i++) {
    for (let j = 0; j < slices; j++) {
      const a = i * (slices + 1) + j;
      const b = a + slices + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const vertices = new Float32Array(verts);
  return {
    vertices,
    indices: new Uint32Array(idx),
    count: idx.length,
  };
}

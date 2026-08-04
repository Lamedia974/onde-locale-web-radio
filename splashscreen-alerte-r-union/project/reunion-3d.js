import * as THREE from 'https://unpkg.com/three@0.184.0/build/three.module.js';

const GEO = 'departements/974-la-reunion/departement-974-la-reunion.geojson';
const KX = 103.9, KY = 110.9; // km per degree at 21°S
const BB = { minx: 55.21653, miny: -21.38936, maxx: 55.83668, maxy: -20.87174 };
const PEAKS = [ // lon, lat, height km, sigma km
  [55.478, -21.099, 3.07, 7.5],  // Piton des Neiges
  [55.430, -21.135, 2.90, 5.5],  // Grand Bénare
  [55.447, -20.972, 2.10, 4.5],  // Roche Écrite
  [55.714, -21.244, 2.63, 5.0],  // Piton de la Fournaise
  [55.600, -21.190, 1.75, 7.0],  // Plaine des Cafres
  [55.660, -21.100, 1.40, 5.0]   // Plaine des Palmistes
];
const CIRQUES = [ // carved depressions
  [55.425, -21.045, 1.55, 3.4],  // Mafate
  [55.468, -21.148, 1.45, 2.9],  // Cilaos
  [55.535, -21.030, 1.35, 3.1]   // Salazie
];
const EXAG = 1.35;
// x/y in % of the old 1000x895 viewBox, m = zoom factor (1 = overview)
const STOPS = [
  { name: 'Saint-Denis', x: 37.3, y: 3.5, m: 4.6 },
  { name: 'Route du Littoral', x: 16, y: 8.9, m: 5.0 },
  { name: 'Les Cirques', x: 41.1, y: 50.6, m: 4.4 },
  { name: 'Piton de la Fournaise', x: 72, y: 63, m: 4.8 },
  { name: 'Saint-Pierre', x: 42.2, y: 88, m: 4.6 },
  { name: '', x: 50, y: 50, m: 1 }
];

function toKm(lon, lat) {
  return [(lon - (BB.minx + BB.maxx) / 2) * KX, ((BB.miny + BB.maxy) / 2 - lat) * KY];
}
function pctToKm(x, y) {
  return toKm(BB.minx + x / 100 * (BB.maxx - BB.minx), BB.maxy - y / 100 * (BB.maxy - BB.miny));
}
async function loadDEM() {
  // real elevation: AWS terrain tiles (terrarium encoding), z=10 over the island bbox
  const Z = 10, WORLD = 256 * (1 << Z);
  const merc = (lon, lat) => {
    const r = lat * Math.PI / 180;
    return [(lon + 180) / 360 * WORLD, (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * WORLD];
  };
  const [px0, py0] = merc(BB.minx, BB.maxy), [px1, py1] = merc(BB.maxx, BB.miny);
  const tx0 = Math.floor(px0 / 256), tx1 = Math.floor(px1 / 256);
  const ty0 = Math.floor(py0 / 256), ty1 = Math.floor(py1 / 256);
  const cnv = document.createElement('canvas');
  cnv.width = (tx1 - tx0 + 1) * 256; cnv.height = (ty1 - ty0 + 1) * 256;
  const ctx = cnv.getContext('2d', { willReadFrequently: true });
  const jobs = [];
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    jobs.push(fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${tx}/${ty}.png`)
      .then(r => { if (!r.ok) throw new Error('tile ' + r.status); return r.blob(); })
      .then(createImageBitmap)
      .then(im => ctx.drawImage(im, (tx - tx0) * 256, (ty - ty0) * 256)));
  }
  await Promise.all(jobs);
  const img = ctx.getImageData(0, 0, cnv.width, cnv.height);
  const { data, width, height } = img;
  const at = (px, py) => {
    const x = Math.min(width - 1, Math.max(0, px)), y = Math.min(height - 1, Math.max(0, py));
    const k = (y * width + x) * 4;
    return (data[k] * 256 + data[k + 1] + data[k + 2] / 256) - 32768; // meters
  };
  return (lon, lat) => { // bilinear sample, meters
    const [mx, my] = merc(lon, lat);
    const fx = mx - tx0 * 256, fy = my - ty0 * 256;
    const x = Math.floor(fx), y = Math.floor(fy), u = fx - x, w = fy - y;
    return at(x, y) * (1 - u) * (1 - w) + at(x + 1, y) * u * (1 - w) + at(x, y + 1) * (1 - u) * w + at(x + 1, y + 1) * u * w;
  };
}

function rawHeight(x, z) {
  let h = 0;
  for (const [lo, la, hp, s] of PEAKS) {
    const [px, pz] = toKm(lo, la);
    const g = hp * Math.exp(-((x - px) ** 2 + (z - pz) ** 2) / (2 * s * s));
    if (g > h) h = g;
  }
  for (const [lo, la, d, s] of CIRQUES) {
    const [px, pz] = toKm(lo, la);
    h -= d * Math.exp(-((x - px) ** 2 + (z - pz) ** 2) / (2 * s * s));
  }
  return Math.max(h, 0.12);
}

customElements.define('reunion-3d', class extends HTMLElement {
  connectedCallback() {
    if (this._init) return; this._init = true;
    this.style.display = 'block';
    if (!this.style.position) this.style.position = 'relative';
    if (!this.style.width) this.style.width = '100%';
    if (!this.style.height) this.style.height = '100%';
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    this.appendChild(canvas);
    const st = document.createElement('style');
    st.textContent = '@keyframes r3d-ping{0%{transform:scale(.2);opacity:.95}75%{opacity:0}100%{transform:scale(1);opacity:0}}';
    this.appendChild(st);
    this._labels = STOPS.slice(0, 5).map(s => {
      const d = document.createElement('div');
      d.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;will-change:transform;display:flex;flex-direction:column;align-items:center;gap:5px;transform:translate(-200px,-200px)';
      d.innerHTML = '<span style="font-size:8.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#201e1d;white-space:nowrap;font-family:Archivo,sans-serif">' + s.name + '</span>' +
        '<span style="position:relative;width:8px;height:8px"><i data-ring style="position:absolute;left:-13px;top:-13px;width:34px;height:34px;border:2px solid #ec3013;border-radius:50%;opacity:0;display:none;animation:r3d-ping 2.2s cubic-bezier(.23,1,.32,1) infinite"></i><i style="position:absolute;inset:0;background:#ec3013;border-radius:50%;box-shadow:0 0 0 2px rgba(255,255,255,.9)"></i></span>';
      this.appendChild(d);
      return d;
    });
    this._progress = 5; // overview until driven
    this._start(canvas).catch(e => console.error('reunion-3d:', e));
  }
  setProgress(f) { this._progress = f; }
  async _start(canvas) {
    let dem = null;
    const [gj] = await Promise.all([
      (await fetch(GEO)).json(),
      loadDEM().then(f => { dem = f; }).catch(e => console.warn('r3d: DEM offline, procedural relief', e))
    ]);
    const polys = gj.geometry.coordinates;
    let ring = polys[0][0].length > polys[1][0].length ? polys[0][0] : polys[1][0];
    ring = ring.map(([lo, la]) => toKm(lo, la));
    const rx = ring.map(p => p[0]), rz = ring.map(p => p[1]), nR = ring.length;
    const inside = (x, z) => {
      let c = false;
      for (let i = 0, j = nR - 1; i < nR; j = i++) {
        if (((rz[i] > z) !== (rz[j] > z)) && (x < (rx[j] - rx[i]) * (z - rz[i]) / (rz[j] - rz[i]) + rx[i])) c = !c;
      }
      return c;
    };
    const N = 220;
    const hw = (BB.maxx - BB.minx) * KX / 2 + 1, hh = (BB.maxy - BB.miny) * KY / 2 + 1;
    const cw = 2 * hw / N, ch = 2 * hh / N;
    const idx = (i, j) => j * (N + 1) + i;
    const mask = new Uint8Array((N + 1) * (N + 1));
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) mask[idx(i, j)] = inside(-hw + i * cw, -hh + j * ch) ? 1 : 0;
    // chamfer distance to coast (cells)
    const INF = 1e9, dist = new Float32Array((N + 1) * (N + 1));
    for (let k = 0; k < dist.length; k++) dist[k] = mask[k] ? INF : 0;
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
      const k = idx(i, j); if (!dist[k]) continue;
      if (i > 0) dist[k] = Math.min(dist[k], dist[idx(i - 1, j)] + 1);
      if (j > 0) dist[k] = Math.min(dist[k], dist[idx(i, j - 1)] + 1);
      if (i > 0 && j > 0) dist[k] = Math.min(dist[k], dist[idx(i - 1, j - 1)] + 1.414);
    }
    for (let j = N; j >= 0; j--) for (let i = N; i >= 0; i--) {
      const k = idx(i, j); if (!dist[k]) continue;
      if (i < N) dist[k] = Math.min(dist[k], dist[idx(i + 1, j)] + 1);
      if (j < N) dist[k] = Math.min(dist[k], dist[idx(i, j + 1)] + 1);
      if (i < N && j < N) dist[k] = Math.min(dist[k], dist[idx(i + 1, j + 1)] + 1.414);
    }
    const kmToGeo = (x, z) => [x / KX + (BB.minx + BB.maxx) / 2, (BB.miny + BB.maxy) / 2 - z / KY];
    const hOf = (i, j) => {
      const k = idx(i, j);
      if (!mask[k]) return -0.7;
      const x = -hw + i * cw, z = -hh + j * ch;
      const dKm = dist[k] * cw;
      if (dem) {
        const [lo, la] = kmToGeo(x, z);
        return Math.max(dem(lo, la), 8) / 1000 * Math.min(1, dKm / 0.9) * EXAG;
      }
      const fall = Math.pow(Math.min(1, dKm / 5), 0.65);
      return rawHeight(x, z) * fall * EXAG;
    };
    // precompute + smooth heights
    const hgt = new Float32Array((N + 1) * (N + 1));
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) hgt[idx(i, j)] = hOf(i, j);
    for (let pass = 0; pass < 2; pass++) {
      const src = hgt.slice();
      for (let j = 1; j < N; j++) for (let i = 1; i < N; i++) {
        const k = idx(i, j); if (!mask[k]) continue;
        let s = src[k] * 2, n = 2;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const kk = idx(i + di, j + dj);
          if (mask[kk]) { s += src[kk]; n++; }
        }
        hgt[k] = s / n;
      }
    }
    this._hAt = (x, z) => {
      const i = Math.min(N, Math.max(0, Math.round((x + hw) / cw)));
      const j = Math.min(N, Math.max(0, Math.round((z + hh) / ch)));
      return Math.max(hgt[idx(i, j)], 0);
    };
    const pos = [], indices = [], vmap = new Int32Array((N + 1) * (N + 1)).fill(-1);
    // project boundary (outside) vertices onto the real coastline for a smooth outline
    const coastSnap = (x, z) => {
      let bx = x, bz = z, bd = Infinity;
      for (let i = 0, j = nR - 1; i < nR; j = i++) {
        const ax = rx[j], az2 = rz[j], dxx = rx[i] - ax, dzz = rz[i] - az2;
        const L2 = dxx * dxx + dzz * dzz || 1e-9;
        let t = ((x - ax) * dxx + (z - az2) * dzz) / L2;
        t = Math.max(0, Math.min(1, t));
        const px = ax + t * dxx, pz = az2 + t * dzz;
        const d = (x - px) ** 2 + (z - pz) ** 2;
        if (d < bd) { bd = d; bx = px; bz = pz; }
      }
      return [bx, bz];
    };
    const getV = (i, j) => {
      const k = idx(i, j);
      if (vmap[k] === -1) {
        vmap[k] = pos.length / 3;
        if (mask[k]) pos.push(-hw + i * cw, hgt[k], -hh + j * ch);
        else { const [sx, sz] = coastSnap(-hw + i * cw, -hh + j * ch); pos.push(sx, 0, sz); }
      }
      return vmap[k];
    };
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      if (!(mask[idx(i, j)] + mask[idx(i + 1, j)] + mask[idx(i, j + 1)] + mask[idx(i + 1, j + 1)])) continue;
      const a = getV(i, j), b = getV(i + 1, j), c = getV(i, j + 1), d = getV(i + 1, j + 1);
      indices.push(a, c, b, b, c, d);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const scene = new THREE.Scene();
    // A light atmospheric falloff keeps the overview from feeling like a bare
    // model while preserving the sharp, editorial look at each close-up stop.
    scene.fog = new THREE.FogExp2(0xf3f2f2, 0.0032);
    scene.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xdedbd8, roughness: 0.95 })));
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d5d3, 0.85));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(-45, 60, -25);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xec3013, 0.3);
    fill.position.set(55, 10, 45);
    scene.add(fill);

    // Animated "fog of war" ring. The centre stays clear while two soft,
    // noisy layers drift around the coast and fade before the plane edges.
    const fogVertex = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    const fogFragment = `
      precision highp float;
      uniform float uTime;
      uniform float uOpacity;
      uniform float uSeed;
      uniform vec2 uDrift;
      varying vec2 vUv;

      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 345.45));
        p += dot(p, p + 34.345);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x),
          f.y
        );
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.55;
        for (int i = 0; i < 4; i++) {
          value += amplitude * noise(p);
          p = p * 2.03 + 11.7;
          amplitude *= 0.5;
        }
        return value;
      }

      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        float radius = length(p);
        vec2 drift = uDrift * uTime;
        float cloud = fbm(p * 3.0 + drift + uSeed);
        float detail = fbm(p * 7.5 - drift * 1.7 + uSeed * 2.3);
        float brokenEdge = radius + (cloud - 0.5) * 0.22 + (detail - 0.5) * 0.08;
        float coastalRing = smoothstep(0.32, 0.56, brokenEdge);
        float outerFade = 1.0 - smoothstep(0.72, 0.98, radius);
        float wisps = smoothstep(0.28, 0.82, cloud + detail * 0.22);
        float alpha = coastalRing * outerFade * mix(0.48, 1.0, wisps) * uOpacity;
        gl_FragColor = vec4(vec3(0.76, 0.75, 0.74), alpha);
      }
    `;
    const fogMaterials = [];
    const addFogLayer = ({ y, scale, opacity, seed, drift, rotation }) => {
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: opacity },
          uSeed: { value: seed },
          uDrift: { value: new THREE.Vector2(...drift) }
        },
        vertexShader: fogVertex,
        fragmentShader: fogFragment,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide
      });
      const layer = new THREE.Mesh(
        new THREE.PlaneGeometry(hw * scale, hh * scale),
        material
      );
      layer.rotation.x = -Math.PI / 2;
      layer.rotation.z = rotation;
      layer.position.y = y;
      layer.renderOrder = 1;
      fogMaterials.push(material);
      scene.add(layer);
    };
    addFogLayer({ y: 0.18, scale: 4.7, opacity: 0.56, seed: 1.8, drift: [0.016, -0.011], rotation: -0.05 });
    addFogLayer({ y: 0.38, scale: 5.15, opacity: 0.28, seed: 6.2, drift: [-0.010, 0.014], rotation: 0.08 });
    // real trace of the Nouvelle Route du Littoral: follows the actual coastline
    // between La Possession and Saint-Denis (Barachois)
    const nearestRing = (lon, lat) => {
      const [x, z] = toKm(lon, lat);
      let bi = 0, bd = Infinity;
      for (let i = 0; i < nR; i++) {
        const d = (rx[i] - x) ** 2 + (rz[i] - z) ** 2;
        if (d < bd) { bd = d; bi = i; }
      }
      return bi;
    };
    let iA = nearestRing(55.3355, -20.9215), iB = nearestRing(55.4505, -20.8760);
    const arc = [];
    const fwd = (iB - iA + nR) % nR, bwd = (iA - iB + nR) % nR;
    if (fwd <= bwd) { for (let s = 0; s <= fwd; s++) arc.push(ring[(iA + s) % nR]); }
    else { for (let s = 0; s <= bwd; s++) arc.push(ring[(iA - s + nR) % nR]); }
    const routePts = arc.filter((_, k) => k % 2 === 0 || k === arc.length - 1)
      .map(([x, z]) => new THREE.Vector3(x, this._hAt(x, z) + 0.35, z));
    const curve = new THREE.CatmullRomCurve3(routePts, false, 'centripetal', 0.5);
    const SEG = 300;
    const cpts = curve.getPoints(SEG).map(p => new THREE.Vector3(p.x, 0.25, p.z));
    // (NRL tube removed)
    this._tube = null;
    // animated tour line through the 5 stops, drawn with scroll
    const tourPts = STOPS.slice(0, 5).map(s => {
      const [x, z] = pctToKm(s.x, s.y);
      return new THREE.Vector3(x, this._hAt(x, z) + 0.6, z);
    });
    const tourCurve = new THREE.CatmullRomCurve3(tourPts, false, 'centripetal', 0.6);
    const TSEG = 360;
    const tpts = tourCurve.getPoints(TSEG).map(p => new THREE.Vector3(p.x, Math.max(this._hAt(p.x, p.z), 0) + 0.55, p.z));
    const tourGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tpts), TSEG, 0.2, 6, false);
    this._tour = new THREE.Mesh(tourGeo, new THREE.MeshBasicMaterial({ color: 0x201e1d }));
    this._tour.geometry.setDrawRange(0, 0);
    this._tourIndexCount = tourGeo.index.count;
    scene.add(this._tour);
    // anchor points (3D km) for the labels
    this._anchors = STOPS.slice(0, 5).map(s => {
      const [x, z] = pctToKm(s.x, s.y);
      return new THREE.Vector3(x, this._hAt(x, z) + 0.9, z);
    });

    const cam = new THREE.PerspectiveCamera(36, 1, 0.5, 900);
    const size = () => {
      const w = this.clientWidth || 300, h = this.clientHeight || 300;
      renderer.setSize(w, h, false);
      cam.aspect = w / h; cam.updateProjectionMatrix();
      this._w = w; this._h = h;
    };
    new ResizeObserver(size).observe(this);
    size();

    const ease = t => t * t * (3 - 2 * t);
    const lerp = (a, b, t) => a + (b - a) * t;
    const v = new THREE.Vector3();
    const loop = () => {
      requestAnimationFrame(loop);
      const rc = this.getBoundingClientRect();
      if (rc.bottom < 0 || rc.top > innerHeight || rc.height === 0) return;
      const f = Math.min(5, Math.max(0, this._progress));
      const fogTime = performance.now() * 0.001;
      for (const material of fogMaterials) material.uniforms.uTime.value = fogTime;
      const i = Math.min(4, Math.floor(f)), t = ease(f - i);
      const A = STOPS[i], B = STOPS[i + 1];
      const [ax, az_] = pctToKm(A.x, A.y), [bx, bz] = pctToKm(B.x, B.y);
      const x = lerp(ax, bx, t), z = lerp(az_, bz, t);
      const m = lerp(A.m, B.m, t);
      const view = (mm, vx, vz) => mm === 1
        ? { R: 148, pol: 0.72, ty: 1.2 }
        : { R: 132 / Math.pow(mm, 0.72), pol: 0.80 + (1 - 1 / mm) * 0.24, ty: this._hAt(vx, vz) * 0.6 };
      const VA = view(A.m, ax, az_), VB = view(B.m, bx, bz);
      const R = lerp(VA.R, VB.R, t);
      const azm = -0.55 + f * 0.22;
      const pol = lerp(VA.pol, VB.pol, t);
      const ty = lerp(VA.ty, VB.ty, t);
      cam.position.set(
        x + R * Math.sin(pol) * Math.sin(azm),
        ty + R * Math.cos(pol),
        z + R * Math.sin(pol) * Math.cos(azm));
      cam.lookAt(x, ty, z);
      this._tour.geometry.setDrawRange(0, Math.floor(this._tourIndexCount * Math.min(1, Math.max(0, f / 4))));
      const active = Math.round(Math.min(4.49, f));
      this._anchors.forEach((p, k) => {
        v.copy(p).project(cam);
        const el = this._labels[k];
        if (v.z > 1) { el.style.transform = 'translate(-300px,-300px)'; return; }
        el.style.transform = `translate(${(v.x * .5 + .5) * this._w - el.offsetWidth / 2}px, ${(-v.y * .5 + .5) * this._h - el.offsetHeight + 4}px)`;
        const on = k === active && f < 4.6;
        el.style.opacity = on ? '1' : (f >= 4.6 ? '.55' : '.3');
        el.querySelector('[data-ring]').style.display = on ? 'block' : 'none';
      });
      renderer.render(scene, cam);
    };
    requestAnimationFrame(loop);
  }
});

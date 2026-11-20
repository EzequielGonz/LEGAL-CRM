// Motor de reels 3D (gratis): Three.js con PBR, HDRI, sombras suaves, profundidad de campo, bloom,
// desenfoque de movimiento por submuestreo temporal adaptativo, corrección de color, viñeta, aberración y grano.
// Todo es función pura del tiempo: window.render(t) deja el cuadro listo para capturar.
import * as THREE from 'three';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {BokehPass} from 'three/addons/postprocessing/BokehPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {FullScreenQuad} from 'three/addons/postprocessing/Pass.js';
export {THREE};

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const smooth = k => { k = clamp(k); return k * k * (3 - 2 * k); };
export const easeOut = k => 1 - Math.pow(1 - clamp(k), 3);
export const easeInOut = k => { k = clamp(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
export const expoOut = k => k >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(k));
export const backOut = (k, s = 1.6) => { k = clamp(k) - 1; return k * k * ((s + 1) * k + s) + 1; };
export const spring = (k, f = 7, d = 5) => k <= 0 ? 0 : 1 - Math.exp(-d * k) * Math.cos(f * k);
export const win = (t, a, b) => clamp((t - a) / (b - a));
// ruido suave determinista (suma de senos) para la cámara en mano y derivas
export const wob = (t, s = 0) => Math.sin(t * 1.3 + s) * .5 + Math.sin(t * 2.1 + s * 1.7) * .3 + Math.sin(t * 3.7 + s * 2.3) * .2;
export const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export async function crear({W = 1080, H = 1920, hdri, hdriIntensity = 1, exposure = 1, bloom = [0.45, 0.55, 0.9], dof = true, grade = {}}) {
  const dpr = window.devicePixelRatio || 1;
  const canvas = document.createElement('canvas'); canvas.id = 'gl'; document.getElementById('escena').appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance'});
  renderer.setPixelRatio(dpr); renderer.setSize(W, H);
  renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = exposure;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, W / H, 0.05, 600);
  let envTex = null;
  if (hdri) {
    const pm = new THREE.PMREMGenerator(renderer);
    const hdr = await new RGBELoader().loadAsync(hdri);
    envTex = pm.fromEquirectangular(hdr).texture; hdr.dispose();
    scene.environment = envTex; scene.environmentIntensity = hdriIntensity;
  }
  const PW = Math.round(W * dpr), PH = Math.round(H * dpr);
  const rt = new THREE.WebGLRenderTarget(PW, PH, {type: THREE.HalfFloatType, samples: 4});
  const composer = new EffectComposer(renderer, rt); composer.setPixelRatio(1); composer.setSize(PW, PH);
  composer.addPass(new RenderPass(scene, camera));
  let bokeh = null;
  if (dof) { bokeh = new BokehPass(scene, camera, {focus: 5, aperture: 0.0, maxblur: 0.008}); composer.addPass(bokeh); }
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(PW, PH), bloom[0], bloom[1], bloom[2]); composer.addPass(bloomPass);
  const out = new OutputPass(); composer.addPass(out);
  // acumulación para el desenfoque de movimiento
  const acc = new THREE.WebGLRenderTarget(PW, PH, {type: THREE.HalfFloatType});
  const accMat = new THREE.ShaderMaterial({uniforms: {tDiffuse: {value: null}, w: {value: 1}}, transparent: true, depthTest: false, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader: 'uniform sampler2D tDiffuse;uniform float w;varying vec2 vUv;void main(){gl_FragColor=vec4(texture2D(tDiffuse,vUv).rgb*w,w);}'});
  const accQuad = new FullScreenQuad(accMat);
  const G = Object.assign({lift: [0, 0, 0], gamma: [1, 1, 1], gain: [1, 1, 1], sat: 1.05, contrast: 1.04, shadowTint: [0, 0, 0], highTint: [0, 0, 0], vignette: .32, grain: .045, ca: .0016}, grade);
  const finMat = new THREE.ShaderMaterial({uniforms: {tAcc: {value: acc.texture}, seed: {value: 0}, res: {value: new THREE.Vector2(PW, PH)},
      lift: {value: new THREE.Vector3(...G.lift)}, gam: {value: new THREE.Vector3(...G.gamma)}, gain: {value: new THREE.Vector3(...G.gain)},
      sat: {value: G.sat}, con: {value: G.contrast}, sT: {value: new THREE.Vector3(...G.shadowTint)}, hT: {value: new THREE.Vector3(...G.highTint)},
      vig: {value: G.vignette}, grain: {value: G.grain}, ca: {value: G.ca}, flash: {value: 0}, flashCol: {value: new THREE.Vector3(1, 1, 1)}, fade: {value: 0}},
    depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader: `uniform sampler2D tAcc;uniform float seed,sat,con,vig,grain,ca,flash,fade;uniform vec2 res;uniform vec3 lift,gam,gain,sT,hT,flashCol;varying vec2 vUv;
      float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233))+seed*17.13)*43758.5453);}
      void main(){vec2 d=vUv-.5;float r2=dot(d,d);
        vec3 c;c.r=texture2D(tAcc,vUv-d*ca*(1.+r2*4.)).r;c.g=texture2D(tAcc,vUv).g;c.b=texture2D(tAcc,vUv+d*ca*(1.+r2*4.)).b;
        float L=dot(c,vec3(.2126,.7152,.0722));
        c=c+sT*(1.-smoothstep(0.,.45,L))+hT*smoothstep(.55,1.,L);
        c=pow(max(gain*(c+lift*(1.-c)),0.),1./gam);
        c=(c-.5)*con+.5; float l2=dot(c,vec3(.2126,.7152,.0722)); c=mix(vec3(l2),c,sat);
        c*=1.-vig*smoothstep(.12,.75,r2*1.9);
        c=mix(c,flashCol,flash);
        float g=(h(vUv*res)+h(vUv*res+3.1)-1.)*grain; c+=g*(1.-L*.6);
        c=mix(c,vec3(0.),fade);
        gl_FragColor=vec4(clamp(c,0.,1.),1.);}`});
  const finQuad = new FullScreenQuad(finMat);
  const gltfLoader = new GLTFLoader();
  const M = {
    THREE, renderer, scene, camera, composer, bokeh, bloomPass, finMat, envTex, W, H, dpr,
    async gltf(url) { const g = await gltfLoader.loadAsync(url); g.scene.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } }); return g.scene; },
    tex(w, h, draw, {repeat, srgb = true} = {}) {
      const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); draw(x, w, h);
      const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
      if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
      t.userData.redraw = f => { x.clearRect(0, 0, w, h); f(x, w, h); t.needsUpdate = true; }; return t;
    },
    noiseTex(n = 512, scale = 1, oct = 4, seed = 1) { // ruido para rugosidad y relieve
      return M.tex(n, n, (x, w, h) => { const im = x.createImageData(w, h); for (let i = 0; i < w * h; i++) { const px = i % w, py = (i / w) | 0; let v = 0, a = .5, f = scale;
        for (let o = 0; o < oct; o++) { v += a * (hash(Math.floor(px * f / 8) * 7.1 + Math.floor(py * f / 8) * 13.7 + seed * 91 + o * 3.3)); a *= .5; f *= 2; }
        const k = Math.round(v * 255); im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = k; im.data[i * 4 + 3] = 255; } x.putImageData(im, 0, 0); }, {repeat: [1, 1], srgb: false});
    },
    shots: [], update: () => {}, motion: () => 0, focusFn: null, shutter: 0.5, maxSub: 6,
    camAt(t) { // devuelve {p, l, fov, roll, shot}
      const S = M.shots; let i = S.length - 1; while (i > 0 && S[i].t0 > t) i--; const s = S[i]; const t1 = (S[i + 1] ? S[i + 1].t0 : s.t0 + 4);
      const k = (s.ease || easeInOut)((t - s.t0) / (t1 - s.t0)); const f = s.from, to = s.to || s.from;
      const p = new THREE.Vector3().lerpVectors(new THREE.Vector3(...f.p), new THREE.Vector3(...to.p), k);
      const l = new THREE.Vector3().lerpVectors(new THREE.Vector3(...f.l), new THREE.Vector3(...to.l), k);
      const hand = s.hand ?? .012; p.x += wob(t, 1) * hand; p.y += wob(t, 2) * hand; l.x += wob(t, 3) * hand * .6; l.y += wob(t, 4) * hand * .6;
      return {p, l, fov: lerp(f.fov || 35, to.fov || f.fov || 35, k), roll: lerp(f.roll || 0, to.roll || f.roll || 0, k), shot: i, t0: s.t0, t1, s};
    },
    setCam(t) {
      const c = M.camAt(t); camera.position.copy(c.p); camera.up.set(0, 1, 0); camera.lookAt(c.l); camera.rotateZ(c.roll); camera.fov = c.fov; camera.updateProjectionMatrix();
      if (M.bokeh) { const fd = M.focusFn ? M.focusFn(t, c) : c.p.distanceTo(c.l); const s = c.s;
        M.bokeh.uniforms.focus.value = fd; M.bokeh.uniforms.aperture.value = (s.ap ?? 0.0012) ; M.bokeh.uniforms.maxblur.value = s.mb ?? 0.008; }
      if (M.postCam) M.postCam(t, camera, c);
      return c;
    },
    pxMotion(t, dt) { // desplazamiento en píxeles de puntos de referencia entre t-dt y t+dt (cámara)
      const a = M.camAt(t - dt), b = M.camAt(t + dt); if (a.shot !== b.shot) return 0; const pts = [];
      const L = b.l.clone(); const dir = L.clone().sub(b.p).normalize(); const side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
      const dist = b.p.distanceTo(b.l); for (const [u, v] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) pts.push(L.clone().addScaledVector(side, u * dist * .3).add(new THREE.Vector3(0, v * dist * .3, 0)));
      const proj = (c, p) => { camera.position.copy(c.p); camera.up.set(0, 1, 0); camera.lookAt(c.l); camera.rotateZ(c.roll); camera.fov = c.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); const q = p.clone().project(camera); return [q.x * W / 2, q.y * H / 2]; };
      let m = 0; for (const p of pts) { const [x1, y1] = proj(a, p), [x2, y2] = proj(b, p); m = Math.max(m, Math.hypot(x2 - x1, y2 - y1)); }
      return m;
    },
    frame(t, fps = 60) {
      const exp = M.shutter / fps; // obturador de 180°
      const c0 = M.camAt(t);
      const mot = Math.max(M.pxMotion(t, exp / 2), M.motion(t, exp) || 0);
      let S = Math.min(M.maxSub, Math.max(1, Math.ceil(mot / 3.5)));
      if (window.__noblur) S = 1;
      renderer.setRenderTarget(acc); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.setRenderTarget(null);
      for (let i = 0; i < S; i++) {
        let ts = S === 1 ? t : t + (i / (S - 1) - .5) * exp;
        ts = clamp(ts, c0.t0, c0.t1 - 1e-4);
        M.update(ts); M.setCam(ts);
        composer.renderToScreen = false; composer.render();
        accMat.uniforms.tDiffuse.value = composer.readBuffer.texture; accMat.uniforms.w.value = 1 / S;
        renderer.setRenderTarget(acc); accQuad.render(renderer); renderer.setRenderTarget(null);
      }
      M.update(t); // deja el estado de la escena en t (para el DOM)
      finMat.uniforms.seed.value = (t * 60) % 997; renderer.setRenderTarget(null); finQuad.render(renderer);
      return S;
    },
  };
  return M;
}

// Partículas suaves (polvo en la luz, bokeh, chispas) con tamaño en pantalla y deriva determinista
export function particulas(M, {n = 300, area = [10, 6, 10], centro = [0, 2, 0], color = '#ffffff', size = 0.05, opacity = .6, seed = 1, add = true}) {
  const THREE = M.THREE; const g = new THREE.BufferGeometry(); const P = new Float32Array(n * 3), R = new Float32Array(n);
  for (let i = 0; i < n; i++) { P[i * 3] = (hash(i + seed) - .5) * area[0]; P[i * 3 + 1] = (hash(i * 2.3 + seed) - .5) * area[1]; P[i * 3 + 2] = (hash(i * 3.7 + seed) - .5) * area[2]; R[i] = hash(i * 5.1 + seed); }
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('rnd', new THREE.BufferAttribute(R, 1));
  const m = new THREE.ShaderMaterial({transparent: true, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: {t: {value: 0}, col: {value: new THREE.Color(color)}, size: {value: size * M.H * M.dpr}, op: {value: opacity}, k: {value: 1}},
    vertexShader: `attribute float rnd;uniform float t,size;varying float vr;void main(){vr=rnd;vec3 p=position;p.y+=sin(t*.3+rnd*40.)*.25+t*.04*(rnd-.3);p.x+=sin(t*.21+rnd*30.)*.2;
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=size*(.4+rnd*.9)/-mv.z;}`,
    fragmentShader: `uniform vec3 col;uniform float op,k,t;varying float vr;void main(){vec2 d=gl_PointCoord-.5;float a=smoothstep(.5,.0,length(d));a*=a;
      float tw=.55+.45*sin(t*2.+vr*60.);gl_FragColor=vec4(col,a*op*k*tw);}`});
  const p = new THREE.Points(g, m); p.position.set(...centro); p.frustumCulled = false; M.scene.add(p); return p;
}

// Subtítulos palabra por palabra + textos del DOM, deterministas por tiempo
export function subtitulos(el, frases, t, {max = 3, maxChars = 18} = {}) {
  // agrupa palabras de cada frase en bloques cortos; muestra el bloque activo y revela palabra por palabra
  let html = '';
  for (const f of frases) {
    if (f.cta) continue; const ws = f.words; const groups = []; let cur = [];
    for (const w of ws) { const len = cur.map(x => x.w).join(' ').length + w.w.length; if (cur.length >= max || (cur.length && len > maxChars)) { groups.push(cur); cur = []; } cur.push(w); }
    if (cur.length) groups.push(cur);
    for (let gi = 0; gi < groups.length; gi++) {
      const g = groups[gi]; const a = g[0].t - .05; const b = gi + 1 < groups.length ? groups[gi + 1][0].t - .05 : f.fin + .25;
      if (t >= a && t < b) {
        html = g.map(w => { const k = clamp((t - w.t + .02) / .14); const s = .82 + .18 * backOut(k); const o = k > 0 ? 1 : 0;
          return `<span class="w${w.h ? ' h' : ''}" style="opacity:${o};transform:translateY(${(1 - easeOut(k)) * 18}px) scale(${s})">${w.w}</span>`; }).join(' ');
      }
    }
  }
  el.innerHTML = html;
}

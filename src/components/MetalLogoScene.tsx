import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { BRAND_PATHS, BRAND_VIEWBOX } from './brandShape';
import { crownBrandSlab, cushionBrandStar, extrudeBrandSlab } from './metalSceneGeometry';

export interface MetalLogoSceneProps {
  onReady: () => void;
  onError: () => void;
  docked: boolean;
  reducedMotion: boolean;
  active?: boolean;
  /** Starts the small physical turn only once the SVG-to-material reveal has finished. */
  revealed?: boolean;
  /** Visible intro height when the containing hero is taller than the viewport. */
  introHeight?: number;
  /** CSS-pixel rectangle relative to the full-size canvas, with a top-left origin. */
  dockTarget?: { x: number; y: number; width: number; height: number };
}

type Disposable = { dispose: () => void };
type SceneController = { update: () => void; dispose: () => void };

function brushedTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create the metal surface texture.');
  const pixels = context.createImageData(canvas.width, canvas.height);
  let seed = 137;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let y = 0; y < canvas.height; y++) {
    const strand = 148 + random() * 67;
    for (let x = 0; x < canvas.width; x++) {
      const value = strand + (random() - .5) * 14;
      const index = (y * canvas.width + x) * 4;
      pixels.data[index] = value;
      pixels.data[index + 1] = value;
      pixels.data[index + 2] = value;
      pixels.data[index + 3] = 255;
    }
  }
  context.putImageData(pixels, 0, 0);
  context.lineWidth = .35;
  for (let i = 0; i < 1700; i++) {
    const y = random() * 1024;
    const x = random() * 1024;
    context.strokeStyle = `rgba(${random() > .5 ? '245,245,245' : '15,15,15'},${.06 + random() * .13})`;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + 80 + random() * 420, y + random() * 2);
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = 4;
  texture.rotation = -.7;
  texture.center.set(.5, .5);
  return texture;
}

/** Locally rendered studio cards become genuine PBR reflections, never a backdrop image. */
function studioEnvironment(renderer: THREE.WebGLRenderer): THREE.WebGLRenderTarget {
  const studio = new THREE.Scene();
  studio.background = new THREE.Color('#111514');
  const resources: Disposable[] = [];
  const roomGeometry = new THREE.BoxGeometry(28, 20, 28);
  const roomMaterial = new THREE.MeshBasicMaterial({ color: '#171b19', side: THREE.BackSide });
  resources.push(roomGeometry, roomMaterial);
  studio.add(new THREE.Mesh(roomGeometry, roomMaterial));
  const card = (size: [number, number], position: [number, number, number], color: THREE.Color, map: THREE.Texture | null = null) => {
    const geometry = new THREE.PlaneGeometry(...size);
    const material = new THREE.MeshBasicMaterial({ color, map, side: THREE.DoubleSide, toneMapped: false });
    resources.push(geometry, material);
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(...position);
    plane.lookAt(0, 0, 0);
    studio.add(plane);
  };
  card([6.5, 5], [-5, 5.5, 7], new THREE.Color(7, 7.4, 7.8));
  card([1.25, 9], [6, 2, 4.5], new THREE.Color(8, 8, 7.5));
  card([7, 2.2], [0, 7, -2], new THREE.Color(5.5, 5.8, 6));
  const softboxCanvas = document.createElement('canvas');
  softboxCanvas.width = softboxCanvas.height = 512;
  const softboxContext = softboxCanvas.getContext('2d');
  if (!softboxContext) throw new Error('Unable to construct the studio softbox.');
  const falloff = softboxContext.createLinearGradient(0, 450, 512, 70);
  falloff.addColorStop(0, '#111111');
  falloff.addColorStop(.24, '#515151');
  falloff.addColorStop(.43, '#e5e5e5');
  falloff.addColorStop(.58, '#c1c1c1');
  falloff.addColorStop(.76, '#404040');
  falloff.addColorStop(1, '#111111');
  softboxContext.fillStyle = falloff;
  softboxContext.fillRect(0, 0, 512, 512);
  const softboxMap = new THREE.CanvasTexture(softboxCanvas);
  softboxMap.colorSpace = THREE.SRGBColorSpace;
  resources.push(softboxMap);
  card([7, 7], [-2.6, 1.5, 8], new THREE.Color(1.8, 1.9, 2), softboxMap);
  card([3.5, 9], [3.8, -.5, 8.5], new THREE.Color(.035, .042, .038));
  card([.55, 7], [5, .5, 2], new THREE.Color('#d7ff36').multiplyScalar(4.2));
  card([.65, 5], [-5.5, 1, -3], new THREE.Color('#d7ff36').multiplyScalar(1.3));
  // Reflection cards around the matched 60-degree product pose.
  card([4.5, 10], [-8, 3.5, -4], new THREE.Color(5, 5.25, 5.5), softboxMap);
  card([1.3, 9], [-7, -1.5, -6.5], new THREE.Color(7.5, 7.5, 7.2));
  card([4, 11], [-9, .7, -1.3], new THREE.Color(.008, .01, .008));
  card([.42, 7.5], [-5, 1, -8], new THREE.Color('#d7ff36').multiplyScalar(3.8));
  card([1.1, 11], [5.5, 1, 6], new THREE.Color(5.5, 5.8, 5.9));
  card([3.8, 10], [7, 1.2, 5], new THREE.Color(3.2, 3.4, 3.3), softboxMap);
  card([.3, 8], [6.8, .6, 4.5], new THREE.Color('#d7ff36').multiplyScalar(5.5));
  // Slanted right faces reflect below the horizon: these low studio cards reveal the depth.
  card([5, 12], [7, -8, -3], new THREE.Color(4.5, 4.7, 4.5), softboxMap);
  card([.45, 10], [6.2, -7.6, -2], new THREE.Color('#d7ff36').multiplyScalar(5));
  const generator = new THREE.PMREMGenerator(renderer);
  try {
    return generator.fromScene(studio, .025, .1, 60, { size: 256 });
  } finally {
    generator.dispose();
    resources.forEach(resource => resource.dispose());
  }
}

export default function MetalLogoScene(props: MetalLogoSceneProps) {
  const container = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  const controller = useRef<SceneController | null>(null);
  latest.current = props;

  useEffect(() => {
    const root = container.current;
    if (!root) return;
    const host: HTMLDivElement = root;
    const experience = host.closest<HTMLElement>('.ix-experience');
    let unmounted = false;
    // Defer GPU setup by one frame so React StrictMode's discarded mount allocates nothing.
    const initializeFrame = requestAnimationFrame(() => {
      if (unmounted) return;
      const resources: Disposable[] = [];
      const cleanups: (() => void)[] = [];
      let renderer: THREE.WebGLRenderer | undefined;
      let frame = 0;
      let disposed = false;
      let ready = false;
      let failed = false;
      let inView = true;
      let width = 1;
      let height = 1;
      let pageLeft = 0;
      let pageTop = 0;
      let viewportLeft = 0;
      let viewportTop = 0;
      let lastActive = latest.current.active !== false;
      let lastTime = 0;
      let currentDock = latest.current.docked ? 1 : 0;
      let fromDock = currentDock;
      let toDock = currentDock;
      let dockStart = 0;
      let lastDocked = latest.current.docked;
      let currentReveal = latest.current.revealed ? 1 : 0;
      let fromReveal = currentReveal;
      let toReveal = currentReveal;
      let revealStart = 0;
      let lastRevealed = Boolean(latest.current.revealed);
      let pointerX = 0;
      let pointerY = 0;
      let targetPointerX = 0;
      let targetPointerY = 0;
      let renderCount = 0;
      const dispose = () => {
        if (disposed) return;
        disposed = true;
        cancelAnimationFrame(frame);
        cleanups.forEach(cleanup => cleanup());
        resources.forEach(resource => resource.dispose());
        if (renderer) {
          renderer.renderLists.dispose();
          renderer.dispose();
          renderer.forceContextLoss();
          renderer.domElement.remove();
        }
      };
      const fail = () => {
        if (failed || disposed || unmounted) return;
        failed = true;
        cancelAnimationFrame(frame);
        host.dataset.scene = 'error';
        latest.current.onError();
      };

      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
        const gl = renderer;
        gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        gl.setClearColor('#10120f', 1);
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFShadowMap;
        gl.autoClear = false;
        gl.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;';
        gl.domElement.setAttribute('aria-hidden', 'true');
        gl.domElement.dataset.renderer = 'three-webgl';
        host.appendChild(gl.domElement);
        host.dataset.scene = 'loading';

        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#10120f');
        scene.fog = new THREE.Fog('#10120f', 18, 58);
        const environment = studioEnvironment(gl);
        resources.push(environment);
        scene.environment = environment.texture;
        const camera = new THREE.PerspectiveCamera(12, 1, .1, 180);
        const model = new THREE.Group();
        scene.add(model);
        const slabPoses: { group: THREE.Group; meshes: THREE.Mesh[]; centerX: number; slope: number }[] = [];
        let starMesh: THREE.Mesh | undefined;

        const brush = brushedTexture();
        resources.push(brush);
        const chrome = new THREE.MeshPhysicalMaterial({
          color: '#dbe0e2', metalness: 1, roughness: .28,
          roughnessMap: brush, bumpMap: brush, bumpScale: .0026,
          anisotropy: .68, anisotropyRotation: 1.1,
          envMapIntensity: 1.1, clearcoat: .12, clearcoatRoughness: .17,
          fog: false,
        });
        const edgeChrome = new THREE.MeshPhysicalMaterial({ color: '#d5d8d5', metalness: 1, roughness: .095, envMapIntensity: 1.35, fog: false });
        const starChrome = new THREE.MeshPhysicalMaterial({ color: '#e3e5e2', metalness: 1, roughness: .15, envMapIntensity: 1.2, fog: false });
        resources.push(chrome, edgeChrome, starChrome);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${BRAND_VIEWBOX}">${Object.values(BRAND_PATHS).map(path => `<path d="${path}" fill="#fff"/>`).join('')}</svg>`;
        const paths = new SVGLoader().parse(svg).paths;
        paths.forEach((path, index) => {
          const shape = path.toShapes()[0];
          if (!shape) throw new Error('The supplied brand contour could not be triangulated.');
          const geometry = index === 2 ? cushionBrandStar(shape) : extrudeBrandSlab(shape);
          resources.push(geometry);
          const mesh = new THREE.Mesh(geometry, index === 2 ? starChrome : [chrome, edgeChrome]);
          mesh.name = index === 2 ? 'Curved four-point star' : `Extruded brand slash ${index + 1}`;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          if (index === 2) {
            geometry.translate(-3.04, .79, 0);
            mesh.position.set(3.04, -.79, 0);
            starMesh = mesh;
            model.add(mesh);
          } else {
            const group = new THREE.Group();
            const centerX = index === 0 ? -1.715 : 1.005;
            const slope = index === 0 ? 2.81 / 3.52 : 2.85 / 3.52;
            geometry.translate(-centerX, -.08, 0);
            group.position.set(centerX, .08, 0);
            group.add(mesh);
            const faceGeometry = crownBrandSlab(shape);
            faceGeometry.translate(-centerX, -.08, 0);
            resources.push(faceGeometry);
            const face = new THREE.Mesh(faceGeometry, chrome);
            face.name = `Formed metal face ${index + 1}`;
            face.castShadow = true;
            face.receiveShadow = true;
            group.add(face);
            model.add(group);
            mesh.matrixAutoUpdate = false;
            face.matrixAutoUpdate = false;
            slabPoses.push({ group, meshes: [mesh, face], centerX, slope });
          }
        });

        const floorGeometry = new THREE.PlaneGeometry(90, 90);
        const floorMaterial = new THREE.MeshStandardMaterial({ color: '#0b0d0b', roughness: .64, metalness: .15, envMap: environment.texture, envMapIntensity: .035, bumpMap: brush, bumpScale: .002 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -1.92;
        floor.receiveShadow = true;
        scene.add(floor);
        resources.push(floorGeometry, floorMaterial);

        const reflectionGeometry = new THREE.PlaneGeometry(90, 90);
        const reflection = new Reflector(reflectionGeometry, {
          textureWidth: 1024, textureHeight: 1024, multisample: 0, clipBias: .002,
          shader: {
            name: 'BrushedStudioFloor',
            uniforms: { tDiffuse: { value: null }, textureMatrix: { value: new THREE.Matrix4() }, color: { value: new THREE.Color() }, uTexel: { value: new THREE.Vector2(1 / 1024, 1 / 1024) }, uCenter: { value: new THREE.Vector2() }, uStrength: { value: .2 } },
            vertexShader: `uniform mat4 textureMatrix; varying vec4 vReflect; varying vec3 vWorld;
              void main() { vReflect = textureMatrix * vec4(position, 1.); vWorld = (modelMatrix * vec4(position, 1.)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
            fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uTexel; uniform vec2 uCenter; uniform float uStrength; varying vec4 vReflect; varying vec3 vWorld;
              float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
              void main() {
                vec2 uv = vReflect.xy / vReflect.w;
                float dist = length(vWorld.xz-uCenter);
                vec2 radius = uTexel * (2.5 + min(dist, 8.) * .7);
                uv += (hash(floor(vWorld.xz * 170.))-.5) * uTexel * 1.8;
                vec3 c = texture2D(tDiffuse, uv).rgb * .24;
                c += (texture2D(tDiffuse, uv+vec2(radius.x,0.)).rgb + texture2D(tDiffuse, uv-vec2(radius.x,0.)).rgb + texture2D(tDiffuse, uv+vec2(0.,radius.y)).rgb + texture2D(tDiffuse, uv-vec2(0.,radius.y)).rgb) * .12;
                c += (texture2D(tDiffuse, uv+radius).rgb + texture2D(tDiffuse, uv-radius).rgb + texture2D(tDiffuse, uv+vec2(radius.x,-radius.y)).rgb + texture2D(tDiffuse, uv+vec2(-radius.x,radius.y)).rgb) * .07;
                float fade = exp(-max(0., dist-1.5)*.23);
                gl_FragColor = vec4(c, uStrength * fade);
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
              }`,
          },
        });
        reflection.rotation.x = -Math.PI / 2;
        reflection.position.y = floor.position.y + .002;
        const reflectionMaterial = reflection.material as THREE.ShaderMaterial;
        reflectionMaterial.transparent = true;
        reflectionMaterial.depthWrite = false;
        reflection.renderOrder = 2;
        const reflectionViewport = new THREE.Vector4();
        const reflectionScissor = new THREE.Vector4();
        const renderReflection = reflection.onBeforeRender;
        reflection.onBeforeRender = function (render, reflectionScene, viewCamera, geometry, material, group) {
          render.getViewport(reflectionViewport);
          render.getScissor(reflectionScissor);
          const scissors = render.getScissorTest();
          render.setScissorTest(false);
          renderReflection.call(this, render, reflectionScene, viewCamera, geometry, material, group);
          render.setViewport(reflectionViewport);
          render.setScissor(reflectionScissor);
          render.setScissorTest(scissors);
        };
        scene.add(reflection);
        resources.push(reflectionGeometry, reflection);

        const key = new THREE.SpotLight('#f3f5ef', 260, 0, Math.PI / 5, .65, 2);
        key.position.set(-5, 9, 7);
        key.target.position.set(.3, -1.3, 0);
        key.castShadow = true;
        key.shadow.mapSize.set(1024, 1024);
        key.shadow.bias = -.00015;
        key.shadow.normalBias = .025;
        key.shadow.radius = 3;
        key.shadow.camera.near = 1;
        key.shadow.camera.far = 30;
        key.shadow.focus = 1;
        scene.add(key, key.target);
        cleanups.push(() => key.shadow.dispose());
        const fill = new THREE.DirectionalLight('#eff3ff', 1.5);
        fill.position.set(-3, 3, 6);
        scene.add(fill);
        const rim = new THREE.SpotLight('#d7ff36', 40, 0, Math.PI / 4, .8, 2);
        rim.position.set(5, 3, -2.5);
        rim.target.position.set(1, 0, 0);
        scene.add(rim, rim.target);

        const canAnimate = () => !disposed && !failed && !unmounted && !document.hidden && (latest.current.active !== false || !ready) && (inView || !ready);
        const invalidate = () => {
          if (!frame && canAnimate()) frame = requestAnimationFrame(draw);
        };
        const ease = (value: number) => value < .5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
        const getRect = () => {
          const destination = latest.current.dockTarget;
          const fullHeight = latest.current.introHeight || height;
          if (!destination) return { x: 0, y: 0, width, height: fullHeight };
          return {
            x: destination.x * currentDock,
            y: destination.y * currentDock,
            width: THREE.MathUtils.lerp(width, Math.max(1, destination.width), currentDock),
            height: THREE.MathUtils.lerp(fullHeight, Math.max(1, destination.height), currentDock),
          };
        };
        function draw(now: number) {
          frame = 0;
          if (!canAnimate()) return;
          try {
            const reduced = latest.current.reducedMotion;
            const delta = lastTime ? Math.min((now - lastTime) / 1000, .05) : 1 / 60;
            lastTime = now;
            const progress = Math.min(1, (now - dockStart) / 1400);
            currentDock = reduced ? toDock : THREE.MathUtils.lerp(fromDock, toDock, ease(progress));
            const revealProgress = Math.min(1, (now - revealStart) / 1000);
            currentReveal = reduced ? 0 : THREE.MathUtils.lerp(fromReveal, toReveal, ease(revealProgress));
            const damping = 1 - Math.exp(-delta * 10);
            pointerX = reduced ? 0 : THREE.MathUtils.lerp(pointerX, targetPointerX, damping);
            pointerY = reduced ? 0 : THREE.MathUtils.lerp(pointerY, targetPointerY, damping);
            const rect = getRect();
            const aspect = rect.width / rect.height;
            const mobile = width <= 600;
            const medium = width > 600 && width <= 1000;
            const introFraction = mobile ? .78 : Math.min(.46, 620 / width);
            const pose = Math.max(currentDock, currentReveal);
            const frontalHeight = Math.max(5.4, 8.2 / (aspect * introFraction));
            const cinematicHeight = Math.max(5.5, 4.6 / (aspect * (mobile ? .87 : medium ? .51 : .67)));
            const viewHeight = THREE.MathUtils.lerp(frontalHeight, cinematicHeight, pose);
            const viewWidth = viewHeight * aspect;
            const distance = viewHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
            camera.aspect = aspect;
            camera.position.set(0, .35 * pose, distance);
            camera.lookAt(0, -.12 * pose, 0);
            camera.updateProjectionMatrix();
            model.position.x = viewWidth * (mobile ? 0 : medium ? .23 : .17) * pose;
            model.position.y = mobile ? -viewHeight * .055 * currentDock : 0;
            model.position.z = THREE.MathUtils.lerp(-.356, 0, pose);
            model.rotation.set(pointerY * .02, pointerX * .045, 0);
            for (const slab of slabPoses) {
              slab.group.position.x = slab.centerX * THREE.MathUtils.lerp(1, .54, pose);
              slab.group.rotation.y = -Math.PI / 3 * pose;
              const narrowing = THREE.MathUtils.lerp(1, .72, pose);
              const depth = THREE.MathUtils.lerp(1, .27, pose);
              for (const mesh of slab.meshes) mesh.matrix.set(narrowing, (1 - narrowing) * slab.slope, 0, 0, 0, 1, 0, 0, 0, 0, depth, 0, 0, 0, 0, 1);
            }
            if (starMesh) {
              starMesh.position.x = THREE.MathUtils.lerp(3.04, 1.6, pose);
              starMesh.position.y = THREE.MathUtils.lerp(-.79, -1.185, pose);
              starMesh.scale.setScalar(THREE.MathUtils.lerp(1, .55, pose));
              starMesh.rotation.y = -.08 * pose;
            }
            floor.position.y = THREE.MathUtils.lerp(-1.92, -1.74, pose) + model.position.y;
            reflection.position.y = floor.position.y + .002;
            (reflectionMaterial.uniforms.uCenter.value as THREE.Vector2).set(model.position.x, model.position.z);
            key.position.x = model.position.x - 5 + pointerX * .4;
            key.target.position.x = model.position.x;

            gl.setScissorTest(false);
            gl.setViewport(0, 0, width, height);
            gl.clear(true, true, true);
            const bottom = height - rect.y - rect.height;
            gl.setViewport(rect.x, bottom, rect.width, rect.height);
            gl.setScissor(rect.x, bottom, rect.width, rect.height);
            gl.setScissorTest(true);
            gl.render(scene, camera);
            renderCount++;
            host.dataset.sceneFrames = String(renderCount);
            if (!ready) {
              ready = true;
              host.dataset.scene = 'ready';
              host.dataset.sceneTriangles = String(gl.info.render.triangles);
              latest.current.onReady();
            }
            const dockMoving = !reduced && progress < 1 && Math.abs(toDock - fromDock) > .0001;
            const revealMoving = !reduced && revealProgress < 1 && Math.abs(toReveal - fromReveal) > .0001;
            const pointerMoving = Math.abs(pointerX - targetPointerX) + Math.abs(pointerY - targetPointerY) > .0008;
            if (dockMoving || revealMoving || (!reduced && pointerMoving)) invalidate();
          } catch { fail(); }
        }
        const resize = () => {
          if (disposed) return;
          // CSS folding must not resize the drawing buffer to the transformed bounds.
          const nextWidth = Math.max(1, host.clientWidth);
          const nextHeight = Math.max(1, host.clientHeight);
          if (latest.current.active !== false) {
            const box = host.getBoundingClientRect();
            viewportLeft = box.left;
            viewportTop = box.top;
            pageLeft = box.left + window.scrollX;
            pageTop = box.top + window.scrollY;
          }
          if (nextWidth !== width || nextHeight !== height) {
            width = nextWidth;
            height = nextHeight;
            gl.setSize(width, height, false);
          }
          invalidate();
        };
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
        cleanups.push(() => resizeObserver.disconnect());
        const intersectionObserver = new IntersectionObserver(entries => {
          inView = entries[0]?.isIntersecting ?? true;
          if (inView) invalidate();
          else { cancelAnimationFrame(frame); frame = 0; }
        }, { rootMargin: '80px' });
        intersectionObserver.observe(host);
        cleanups.push(() => intersectionObserver.disconnect());
        const pointerMove = (event: PointerEvent) => {
          if (latest.current.active === false || latest.current.reducedMotion || event.pointerType === 'touch') return;
          const pinned = experience?.dataset.morph === 'true';
          const localX = pinned ? event.clientX - viewportLeft : event.pageX - pageLeft;
          const localY = pinned ? event.clientY - viewportTop : event.pageY - pageTop;
          if (localX < 0 || localX > width || localY < 0 || localY > height) { pointerLeave(); return; }
          const rect = getRect();
          targetPointerX = THREE.MathUtils.clamp(((localX - rect.x) / rect.width - .5) * 2, -1, 1);
          targetPointerY = THREE.MathUtils.clamp(((localY - rect.y) / rect.height - .5) * 2, -1, 1);
          invalidate();
        };
        const pointerLeave = () => { targetPointerX = targetPointerY = 0; invalidate(); };
        const pointerOut = (event: PointerEvent) => { if (!event.relatedTarget) pointerLeave(); };
        const visibilityChange = () => {
          if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
          else { lastTime = 0; invalidate(); }
        };
        const contextLost = (event: Event) => { event.preventDefault(); fail(); };
        window.addEventListener('pointermove', pointerMove, { passive: true });
        window.addEventListener('pointerout', pointerOut, { passive: true });
        window.addEventListener('blur', pointerLeave);
        document.addEventListener('visibilitychange', visibilityChange);
        gl.domElement.addEventListener('webglcontextlost', contextLost);
        cleanups.push(() => {
          window.removeEventListener('pointermove', pointerMove);
          window.removeEventListener('pointerout', pointerOut);
          window.removeEventListener('blur', pointerLeave);
          document.removeEventListener('visibilitychange', visibilityChange);
          gl.domElement.removeEventListener('webglcontextlost', contextLost);
        });
        const update = () => {
          const nextActive = latest.current.active !== false;
          if (nextActive && !lastActive) { lastTime = 0; resize(); }
          lastActive = nextActive;
          if (latest.current.docked !== lastDocked) {
            fromDock = currentDock;
            toDock = latest.current.docked ? 1 : 0;
            lastDocked = latest.current.docked;
            dockStart = performance.now();
            host.dataset.sceneDocked = String(lastDocked);
          }
          if (Boolean(latest.current.revealed) !== lastRevealed) {
            fromReveal = currentReveal;
            toReveal = latest.current.revealed ? 1 : 0;
            lastRevealed = Boolean(latest.current.revealed);
            revealStart = performance.now();
          }
          if (latest.current.reducedMotion) {
            currentDock = toDock;
            pointerX = pointerY = targetPointerX = targetPointerY = 0;
          }
          if (latest.current.active === false && ready) { cancelAnimationFrame(frame); frame = 0; }
          else invalidate();
        };
        controller.current = { update, dispose };
        host.dataset.sceneDocked = String(lastDocked);
        resize();
      } catch {
        fail();
        dispose();
      }
    });
    return () => {
      unmounted = true;
      cancelAnimationFrame(initializeFrame);
      controller.current?.dispose();
      controller.current = null;
    };
  }, []);

  useEffect(() => { controller.current?.update(); }, [props.docked, props.dockTarget, props.reducedMotion, props.active, props.introHeight, props.revealed]);

  return <div ref={container} data-scene="loading" aria-hidden="true" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }} />;
}

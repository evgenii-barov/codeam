import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { MetalLogoSceneProps } from './MetalLogoScene';
import { MATCHED_CROP, MATCHED_SOURCE, createMatchedBackdrop, createMatchedFloor, createMatchedSlabs, createMatchedStar, floorStartAt } from './matchedMetalGeometry';
import { createMatchedFaceMaterial, setMatchedLighting } from './matchedLightingMaterial';
import type { LightingPreset } from './matchedLightingMaterial';

type Disposable = { dispose: () => void };
type Controller = { update: () => void; dispose: () => void };
export type MatchedMetalSceneProps = MetalLogoSceneProps & { lighting?: LightingPreset; instantDock?: boolean; onDocked?: () => void; placement?: 'hero' | 'center'; objectTarget?: { x: number; y: number; width: number; height: number } };

/** This mask only blends the floor edge; all metal colour is sampled from the supplied photo. */
function floorAlpha() {
  const width = 512, height = 512;
  const pixels = new Uint8Array(width * height * 4);
  const smooth = (a: number, b: number, value: number) => THREE.MathUtils.smoothstep(value, a, b);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const px = x / (width - 1) * MATCHED_SOURCE.width;
    const py = (1 - y / (height - 1)) * MATCHED_SOURCE.height;
    const start = floorStartAt(px);
    const alpha = smooth(520, 690, px) * (1 - smooth(1610, 1672, px)) * smooth(start, start + 3, py) * (1 - smooth(900, 941, py));
    const offset = (y * width + x) * 4;
    pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = Math.round(alpha * 255);
    pixels[offset + 3] = 255;
  }
  const texture = new THREE.DataTexture(pixels, width, height, THREE.RGBAFormat);
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/** Actual closed 3D solids carrying the reference's baked finish. No full-image logo billboard. */
export default function MatchedMetalScene(props: MatchedMetalSceneProps) {
  const container = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  const control = useRef<Controller | null>(null);
  latest.current = props;

  useEffect(() => {
    const root = container.current;
    if (!root) return;
    const host: HTMLDivElement = root;
    const experience = host.closest<HTMLElement>('.ix-experience');
    let unmounted = false;
    const setupFrame = requestAnimationFrame(() => {
      if (unmounted) return;
      const resources: Disposable[] = [];
      const cleanups: (() => void)[] = [];
      let renderer: THREE.WebGLRenderer | undefined;
      let disposed = false, failed = false, ready = false, loaded = false, inView = true;
      let width = 1, height = 1, pageLeft = 0, pageTop = 0;
      let viewportLeft = 0, viewportTop = 0;
      let lastActive = latest.current.active !== false;
      let frame = 0, previousTime = 0, renderCount = 0;
      let dock = latest.current.docked ? 1 : 0;
      let startDock = dock, endDock = dock, dockElapsed = 1400;
      let lastDocked = latest.current.docked;
      let dockReported = false;
      let lastLighting = latest.current.lighting ?? 'original';
      let pointerX = 0, pointerY = 0, wantedX = 0, wantedY = 0;
      let idleElapsed = 0;

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
        frame = 0;
        host.dataset.scene = 'error';
        latest.current.onError();
      };

      try {
        renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true, powerPreference: 'high-performance' });
        const gl = renderer;
        gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        gl.setClearColor('#10120f');
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.NoToneMapping;
        gl.autoClear = false;
        gl.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;';
        gl.domElement.setAttribute('aria-hidden', 'true');
        gl.domElement.dataset.renderer = 'three-webgl-photo-matched';
        host.appendChild(gl.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-500, 500, 500, -500, .1, 10000);
        camera.position.z = 3000;
        const composition = new THREE.Group();
        const idlePivot = new THREE.Group();
        idlePivot.name = 'Slow, grounded sculpture sway';
        // Keep the gentle idle roll anchored at the floor rather than lifting the sculpture.
        idlePivot.position.y = -MATCHED_CROP.height / 2;
        const sculpture = new THREE.Group();
        sculpture.position.y = MATCHED_CROP.height / 2;
        idlePivot.add(sculpture);
        composition.add(idlePivot);
        scene.add(composition);

        const photo = new THREE.TextureLoader().load('/assets/sculpture.png', () => {
          if (disposed || unmounted) { photo.dispose(); return; }
          loaded = true;
          invalidate();
        }, undefined, fail);
        photo.colorSpace = THREE.SRGBColorSpace;
        photo.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
        photo.wrapS = photo.wrapT = THREE.ClampToEdgeWrapping;
        resources.push(photo);

        const finish = new THREE.MeshBasicMaterial({ map: photo, side: THREE.DoubleSide, toneMapped: false });
        resources.push(finish);
        const faceMaterials: THREE.ShaderMaterial[] = [];
        createMatchedSlabs().forEach((slab, faceIndex) => {
          resources.push(slab.face, slab.walls);
          const faceMaterial = createMatchedFaceMaterial(photo, faceIndex);
          setMatchedLighting(faceMaterial, lastLighting);
          faceMaterials.push(faceMaterial);
          resources.push(faceMaterial);
          const face = new THREE.Mesh(slab.face, faceMaterial);
          const walls = new THREE.Mesh(slab.walls, finish);
          face.name = `${slab.name} / brushed face`;
          walls.name = `${slab.name} / 87px deep closed sides`;
          sculpture.add(face, walls);
        });
        host.dataset.sceneLighting = lastLighting;
        const starGeometry = createMatchedStar();
        const starCenter = new THREE.Vector3(1505 - (MATCHED_CROP.x + MATCHED_CROP.width / 2), (MATCHED_CROP.y + MATCHED_CROP.height / 2) - 711, 0);
        // Preserve every calibrated vertex at rest, then turn the star around its own centre.
        starGeometry.translate(-starCenter.x, -starCenter.y, 0);
        resources.push(starGeometry);
        const star = new THREE.Mesh(starGeometry, finish);
        star.name = 'Photo-matched soft, closed four-point star';
        const starPivot = new THREE.Group();
        starPivot.name = 'Independent cursor-responsive star pivot';
        starPivot.position.copy(starCenter);
        starPivot.add(star);
        sculpture.add(starPivot);

        const backdropGeometry = createMatchedBackdrop();
        const backdropMaterial = new THREE.MeshBasicMaterial({ map: photo, depthWrite: false, toneMapped: false });
        const backdrop = new THREE.Mesh(backdropGeometry, backdropMaterial);
        backdrop.name = 'Empty left-side photographic environment';
        backdrop.renderOrder = -5;
        composition.add(backdrop);
        resources.push(backdropGeometry, backdropMaterial);

        // A separate ground mesh samples the empty photographic floor at its original grain scale.
        // Mirrored horizontal sampling removes seams without stretching one scanline over the viewport.
        const groundGeometry = new THREE.PlaneGeometry(6000, 900);
        groundGeometry.translate(0, -725, -130);
        const groundMaterial = new THREE.ShaderMaterial({
          uniforms: { sourcePhoto: { value: photo } },
          vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
          fragmentShader: `uniform sampler2D sourcePhoto;
            varying vec2 vUv;
            void main(){
              float photoY=700.0+(1.0-vUv.y)*900.0;
              float mirrored=1.0-abs(mod(vUv.x*6000.0/620.0,2.0)-1.0);
              vec2 sourceUv=vec2((20.0+mirrored*590.0)/1672.0,1.0-clamp(photoY,700.0,940.0)/941.0);
              vec3 colour=texture2D(sourcePhoto,sourceUv).rgb;
              float alpha=smoothstep(745.0,825.0,photoY)*(1.0-smoothstep(990.0,1200.0,photoY))*.75;
              gl_FragColor=vec4(colour,alpha);
              #include <colorspace_fragment>
            }`,
          transparent: true, depthWrite: false, toneMapped: false,
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.name = 'Fine photographic ground grain, without duplicated source objects';
        ground.renderOrder = -3;
        composition.add(ground);
        resources.push(groundGeometry, groundMaterial);

        const alpha = floorAlpha();
        const floorGeometry = createMatchedFloor();
        const floorMaterial = new THREE.MeshBasicMaterial({ map: photo, alphaMap: alpha, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.name = 'Photographic reflection on a separate ground surface';
        floor.renderOrder = -1;
        composition.add(floor);
        resources.push(alpha, floorGeometry, floorMaterial);

        const canRender = () => !disposed && !failed && !unmounted && loaded && !document.hidden && (latest.current.active !== false || !ready) && (inView || !ready);
        const ease = (v: number) => v < .5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
        function invalidate() { if (!frame && canRender()) frame = requestAnimationFrame(draw); }
        const viewport = () => {
          const fullHeight = latest.current.introHeight || height;
          const target = latest.current.dockTarget;
          if (!target) return { x: 0, y: 0, width, height: fullHeight };
          return { x: target.x * dock, y: target.y * dock, width: THREE.MathUtils.lerp(width, target.width, dock), height: THREE.MathUtils.lerp(fullHeight, target.height, dock) };
        };
        function draw(now: number) {
          frame = 0;
          if (!canRender()) return;
          try {
            const dt = previousTime ? Math.min(now - previousTime, 60) : 16;
            previousTime = now;
            dockElapsed = Math.min(1400, dockElapsed + dt);
            const reduced = latest.current.reducedMotion;
            dock = reduced || latest.current.instantDock ? endDock : THREE.MathUtils.lerp(startDock, endDock, ease(dockElapsed / 1400));
            const allowTurn = latest.current.revealed !== false && !reduced;
            const amount = 1 - Math.exp(-dt / 160);
            // Never accumulate an invisible cursor pose and switch it on at reveal.
            const targetX = allowTurn ? wantedX : 0;
            const targetY = allowTurn ? wantedY : 0;
            pointerX = reduced ? 0 : THREE.MathUtils.lerp(pointerX, targetX, amount);
            pointerY = reduced ? 0 : THREE.MathUtils.lerp(pointerY, targetY, amount);

            const rect = viewport();
            const mobile = width <= 600;
            const introHeight = latest.current.introHeight || height;
            const introWidth = Math.min(width * (mobile ? .78 : .46), mobile ? Infinity : 620, .60 * introHeight * MATCHED_CROP.width / MATCHED_CROP.height);
            const centered = latest.current.placement === 'center';
            const targetWidth = (latest.current.dockTarget?.width || width) * (centered ? .83 : mobile ? .87 : .54);
            const targetHeight = latest.current.dockTarget?.height || height;
            const dockWidth = Math.min(targetWidth, targetHeight * (mobile ? .70 : .86) * MATCHED_CROP.width / MATCHED_CROP.height);
            const objectTarget = latest.current.objectTarget;
            const renderedWidth = objectTarget ? Math.min(objectTarget.width * .92, objectTarget.height * .82 * MATCHED_CROP.width / MATCHED_CROP.height) : THREE.MathUtils.lerp(introWidth, dockWidth, dock);
            const scale = Math.max(.01, renderedWidth / MATCHED_CROP.width);
            const viewWidth = rect.width / scale, viewHeight = rect.height / scale;
            camera.left = -viewWidth / 2; camera.right = viewWidth / 2;
            camera.top = viewHeight / 2; camera.bottom = -viewHeight / 2;
            camera.updateProjectionMatrix();
            composition.position.x = (centered || mobile ? 0 : .20) * viewWidth * dock;
            composition.position.y = (!centered && mobile ? -.12 : 0) * viewHeight * dock;
            if (objectTarget) {
              composition.position.x = (objectTarget.x + objectTarget.width / 2 - width / 2) / scale;
              composition.position.y = (height / 2 - objectTarget.y - objectTarget.height / 2) / scale;
            }
            const turnX = allowTurn ? pointerX : 0;
            const turnY = allowTurn ? pointerY : 0;
            // Accumulated visible time preserves the phase across tab/section pauses.
            // Start at the calibrated pose and ease into a few-pixel movement over slow cycles.
            idleElapsed = allowTurn ? idleElapsed + dt : 0;
            const idleSeconds = idleElapsed / 1000;
            const idleStrength = THREE.MathUtils.smoothstep(idleElapsed, 0, 1600);
            const idleWave = (period: number, degrees: number) => Math.sin(idleSeconds * Math.PI * 2 / period) * THREE.MathUtils.degToRad(degrees) * idleStrength;
            idlePivot.rotation.set(idleWave(12, .7), idleWave(10, 2.8), idleWave(8.5, .85));
            sculpture.rotation.set(turnY * THREE.MathUtils.degToRad(2.8), turnX * THREE.MathUtils.degToRad(3.5), 0);
            starPivot.rotation.set(turnY * THREE.MathUtils.degToRad(2.2), turnX * THREE.MathUtils.degToRad(4.5) + idleWave(10.5, 3), -turnX * THREE.MathUtils.degToRad(4) + idleWave(8.5, 2.6));
            starPivot.position.set(starCenter.x + turnX * 7, starCenter.y, starCenter.z);
            for (const material of faceMaterials) material.uniforms.uPointer?.value.set(allowTurn ? pointerX : 0, allowTurn ? pointerY : 0);

            gl.setScissorTest(false);
            gl.setViewport(0, 0, width, height);
            gl.clear(true, true, true);
            gl.setViewport(rect.x, height - rect.y - rect.height, rect.width, rect.height);
            gl.setScissor(rect.x, height - rect.y - rect.height, rect.width, rect.height);
            gl.setScissorTest(true);
            gl.render(scene, camera);
            if (endDock === 1 && dock === 1 && !dockReported) {
              dockReported = true;
              latest.current.onDocked?.();
            }
            host.dataset.sceneFrames = String(++renderCount);
            if (!ready) {
              ready = true;
              host.dataset.scene = 'ready';
              host.dataset.sceneTriangles = String(gl.info.render.triangles);
              latest.current.onReady();
            }
            const moving = !reduced && (!latest.current.instantDock && dockElapsed < 1400 && Math.abs(endDock - startDock) > .0001 || Math.abs(pointerX - targetX) + Math.abs(pointerY - targetY) > .0005);
            // Idle motion only keeps rendering while the revealed scene can actually be seen.
            if (moving || allowTurn) invalidate();
          } catch { fail(); }
        }

        const resize = () => {
          if (disposed) return;
          // The fold transforms the element visually; its WebGL drawing size stays unchanged.
          const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
          if (latest.current.active !== false) {
            const box = host.getBoundingClientRect();
            viewportLeft = box.left; viewportTop = box.top;
            pageLeft = box.left + scrollX; pageTop = box.top + scrollY;
          }
          if (w !== width || h !== height) { width = w; height = h; gl.setSize(width, height, false); }
          invalidate();
        };
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
        cleanups.push(() => resizeObserver.disconnect());
        const observer = new IntersectionObserver(entries => {
          inView = entries[0]?.isIntersecting ?? true;
          if (inView) { previousTime = 0; invalidate(); }
          else { cancelAnimationFrame(frame); frame = 0; }
        }, { rootMargin: '80px' });
        observer.observe(host);
        cleanups.push(() => observer.disconnect());

        const leave = () => { wantedX = wantedY = 0; invalidate(); };
        const move = (event: PointerEvent) => {
          if (latest.current.active === false || latest.current.reducedMotion || event.pointerType === 'touch') return;
          const centered = latest.current.placement === 'center';
          const box = centered ? host.getBoundingClientRect() : null;
          const pinned = experience?.dataset.morph === 'true';
          const x = box ? event.clientX - box.left : pinned ? event.clientX - viewportLeft : event.pageX - pageLeft;
          const y = box ? event.clientY - box.top : pinned ? event.clientY - viewportTop : event.pageY - pageTop;
          const rect = viewport();
          if (x < rect.x || x > rect.x + rect.width || y < rect.y || y > rect.y + rect.height) { leave(); return; }
          wantedX = THREE.MathUtils.clamp((x - rect.x) / rect.width * 2 - 1, -1, 1);
          wantedY = THREE.MathUtils.clamp((y - rect.y) / rect.height * 2 - 1, -1, 1);
          invalidate();
        };
        const out = (event: PointerEvent) => { if (!event.relatedTarget) leave(); };
        const visibility = () => {
          previousTime = 0;
          if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
          else invalidate();
        };
        const contextLost = (event: Event) => { event.preventDefault(); fail(); };
        window.addEventListener('pointermove', move, { passive: true });
        window.addEventListener('pointerout', out, { passive: true });
        window.addEventListener('blur', leave);
        document.addEventListener('visibilitychange', visibility);
        gl.domElement.addEventListener('webglcontextlost', contextLost);
        cleanups.push(() => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerout', out);
          window.removeEventListener('blur', leave);
          document.removeEventListener('visibilitychange', visibility);
          gl.domElement.removeEventListener('webglcontextlost', contextLost);
        });
        const update = () => {
          const nextActive = latest.current.active !== false;
          if (nextActive && !lastActive) { previousTime = 0; resize(); }
          lastActive = nextActive;
          const nextLighting = latest.current.lighting ?? 'original';
          if (nextLighting !== lastLighting) {
            lastLighting = nextLighting;
            faceMaterials.forEach(material => setMatchedLighting(material, nextLighting));
            host.dataset.sceneLighting = nextLighting;
          }
          if (latest.current.docked !== lastDocked) {
            dockReported = false;
            startDock = dock; endDock = latest.current.docked ? 1 : 0;
            lastDocked = latest.current.docked; dockElapsed = 0; previousTime = 0;
            host.dataset.sceneDocked = String(lastDocked);
          }
          if (latest.current.reducedMotion) { dock = endDock; pointerX = pointerY = wantedX = wantedY = 0; }
          if (latest.current.instantDock) { dock = endDock; dockElapsed = 1400; }
          if (latest.current.active === false && ready) { cancelAnimationFrame(frame); frame = 0; }
          else invalidate();
        };
        control.current = { update, dispose };
        host.dataset.sceneDocked = String(lastDocked);
        resize();
      } catch { fail(); dispose(); }
    });
    return () => { unmounted = true; cancelAnimationFrame(setupFrame); control.current?.dispose(); control.current = null; };
  }, []);

  useEffect(() => { control.current?.update(); }, [props.docked, props.dockTarget, props.reducedMotion, props.active, props.introHeight, props.revealed, props.lighting, props.instantDock, props.objectTarget]);
  return <div ref={container} data-scene="loading" data-scene-technique="calibrated-photo-geometry" aria-hidden="true" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }} />;
}

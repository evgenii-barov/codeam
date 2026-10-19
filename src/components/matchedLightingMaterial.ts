import * as THREE from 'three';

export type LightingPreset = 'original' | 'softened' | 'balanced';

const presetIndex: Record<LightingPreset, number> = { original: 0, softened: 1, balanced: 2 };

/**
 * The photograph remains the lighting reference. Alternatives make a restrained,
 * local correction to the pointed reflection on the first slab; they do not replace
 * the studio lighting, metal colour or original high-frequency brushed finish.
 * `faceUv` runs left-to-right / bottom-to-top. `uv` is the calibrated photo UV.
 */
export function createMatchedFaceMaterial(photo: THREE.Texture, faceIndex: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    name: `Photo-preserving metal lighting ${faceIndex + 1}`,
    uniforms: {
      uPhoto: { value: photo },
      uTexel: { value: new THREE.Vector2(1 / 1672, 1 / 941) },
      uPreset: { value: 0 },
      uFaceIndex: { value: faceIndex },
      uPointer: { value: new THREE.Vector2() },
    },
    vertexShader: /* glsl */`
      attribute vec2 faceUv;
      varying vec2 vPhotoUv;
      varying vec2 vFaceUv;
      void main() {
        vPhotoUv = uv;
        vFaceUv = faceUv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform sampler2D uPhoto;
      uniform vec2 uTexel;
      uniform float uPreset;
      uniform float uFaceIndex;
      varying vec2 vPhotoUv;
      varying vec2 vFaceUv;

      float photoLuma(vec3 c) { return dot(c, vec3(.2126, .7152, .0722)); }
      vec3 photographicLowPass(vec2 uv, float radius) {
        vec3 sum = vec3(0.0);
        float total = 0.0;
        for (int y = -2; y <= 2; y++) {
          for (int x = -2; x <= 2; x++) {
            vec2 offset = vec2(float(x), float(y));
            float weight = exp(-dot(offset, offset) / 2.88);
            sum += texture2D(uPhoto, uv + offset * uTexel * radius).rgb * weight;
            total += weight;
          }
        }
        return sum / total;
      }

      void main() {
        vec3 source = texture2D(uPhoto, vPhotoUv).rgb;
        vec3 result = source;
        // Exact original is the default; the second slab is also untouched in both variants.
        if (uPreset > .5 && uFaceIndex < .5) {
          vec2 p = vFaceUv;
          float centre = .34 + .08 * (1.0 - p.y);
          float horizontal = (p.x - centre) / .38;
          float vertical = (p.y - .64) / .245;
          float local = exp(-.5 * (horizontal * horizontal + vertical * vertical));
          // Keep the silhouette, top and base untouched; no photo sampling across an edge.
          local *= smoothstep(.025, .16, p.x) * (1.0 - smoothstep(.84, .98, p.x));
          local *= smoothstep(.22, .34, p.y) * (1.0 - smoothstep(.91, .98, p.y));
          if (local > .001) {
            vec3 fine = photographicLowPass(vPhotoUv, 2.0);
            vec3 broad = photographicLowPass(vPhotoUv, 10.0);
            // Subtract/add only low frequencies. The source's scratches remain pixel-aligned.
            float strength = uPreset < 1.5 ? .48 : .62;
            vec3 correction = (broad - fine) * local * strength;
            // Limit the local correction so the original dark and white lobes stay recognizable.
            correction = clamp(correction, vec3(-.065), vec3(.065));
            result = source + correction;
            if (uPreset > 1.5) {
              // A slightly quieter peak, with a very small fill on the adjacent dark reflection.
              float light = photoLuma(fine);
              float peak = smoothstep(.34, .87, light);
              float dark = 1.0 - smoothstep(.025, .16, light);
              result *= 1.0 - .075 * local * peak;
              result += vec3(.008, .009, .009) * local * dark;
            }
          }
        }
        gl_FragColor = vec4(clamp(result, vec3(0.0), vec3(1.0)), 1.0);
        #include <colorspace_fragment>
      }
    `,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
}

/** Uniform-only changes retain the existing canvas and do not rebuild any geometry. */
export function setMatchedLighting(material: THREE.ShaderMaterial, preset: LightingPreset): void {
  material.uniforms.uPreset.value = presetIndex[preset];
}

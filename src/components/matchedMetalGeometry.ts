import * as THREE from 'three';

/** Photo-space calibration. The camera looks down +Z; neutral projection preserves every source UV. */
export const MATCHED_SOURCE = { width: 1672, height: 941 };
export const MATCHED_CROP = { x: 680, y: 0, width: 970, height: 850 };
export const MATCHED_OUTLINES = {
  first: 'M1043 12 L1201 9 L1225 47 L925 837 L741 835 L699 822 Z',
  second: 'M1335 13 L1495 10 L1515 47 L1225 846 L1057 841 L1007 827 Z',
  star: 'M1505 584 C1518 657 1541 694 1629 710 C1550 729 1517 750 1507 828 C1491 749 1469 728 1380 710 C1474 694 1500 660 1505 584 Z',
};

type Point = [number, number];
type Quad = [Point, Point, Point, Point];
const centerX = MATCHED_CROP.x + MATCHED_CROP.width / 2;
const centerY = MATCHED_CROP.y + MATCHED_CROP.height / 2;

function vertex(x: number, y: number, z: number, positions: number[], uvs: number[]) {
  positions.push(x - centerX, centerY - y, z);
  uvs.push(x / MATCHED_SOURCE.width, 1 - y / MATCHED_SOURCE.height);
}

function finish(positions: number[], uvs: number[], indices: number[]) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/** A formed metal face, rather than a texture rectangle: image-plane projection stays calibrated. */
function faceGeometry(corners: Quad) {
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  const faceUvs: number[] = [];
  const columns = 12, rows = 48;
  for (let row = 0; row <= rows; row++) {
    const v = row / rows;
    for (let col = 0; col <= columns; col++) {
      const u = col / columns;
      const topX = THREE.MathUtils.lerp(corners[0][0], corners[1][0], u);
      const topY = THREE.MathUtils.lerp(corners[0][1], corners[1][1], u);
      const bottomX = THREE.MathUtils.lerp(corners[3][0], corners[2][0], u);
      const bottomY = THREE.MathUtils.lerp(corners[3][1], corners[2][1], u);
      const z = 35 + 3.5 * Math.sin(Math.PI * u) * Math.sin(Math.PI * v);
      vertex(THREE.MathUtils.lerp(topX, bottomX, v), THREE.MathUtils.lerp(topY, bottomY, v), z, positions, uvs);
      faceUvs.push(u, 1 - v);
      if (row < rows && col < columns) {
        const a = row * (columns + 1) + col;
        indices.push(a, a + columns + 1, a + 1, a + 1, a + columns + 1, a + columns + 2);
      }
    }
  }
  const geometry = finish(positions, uvs, indices);
  geometry.setAttribute('faceUv', new THREE.Float32BufferAttribute(faceUvs, 2));
  return geometry;
}

/** Closed, genuinely deep side walls. Source projection also maps the lime right-hand wall. */
function wallsGeometry(front: Quad, back: Quad) {
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  for (let side = 0; side < 4; side++) {
    const next = (side + 1) % 4;
    const offset = positions.length / 3;
    vertex(...front[side], 35, positions, uvs);
    vertex(...front[next], 35, positions, uvs);
    vertex(...back[next], -52, positions, uvs);
    vertex(...back[side], -52, positions, uvs);
    indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
  }
  const base = positions.length / 3;
  for (const point of back) vertex(...point, -52, positions, uvs);
  indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  return finish(positions, uvs, indices);
}

export function createMatchedSlabs() {
  const first: Quad = [[1043, 12], [1201, 9], [870, 824], [699, 822]];
  const firstBack: Quad = [[1067, 50], [1225, 47], [925, 837], [741, 835]];
  const second: Quad = [[1335, 13], [1495, 10], [1180, 837], [1007, 827]];
  const secondBack: Quad = [[1355, 50], [1515, 47], [1225, 846], [1057, 841]];
  return [
    { name: 'Photo-matched first slab', face: faceGeometry(first), walls: wallsGeometry(first, firstBack) },
    { name: 'Photo-matched second slab', face: faceGeometry(second), walls: wallsGeometry(second, secondBack) },
  ];
}

/** Closed soft four-point volume. Front is a rounded dome with a photo-calibrated footprint. */
export function createMatchedStar() {
  const outline = new THREE.Shape();
  outline.moveTo(1505, 584);
  outline.bezierCurveTo(1518, 657, 1541, 694, 1629, 710);
  outline.bezierCurveTo(1550, 729, 1517, 750, 1507, 828);
  outline.bezierCurveTo(1491, 749, 1469, 728, 1380, 710);
  outline.bezierCurveTo(1474, 694, 1500, 660, 1505, 584);
  const boundary = outline.getSpacedPoints(160).slice(0, -1);
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  const rings = 20, count = boundary.length;
  const cx = 1505, cy = 711;
  // Two separately triangulated skins share the same contour; the rear closes the solid.
  for (let skin = 0; skin < 2; skin++) {
    const base = positions.length / 3;
    vertex(cx, cy, skin ? -34 : 56, positions, uvs);
    for (let ring = 1; ring <= rings; ring++) {
      const radial = ring / rings;
      for (const point of boundary) {
        const z = (skin ? -34 : 56) * Math.pow(Math.cos(radial * Math.PI / 2), .85);
        vertex(THREE.MathUtils.lerp(cx, point.x, radial), THREE.MathUtils.lerp(cy, point.y, radial), z, positions, uvs);
      }
      for (let i = 0; i < count; i++) {
        const next = (i + 1) % count;
        if (ring === 1) indices.push(base, base + 1 + i, base + 1 + next);
        else {
          const previous = base + 1 + (ring - 2) * count;
          const current = base + 1 + (ring - 1) * count;
          indices.push(previous + i, current + i, current + next, previous + i, current + next, previous + next);
        }
      }
    }
  }
  return finish(positions, uvs, indices);
}

export function floorStartAt(x: number) {
  // Follow the bases, keeping the texture behind the geometry free of duplicate metal pixels.
  const edge: Point[] = [[520, 830], [690, 830], [700, 840], [930, 840], [950, 830], [995, 830], [1007, 849], [1228, 849], [1245, 830], [1672, 830]];
  for (let i = 1; i < edge.length; i++) {
    if (x <= edge[i][0]) return THREE.MathUtils.lerp(edge[i - 1][1], edge[i][1], THREE.MathUtils.clamp((x - edge[i - 1][0]) / (edge[i][0] - edge[i - 1][0]), 0, 1));
  }
  return 830;
}

/** Original reflected floor pixels only, with a top edge fitted around the source object bases. */
export function createMatchedFloor() {
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  const columns = [520, 690, 700, 930, 950, 995, 1007, 1228, 1245, 1672];
  for (let i = 0; i < columns.length; i++) {
    const x = columns[i];
    vertex(x, floorStartAt(x), -90, positions, uvs);
    vertex(x, 941, -20, positions, uvs);
    if (i < columns.length - 1) { const a = i * 2; indices.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
  }
  return finish(positions, uvs, indices);
}

/** Background samples exclusively the empty left side; no duplicate picture of the logo. */
export function createMatchedBackdrop() {
  const geometry = new THREE.PlaneGeometry(12000, 12000);
  geometry.translate(0, 0, -180);
  const positions = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < positions.count; i++) {
    // Sampling an empty sky scanline avoids stretching photographic ground grain into bands.
    uv.setXY(i, ((positions.getX(i) + 6000) / 12000) * (620 / MATCHED_SOURCE.width), 1 - 390 / MATCHED_SOURCE.height);
  }
  uv.needsUpdate = true;
  return geometry;
}

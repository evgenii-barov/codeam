import * as THREE from 'three';

const UNIT = .02;
const CENTER_X = 205;
const CENTER_Y = 92;

/** The SVG contour stays exact; depth and the narrow machined bevel are added in Z. */
export function extrudeBrandSlab(shape: THREE.Shape): THREE.ExtrudeGeometry {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 30,
    steps: 1,
    curveSegments: 24,
    bevelEnabled: true,
    bevelThickness: 2.8,
    bevelSize: 1.8,
    bevelSegments: 5,
  });
  geometry.scale(UNIT, UNIT, UNIT);
  // A rotation, rather than negative geometry scale, preserves triangle winding.
  geometry.rotateX(Math.PI);
  geometry.translate(-CENTER_X * UNIT, CENTER_Y * UNIT, 15 * UNIT);
  // Replace the camera-facing planar lid with the subtly crowned metal face below.
  const lid = geometry.groups.find(group => group.materialIndex === 0);
  if (lid) { lid.start += lid.count / 2; lid.count /= 2; }
  const position = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < position.count; i++) {
    uv.setXY(i, position.getX(i) * .66 + position.getZ(i) * .75, position.getY(i) * .66);
  }
  uv.needsUpdate = true;
  geometry.computeBoundingSphere();
  return geometry;
}

/** A very shallow formed-metal crown; its perimeter is still the exact SVG contour. */
export function crownBrandSlab(shape: THREE.Shape): THREE.BufferGeometry {
  const points = shape.getPoints(1);
  const minY = Math.min(...points.map(point => point.y));
  const maxY = Math.max(...points.map(point => point.y));
  const upper = points.filter(point => Math.abs(point.y - minY) < .01);
  const lower = points.filter(point => Math.abs(point.y - maxY) < .01);
  const leftTop = Math.min(...upper.map(point => point.x));
  const rightTop = Math.max(...upper.map(point => point.x));
  const leftBottom = Math.min(...lower.map(point => point.x));
  const rightBottom = Math.max(...lower.map(point => point.x));
  const columns = 28;
  const rows = 40;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rows; row++) {
    const v = row / rows;
    const left = THREE.MathUtils.lerp(leftTop, leftBottom, v);
    const right = THREE.MathUtils.lerp(rightTop, rightBottom, v);
    for (let column = 0; column <= columns; column++) {
      const u = column / columns;
      const x = (THREE.MathUtils.lerp(left, right, u) - CENTER_X) * UNIT;
      const y = (CENTER_Y - THREE.MathUtils.lerp(minY, maxY, v)) * UNIT;
      const z = .356 + .038 * Math.sin(Math.PI * u) * Math.sin(Math.PI * v);
      positions.push(x, y, z);
      uvs.push(x * .66 + z * .75, y * .66);
      if (row < rows && column < columns) {
        const a = row * (columns + 1) + column;
        const b = a + columns + 1;
        indices.push(a, b, b + 1, a, b + 1, a + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/** A closed, softly domed metal surface with the supplied curved star as its perimeter. */
export function cushionBrandStar(shape: THREE.Shape): THREE.BufferGeometry {
  const contour = shape.getPoints(36).map(point => new THREE.Vector2((point.x - CENTER_X) * UNIT, (CENTER_Y - point.y) * UNIT));
  if (contour[0].distanceToSquared(contour[contour.length - 1]) < .000001) contour.pop();
  if (THREE.ShapeUtils.isClockWise(contour)) contour.reverse();
  const center = new THREE.Vector2((357 - CENTER_X) * UNIT, (CENTER_Y - 131.5) * UNIT);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const rings = 13;
  const count = contour.length;
  const addVertex = (x: number, y: number, z: number) => {
    const index = positions.length / 3;
    positions.push(x, y, z);
    uvs.push(x * .5, y * .5);
    return index;
  };
  const frontCenter = addVertex(center.x, center.y, .34);
  const front: number[][] = [];
  const back: number[][] = [];
  for (let ring = 1; ring <= rings; ring++) {
    const radius = ring / rings;
    const height = .34 * Math.pow(Math.cos(radius * Math.PI / 2), .72);
    front.push(contour.map(point => addVertex(THREE.MathUtils.lerp(center.x, point.x, radius), THREE.MathUtils.lerp(center.y, point.y, radius), height)));
  }
  const backCenter = addVertex(center.x, center.y, -.25);
  for (let ring = 1; ring < rings; ring++) {
    const radius = ring / rings;
    const height = -.25 * Math.pow(Math.cos(radius * Math.PI / 2), .72);
    back.push(contour.map(point => addVertex(THREE.MathUtils.lerp(center.x, point.x, radius), THREE.MathUtils.lerp(center.y, point.y, radius), height)));
  }
  // Sharing the outside ring gives the thin rounded edge continuous vertex normals.
  back.push(front[rings - 1]);
  for (let j = 0; j < count; j++) {
    const next = (j + 1) % count;
    indices.push(frontCenter, front[0][j], front[0][next]);
    indices.push(backCenter, back[0][next], back[0][j]);
    for (let ring = 1; ring < rings; ring++) {
      const a = front[ring - 1][j], b = front[ring][j], c = front[ring][next], d = front[ring - 1][next];
      indices.push(a, b, c, a, c, d);
      const e = back[ring - 1][j], f = back[ring][j], g = back[ring][next], h = back[ring - 1][next];
      indices.push(e, g, f, e, h, g);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

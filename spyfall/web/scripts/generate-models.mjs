import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mkdir, writeFile } from 'node:fs/promises';

globalThis.FileReader = class {
  result = null;
  onloadend = null;
  async readAsArrayBuffer(blob) { this.result = await blob.arrayBuffer(); this.onloadend?.(); }
};

const out = new URL('../public/models/', import.meta.url);
await mkdir(out, { recursive: true });
const mat = (color, roughness = .78) => new THREE.MeshStandardMaterial({ color, roughness, metalness: .05, flatShading: true });
const add = (root, mesh) => { mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh); return mesh; };
const ico = (root, color, pos, scale) => { const m = add(root, new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), mat(color))); m.position.set(...pos); m.scale.set(...scale); return m; };
const sphere = (root, color, pos, scale, seg = 8) => { const m = add(root, new THREE.Mesh(new THREE.SphereGeometry(1, seg, Math.max(4, seg - 2)), mat(color))); m.position.set(...pos); m.scale.set(...scale); return m; };
const cone = (root, color, pos, scale, rot = [0, 0, 0]) => { const m = add(root, new THREE.Mesh(new THREE.ConeGeometry(1, 1, 4), mat(color))); m.position.set(...pos); m.scale.set(...scale); m.rotation.set(...rot); return m; };
const eye = (root, x, y, z, color = 0x171a28) => { sphere(root, 0xf6f0d8, [x, y, z], [.16, .16, .12], 8); sphere(root, color, [x, y, z + .115], [.07, .07, .045], 7); };
const paws = (root, color) => { ico(root, color, [-.38, .48, .72], [.28, .15, .4]); ico(root, color, [.38, .48, .72], [.28, .15, .4]); };
function animal(kind) {
  const root = new THREE.Group(); root.name = `${kind}-low-poly-character`;
  const palettes = { frog: [0x57bd45, 0x9be35a], fox: [0xe96825, 0xf5c19b], cat: [0x668ed7, 0xc4ddff], panda: [0xdce3e2, 0x202936], person: [0xc78943, 0xf0c29d] };
  const [body, accent] = palettes[kind];
  ico(root, body, [0, .92, 0], [.78, .88, .66]);
  ico(root, body, [0, 1.65, .08], [.68, .62, .58]);
  if (kind === 'frog') {
    sphere(root, body, [-.4, 2.05, .02], [.3, .32, .28]); sphere(root, body, [.4, 2.05, .02], [.3, .32, .28]); eye(root, -.4, 2.1, .3); eye(root, .4, 2.1, .3); ico(root, accent, [0, 1.45, .55], [.45, .16, .08]);
  } else if (kind === 'fox') {
    cone(root, body, [-.4, 2.15, .02], [.28, .58, .28], [0, 0, -.2]); cone(root, body, [.4, 2.15, .02], [.28, .58, .28], [0, 0, .2]); eye(root, -.24, 1.73, .55); eye(root, .24, 1.73, .55); ico(root, accent, [0, 1.5, .57], [.4, .25, .12]);
  } else if (kind === 'cat') {
    cone(root, body, [-.38, 2.15, .02], [.3, .62, .3], [0, 0, -.15]); cone(root, body, [.38, 2.15, .02], [.3, .62, .3], [0, 0, .15]); eye(root, -.24, 1.75, .55, 0x17204c); eye(root, .24, 1.75, .55, 0x17204c);
  } else if (kind === 'panda') {
    sphere(root, 0x202936, [-.34, 1.78, .5], [.19, .24, .08]); sphere(root, 0x202936, [.34, 1.78, .5], [.19, .24, .08]); eye(root, -.25, 1.78, .59); eye(root, .25, 1.78, .59); sphere(root, 0x202936, [-.42, 2.05, .05], [.2, .2, .16]); sphere(root, 0x202936, [.42, 2.05, .05], [.2, .2, .16]);
  } else {
    eye(root, -.22, 1.76, .55, 0x28344e); eye(root, .22, 1.76, .55, 0x28344e);
  }
  paws(root, body);
  root.userData.kind = kind;
  return root;
}
const exporter = new GLTFExporter();
for (const kind of ['frog', 'fox', 'cat', 'panda', 'person']) {
  const data = await exporter.parseAsync(animal(kind), { binary: true, trs: false, onlyVisible: true });
  await writeFile(new URL(`${kind}.glb`, out), Buffer.from(data));
  console.log(`${kind}.glb ${Buffer.from(data).length} bytes`);
}

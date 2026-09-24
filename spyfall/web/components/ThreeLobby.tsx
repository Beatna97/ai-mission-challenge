'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

type Player = { id: string; name: string; ready?: boolean; };
type Props = { players: Player[]; speaking: string[]; mine?: string; skin?: string; };

const cosmetics: Record<string, { model: string; color: number; hat: string }> = {
  gold: { model: 'squirrel', color: 0xc58a35, hat: '🎩' },
  fox: { model: 'fox', color: 0xe86926, hat: '🧢' },
  cat: { model: 'rabbit', color: 0x6593d6, hat: '🎀' },
  panda: { model: 'squirrel', color: 0xd9dedb, hat: '🕶️' },
  frog: { model: 'frog', color: 0x58bd45, hat: '👑' },
};

function mat(color: number, roughness = .72) { return new THREE.MeshStandardMaterial({ color, roughness, metalness: .08 }); }
function lowPolyAnimal(kind: string, color: number) {
  const root = new THREE.Group();
  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(.62, 1), mat(color)); body.scale.set(.9, 1.05, .75); body.position.y = .9; root.add(body);
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(.58, 1), mat(color)); head.position.set(0, 1.65, .08); head.scale.set(1, .9, .9); root.add(head);
  const eyeMat = mat(0x141a27, .3), eyeWhite = mat(0xf5f4da, .4);
  for (const x of [-.22, .22]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), eyeWhite); eye.position.set(x, 1.78, .52); root.add(eye); const pupil = new THREE.Mesh(new THREE.SphereGeometry(.055, 7, 5), eyeMat); pupil.position.set(x, 1.78, .62); root.add(pupil); }
  const pawMat = mat(color); for (const x of [-.36, .36]) { const paw = new THREE.Mesh(new THREE.IcosahedronGeometry(.24, 1), pawMat); paw.scale.set(1.2, .55, 1.5); paw.position.set(x, .48, .68); root.add(paw); }
  if (kind === 'frog') { for (const x of [-.4, .4]) { const bump = new THREE.Mesh(new THREE.IcosahedronGeometry(.28, 1), mat(color)); bump.position.set(x, 1.98, .05); root.add(bump); } }
  if (kind === 'fox') { const ear = new THREE.ConeGeometry(.23, .55, 4); for (const x of [-.34, .34]) { const e = new THREE.Mesh(ear, mat(color)); e.position.set(x, 2.12, .05); root.add(e); } }
  if (kind === 'cat') { const ear = new THREE.ConeGeometry(.23, .5, 4); for (const x of [-.34, .34]) { const e = new THREE.Mesh(ear, mat(color)); e.position.set(x, 2.1, .05); root.add(e); } }
  root.userData.baseY = 0; return root;
}
function chair() { const g = new THREE.Group(); g.userData.fallbackChair = true; const m = mat(0x3c2630); const seat = new THREE.Mesh(new THREE.CylinderGeometry(.7, .78, .22, 8), m); seat.position.y = .28; g.add(seat); const back = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.65, .2), m); back.position.set(0, 1.05, -.45); back.rotation.x = -.08; g.add(back); return g; }
function hat(kind: string) { const g = new THREE.Group(); const gold = new THREE.MeshStandardMaterial({ color: 0xf4c84b, emissive: 0x6d3d08, emissiveIntensity: .55, metalness: .65, roughness: .3 }); const dark = mat(0x17213a);
  if (kind === 'frog') { const base = new THREE.Mesh(new THREE.CylinderGeometry(.48, .56, .12, 8), gold); base.position.y = 2.33; g.add(base); for (let i = 0; i < 5; i++) { const spike = new THREE.Mesh(new THREE.ConeGeometry(.12, .42, 4), gold); const a = i / 5 * Math.PI * 2; spike.position.set(Math.cos(a) * .32, 2.55, Math.sin(a) * .22); spike.rotation.z = Math.cos(a) * .28; g.add(spike); } }
  else if (kind === 'fox') { const cap = new THREE.Mesh(new THREE.SphereGeometry(.48, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x1b82bb)); cap.position.y = 2.28; g.add(cap); const brim = new THREE.Mesh(new THREE.BoxGeometry(.5, .06, .28), mat(0x17628d)); brim.position.set(0, 2.2, .35); g.add(brim); }
  else if (kind === 'cat') { const bow = new THREE.Mesh(new THREE.ConeGeometry(.26, .25, 4), mat(0xd84e8a)); bow.scale.x = 1.2; bow.position.set(-.18, 2.3, .3); bow.rotation.z = Math.PI / 2; g.add(bow); const bow2 = bow.clone(); bow2.position.x = .18; bow2.rotation.z = -Math.PI / 2; g.add(bow2); }
  else if (kind === 'panda') { const lens = new THREE.Mesh(new THREE.TorusGeometry(.16, .045, 6, 16), dark); lens.position.set(-.23, 1.82, .58); g.add(lens); const lens2 = lens.clone(); lens2.position.x = .23; g.add(lens2); const bridge = new THREE.Mesh(new THREE.BoxGeometry(.2, .05, .05), dark); bridge.position.set(0, 1.82, .58); g.add(bridge); }
  else { const brim = new THREE.Mesh(new THREE.CylinderGeometry(.52, .52, .08, 10), dark); brim.position.y = 2.3; g.add(brim); const crown = new THREE.Mesh(new THREE.CylinderGeometry(.36, .4, .45, 8), dark); crown.position.y = 2.52; g.add(crown); }
  return g;
}
function card() { const g = new THREE.Group(); const edge = new THREE.Mesh(new THREE.BoxGeometry(.8, .06, 1.08), mat(0xc8963d)); const face = new THREE.Mesh(new THREE.BoxGeometry(.7, .065, .98), mat(0x10182d)); const mark = new THREE.Mesh(new THREE.BoxGeometry(.28, .025, .12), mat(0xeab44d)); mark.position.y = .06; g.add(edge, face, mark); return g; }

export default function ThreeLobby({ players, speaking, mine, skin = 'gold' }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const data = useRef({ players, speaking, mine, skin }); data.current = { players, speaking, mine, skin };
  useEffect(() => {
    if (!mount.current) return;
    const host = mount.current; const scene = new THREE.Scene(); scene.background = new THREE.Color(0x070b19); scene.fog = new THREE.Fog(0x070b19, 8, 19);
    const camera = new THREE.PerspectiveCamera(38, 1, .1, 100); camera.position.set(0, 8.4, 10.5); camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; host.appendChild(renderer.domElement);
    const hemi = new THREE.HemisphereLight(0x9dbdff, 0x080b18, 2.2); scene.add(hemi); const key = new THREE.SpotLight(0xffd078, 90, 18, Math.PI / 5, .45); key.position.set(0, 9, 2); key.castShadow = true; scene.add(key); const cyan = new THREE.PointLight(0x00d9ff, 18, 10); cyan.position.set(5, 3, 3); scene.add(cyan);
    const world = new THREE.Group(); scene.add(world); const floor = new THREE.Mesh(new THREE.CircleGeometry(12, 64), mat(0x101827)); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; world.add(floor);
    const table = new THREE.Mesh(new THREE.CylinderGeometry(4.65, 4.9, .38, 64), mat(0x432b2b, .5)); table.position.y = .05; table.castShadow = true; table.receiveShadow = true; world.add(table); const rim = new THREE.Mesh(new THREE.TorusGeometry(4.78, .06, 10, 64), new THREE.MeshStandardMaterial({ color: 0xf0b93d, emissive: 0x9c5b12, emissiveIntensity: 1.5, metalness: .8, roughness: .25 })); rim.rotation.x = Math.PI / 2; rim.position.y = .28; world.add(rim);
    const felt = new THREE.Mesh(new THREE.CylinderGeometry(4.35, 4.35, .05, 64), mat(0x173b35, .95)); felt.position.y = .27; world.add(felt);
    const logo = new THREE.Mesh(new THREE.TorusGeometry(.95, .035, 8, 32), new THREE.MeshStandardMaterial({ color: 0xf0b93d, emissive: 0x9c5b12, emissiveIntensity: 1 })); logo.rotation.x = Math.PI / 2; logo.position.y = .33; world.add(logo);
    const logoText = new THREE.Mesh(new THREE.BoxGeometry(.45, .04, .2), mat(0xf0b93d)); logoText.position.set(0, .36, 0); world.add(logoText);
    for (const pos of [[-1.8, .38], [1.8, .38], [0, -1.85]] as [number, number][]) { const c = card(); c.position.set(pos[0], .42, pos[1]); c.rotation.x = -.18; world.add(c); }
    const seats = new THREE.Group(); world.add(seats); const actors: { id: string; group: THREE.Group; head: THREE.Object3D; ring: THREE.Mesh }[] = [];
    const pos = [[0, -5.2], [4.1, -2.3], [4.1, 2.3], [0, 5.1], [-4.1, 2.3], [-4.1, -2.3], [2.5, -4.3], [-2.5, 4.3]];
    const loader = new GLTFLoader();
    loader.load('/models/table.glb', (gltf) => { const model = gltf.scene; model.scale.setScalar(1.03); model.position.y = .05; model.traverse((o) => { if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; } }); table.visible = false; rim.visible = false; felt.visible = false; world.add(model); });
    loader.load('/models/lamp.glb', (gltf) => { const model = gltf.scene; model.scale.setScalar(1.2); model.position.set(0, 4.8, -1); model.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = true; }); world.add(model); });
    data.current.players.slice(0, 8).forEach((p, i) => { const [x, z] = pos[i]; const group = new THREE.Group(); group.position.set(x, 0, z); group.lookAt(0, 0, 0); seats.add(group); const chairObj = chair(); group.add(chairObj); const mineHere = p.id === data.current.mine; const c = mineHere ? (cosmetics[data.current.skin] || cosmetics.gold) : Object.values(cosmetics)[i % Object.values(cosmetics).length]; const actor = lowPolyAnimal(c.model, c.color); actor.position.y = .42; actor.scale.setScalar(.84); actor.traverse((o) => { if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; } }); group.add(actor); const hatObj = hat(c.model); group.add(hatObj); const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, .045, 8, 40), new THREE.MeshBasicMaterial({ color: 0x00d9ff, transparent: true, opacity: .95 })); ring.rotation.x = Math.PI / 2; ring.position.y = 2.02; ring.visible = data.current.speaking.includes(p.id); group.add(ring); actors.push({ id: p.id, group, head: actor, ring });
      loader.load(`/models/${c.model}.glb`, (gltf) => { const loaded = gltf.scene; loaded.scale.setScalar(.9); loaded.position.y = .45; loaded.traverse((o) => { if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; } }); group.remove(actor); group.add(loaded); actors.find((a) => a.id === p.id)!.head = loaded; }, undefined, () => { /* procedural low-poly fallback remains visible only if an asset request fails */ });
    });
    loader.load('/models/chair.glb', (gltf) => { const source = gltf.scene; source.scale.setScalar(1.25); seats.children.forEach((group) => { const fallback = group.children.find((child) => child.userData?.fallbackChair); if (fallback) fallback.visible = false; const loadedChair = source.clone(true); loadedChair.position.set(0, .1, -.45); loadedChair.rotation.y = Math.PI; group.add(loadedChair); }); });
    const pointer = { down: false, x: 0, rotation: 0 }; const down = (e: PointerEvent) => { pointer.down = true; pointer.x = e.clientX; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }; const move = (e: PointerEvent) => { if (pointer.down) { pointer.rotation += (e.clientX - pointer.x) * .006; pointer.x = e.clientX; world.rotation.y = pointer.rotation; } }; const up = () => { pointer.down = false; }; host.addEventListener('pointerdown', down); host.addEventListener('pointermove', move); host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);
    let frame = 0; const resize = () => { const w = host.clientWidth || 600, h = host.clientHeight || 520; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }; const animate = (t: number) => { frame = requestAnimationFrame(animate); actors.forEach((a, i) => { const talking = data.current.speaking.includes(a.id); a.ring.visible = talking; a.ring.rotation.z += .025; a.head.rotation.y = Math.sin(t * .004 + i) * (talking ? .13 : .035); a.head.position.y = .42 + Math.sin(t * .003 + i) * (talking ? .025 : .008); }); renderer.render(scene, camera); }; resize(); window.addEventListener('resize', resize); frame = requestAnimationFrame(animate); return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); host.removeEventListener('pointerdown', down); host.removeEventListener('pointermove', move); host.removeEventListener('pointerup', up); renderer.dispose(); renderer.domElement.remove(); scene.traverse((o) => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose()); else o.material.dispose(); } }); };
  }, []);
  return <div ref={mount} className="h-full w-full" aria-label="Three.js 3D lobby" />;
}

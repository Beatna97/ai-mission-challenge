'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';

const skins = [
  { id: 'gold', name: 'Алтан мөрдөгч', avatar: '🧑‍✈️', hat: '🎩', color: 'from-gold/50 to-orange-500/20', price: 'Үнэгүй' },
  { id: 'fox', name: 'Ухаант үнэг', avatar: '🦊', hat: '🧢', color: 'from-orange-500/50 to-amber-600/20', price: '100 coin' },
  { id: 'cat', name: 'Нууц муур', avatar: '🐱', hat: '🎀', color: 'from-sky/50 to-blue-600/20', price: '150 coin' },
  { id: 'panda', name: 'Панда агент', avatar: '🐼', hat: '🕶️', color: 'from-slate-400/40 to-slate-700/30', price: '250 coin' },
  { id: 'frog', name: 'Мэлхий шпион', avatar: '🐸', hat: '👑', color: 'from-emerald-400/50 to-green-600/20', price: '400 coin' },
];

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState({ name: 'Тоглогч', contact: '', skin: 'gold' });
  useEffect(() => { const raw = localStorage.getItem('sf_profile'); if (raw) setProfile(JSON.parse(raw)); }, []);
  const save = (patch: Partial<typeof profile>) => { const next = { ...profile, ...patch }; setProfile(next); localStorage.setItem('sf_profile', JSON.stringify(next)); };
  const signOut = () => { localStorage.removeItem('sf_account'); localStorage.removeItem('sf_profile'); router.push('/'); };
  const active = skins.find((s) => s.id === profile.skin) || skins[0];
  return <Shell><div className="scene-backdrop soft-rise -mx-5 rounded-[2rem] px-5 py-7 sm:-mx-8 sm:px-8 sm:py-9">
    <div className="game-topbar mb-8 flex items-center justify-between rounded-2xl px-4 py-3"><div><p className="label">Тоглогчийн төв</p><p className="mt-1 font-display text-lg text-slate-100">PROFILE <span className="text-gold">LOUNGE</span></p></div><button className="game-pill rounded-xl px-4 py-2 text-xs font-bold text-slate-200" onClick={() => router.push('/')}>← Тоглоомын цэс</button></div>
    <section className="design-card soft-rise mt-4 flex items-center gap-5 p-5 sm:p-8"><div className={`design-avatar relative grid h-24 w-24 shrink-0 place-items-center rounded-[1.7rem] bg-gradient-to-br ${active.color} text-5xl`}><span>{active.avatar}</span><span className="absolute -right-2 -top-3 text-3xl">{active.hat}</span></div><div><p className="label">Миний profile</p><h1 className="mt-2 font-display text-3xl text-slate-100">{profile.name}</h1><p className="mt-1 text-xs text-slate-500">{profile.contact || 'Бүртгэлээ холбоно уу'}</p><span className="mt-3 inline-flex rounded-full border border-gold bg-gold/10 px-3 py-1 text-xs font-bold text-gold">⭐ Level 1 · 0 XP</span></div></section>
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><div className="design-stat"><p className="text-2xl font-extrabold text-gold">0</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-slate-500">Тоглосон</p></div><div className="design-stat"><p className="text-2xl font-extrabold text-sky">0%</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-slate-500">Ялалт</p></div><div className="design-stat"><p className="text-2xl font-extrabold text-purple-300">0</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-slate-500">Шпи болсон</p></div><div className="design-stat"><p className="text-2xl font-extrabold text-emerald-300">0</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-slate-500">Найз</p></div></div>
    <div className="card soft-rise delay-1 mt-7 space-y-4"><div className="flex items-center justify-between"><div><p className="font-display text-sm">Тоглогчийн мэдээлэл</p><p className="mt-1 text-xs text-slate-500">Lobby дотор бусдад харагдах нэр</p></div><span className="text-lg text-gold">✎</span></div><div><label className="label" htmlFor="name">Дэлгэцийн нэр</label><input id="name" className="input mt-1" value={profile.name} onChange={(e) => save({ name: e.target.value })} maxLength={16} /></div><button className="btn btn-ghost w-full text-sm" onClick={() => router.push('/auth')}>И-мэйл / утасны мэдээлэл засах</button></div>
    <section className="soft-rise delay-2 mt-7"><div className="mb-3 flex items-end justify-between"><div><p className="label">Lobby cosmetics</p><h2 className="mt-2 font-display text-lg">Дүр болон малгайгаа сонго</h2></div><span className="text-xs text-gold">✦ {active.name}</span></div><div className="space-y-3">{skins.map((skin) => <button key={skin.id} onClick={() => save({ skin: skin.id })} className={`flex w-full items-center gap-4 rounded-2xl border p-3 text-left transition ${profile.skin === skin.id ? 'border-gold bg-gold/10 shadow-[0_0_24px_rgba(242,181,68,.10)]' : 'border-white/10 bg-white/[.03] hover:border-white/25'}`}><span className={`relative grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br ${skin.color} text-2xl`}><span>{skin.avatar}</span><span className="absolute -right-1 -top-2 text-lg">{skin.hat}</span></span><span className="flex-1"><span className="block text-sm font-bold text-slate-100">{skin.name}</span><span className="mt-1 block text-xs text-slate-500">Малгай: {skin.hat} · {skin.price}</span></span>{profile.skin === skin.id ? <span className="text-xs font-bold text-gold">Сонгосон</span> : <span className="text-xs text-slate-500">Сонгох</span>}</button>)}</div></section>
    <button onClick={signOut} className="mt-8 w-full text-center text-xs font-bold text-slate-500 transition hover:text-ember">Бүртгэлээс гарах</button>
  </div></Shell>;
}

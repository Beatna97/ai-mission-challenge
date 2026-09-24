'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import { getKey, getSocket, loadName, saveName } from '@/lib/socket';
import { t } from '@/lib/i18n';

type Ack = { ok: boolean; error?: string; code?: string };

export default function SpyfallLobby() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { setName(loadName()); getSocket().emit('room:leave'); }, []);
  const go = (ev: 'room:create' | 'room:join') => {
    const n = name.trim();
    if (!n) return setErr(t.errors.name);
    if (ev === 'room:join' && code.length !== 6) return setErr(t.errors.not_found);
    saveName(n); setBusy(true); setErr('');
    getSocket().emit(ev, { name: n, code, key: getKey() }, (r: Ack) => {
      setBusy(false);
      if (r.ok) router.push(`/room/${r.code ?? code}`);
      else setErr(t.errors[r.error as keyof typeof t.errors] ?? t.errors.generic);
    });
  };
  return (
    <Shell>
      <button className="soft-rise btn btn-ghost !rounded-xl !px-3 !py-2 text-xs" onClick={() => router.push('/')}>← Тоглоомын цэс</button>
      <section className="soft-rise mt-8">
        <div className="mb-4 flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold text-2xl text-ink shadow-[0_0_28px_rgba(242,181,68,.22)]">◉</span><div><p className="label">Social deduction</p><h1 className="mt-1 font-display text-3xl text-gold">Шпи</h1></div></div>
        <p className="max-w-sm text-sm leading-6 text-slate-300">Байршлыг мэдэхгүй ганц тоглогчийг яриа, асуултаар илрүүлээрэй.</p>
      </section>
      <div className="card soft-rise delay-1 mt-7 space-y-5">
        <div className="flex items-center justify-between"><div><p className="font-display text-sm text-slate-100">Lobby-д нэвтрэх</p><p className="mt-1 text-xs text-slate-500">Нууц нэрээ сонгоод эхлүүлээрэй</p></div><span className="grid h-9 w-9 place-items-center rounded-xl bg-gold/10 text-lg text-gold">✦</span></div>
        <div><label className="label" htmlFor="n">{t.name}</label><input id="n" className="input mt-1" maxLength={16} autoFocus value={name} onChange={(e) => setName(e.target.value)} /></div>
        <button className="btn btn-gold group w-full" disabled={busy} onClick={() => go('room:create')}>{t.createRoom}<span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span></button>
        <div className="relative py-1 text-center"><span className="relative z-10 bg-panel px-3 text-[10px] font-bold uppercase tracking-[.2em] text-slate-600">эсвэл кодоор</span><span className="absolute inset-x-0 top-1/2 border-t border-white/10" /></div>
        <div><label className="label" htmlFor="c">{t.roomCode}</label><div className="mt-1 flex gap-2"><input id="c" className="input min-w-0 flex-1 font-display tracking-[0.25em]" inputMode="numeric" maxLength={6} placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => e.key === 'Enter' && go('room:join')} /><button className="btn btn-ghost shrink-0" disabled={busy} onClick={() => go('room:join')}>{t.joinRoom}</button></div></div>
        {err && <p role="alert" className="text-sm text-ember">{err}</p>}
      </div>
      <div className="soft-rise delay-2 mt-6 grid grid-cols-3 gap-2 text-center text-[10px] font-bold uppercase tracking-[.12em] text-slate-500"><div className="rounded-2xl border border-white/10 bg-white/[.03] px-2 py-3"><span className="mb-1 block text-base text-sky">♢</span>4–8 тоглогч</div><div className="rounded-2xl border border-white/10 bg-white/[.03] px-2 py-3"><span className="mb-1 block text-base text-gold">◉</span>Нууц дүр</div><div className="rounded-2xl border border-white/10 bg-white/[.03] px-2 py-3"><span className="mb-1 block text-base text-ember">⌁</span>Монгол хэл</div></div>
    </Shell>
  );
}

'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import ThreeLobby from '@/components/ThreeLobby';
import { getKey, getSocket, loadName, saveName } from '@/lib/socket';
import { useVoice } from '@/lib/useVoice';
import { t } from '@/lib/i18n';
import type { RoomState } from '@/lib/types';

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const emit = (ev: string, ...a: unknown[]) => getSocket().emit(ev, ...a);

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [s, setS] = useState<RoomState | null>(null);
  const [err, setErr] = useState('');
  const [skew, setSkew] = useState(0);
  const [, tick] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const voice = useVoice(!!s);

  useEffect(() => { const demo = new URLSearchParams(window.location.search).get('demo'); setName(demo || loadName()); }, []);

  useEffect(() => {
    if (!name) return;
    const sock = getSocket();
    const onState = (st: RoomState) => { setS(st); setSkew(st.now - Date.now()); };
    const join = () =>
      sock.emit('room:join', { code, name, key: getKey() }, (r: { ok: boolean; error?: string }) => {
        if (!r.ok) setErr(t.errors[r.error as keyof typeof t.errors] ?? t.errors.generic);
      });
    sock.on('room:state', onState);
    sock.on('connect', join); // also re-joins after a dropped connection
    if (sock.connected) join();
    return () => { sock.off('room:state', onState); sock.off('connect', join); };
  }, [code, name]);

  useEffect(() => { const i = setInterval(() => tick((n) => n + 1), 250); return () => clearInterval(i); }, []);
  useEffect(() => setPick(null), [s?.phase]);

  if (name === null) return null;
  if (!name) return <NamePrompt onSave={(n) => { saveName(n); setName(n); }} />;
  if (err) {
    return (
      <Shell>
        <div className="card text-center">
          <p className="mb-4">{err}</p>
          <button className="btn btn-gold" onClick={() => router.push('/')}>{t.back}</button>
        </div>
      </Shell>
    );
  }
  if (!s) return <Shell><p className="pt-20 text-center text-slate-400">{t.connecting}</p></Shell>;

  const left = s.endsAt ? Math.max(0, Math.ceil((s.endsAt - (Date.now() + skew)) / 1000)) : 0;
  const isHost = s.hostId === s.me;
  const me = s.players.find((p) => p.id === s.me);
  const canStart = s.players.length >= s.minPlayers && s.players.every((p) => p.ready);
  const inRound = s.phase === 'discussion' || s.phase === 'voting';
  const copy = () => {
    navigator.clipboard?.writeText(location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
  };

  return (
    <Shell>
      <header className="soft-rise mb-5 flex items-center justify-between gap-3">
        <button className="btn btn-ghost !rounded-xl !px-3 !py-2 text-xs" onClick={() => { emit('room:leave'); router.push('/'); }}>← {t.leave}</button>
        <div className="text-center">
          <p className="label">{t.roomCode}</p>
        <p className="mt-1 font-display text-xl tracking-[0.25em] text-gold">{s.code}</p>
        </div>
        <span className="rounded-full border border-gold/20 bg-gold/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-gold">{t.phases[s.phase]}</span>
      </header>

      {s.phase === 'lobby' && (
        <div className="soft-rise space-y-4">
          <TableLobby s={s} speaking={voice.speaking} />
          <button className="btn btn-ghost w-full text-sm" onClick={copy}>{copied ? `✓ ${t.copied}` : `⌘ ${t.copyLink}`}</button>
          {isHost ? (
            <button className="btn btn-gold w-full" disabled={!canStart} onClick={() => emit('game:start')}>{t.startGame}</button>
          ) : (
            <button className={`btn w-full ${me?.ready ? 'btn-ghost' : 'btn-gold'}`} onClick={() => emit('player:ready')}>
              {me?.ready ? t.notReady : t.ready}
            </button>
          )}
          <p className="text-center text-xs text-slate-400">
            {s.players.length < s.minPlayers ? t.needPlayers : !canStart ? t.waitReady : isHost ? '' : t.waitHost}
          </p>
        </div>
      )}

      {s.phase === 'reveal' && (
        <div className="space-y-4">
          <RoleCard s={s} />
          <p className="text-center text-slate-400">{t.startsIn}: {left}</p>
        </div>
      )}

      {inRound && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="card text-center">
              <p className="label">{t.time}</p>
              <p className={`font-display text-3xl ${left <= 30 ? 'text-ember' : ''}`}>{fmt(left)}</p>
            </div>
            <RoleCard s={s} small />
          </div>
          {s.phase === 'voting' ? (
            <>
              <div className="text-center">
                <p className="font-display text-lg">{t.voting}</p>
                <p className="text-sm text-slate-400">{t.voteHint}</p>
              </div>
              <PlayerList s={s} speaking={voice.speaking} onPick={(id) => emit('vote:cast', id)} />
            </>
          ) : (
            <>
              <PlayerList s={s} speaking={voice.speaking} />
              {isHost && <button className="btn btn-ghost w-full" onClick={() => emit('game:vote_now')}>{t.voteNow}</button>}
            </>
          )}
          <div className="card">
            <p className="label mb-3">{t.locations}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {s.locations.map((l) => {
                const spy = s.role === 'spy';
                const on = spy ? pick === l : l === s.location;
                return (
                  <button
                    key={l} disabled={!spy} onClick={() => setPick(l)}
                    className={`rounded-lg border px-3 py-2 text-sm disabled:cursor-default ${on ? 'border-gold bg-gold/15 text-gold' : 'border-white/10 text-slate-300'} ${spy ? 'hover:bg-white/5' : ''}`}
                  >{l}</button>
                );
              })}
            </div>
            {s.role === 'spy' && (
              <button className="btn btn-gold mt-3 w-full" disabled={!pick} onClick={() => pick && emit('spy:guess', pick)}>
                {t.guess}{pick ? `: ${pick}` : ''}
              </button>
            )}
          </div>
        </div>
      )}

      {s.phase === 'results' && s.result && <Results s={s} isHost={isHost} />}

      {s && (
        <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-[#070d1d]/90 p-3 backdrop-blur-xl" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <button
              onClick={voice.toggle} disabled={voice.status !== 'on'}
              className={`btn flex-1 ${voice.muted ? 'bg-ember/20 text-ember' : 'bg-sky/20 text-sky'}`}
            >{voice.muted ? `🔇 ${t.unmute}` : `🎙 ${t.mute}`}</button>
            <span className="max-w-[9rem] text-xs text-slate-400">
              {voice.status === 'connecting' ? t.voiceConnecting : voice.status === 'error' ? t.voiceError : voice.speaking.length ? `${voice.speaking.length} хүн ярьж байна` : 'Дууны суваг нээлттэй'}
            </span>
          </div>
        </div>
      )}
    </Shell>
  );
}

function NamePrompt({ onSave }: { onSave: (n: string) => void }) {
  const [v, setV] = useState('');
  return (
    <Shell>
      <div className="card mt-16 space-y-3">
        <label className="label" htmlFor="nm">{t.name}</label>
        <input id="nm" className="input" maxLength={16} autoFocus value={v} onChange={(e) => setV(e.target.value)} />
        <button className="btn btn-gold w-full" disabled={!v.trim()} onClick={() => onSave(v.trim())}>{t.joinRoom}</button>
      </div>
    </Shell>
  );
}

function RoleCard({ s, small }: { s: RoomState; small?: boolean }) {
  const spy = s.role === 'spy';
  return (
    <div className={`rounded-3xl border p-5 text-center ${spy ? 'border-ember/60 bg-ember/10' : 'border-sky/50 bg-sky/10'} ${small ? 'p-3' : ''}`}>
      <p className={`font-semibold ${small ? 'text-sm' : 'text-xl'} ${spy ? 'text-ember' : 'text-sky'}`}>{spy ? t.isSpy : t.notSpy}</p>
      <p className="label mt-2">{t.location}</p>
      <p className={`font-display ${small ? 'text-lg' : 'mt-1 text-4xl'}`}>{spy ? '???' : s.location}</p>
    </div>
  );
}

function TableLobby({ s, speaking }: { s: RoomState; speaking: string[] }) {
  const [skin, setSkin] = useState('gold');
  useEffect(() => { try { const p = JSON.parse(localStorage.getItem('sf_profile') || '{}'); if (p.skin) setSkin(p.skin); } catch {} }, []);
  return (
    <div className="scene-backdrop overflow-hidden rounded-[2rem] p-4 sm:p-7">
      <div className="game-topbar relative z-20 mb-5 flex items-center justify-between rounded-2xl px-4 py-3"><div><p className="label">Тагнуулын ширээ</p><p className="mt-1 text-xs text-slate-400">{s.players.length}/8 тоглогч холбогдсон</p></div><span className="neon-live rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[.14em]"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-cyan-300" /> LIVE</span></div>
      <div className="three-lobby-frame relative mx-auto max-w-[60rem] overflow-hidden rounded-[2rem] border border-gold/30 bg-[#070b19] shadow-[0_25px_80px_rgba(0,0,0,.58)]"><ThreeLobby players={s.players} speaking={speaking} mine={s.me} skin={skin} /></div>
      <div className="floating-panel relative z-20 mt-5 flex flex-wrap items-center justify-center gap-4 rounded-2xl px-5 py-3"><p className="text-center text-xs font-bold text-slate-300">☝ Хуруугаараа чирж ширээг эргүүлнэ</p><span className="text-xs text-sky">Микрофоноо асаагаад ярилцаарай</span></div>
    </div>
  );
}

function PlayerList({ s, speaking, onPick }: { s: RoomState; speaking: string[]; onPick?: (id: string) => void }) {
  return (
    <ul className="space-y-2">
      {s.players.map((p) => {
        const self = p.id === s.me, talk = speaking.includes(p.id), chosen = s.myVote === p.id;
        return (
          <li key={p.id}>
            <button
              disabled={!onPick || self} onClick={() => onPick?.(p.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition duration-200 disabled:cursor-default ${chosen ? 'border-gold bg-gold/10 shadow-[0_0_24px_rgba(242,181,68,.10)]' : 'border-white/10 bg-panel/60 hover:bg-white/[.06]'} ${onPick && !self ? 'hover:border-gold/60 hover:-translate-y-0.5' : ''} ${p.online ? '' : 'opacity-50'}`}
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-white/15 to-white/5 font-display text-lg ${talk ? 'animate-pulse ring-2 ring-sky' : ''}`}>
                {p.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="flex-1 truncate font-medium">
                {p.name}{self && <span className="ml-2 text-xs text-slate-400">({t.you})</span>}
              </span>
              {p.id === s.hostId && <span className="text-xs text-gold">{t.host}</span>}
              {s.phase === 'lobby' && (
                <span className={`text-xs ${p.ready ? 'text-sky' : 'text-slate-500'}`}>{p.ready ? `✓ ${t.ready}` : t.notReady}</span>
              )}
              {s.phase === 'voting' && p.voted && <span className="text-xs text-sky">✓</span>}
              {talk && <span aria-hidden>🎙</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Results({ s, isHost }: { s: RoomState; isHost: boolean }) {
  const r = s.result!;
  const nm = (id: string) => s.players.find((p) => p.id === id)?.name ?? '?';
  const caught = r.winner === 'players';
  return (
    <div className="space-y-4">
      <div className={`card text-center ${caught ? 'border-sky/50' : 'border-ember/50'}`}>
        <p className={`font-display text-2xl ${caught ? 'text-sky' : 'text-ember'}`}>{caught ? t.spyRevealed : t.spyEscaped}</p>
        <p className="mt-1 text-sm text-slate-400">{t.reasons[r.reason]}{r.guess ? `: ${r.guess}` : ''}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-left">
          <div><dt className="label">{t.spy}</dt><dd className="text-lg font-semibold">{nm(r.spyId)}</dd></div>
          <div><dt className="label">{t.location}</dt><dd className="text-lg font-semibold">{r.location}</dd></div>
        </dl>
      </div>
      {s.votes && Object.keys(s.votes).length > 0 && (
        <div className="card">
          <p className="label mb-2">{t.voting}</p>
          <ul className="space-y-1 text-sm">
            {Object.entries(s.votes).map(([v, target]) => (
              <li key={v}>{nm(v)} → <span className={target === r.spyId ? 'text-sky' : 'text-slate-300'}>{nm(target)}</span></li>
            ))}
          </ul>
        </div>
      )}
      {isHost
        ? <button className="btn btn-gold w-full" onClick={() => emit('game:again')}>{t.again}</button>
        : <p className="text-center text-sm text-slate-400">{t.waitHost}</p>}
    </div>
  );
}

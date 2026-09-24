'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const submit = () => {
    if (!contact.trim() || password.length < 4) return setError('И-мэйл/утас болон 4-өөс дээш тэмдэгттэй нууц үг оруулна уу.');
    localStorage.setItem('sf_account', contact.trim());
    localStorage.setItem('sf_profile', JSON.stringify({ contact: contact.trim(), name: contact.includes('@') ? contact.split('@')[0] : 'Тоглогч', skin: 'gold' }));
    router.push('/profile');
  };
  return <Shell><section className="soft-rise mx-auto mt-4 max-w-xl text-center"><p className="design-gold font-display text-5xl font-black tracking-[.12em]">ШПИ</p><p className="mt-3 text-sm text-slate-400">Нууц ажиллагаа эхэллээ</p></section><div className="design-card soft-rise delay-1 mx-auto mt-8 max-w-xl space-y-5 p-6 sm:p-10"><div className="grid grid-cols-2 rounded-2xl bg-black/30 p-1"><button onClick={() => setMode('signup')} className={`rounded-xl px-3 py-3 text-xs font-bold ${mode === 'signup' ? 'design-primary' : 'text-slate-400'}`}>Бүртгүүлэх</button><button onClick={() => setMode('login')} className={`rounded-xl px-3 py-3 text-xs font-bold ${mode === 'login' ? 'design-primary' : 'text-slate-400'}`}>Нэвтрэх</button></div><div><label className="label" htmlFor="contact">И-мэйл эсвэл утас</label><div className="relative mt-1"><span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-60">📧</span><input id="contact" className="design-input pl-12" placeholder="name@email.com / 99112233" value={contact} onChange={(e) => setContact(e.target.value)} /></div></div><div><label className="label" htmlFor="password">Нууц үг</label><div className="relative mt-1"><span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-60">🔒</span><input id="password" type="password" className="design-input pl-12" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} /></div></div>{error && <p className="text-sm text-ember">{error}</p>}<button onClick={submit} className="design-primary w-full rounded-2xl px-5 py-4 text-sm font-extrabold transition">{mode === 'signup' ? 'БҮРТГЭЛ ҮҮСГЭХ' : 'НЭВТРЭХ'} <span className="ml-2">→</span></button><div className="flex items-center gap-3 text-xs text-slate-500"><span className="h-px flex-1 bg-white/10" /> Preview mode <span className="h-px flex-1 bg-white/10" /></div><p className="text-center text-[10px] leading-5 text-slate-500">OTP баталгаажуулалт backend-ийн дараагийн хувилбарт холбогдоно.</p></div></Shell>;
}

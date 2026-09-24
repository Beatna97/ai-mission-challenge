'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [account, setAccount] = useState('');
  useEffect(() => setAccount(localStorage.getItem('sf_account') || ''), []);
  const profilePath = account ? '/profile' : '/auth';
  return (
    <main className="app-main mx-auto min-h-screen max-w-[1480px] px-5 pb-28 pt-5 sm:px-8">
      <div className="relative z-10 flex items-center justify-between pb-8">
        <div className="flex items-center gap-3">
          <button aria-label="Нүүр хуудас" onClick={() => router.push('/')} className="brand-mark grid h-10 w-10 place-items-center rounded-2xl bg-gold text-ink transition hover:scale-105"><span className="font-display text-lg font-bold">Ш</span></button>
          <button onClick={() => router.push('/')} className="text-left"><p className="font-display text-sm tracking-[.08em] text-slate-100">ШПИ</p><p className="text-[10px] font-bold uppercase tracking-[.22em] text-slate-500">Нууц ажиллагаа</p></button>
        </div>
        <div className="flex items-center gap-2">
          {pathname !== '/auth' && <button onClick={() => router.push(profilePath)} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[.05] text-sm text-slate-200 transition hover:border-gold/40 hover:bg-gold/10">{account ? account.slice(0, 1).toUpperCase() : '♙'}</button>}
          <span className="hidden rounded-full border border-sky/20 bg-sky/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-sky sm:inline-flex">Online</span>
        </div>
      </div>
      {children}
    </main>
  );
}

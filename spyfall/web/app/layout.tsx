import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope, Unbounded } from 'next/font/google';

const display = Unbounded({ subsets: ['cyrillic', 'latin'], variable: '--font-display' });
const body = Manrope({ subsets: ['cyrillic', 'latin'], variable: '--font-body' });

export const metadata: Metadata = { title: 'Шпи — Spyfall', description: 'Онлайн Spyfall тоглоом' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#111a33' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen bg-ink font-body text-slate-100 antialiased"><div className="orientation-lock" role="status" aria-live="polite"><div className="orientation-lock-card"><div className="orientation-phone">▱</div><p className="label">Тоглоомын өрөө</p><h1>Утсаа хэвтүүлнэ үү</h1><p>Энэ 3D lobby нь өргөн дэлгэцийн landscape горимд зориулагдсан.</p><div className="orientation-arrow">↔</div></div></div>{children}</body>
    </html>
  );
}

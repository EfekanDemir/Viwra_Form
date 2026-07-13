import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface LegalLayoutProps {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalLayout({ title, subtitle, lastUpdated, children }: LegalLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-[#0a062b] text-[#f4f2e2] font-sans overflow-x-hidden">
      <div className="noise-overlay pointer-events-none fixed inset-0 z-0 opacity-25" />
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(80,60,180,0.12) 0%, transparent 70%)', filter: 'blur(80px)' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-3xl mx-auto px-6 py-16"
      >
        {/* Back */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-[#f4f2e2]/30 hover:text-[#f4f2e2]/70 transition-colors duration-500 mb-16"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Ana Sayfa
        </button>

        {/* Header */}
        <div className="mb-12">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#f4f2e2]/25 mb-3 font-light">Viwra</p>
          <h1 className="text-4xl font-extralight tracking-[-0.01em] text-[#f4f2e2]/90 mb-3">{title}</h1>
          {subtitle && <p className="text-sm font-light text-[#f4f2e2]/40 mt-2">{subtitle}</p>}
          <p className="text-[11px] text-[#f4f2e2]/20 font-light mt-4">Son güncelleme: {lastUpdated}</p>
        </div>

        <div className="h-px bg-gradient-to-r from-[#f4f2e2]/10 via-[#f4f2e2]/5 to-transparent mb-12" />

        {/* Content */}
        <div className="prose-legal space-y-10 text-[#f4f2e2]/65 text-sm font-light leading-relaxed">
          {children}
        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-[#f4f2e2]/8 text-center">
          <p className="text-[10px] text-[#f4f2e2]/15 tracking-wide font-light">Viwra · viwra.com</p>
        </div>
      </motion.div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-medium tracking-wide text-[#f4f2e2]/80 mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function LegalP({ children }: { children: React.ReactNode }) {
  return <p className="text-[#f4f2e2]/55 leading-[1.85] text-[13.5px]">{children}</p>;
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 pl-4">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-[#f4f2e2]/50 text-[13.5px] leading-relaxed">
          <span className="text-[#f4f2e2]/20 mt-1 shrink-0">·</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

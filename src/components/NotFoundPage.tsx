import React, { useEffect, useState } from 'react';
import { motion, useAnimationFrame } from 'motion/react';
import { useNavigate } from 'react-router-dom';

// ─── Floating digit ───────────────────────────────────────────────────────────
function FloatingDigit({ char, delay, className = '' }: { char: string; delay: number; className?: string }) {
  return (
    <motion.span
      animate={{
        y: [0, -14, 0],
        opacity: [0.12, 0.22, 0.12],
      }}
      transition={{
        duration: 5,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={`font-extralight tracking-[-0.06em] select-none ${className}`}
      style={{
        fontSize: 'clamp(140px, 24vw, 260px)',
        lineHeight: 1,
        textShadow: '0 0 80px rgba(244,242,226,0.08)',
        color: '#f4f2e2',
      }}
    >
      {char}
    </motion.span>
  );
}

// ─── Sonar rings ──────────────────────────────────────────────────────────────
function SonarRings() {
  const rings = [0, 1, 2, 3, 4];
  const DURATION = 6;
  const STAGGER = DURATION / rings.length;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Center glow */}
      <div
        className="absolute rounded-full"
        style={{
          width: 120,
          height: 120,
          background: 'radial-gradient(circle, rgba(244,242,226,0.05) 0%, transparent 70%)',
          filter: 'blur(16px)',
        }}
      />
      {rings.map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 120,
            height: 120,
            border: '1px solid rgba(244,242,226,0.08)',
            boxShadow: '0 0 16px rgba(244,242,226,0.04)',
          }}
          animate={{ scale: [0.3, 8], opacity: [0.5, 0] }}
          transition={{
            duration: DURATION,
            repeat: Infinity,
            delay: i * STAGGER,
            ease: [0.1, 0.4, 0.7, 1],
          }}
        />
      ))}
    </div>
  );
}

// ─── Drifting particles ───────────────────────────────────────────────────────
function Particles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    duration: 6 + Math.random() * 8,
    delay: Math.random() * 6,
    floatY: -(20 + Math.random() * 40),
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[#f4f2e2]"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{ y: [0, p.floatY], opacity: [0, 0.25, 0] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ─── 404 Page ─────────────────────────────────────────────────────────────────
export function NotFoundPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(12);

  // 12 saniye sonra ana sayfaya yönlendir
  useEffect(() => {
    if (countdown <= 0) {
      navigate('/', { replace: true });
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, navigate]);

  return (
    <div className="relative min-h-screen bg-[#0a062b] text-[#f4f2e2] font-sans overflow-hidden flex flex-col items-center justify-center">
      <div className="noise-overlay pointer-events-none fixed inset-0 z-0 opacity-30" />

      {/* Background orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(70,50,180,0.14) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(40,80,160,0.10) 0%, transparent 70%)', filter: 'blur(80px)' }} />

      {/* Sonar rings */}
      <SonarRings />

      {/* Particles */}
      <Particles />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">

        {/* 404 digits */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-10 select-none">
          <FloatingDigit char="4" delay={0} />
          <FloatingDigit char="0" delay={0.6} />
          <FloatingDigit char="4" delay={1.2} />
        </div>

        {/* Divider line */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-16 h-px bg-[#f4f2e2]/15 mb-10"
        />

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4 mb-14"
        >
          <h1 className="text-xl sm:text-2xl font-extralight tracking-[-0.01em] text-[#f4f2e2]/70">
            Kaybolmak da bazen bir keşiftir.
          </h1>
          <p className="text-sm font-light text-[#f4f2e2]/35 max-w-xs leading-relaxed">
            Aradığın sayfa burada değil. Ama nereye gideceğini biliyoruz.
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <button
            onClick={() => navigate('/')}
            className="px-7 py-3.5 rounded-full bg-[#f4f2e2]/8 border border-[#f4f2e2]/12 text-[#f4f2e2]/75 text-sm font-light tracking-wide hover:bg-[#f4f2e2]/14 transition-colors duration-500"
          >
            Ana Sayfaya Dön
          </button>
          <button
            onClick={() => navigate('/login')}
            className="text-xs tracking-[0.3em] uppercase text-[#f4f2e2]/25 hover:text-[#f4f2e2]/60 transition-colors duration-500"
          >
            Giriş Yap
          </button>
        </motion.div>

        {/* Countdown */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 1 }}
          className="mt-14 text-[10px] tracking-[0.3em] text-[#f4f2e2]/15 font-light"
        >
          {countdown} saniye sonra ana sayfaya yönlendirileceksin
        </motion.p>

      </div>
    </div>
  );
}

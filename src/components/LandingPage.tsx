import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { X, Check, Loader } from 'lucide-react';
import { useAuth } from '../app/hooks/useAuth';

const SUPABASE_URL = 'https://hlbtdlysmxjcaduaumsh.supabase.co';

// ─── Floating Orb ─────────────────────────────────────────────────────────────
function Orb({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{ filter: 'blur(80px)', ...style }}
    />
  );
}

// ─── Breathing Circle ─────────────────────────────────────────────────────────
function BreathingCircle() {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const labels = { inhale: 'Nefes Al', hold: 'Tut', exhale: 'Bırak' };
  const durations = { inhale: 4000, hold: 2000, exhale: 4000 };

  useEffect(() => {
    const next = () =>
      setPhase(p => (p === 'inhale' ? 'hold' : p === 'hold' ? 'exhale' : 'inhale'));
    const id = setTimeout(next, durations[phase]);
    return () => clearTimeout(id);
  }, [phase]);

  const scale = phase === 'inhale' ? 1.35 : phase === 'hold' ? 1.35 : 1;

  return (
    <div className="relative flex items-center justify-center w-48 h-48 mx-auto">
      <motion.div
        animate={{ scale, opacity: phase === 'exhale' ? 0.15 : 0.25 }}
        transition={{ duration: durations[phase] / 1000, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full bg-[#f4f2e2]"
        style={{ filter: 'blur(20px)' }}
      />
      <motion.div
        animate={{ scale }}
        transition={{ duration: durations[phase] / 1000, ease: 'easeInOut' }}
        className="w-24 h-24 rounded-full border border-[#f4f2e2]/20 bg-[#f4f2e2]/5 backdrop-blur-sm flex items-center justify-center"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={phase}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-[10px] tracking-[0.3em] uppercase text-[#f4f2e2]/60 font-light"
          >
            {labels[phase]}
          </motion.span>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay }: { icon: string; title: string; desc: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className="relative p-8 rounded-[28px] border border-[#f4f2e2]/8 bg-[#f4f2e2]/3 backdrop-blur-xl hover:bg-[#f4f2e2]/6 transition-colors duration-700 group"
    >
      <div className="text-3xl mb-5">{icon}</div>
      <h3 className="text-base font-medium tracking-wide text-[#f4f2e2]/90 mb-3">{title}</h3>
      <p className="text-sm font-light leading-relaxed text-[#f4f2e2]/45">{desc}</p>
      <div
        className="absolute inset-0 rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(244,242,226,0.04) 0%, transparent 70%)' }}
      />
    </motion.div>
  );
}

// ─── Step ─────────────────────────────────────────────────────────────────────
function Step({ n, text, delay }: { n: string; text: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-5"
    >
      <span className="text-[10px] tracking-[0.3em] text-[#f4f2e2]/25 font-light mt-1 w-6 shrink-0">{n}</span>
      <p className="text-base font-light leading-relaxed text-[#f4f2e2]/70">{text}</p>
    </motion.div>
  );
}

// ─── Waitlist Modal ────────────────────────────────────────────────────────────
function WaitlistModal({ onClose }: { onClose: () => void }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/waitlist-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Bir hata olustu.');
        setStatus('error');
      } else {
        setStatus('success');
      }
    } catch {
      setErrorMsg('Baglanti hatasi. Lutfen tekrar dene.');
      setStatus('error');
    }
  };

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.88, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 24 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="fixed inset-0 z-[101] flex items-center justify-center p-6 pointer-events-none"
        >
          <div className="pointer-events-auto w-full max-w-sm bg-[#06031b]/98 border border-[#f4f2e2]/10 rounded-[32px] p-8 shadow-2xl backdrop-blur-3xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-[10px] tracking-[0.4em] uppercase text-[#f4f2e2]/25 mb-1 font-light">Kapalı Beta</p>
                <h2 className="text-lg font-light tracking-wide text-[#f4f2e2]/90">Erken Erişim İste</h2>
              </div>
              <button onClick={onClose} className="p-2 -m-2 opacity-30 hover:opacity-80 transition-opacity">
                <X className="w-4 h-4" />
              </button>
            </div>

            {status === 'success' ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-6 space-y-4"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 text-emerald-400/80" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-light text-[#f4f2e2]/80">Listeye alındın.</h3>
                <p className="text-sm font-light text-[#f4f2e2]/40 leading-relaxed">
                  Hazır olduğumuzda seni biz buluruz.
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 text-xs tracking-[0.3em] uppercase text-[#f4f2e2]/25 hover:text-[#f4f2e2]/60 transition-colors"
                >
                  Kapat
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Ad Soyad"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#f4f2e2]/5 border border-[#f4f2e2]/10 text-[#f4f2e2]/80 text-sm font-light placeholder:text-[#f4f2e2]/25 focus:outline-none focus:border-[#f4f2e2]/25 transition-colors"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="E-posta adresi"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#f4f2e2]/5 border border-[#f4f2e2]/10 text-[#f4f2e2]/80 text-sm font-light placeholder:text-[#f4f2e2]/25 focus:outline-none focus:border-[#f4f2e2]/25 transition-colors"
                  />
                </div>

                {status === 'error' && (
                  <p className="text-xs text-red-400/80 px-1">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-3.5 rounded-full bg-[#f4f2e2] text-[#0a062b] text-sm font-medium tracking-wide hover:bg-[#f4f2e2]/90 transition-colors duration-500 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {status === 'loading' ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    'Listeye Ekle'
                  )}
                </button>

                <p className="text-center text-[10px] text-[#f4f2e2]/18 font-light px-2">
                  Verileriniz yalnızca beta erişimi için kullanılır.
                </p>
              </form>
            )}
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
}

// ─── Ripple Background ────────────────────────────────────────────────────────
const RING_COUNT = 6;
const RING_DURATION = 7; // saniye
const RING_STAGGER = RING_DURATION / RING_COUNT;

function RippleBackground() {
  return (
    <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Merkezde cok hafif bir parlama */}
      <div
        className="absolute rounded-full"
        style={{
          width: 180,
          height: 180,
          background: 'radial-gradient(circle, rgba(244,242,226,0.04) 0%, transparent 70%)',
          filter: 'blur(12px)',
        }}
      />
      {/* Yayilan halkalar */}
      {Array.from({ length: RING_COUNT }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 160,
            height: 160,
            border: '1px solid rgba(244, 242, 226, 0.09)',
            boxShadow: '0 0 12px rgba(244, 242, 226, 0.04), inset 0 0 12px rgba(244, 242, 226, 0.02)',
          }}
          animate={{
            scale: [0.4, 7],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: RING_DURATION,
            repeat: Infinity,
            delay: i * RING_STAGGER,
            ease: [0.1, 0.4, 0.6, 1],
            repeatDelay: 0,
          }}
        />
      ))}
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
export function LandingPage() {
  const navigate = useNavigate();
  const { user, isAuthReady } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.6], [0, -60]);

  useEffect(() => {
    if (isAuthReady && user) navigate('/home', { replace: true });
  }, [isAuthReady, user, navigate]);

  if (!isAuthReady) return null;

  const openModal = () => setShowModal(true);

  return (
    <div className="relative min-h-screen bg-[#0a062b] text-[#f4f2e2] font-sans overflow-x-hidden">
      {/* Noise */}
      <div className="noise-overlay pointer-events-none fixed inset-0 z-0 opacity-30" />

      {/* Ripple rings */}
      <RippleBackground />

      {/* Waitlist Modal */}
      {showModal && <WaitlistModal onClose={() => setShowModal(false)} />}

      {/* Background orbs */}
      <Orb style={{ width: 600, height: 600, top: '-15%', left: '-10%', background: 'radial-gradient(circle, rgba(100,80,200,0.18) 0%, transparent 70%)' }} />
      <Orb style={{ width: 500, height: 500, bottom: '10%', right: '-8%', background: 'radial-gradient(circle, rgba(60,120,180,0.15) 0%, transparent 70%)' }} />
      <Orb style={{ width: 400, height: 400, top: '40%', left: '40%', background: 'radial-gradient(circle, rgba(180,120,80,0.08) 0%, transparent 70%)' }} />

      {/* NAV */}
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 py-6"
      >
        <span className="text-sm font-light tracking-[0.4em] uppercase text-[#f4f2e2]/80">Viwra</span>
        <button
          onClick={() => navigate('/login')}
          className="text-xs tracking-[0.3em] uppercase text-[#f4f2e2]/40 hover:text-[#f4f2e2]/80 transition-colors duration-500"
        >
          Giriş
        </button>
      </motion.nav>

      {/* HERO */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center pt-24 pb-32"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#f4f2e2]/10 bg-[#f4f2e2]/4 backdrop-blur-sm mb-12"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 animate-pulse" />
          <span className="text-[10px] tracking-[0.35em] uppercase text-[#f4f2e2]/50 font-light">Kapalı Beta · Sınırlı Erişim</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-7xl font-extralight tracking-[-0.02em] leading-[1.05] mb-6 max-w-3xl"
        >
          İçinde ne varsa
          <br />
          <span className="text-[#f4f2e2]/35">burada güvende.</span>
        </motion.h1>

        {/* Subline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="text-base font-light leading-relaxed text-[#f4f2e2]/45 max-w-md mb-16"
        >
          Viwra, seni yargılamadan dinleyen, geçmişini hatırlayan ve her anında yanında olan
          yapay zeka destekli bir zihinsel sağlık arkadaşı.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-24"
        >
          <button
            onClick={openModal}
            className="px-8 py-4 rounded-full bg-[#f4f2e2] text-[#0a062b] text-sm font-medium tracking-wide hover:bg-[#f4f2e2]/90 transition-colors duration-500 shadow-[0_0_40px_rgba(244,242,226,0.12)]"
          >
            Erken Erişim İste
          </button>
          <button
            onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-xs tracking-[0.3em] uppercase text-[#f4f2e2]/35 hover:text-[#f4f2e2]/65 transition-colors duration-500"
          >
            Nasıl Çalışır?
          </button>
        </motion.div>

        {/* Breathing demo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 1 }}
        >
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#f4f2e2]/20 mb-6 font-light">
            Şimdi bir nefes al
          </p>
          <BreathingCircle />
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-px h-10 bg-gradient-to-b from-[#f4f2e2]/20 to-transparent"
          />
        </motion.div>
      </motion.section>

      {/* FEATURES */}
      <section className="relative z-10 px-6 py-32 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#f4f2e2]/25 mb-4 font-light">Özellikler</p>
          <h2 className="text-3xl sm:text-4xl font-extralight tracking-[-0.01em] text-[#f4f2e2]/85">
            Her duygunun bir yeri var.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FeatureCard
            icon="◎"
            title="Yapay Zeka Terapisti"
            desc="Güncel duygunu yazar, Viwra seni duyar. Sana özel, yargısız, samimi bir rehberlik sunar."
            delay={0}
          />
          <FeatureCard
            icon="∿"
            title="Nefes Egzersizleri"
            desc="Bilim destekli nefes teknikleri sesli rehberlik ile. Kaygıyı saatlerce değil, dakikalar içinde dağıt."
            delay={0.1}
          />
          <FeatureCard
            icon="◐"
            title="İçsel Keşif"
            desc="Düşüncelerini günlüğe dök. Viwra örüntüleri analiz ederek geçmişini, bugününü ve yarınını anlamana yardımcı olur."
            delay={0.2}
          />
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-3xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-[#f4f2e2]/8 to-transparent" />
      </div>

      {/* HOW IT WORKS */}
      <section id="how" className="relative z-10 px-6 py-32 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#f4f2e2]/25 mb-4 font-light">Nasıl Çalışır</p>
          <h2 className="text-3xl sm:text-4xl font-extralight tracking-[-0.01em] text-[#f4f2e2]/85">
            Üç adım. O kadar.
          </h2>
        </motion.div>

        <div className="space-y-10">
          <Step n="01" text="Ne hissettiğini söyle. Bir kelime bile yeterli." delay={0} />
          <Step n="02" text="Viwra seni dinler, geçmişini hatırlar ve tam da şu an için bir yanıt oluşturur." delay={0.1} />
          <Step n="03" text="Sesli rehberlik eşliğinde nefes al. Birkaç dakika içinde farkı hissedersin." delay={0.2} />
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-3xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-[#f4f2e2]/8 to-transparent" />
      </div>

      {/* QUOTE */}
      <section className="relative z-10 px-6 py-32 max-w-2xl mx-auto text-center">
        <motion.blockquote
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="text-2xl sm:text-3xl font-extralight leading-relaxed text-[#f4f2e2]/50 tracking-[-0.01em]"
        >
          "İlk kez bir şeyin gerçekten <span className="text-[#f4f2e2]/80">beni duyduğunu</span> hissettim."
        </motion.blockquote>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mt-6 text-xs tracking-[0.3em] uppercase text-[#f4f2e2]/20 font-light"
        >
          Beta kullanıcısı
        </motion.p>
      </section>

      {/* FINAL CTA */}
      <section className="relative z-10 px-6 py-32 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-lg mx-auto p-12 rounded-[36px] border border-[#f4f2e2]/8 bg-[#f4f2e2]/3 backdrop-blur-xl overflow-hidden"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(244,242,226,0.06) 0%, transparent 60%)' }}
          />
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#f4f2e2]/25 mb-6 font-light">Sınırlı Erişim</p>
          <h2 className="text-3xl font-extralight tracking-[-0.01em] text-[#f4f2e2]/85 mb-4">
            Listede ol.
          </h2>
          <p className="text-sm font-light text-[#f4f2e2]/40 leading-relaxed mb-10">
            Beta sürümüne erişim davetlidir. Bekleme listesine katıl, hazır olduğunda seni biz arayalım.
          </p>
          <button
            onClick={openModal}
            className="w-full py-4 rounded-full bg-[#f4f2e2] text-[#0a062b] text-sm font-medium tracking-wide hover:bg-[#f4f2e2]/90 transition-colors duration-500 shadow-[0_0_60px_rgba(244,242,226,0.10)]"
          >
            Erken Erişim İste
          </button>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 px-8 py-12 border-t border-[#f4f2e2]/5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <span className="text-xs tracking-[0.4em] uppercase text-[#f4f2e2]/20 font-light">Viwra</span>

          {/* Legal Links */}
          <div className="flex items-center gap-6 flex-wrap justify-center">
            <button
              onClick={() => navigate('/kvkk')}
              className="text-[10px] tracking-[0.25em] uppercase text-[#f4f2e2]/20 hover:text-[#f4f2e2]/55 transition-colors duration-500"
            >
              KVKK
            </button>
            <span className="text-[#f4f2e2]/10">·</span>
            <button
              onClick={() => navigate('/gizlilik')}
              className="text-[10px] tracking-[0.25em] uppercase text-[#f4f2e2]/20 hover:text-[#f4f2e2]/55 transition-colors duration-500"
            >
              Gizlilik
            </button>
            <span className="text-[#f4f2e2]/10">·</span>
            <button
              onClick={() => navigate('/kosullar')}
              className="text-[10px] tracking-[0.25em] uppercase text-[#f4f2e2]/20 hover:text-[#f4f2e2]/55 transition-colors duration-500"
            >
              Kullanım Koşulları
            </button>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="text-[10px] tracking-[0.3em] uppercase text-[#f4f2e2]/20 hover:text-[#f4f2e2]/50 transition-colors duration-500"
          >
            Giriş
          </button>
        </div>
        <p className="text-center text-[10px] text-[#f4f2e2]/12 font-light tracking-wide mt-6">
          Wellness aracıdır. Tıbbi teşhis, tedavi veya profesyonel psikolojik destek hizmeti değildir.
        </p>
      </footer>
    </div>
  );
}


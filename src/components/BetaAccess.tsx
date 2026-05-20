/**
 * BetaAccess — Magic Link Gatekeeper
 *
 * Flow:
 * 1. User enters email
 * 2. Check if email is in Viwra_Waitlist (Supabase RPC)
 * 3. If found → send Supabase magic link to that email
 * 4. Show "check your inbox" confirmation screen
 * 5. User clicks link in email → lands on /app/home with valid Supabase session
 *
 * Security features:
 * - Strict email regex (XSS prevention)
 * - Brute-force protection: 3 failed attempts → 30s cooldown
 * - Rate limiting on magic link sends (Supabase handles backend rate limiting)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { checkWaitlistEmail, sendMagicLink } from '../app/services/viwraApi';
import { supabase } from '../app/supabase';

const MAX_ATTEMPTS = 3;
const COOLDOWN_SECONDS = 30;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

type Stage = 'input' | 'sent' | 'checking' | 'error' | 'blocked';

export function BetaAccess() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [stage, setStage] = useState<Stage>('input');
  const [errorMsg, setErrorMsg] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  // If user already has a valid Supabase session, skip this screen
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) navigate('/home', { replace: true });
    });
  }, [navigate]);

  // Handle incoming magic link
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/home', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (cooldown === 0 && stage === 'blocked') {
      setStage('input');
      setAttempts(0);
    }
  }, [cooldown, stage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stage === 'blocked' || stage === 'checking') return;

    const trimmed = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(trimmed)) {
      setErrorMsg('Lütfen geçerli bir e-posta adresi girin.');
      setStage('error');
      return;
    }

    setStage('checking');
    setErrorMsg('');

    try {
      const found = await checkWaitlistEmail(trimmed);

      if (found) {
        // Send magic link
        await sendMagicLink(trimmed);
        setStage('sent');
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          setStage('blocked');
          setCooldown(COOLDOWN_SECONDS);
          setErrorMsg(`Çok fazla başarısız deneme. ${COOLDOWN_SECONDS} saniye bekleyin.`);
        } else {
          setStage('error');
          setErrorMsg(`Bu e-posta bekleme listemizde bulunamadı. (${newAttempts}/${MAX_ATTEMPTS})`);
        }
      }
    } catch (err) {
      console.error('BetaAccess error:', err);
      setStage('error');
      setErrorMsg('Bir bağlantı hatası oluştu. Lütfen tekrar deneyin.');
    }
  };

  const isChecking = stage === 'checking';
  const isBlocked = stage === 'blocked';
  const isSent = stage === 'sent';

  return (
    <div className="fixed inset-0 bg-[#0a062b] flex items-center justify-center overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-900/20 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm mx-auto px-6"
      >
        <AnimatePresence mode="wait">
          {/* ── SENT confirmation ─────────────────────────────── */}
          {isSent ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-8"
            >
              {/* Animated envelope */}
              <div className="flex justify-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
                  className="relative w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
                >
                  <motion.span
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="text-3xl"
                  >
                    ✉️
                  </motion.span>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-400/80 flex items-center justify-center"
                  >
                    <span className="text-[10px]">✓</span>
                  </motion.div>
                </motion.div>
              </div>

              <div className="space-y-3">
                <h1 className="text-xl font-medium text-white/90 tracking-wide">
                  Bağlantı gönderildi
                </h1>
                <p className="text-sm text-white/40 font-light leading-relaxed">
                  <span className="text-white/60 font-normal">{email}</span> adresine
                  <br />giriş bağlantısı gönderdik.
                </p>
                <p className="text-xs text-white/25 leading-relaxed pt-2">
                  E-postanı aç ve "Viwra'ya Gir" butonuna tıkla.
                  <br />Bağlantı 1 saat geçerlidir.
                </p>
              </div>

              <div className="pt-4 space-y-3">
                <p className="text-xs text-white/20">E-posta gelmediyse spam klasörünü kontrol et</p>
                <button
                  onClick={() => { setStage('input'); setEmail(''); }}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors underline underline-offset-2"
                >
                  Farklı bir adres dene
                </button>
              </div>
            </motion.div>
          ) : (
            /* ── INPUT form ──────────────────────────────────── */
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-10"
            >
              <div className="text-center space-y-4">
                <motion.div
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6"
                >
                  <span className="text-xl">✦</span>
                </motion.div>
                <h1 className="text-xl font-light text-white/90 tracking-wider">
                  Viwra Beta
                </h1>
                <p className="text-xs text-white/35 leading-relaxed">
                  Bekleme listesindeki e-posta adresini gir.
                  <br />Sana anında giriş bağlantısı göndereceğiz.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  id="beta-email-input"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="ornek@eposta.com"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (stage === 'error') setStage('input');
                  }}
                  disabled={isChecking || isBlocked}
                  className={`w-full bg-white/5 border rounded-2xl px-5 py-4 text-sm text-white/90 font-light tracking-wide
                    focus:outline-none transition-all duration-500 placeholder:text-white/20
                    ${stage === 'error' ? 'border-red-400/40 bg-red-900/10' : 'border-white/10 focus:border-white/25'}
                    disabled:opacity-40`}
                />

                <AnimatePresence mode="wait">
                  {errorMsg && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 py-3 rounded-xl bg-red-900/20 border border-red-400/20">
                        <p className="text-xs text-red-300/80 leading-relaxed">{errorMsg}</p>
                        {!isBlocked && (
                          <p className="text-xs text-white/25 mt-2 leading-relaxed">
                            Kayıtlı değilseniz yetkililerle iletişime geçin veya açık beta mobil sürümünü bekleyin.
                          </p>
                        )}
                        {isBlocked && cooldown > 0 && (
                          <p className="text-xs text-red-300/50 mt-1 font-mono">{cooldown}s</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={isChecking || isBlocked || !email.trim()}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-4 rounded-2xl text-sm font-medium tracking-wide transition-all duration-500
                    ${isChecking
                      ? 'bg-white/8 text-white/40 cursor-wait'
                      : isBlocked
                      ? 'bg-red-900/20 text-red-300/40 cursor-not-allowed border border-red-400/10'
                      : 'bg-white/8 hover:bg-white/12 text-white/75 border border-white/10 hover:border-white/20 cursor-pointer'
                    } disabled:opacity-40`}
                >
                  {isChecking ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="inline-block w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full"
                      />
                      Kontrol ediliyor...
                    </span>
                  ) : isBlocked ? `Bekleniyor (${cooldown}s)` : 'Giriş Bağlantısı Gönder'}
                </motion.button>
              </form>


            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

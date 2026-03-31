import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Minimal loading spinner
const Spinner: React.FC = () => (
  <svg
    className="spin-slow inline-block mr-2"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M12 2a10 10 0 0 1 10 10" opacity="0.9" />
    <path d="M12 2a10 10 0 0 0-10 10" opacity="0.3" />
  </svg>
);

// Step dots component
const StepDots: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <div className="flex items-center gap-2 mb-14">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`step-dot ${i === current ? 'active' : 'inactive'}`}
      />
    ))}
  </div>
);

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const Scene2: React.FC = () => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [altruism, setAltruism] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Validation
  const [emailError, setEmailError] = useState(false);
  const [emailShake, setEmailShake] = useState(false);

  const startTimeRef = useRef<number>(0);
  const backspaceCountRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  const triggerEmailShake = () => {
    setEmailError(true);
    setEmailShake(true);
    setTimeout(() => setEmailShake(false), 500);
  };

  const handleNext = () => {
    if (step === 0 && name.trim()) {
      setStep(1);
    } else if (step === 1) {
      if (!email.trim()) return;
      if (!isValidEmail(email)) {
        triggerEmailShake();
        return;
      }
      setEmailError(false);
      setStep(2);
    } else if (step === 2 && altruism) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Backspace') {
      backspaceCountRef.current += 1;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !altruism) return;

    setIsSubmitting(true);
    const fillTimeMs = Date.now() - startTimeRef.current;

    try {
      const { error } = await supabase.from('waitlist').insert([
        {
          full_name: name,
          email: email,
          phone: phone || null,
          form_fill_time_ms: fillTimeMs,
          backspace_count: backspaceCountRef.current,
          is_altruistic: altruism === 'yakınım',
          status: 'pending',
        },
      ]);

      if (error) {
        console.error('Error submitting to waitlist:', error);
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Common button classes
  const btnBase =
    'px-10 py-3 rounded-full border border-viwra-bone/20 text-xs tracking-[0.2em] uppercase transition-all duration-700';
  const btnActive =
    'opacity-100 hover:bg-viwra-bone hover:text-viwra-navy hover:scale-105 hover:shadow-[0_0_20px_rgba(244,242,226,0.15)]';
  const btnHidden = 'opacity-0 pointer-events-none';

  return (
    <div className="scene-2 absolute inset-0 w-full h-screen flex flex-col items-center justify-center overflow-hidden z-20">
      <div className="relative z-30 w-full max-w-md px-6 form-container opacity-0 pointer-events-auto">
        {!isSubmitted ? (
          <div className="flex flex-col items-center w-full transition-all duration-1000">

            {/* Back button — visible when step > 0 */}
            <button
              onClick={handleBack}
              className="self-start mb-6 flex items-center gap-2 text-viwra-bone/30 hover:text-viwra-bone/70 transition-colors duration-300 text-xs tracking-widest uppercase"
              style={{ opacity: step > 0 ? 1 : 0, pointerEvents: step > 0 ? 'auto' : 'none', transition: 'opacity 0.5s ease' }}
              aria-label="Geri"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="13 5 8 10 13 15" />
              </svg>
              geri
            </button>

            {/* Step dots */}
            <StepDots current={step} total={3} />

            {/* STEP 0 — İsim */}
            {step === 0 && (
              <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className={`w-full input-underline ${name.trim() ? 'has-value' : ''}`}>
                  <input
                    type="text"
                    placeholder="Adın Soyadın"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent text-viwra-bone text-center text-xl md:text-2xl py-4 focus:outline-none transition-colors font-light tracking-wide"
                    autoFocus
                  />
                </div>
                {/* Enter hint */}
                <div className={`mt-3 h-4 transition-opacity duration-500 ${name.trim() ? 'opacity-100' : 'opacity-0'}`}>
                  <span className="enter-hint text-viwra-bone/40">↵ Enter</span>
                </div>
                <button
                  onClick={handleNext}
                  className={`mt-12 ${btnBase} ${name.trim() ? btnActive : btnHidden}`}
                >
                  Devam Et
                </button>
              </div>
            )}

            {/* STEP 1 — E-posta */}
            {step === 1 && (
              <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className={`w-full input-underline ${emailShake ? 'shake' : ''} ${emailError ? 'has-error' : email.trim() ? 'has-value' : ''}`}>
                  <input
                    type="email"
                    placeholder="E-posta Adresin"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError && isValidEmail(e.target.value)) setEmailError(false);
                    }}
                    onBlur={() => {
                      if (email.trim() && !isValidEmail(email)) triggerEmailShake();
                    }}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent text-viwra-bone text-center text-xl md:text-2xl py-4 focus:outline-none transition-colors font-light tracking-wide"
                    autoFocus
                  />
                </div>
                {/* Error message */}
                <div className={`mt-3 h-4 transition-opacity duration-500 ${emailError ? 'opacity-100' : 'opacity-0'}`}>
                  <span className="text-red-400/60 text-xs tracking-widest">geçersiz e-posta</span>
                </div>
                {/* Enter hint */}
                {!emailError && (
                  <div className={`mt-3 h-4 transition-opacity duration-500 ${email.trim() && !emailError ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="enter-hint text-viwra-bone/40">↵ Enter</span>
                  </div>
                )}
                <button
                  onClick={handleNext}
                  disabled={!email.trim()}
                  className={`mt-12 ${btnBase} ${email.trim() ? btnActive : btnHidden}`}
                >
                  Devam Et
                </button>
              </div>
            )}

            {/* STEP 2 — Telefon + Soru */}
            {step === 2 && (
              <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-1000 space-y-8">
                <div className={`w-full input-underline ${phone.trim() ? 'has-value' : ''}`}>
                  <input
                    type="tel"
                    placeholder="Telefon Numaran (İsteğe bağlı)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent text-viwra-bone text-center text-xl md:text-2xl py-4 focus:outline-none transition-colors font-light tracking-wide"
                    autoFocus
                  />
                </div>

                <div className={`w-full input-underline ${altruism ? 'has-value' : ''}`}>
                  <select
                    value={altruism}
                    onChange={(e) => setAltruism(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={`w-full bg-transparent text-center text-xl md:text-2xl py-4 focus:outline-none transition-colors font-light tracking-wide appearance-none cursor-pointer ${altruism ? 'text-viwra-bone' : 'text-viwra-bone/40'}`}
                  >
                    <option value="" disabled className="bg-viwra-navy text-viwra-bone/50">Neden buradasın?</option>
                    <option value="kendim" className="bg-viwra-navy text-viwra-bone">Sadece kendim için</option>
                    <option value="yakınım" className="bg-viwra-navy text-viwra-bone">Bir yakınıma da yardım etmek istiyorum</option>
                  </select>
                </div>

                {/* Enter hint */}
                <div className={`h-4 transition-opacity duration-500 ${altruism ? 'opacity-100' : 'opacity-0'}`}>
                  <span className="enter-hint text-viwra-bone/40">↵ Enter</span>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !altruism}
                  className={`${btnBase} ${altruism ? btnActive : btnHidden}`}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner />
                      Gönderiliyor
                    </>
                  ) : (
                    'Tamamla'
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Success state */
          <div className="text-center animate-in fade-in duration-[3000ms]">
            <p className="text-xl md:text-3xl font-light tracking-wide leading-relaxed text-viwra-bone/70">
              Mesajın bize iletildi{' '}
              <span className="font-medium text-viwra-bone">{name.split(' ')[0]}</span>.
              <br /><br />
              <span className="text-lg md:text-xl opacity-60">
                Şimdi yavaşça telefonunun sesini aç ve kaydırmaya devam et.
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

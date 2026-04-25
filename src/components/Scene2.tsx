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
  const [manualRefCode, setManualRefCode] = useState('');
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userRefCode, setUserRefCode] = useState<string>('');
  const [isVanguard, setIsVanguard] = useState(false);
  const [timer, setTimer] = useState(60);

  // Parse URL refs
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setManualRefCode(ref);
  }, []);


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

  useEffect(() => {
    let interval: any;
    if (step === 1.5 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleNext = async () => {
    if (step === 0 && name.trim()) {
      setStep(1);
    } else if (step === 1) {
      if (!email.trim()) return;
      if (!isValidEmail(email)) {
        triggerEmailShake();
        return;
      }
      setEmailError(false);
      
      setIsVerifying(true);
      const { error } = await supabase.auth.signInWithOtp({ email });
      setIsVerifying(false);

      if (error) {
        console.error('Email OTP send error:', error);
        alert('Doğrulama e-postası gönderilirken hata oluştu. Lütfen tekrar deneyin.');
        return;
      }
      
      setStep(1.5);
      setTimer(60);
    } else if (step === 1.5) {
      if (otp.length !== 6 || timer <= 0) return;
      setIsVerifying(true);
      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
      setIsVerifying(false);
      
      if (error) {
        alert('Girdiğiniz kod hatalı veya süresi dolmuş.');
      } else {
        setStep(2);
      }
    } else if (step === 2 && altruism) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step === 1.5) setStep(1);
    else if (step > 0) setStep(step - 1);
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
    const finalRef = manualRefCode.trim().toUpperCase();
    const newReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      // 1. VIP Kodunu Veritabanından Kontrol Et (limit: 10 kullanım)
      let usingGoldenKey = false;
      if (finalRef) {
        const { data: vipGranted } = await supabase
          .rpc('increment_vip_usage', { p_code: finalRef });

        if (vipGranted === true) {
          usingGoldenKey = true;
        } else if (vipGranted === false) {
          // Kod geçersiz veya dolmuş
          const { data: vipExists } = await supabase
            .from('Viwra_VIP_Codes')
            .select('code')
            .eq('code', finalRef)
            .maybeSingle();

          if (vipExists) {
            alert('Bu VIP kodu maksimum kullanım limitine ulaştı.');
          }
          // Kod yoksa sessizce devam et (normal referans kodu olarak işlem görür)
        }
      }

      // 2. Bekleme Listesine Kaydet
      const { error } = await supabase.from('Viwra_Waitlist').insert([
        {
          full_name: name,
          email: email,
          phone: phone || null,
          form_fill_time_ms: fillTimeMs,
          backspace_count: backspaceCountRef.current,
          is_altruistic: altruism === 'yakınım',
          status: usingGoldenKey ? 'vanguard' : 'pending',
          referral_code: newReferralCode,
          referred_by: finalRef && !usingGoldenKey ? finalRef : null,
        },
      ]);

      if (error) {
        console.error('Error submitting to waitlist:', error);
        alert('Kaydınız sırasında bir hata oluştu, lütfen tekrar deneyin.');
        return;
      }

      // 3. Sırayı Getir
      const { data: rankData } = await supabase.rpc('get_user_rank', { p_referral_code: newReferralCode });
      
      setUserRank(rankData || 14242);
      setUserRefCode(newReferralCode);
      setIsVanguard(usingGoldenKey);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Beklenmeyen bir hata oluştu, lütfen daha sonra tekrar deneyin.');
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
      <div className="relative z-30 w-full max-w-md px-6 pointer-events-auto">
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
            <StepDots current={Math.floor(step)} total={3} />

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
                  disabled={!email.trim() || isVerifying}
                  className={`mt-12 ${btnBase} ${email.trim() ? btnActive : btnHidden}`}
                >
                  {isVerifying ? <><Spinner /> Gönderiliyor</> : 'Devam Et'}
                </button>
              </div>
            )}

            {/* STEP 1.5 — Doğrulama Kodu */}
            {step === 1.5 && (
              <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <p className="text-viwra-bone/60 mb-6 text-center px-4 font-light text-sm md:text-base leading-relaxed">
                  <strong className="text-viwra-bone font-medium block mb-2">{email}</strong>
                  adresine 6 haneli bir doğrulama kodu gönderdik. Lütfen aşağıdaki alana giriniz.
                </p>
                <div className={`w-full input-underline ${otp.trim() ? 'has-value' : ''} ${timer === 0 ? 'opacity-50' : ''}`}>
                  <input
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={otp}
                    disabled={timer === 0}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent tracking-[0.5em] text-viwra-bone text-center text-3xl md:text-4xl py-4 focus:outline-none transition-colors font-light"
                    autoFocus
                  />
                </div>
                
                <div className="mt-6 flex flex-col items-center gap-2">
                  <div className={`h-4 transition-opacity duration-500 ${otp.length === 6 && timer > 0 ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="enter-hint text-viwra-bone/40">↵ Enter</span>
                  </div>
                  
                  <p className={`text-xs tracking-[0.2em] uppercase ${timer < 10 ? 'text-red-400 animate-pulse' : 'text-viwra-bone/40'}`}>
                    {timer > 0 ? `Kalan Süre: 00:${timer.toString().padStart(2, '0')}` : 'Süre Doldu'}
                  </p>

                  {timer === 0 && (
                    <button 
                      onClick={() => { setStep(1); setTimer(60); setOtp(''); }}
                      className="mt-2 text-[10px] text-viwra-bone/60 hover:text-viwra-bone transition-colors underline underline-offset-4 tracking-widest uppercase"
                    >
                      Yeni Kod Gönder
                    </button>
                  )}
                </div>

                <button
                  onClick={handleNext}
                  disabled={otp.length !== 6 || isVerifying || timer === 0}
                  className={`mt-12 ${btnBase} ${otp.length === 6 && timer > 0 ? btnActive : btnHidden}`}
                >
                  {isVerifying ? <><Spinner /> Doğrulanıyor</> : 'Doğrula'}
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

                <div className={`w-full input-underline ${manualRefCode.trim() ? 'has-value' : ''}`}>
                  <input
                    type="text"
                    placeholder="Davet Kodun var mı? (İsteğe bağlı)"
                    value={manualRefCode}
                    onChange={(e) => setManualRefCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent text-viwra-bone text-center text-lg md:text-xl py-3 focus:outline-none transition-colors font-light tracking-wide"
                  />
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
                <div className="mt-4 text-center">
                  <span className="text-[10px] text-viwra-bone/40 flex items-center justify-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Sıfır Bulut Verisi: Verileriniz cihazınızdan asla çıkmaz
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Success state - Leaderboard */
          <div className="text-center animate-in fade-in zoom-in-95 duration-1000 flex flex-col items-center justify-center w-full max-w-lg mx-auto">
            {isVanguard && (
              <div className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 text-xs tracking-widest uppercase">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                Vanguard Status
              </div>
            )}
            
            <h2 className="text-4xl md:text-6xl font-light mb-2 text-viwra-bone">
              #{userRank?.toLocaleString('tr-TR')}
            </h2>
            <p className="text-viwra-bone/60 tracking-widest text-sm uppercase mb-12">
              Mevcut Sıranız
            </p>

            <div className="bg-viwra-bone/5 border border-viwra-bone/10 rounded-2xl p-6 w-full backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-viwra-bone/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <p className="text-lg md:text-xl font-light text-viwra-bone/90 mb-4 leading-relaxed">
                <span className="font-medium text-viwra-bone">3 arkadaşını davet et</span>, listede 
                <span className="text-yellow-300/90 font-medium"> 1000 kişinin</span> önüne geç.
              </p>
              
           {/* Referral link box */}
              <div className="bg-black/20 p-4 rounded-xl flex items-center justify-between border border-viwra-bone/10 mt-6 relative z-10">
                <div className="text-left overflow-hidden mr-3 flex-1">
                  <p className="text-xs text-viwra-bone/40 uppercase tracking-widest mb-1">Referans Linkin</p>
                  <p className="text-xs md:text-sm text-viwra-bone truncate select-all font-mono">{window.location.origin}/form?ref={userRefCode}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Kopyala butonu */}
                  <button
                    id="copy-ref-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/form?ref=${userRefCode}`);
                      const btn = document.getElementById('copy-ref-btn');
                      if (btn) {
                        btn.classList.add('!bg-green-500/20', '!border-green-500/40');
                        setTimeout(() => {
                          btn.classList.remove('!bg-green-500/20', '!border-green-500/40');
                        }, 1500);
                      }
                    }}
                    title="Linki kopyala"
                    className="bg-viwra-bone/10 border border-viwra-bone/20 text-viwra-bone p-2.5 rounded-lg hover:bg-viwra-bone/20 active:scale-95 transition-all"
                    aria-label="Kopyala"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </button>

                  {/* Paylaş butonu */}
                  <button
                    onClick={async () => {
                      const shareUrl = `${window.location.origin}/form?ref=${userRefCode}`;
                      const shareText = `Viwra'ya bekleme listesine katıl ve sırada öne geç! 🚀`;
                      if (navigator.share) {
                        try {
                          await navigator.share({ title: 'Viwra', text: shareText, url: shareUrl });
                        } catch (_) {}
                      } else {
                        // Fallback: WhatsApp web
                        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
                      }
                    }}
                    title="Paylaş"
                    className="bg-viwra-bone text-viwra-navy p-2.5 rounded-lg hover:scale-105 active:scale-95 transition-all"
                    aria-label="Paylaş"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  </button>
                </div>
              </div>

              {/* Sosyal medya kısayolları */}
              <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Viwra'ya bekleme listesine katıl ve sırada öne geç! 🚀 ${window.location.origin}/form?ref=${userRefCode}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-viwra-bone/10 bg-viwra-bone/5 hover:bg-[#25D366]/15 hover:border-[#25D366]/30 text-viwra-bone/60 hover:text-[#25D366] transition-all text-xs tracking-wide"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.557 4.118 1.528 5.847L.057 23.882l6.196-1.624A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.846 0-3.565-.5-5.043-1.373l-.361-.214-3.74.98.999-3.648-.235-.374A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                  WhatsApp
                </a>

                {/* Twitter / X */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Viwra'ya bekleme listesine katıl! 🚀`)}&url=${encodeURIComponent(`${window.location.origin}/form?ref=${userRefCode}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-viwra-bone/10 bg-viwra-bone/5 hover:bg-[#1DA1F2]/15 hover:border-[#1DA1F2]/30 text-viwra-bone/60 hover:text-[#1DA1F2] transition-all text-xs tracking-wide"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  X (Twitter)
                </a>

                {/* Telegram */}
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(`${window.location.origin}/form?ref=${userRefCode}`)}&text=${encodeURIComponent("Viwra'ya bekleme listesine katıl! 🚀")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-viwra-bone/10 bg-viwra-bone/5 hover:bg-[#2AABEE]/15 hover:border-[#2AABEE]/30 text-viwra-bone/60 hover:text-[#2AABEE] transition-all text-xs tracking-wide"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  Telegram
                </a>
              </div>
            </div>
            
            <p className="mt-8 text-sm text-viwra-bone/40 tracking-wide font-light">
               Daha fazla kişiyi davet ederek "Öncü Kullanıcı" haklarına erkenden sahip olabilirsin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

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

// Stylish Popup Component
const CustomPopup: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#0b1021]/90 border border-viwra-bone/10 p-6 md:p-8 rounded-2xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-300 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-viwra-bone/10 flex items-center justify-center mb-5 border border-viwra-bone/20 text-viwra-bone">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <p className="text-viwra-bone/90 text-sm md:text-base mb-8 leading-relaxed font-light">
          {message}
        </p>
        <button 
          onClick={onClose}
          className="w-full py-3 rounded-full bg-viwra-bone text-viwra-navy font-medium text-xs tracking-widest uppercase hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Tamam
        </button>
      </div>
    </div>
  );
};

// Viwra Logo with breathing rings
const ViwraLogo: React.FC = () => (
  <div className="relative flex items-center justify-center mb-10" style={{ width: 160, height: 160 }}>
    <span className="ring-outer" />
    <span className="ring-mid" />
    <span className="ring-inner" />
    <img
      src="/viwra-logo.webp"
      alt="Viwra"
      className="relative z-10 w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(244,242,226,0.35)]"
    />
  </div>
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
  const [popupMessage, setPopupMessage] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Parse URL refs
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setManualRefCode(ref);
  }, []);


  // Validation
  const [emailError, setEmailError] = useState(false);
  const [emailShake, setEmailShake] = useState(false);



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
        setPopupMessage('Lütfen geçerli bir e-posta adresi giriniz.');
        return;
      }
      setEmailError(false);
      
      setIsVerifying(true);
      
      // Check if email already registered in waitlist
      const { data: emailExists, error: checkError } = await supabase
        .rpc('check_email_exists', { p_email: email });

      if (emailExists) {
        setIsVerifying(false);
        setPopupMessage('Bu e-posta adresiyle bekleme listesine zaten katılmışsınız.');
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({ email });
      setIsVerifying(false);

      if (error) {
        console.error('Email OTP send error:', error);
        setPopupMessage('Doğrulama e-postası gönderilirken hata oluştu. Lütfen tekrar deneyin.');
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
        setPopupMessage('Girdiğiniz kod hatalı veya süresi dolmuş.');
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

    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !altruism) return;

    setIsSubmitting(true);
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
            setPopupMessage('Bu VIP kodu maksimum kullanım limitine ulaştı.');
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
          is_altruistic: altruism === 'yakınım',
          status: usingGoldenKey ? 'vanguard' : 'pending',
          referral_code: newReferralCode,
          referred_by: finalRef && !usingGoldenKey ? finalRef : null,
        },
      ]);

      if (error) {
        console.error('Error submitting to waitlist:', error);
        setPopupMessage('Kaydınız sırasında bir hata oluştu, lütfen tekrar deneyin.');
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
      setPopupMessage('Beklenmeyen bir hata oluştu, lütfen daha sonra tekrar deneyin.');
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
    <>
      <CustomPopup message={popupMessage} onClose={() => setPopupMessage('')} />
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

            {/* Logo + Step dots */}
            <ViwraLogo />
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
                {/* No inline error, using popup instead */}

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

                <div className={`w-full relative z-40`}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full input-underline flex justify-center items-center ${altruism ? 'has-value' : ''}`}
                  >
                    <span className={`w-full bg-transparent text-center text-xl md:text-2xl py-4 transition-colors font-light tracking-wide ${altruism ? 'text-viwra-bone' : 'text-viwra-bone/40'}`}>
                      {altruism === 'kendim' ? 'Sadece kendim için' : 
                       altruism === 'yakınım' ? 'Bir yakınıma da yardım etmek istiyorum' : 
                       'Neden buradasın?'}
                    </span>
                  </button>

                  {/* Options List */}
                  <div 
                    className={`absolute left-0 right-0 top-full mt-4 py-2 bg-[#0b1021]/80 backdrop-blur-2xl border border-viwra-bone/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-top ${
                      isDropdownOpen 
                        ? 'opacity-100 scale-y-100 pointer-events-auto translate-y-0' 
                        : 'opacity-0 scale-y-95 pointer-events-none -translate-y-2'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => { setAltruism('kendim'); setIsDropdownOpen(false); }}
                      className="w-full px-6 py-5 text-center text-viwra-bone/60 hover:text-viwra-bone hover:bg-viwra-bone/5 transition-all duration-300 font-light text-lg md:text-xl block tracking-wide"
                    >
                      Sadece kendim için
                    </button>
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-viwra-bone/10 to-transparent"></div>
                    <button
                      type="button"
                      onClick={() => { setAltruism('yakınım'); setIsDropdownOpen(false); }}
                      className="w-full px-6 py-5 text-center text-viwra-bone/60 hover:text-viwra-bone hover:bg-viwra-bone/5 transition-all duration-300 font-light text-lg md:text-xl block tracking-wide"
                    >
                      Bir yakınıma da yardım etmek istiyorum
                    </button>
                  </div>
                  
                  {/* Click-away Overlay */}
                  {isDropdownOpen && (
                    <div 
                      className="fixed inset-0 z-[-1]" 
                      onClick={() => setIsDropdownOpen(false)}
                    />
                  )}
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
                      const shareText = `Viwra'ya bekleme listesine katıl ve sırada öne geç! 🚀 Viwra bekleme listesi`;
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
              <div className="flex items-center justify-center gap-3 mt-4 flex-wrap relative z-10">
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Viwra'ya bekleme listesine katıl ve sırada öne geç! 🚀 ${window.location.origin}/form?ref=${userRefCode} Viwra bekleme listesi`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-viwra-bone/10 bg-viwra-bone/5 hover:bg-[#25D366]/15 hover:border-[#25D366]/30 text-viwra-bone/60 hover:text-[#25D366] transition-all text-xs tracking-wide"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.557 4.118 1.528 5.847L.057 23.882l6.196-1.624A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.846 0-3.565-.5-5.043-1.373l-.361-.214-3.74.98.999-3.648-.235-.374A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                  WhatsApp
                </a>

                {/* Twitter / X */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Viwra'ya bekleme listesine katıl ve sırada öne geç! 🚀 Viwra bekleme listesi`)}&url=${encodeURIComponent(`${window.location.origin}/form?ref=${userRefCode}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-viwra-bone/10 bg-viwra-bone/5 hover:bg-[#1DA1F2]/15 hover:border-[#1DA1F2]/30 text-viwra-bone/60 hover:text-[#1DA1F2] transition-all text-xs tracking-wide"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  X (Twitter)
                </a>

                {/* Telegram */}
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(`${window.location.origin}/form?ref=${userRefCode}`)}&text=${encodeURIComponent("Viwra'ya bekleme listesine katıl ve sırada öne geç! 🚀 Viwra bekleme listesi")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-viwra-bone/10 bg-viwra-bone/5 hover:bg-[#2AABEE]/15 hover:border-[#2AABEE]/30 text-viwra-bone/60 hover:text-[#2AABEE] transition-all text-xs tracking-wide"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  Telegram
                </a>
              </div>
            </div>

            <div className="mt-8 w-full flex flex-col items-center">
              <p className="text-xs text-viwra-bone/40 uppercase tracking-widest mb-3">Viwra'yı Takip Et</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <a
                  href="https://www.instagram.com/viwra.tr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-viwra-bone/10 bg-viwra-bone/5 hover:bg-[#E1306C]/15 hover:border-[#E1306C]/30 text-viwra-bone/60 hover:text-[#E1306C] transition-all text-xs tracking-wide"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                  Instagram
                </a>
                <a
                  href="https://www.tiktok.com/@viwra.tr?lang=tr-TR"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-viwra-bone/10 bg-viwra-bone/5 hover:bg-white/10 hover:border-white/30 text-viwra-bone/60 hover:text-white transition-all text-xs tracking-wide"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.12-3.44-3.17-3.61-5.66-.21-3.23 1.91-6.19 5-6.95.27-.06.55-.1.83-.12v4.06c-.66.07-1.32.25-1.92.58-.94.51-1.63 1.44-1.78 2.51-.18 1.25.33 2.53 1.25 3.32.96.8 2.3.97 3.42.45.92-.41 1.57-1.21 1.76-2.18.06-.31.08-.63.08-.94V.02h3.2z"/></svg>
                  TikTok
                </a>
              </div>
            </div>
            
            <div className="mt-8 p-5 bg-viwra-bone/5 border border-viwra-bone/10 rounded-xl w-full text-center shadow-lg">
              <p className="text-sm md:text-base text-viwra-bone/90 tracking-wide font-light leading-relaxed">
                <span className="block text-viwra-bone font-medium mb-1">🎉 Bekleme listesine eklendiniz!</span>
                20 Mayıs'ta MVP (Minimum Viable Product) test kullanıcılarına açılacaktır.
              </p>
            </div>
            
            <p className="mt-6 text-xs text-viwra-bone/40 tracking-wide font-light">
               Daha fazla kişiyi davet ederek "Öncü Kullanıcı" haklarına erkenden sahip olabilirsin.
            </p>
          </div>
        )}
      </div>

      {/* Cookie Notice */}
      <p className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-viwra-bone/25 tracking-widest px-4 pointer-events-none">
        Bu site yalnızca kimlik doğrulama amacıyla zorunlu oturum çerezleri kullanır. İzleme veya pazarlama çerezi kullanılmaz.
      </p>
    </div>
    </>
  );
};

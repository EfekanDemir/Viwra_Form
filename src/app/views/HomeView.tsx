import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Mic, Send, MessageSquare, LogOut, User as UserIcon } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import type { User } from '@supabase/supabase-js';
import { getUserProfile, logOut, getRecentSessions } from '../services/viwraApi';
import type { ThemeState, SessionSummary } from '../ViwraApp';

// Global AudioContext
let globalAudioCtx: AudioContext | null = null;
function getAudioContext() {
  if (!globalAudioCtx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    globalAudioCtx = new AC({ sampleRate: 24000 });
  }
  return globalAudioCtx;
}

interface HomeViewProps {
  user: User;
  onThemeChange: (theme: ThemeState) => void;
  onSessionSummary: (summary: SessionSummary) => void;
  setPlayerState: (state: { aiMessage: string; audioQueue: string[]; isGeneratingComplete: boolean }) => void;
}

const emergencyKeywords = ['intihar', 'ölmek', 'kendime zarar', 'çaresiz'];

function HrvTeaser() {
  const [isActive, setIsActive] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);

  const handleToggle = () => {
    if (isActive) return;
    setIsActive(true);
    setTimeout(() => setShowToast(true), 200);
    setTimeout(() => {
      setIsActive(false);
      setTimeout(() => setShowToast(false), 4000);
    }, 800);
  };

  return (
    <div className="relative max-w-md mx-auto w-full">
      <div className="backdrop-blur-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-[32px] p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium tracking-wide">Biyometrik Senkronizasyon</h3>
          <button
            onClick={handleToggle}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-700 flex items-center ${isActive ? 'bg-emerald-500/40' : 'bg-black/10 dark:bg-white/10'}`}
          >
            <motion.div animate={{ x: isActive ? 24 : 0 }} className="w-4 h-4 rounded-full bg-white shadow-sm" />
          </button>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-light opacity-60 leading-relaxed">
            Bedenin sana bir şey söylüyor. Viwra, HRV sinyallerini analiz ederek stres örüntülerini fark etmeni ve zamanında mola vermeni destekler.
          </p>
          <p className="text-[10px] font-light opacity-30 italic">
            Wellness aracıdır; tıbbi cihaz veya sağlık hizmeti değildir.
          </p>
        </div>
      </div>
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute -top-20 left-0 right-0 backdrop-blur-3xl bg-black/90 text-white rounded-[24px] p-4 shadow-2xl flex items-center space-x-4"
        >
          <p className="text-xs font-medium tracking-wide">Çok Yakında. Vücudunla tam senkronizasyon için son hazırlıkları yapıyoruz.</p>
        </motion.div>
      )}
    </div>
  );
}

export function HomeView({ user, onThemeChange, onSessionSummary, setPlayerState }: HomeViewProps) {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    getUserProfile(user.id).then(p => {
      if (p?.displayName) setProfileName(p.displayName);
    }).catch(() => {});
  }, [user.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'tr-TR';
    rec.onresult = (event: any) => {
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
      }
      if (final) setInputText(prev => prev ? prev + ' ' + final : final);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = (event: any) => {
      setMicError(event.error === 'not-allowed'
        ? 'Mikrofon erişimi reddedildi.'
        : 'Mikrofon dinlenirken bir hata oluştu.');
      setIsListening(false);
    };
    setRecognition(rec);
  }, []);

  const toggleListening = () => {
    setMicError(null);
    if (isListening) { recognition?.stop(); setIsListening(false); }
    else { try { recognition?.start(); setIsListening(true); } catch (e) { console.error(e); } }
  };

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') await ctx.resume();
    } catch (e) { console.error(e); }

    const lowerInput = inputText.toLowerCase();
    if (emergencyKeywords.some(kw => lowerInput.includes(kw))) {
      navigate('/emergency');
      return;
    }

    navigate('/generating');
    setPlayerState({ aiMessage: 'Derin bir nefes al. Yalnız değilsin, buradayım.', audioQueue: [], isGeneratingComplete: false });

    try {
      let recentContext = '';
      const recentSessions = await getRecentSessions(user.id, 3);
      if (recentSessions.length > 0) {
        recentContext = `\nKullanıcının geçmişteki son ruh halleri:\n${recentSessions.map(s => `- Ruh hali: ${s.mood}, Tema: ${s.theme || 'belirtilmemiş'}`).join('\n')}\n`;
      }

      const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: `Kullanıcı şu an şöyle hissediyor: "${inputText}". ${recentContext}\nSen 30'lu yaşlarda, bilge ama alçakgönüllü, nörobilim bilgisi olan bir meditasyon rehberisin. Kullanıcının duygusal durumunu analiz et ve onu rahatlatacak, topraklayacak bir rehberli meditasyon metni yaz. Yaklaşık 150-200 kelime. Türkçe yaz.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              theme: { type: Type.STRING },
              text: { type: Type.STRING },
              takeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['theme', 'text', 'takeaways'],
          },
        },
      });

      let generatedText = 'Derin bir nefes al. Yalnız değilsin, buradayım.';
      let generatedTheme: ThemeState = 'default';
      let generatedTakeaways: string[] = [];

      if (response.text) {
        try {
          const parsed = JSON.parse(response.text);
          generatedText = parsed.text || generatedText;
          generatedTakeaways = parsed.takeaways || [];
          if (['default', 'anxiety', 'sadness', 'sleep', 'burnout'].includes(parsed.theme)) {
            generatedTheme = parsed.theme as ThemeState;
            onThemeChange(generatedTheme);
          }
        } catch { generatedText = response.text.trim(); }
      }

      const summary: SessionSummary = { mood: inputText, aiResponse: generatedText, theme: generatedTheme, takeaways: generatedTakeaways };
      onSessionSummary(summary);

      // Start TTS
      const fetchTTS = async (text: string, retries = 3): Promise<void> => {
        try {
          const ttsResponse = await ai.models.generateContent({
            model: 'gemini-3.1-flash-tts-preview',
            contents: [{ parts: [{ text: 'Say very slowly and in a calming, meditative tone: ' + text }] }],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
            },
          });
          const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          setPlayerState({ aiMessage: generatedText, audioQueue: base64Audio ? [base64Audio] : [], isGeneratingComplete: true });
        } catch (err) {
          if (retries > 0) { await new Promise(r => setTimeout(r, 2000)); await fetchTTS(text, retries - 1); }
          else setPlayerState({ aiMessage: generatedText, audioQueue: [], isGeneratingComplete: true });
        }
      };

      navigate('/player');
      fetchTTS(generatedText);
    } catch (error) {
      console.error('AI Error:', error);
      setPlayerState({ aiMessage: 'Derin bir nefes al. Yalnız değilsin, buradayım.', audioQueue: [], isGeneratingComplete: true });
      navigate('/player');
    }
  };

  const displayName = profileName || user.user_metadata?.full_name?.split(' ')[0] || null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      className="flex flex-col min-h-full justify-between p-6 pb-32"
    >
      <div className="absolute top-6 right-6 z-50 flex items-center space-x-2">
        <button onClick={() => navigate('/profile')} className="p-3 rounded-full bg-black/5 dark:bg-white/5 opacity-40 hover:opacity-100 transition-opacity duration-700" aria-label="Profil">
          <UserIcon className="w-4 h-4" />
        </button>
        <button onClick={() => navigate('/feedback')} className="p-3 rounded-full bg-black/5 dark:bg-white/5 opacity-40 hover:opacity-100 transition-opacity duration-700" aria-label="Geri Bildirim">
          <MessageSquare className="w-4 h-4" />
        </button>
        <button onClick={logOut} className="p-3 rounded-full bg-black/5 dark:bg-white/5 opacity-40 hover:opacity-100 transition-opacity duration-700" aria-label="Çıkış Yap">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-16 mt-12">
        <div className="text-center space-y-4">
          <h1 className="text-2xl md:text-3xl font-medium tracking-wider">
            {displayName ? `Hoş geldin, ${displayName}. Zihninin yükünü hafifletmek için buradayım.` : 'Hoş geldin. Zihninin yükünü hafifletmek için buradayım.'}
          </h1>
          <p className="text-sm md:text-base font-light tracking-wide opacity-70">Sadece sesini duyur veya hissini yaz. Hazır olduğunda, yavaşça, kendi ritminde.</p>
        </div>

        <div className="flex flex-col items-center space-y-12 w-full max-w-md">
          <div className="flex flex-col items-center space-y-4 relative">
            {isListening && (
              <>
                <motion.div initial={{ scale: 1, opacity: 0.5 }} animate={{ scale: 2, opacity: 0 }} transition={{ duration: 3, repeat: Infinity }} className="absolute w-24 h-24 rounded-full bg-red-500/20 pointer-events-none" />
                <motion.div initial={{ scale: 1, opacity: 0.5 }} animate={{ scale: 2, opacity: 0 }} transition={{ duration: 3, repeat: Infinity, delay: 1.5 }} className="absolute w-24 h-24 rounded-full bg-red-500/20 pointer-events-none" />
              </>
            )}
            <motion.button
              id="viwra-mic-button"
              animate={isListening ? { scale: [1, 1.05, 1] } : { scale: [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: isListening ? 3 : 4 }}
              className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-colors duration-1000 ${isListening ? 'bg-red-500/20' : 'bg-black/5 dark:bg-white/5'}`}
              onClick={toggleListening}
            >
              <Mic className={`w-8 h-8 transition-colors duration-1000 ${isListening ? 'text-red-500' : 'opacity-60'}`} strokeWidth={1.5} />
            </motion.button>
            {micError && <p className="text-xs text-red-500/80 text-center max-w-xs">{micError}</p>}
          </div>

          <div className="relative w-full">
            <input
              id="viwra-home-input"
              type="text"
              placeholder={isListening ? 'Seni duyuyorum...' : 'Şu an içinden neler geçiyor?'}
              className="w-full bg-transparent border-b border-black/10 dark:border-white/10 pb-3 text-center text-lg font-light tracking-wide focus:outline-none focus:border-black/30 dark:focus:border-white/30 transition-colors duration-700 placeholder:opacity-30 pr-10"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <button
              id="viwra-home-submit"
              onClick={handleSubmit}
              className={`absolute right-0 bottom-3 p-2 rounded-full transition-opacity duration-300 ${inputText.trim() ? 'opacity-60 hover:opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-8 mt-12">
        <HrvTeaser />
      </div>
    </motion.div>
  );
}

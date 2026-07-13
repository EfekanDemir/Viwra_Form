import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Play, Pause, Lock, Heart, Phone, Home, Sparkles, Brain, LogOut, ArrowLeft, Send, MessageSquare, History, Star, Settings, Sliders, X, Trash2, Book, Search, Tag, Pencil, Check, User as UserIcon, Network } from 'lucide-react';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { auth, signInWithGoogle, logOut, saveSession, getRecentSessions, saveFeedback, SessionData, CommunityPost, getCommunityPosts, createCommunityPost, supportCommunityPost, editCommunityPost, deleteCommunityPost, saveJournalEntry, getJournalEntries, deleteJournalEntry, JournalEntry, ChatMessage, sendChatMessage, subscribeToChatMessages, UserProfile, getUserProfile, saveUserProfile } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useMeditationDrone } from './hooks/useMeditationDrone';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, BackgroundVariant, Panel, Handle, Position, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { getUserFriendlyErrorMessage } from './errorUtils';

// Types
type ViewState = 'auth' | 'home' | 'generating' | 'player' | 'community' | 'emergency' | 'deepReflection' | 'feedback' | 'history' | 'summary' | 'profile' | 'mindmap';
type ThemeState = 'default' | 'anxiety' | 'sadness' | 'sleep' | 'burnout';

// Global AudioContext to bypass autoplay restrictions
let globalAudioCtx: AudioContext | null = null;
function getAudioContext() {
  if (!globalAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    globalAudioCtx = new AudioContextClass({ sampleRate: 24000 });
  }
  return globalAudioCtx;
}

const themeClasses: Record<ThemeState, string> = {
  default: 'bg-[#0a062b] text-[#f4f2e2] dark:bg-[#0a062b] dark:text-[#f4f2e2]',
  anxiety: 'bg-[#1A362D] text-[#F5F5F0] dark:bg-[#1A362D] dark:text-[#E8E3D9]', // Deep Earth: Derin yeşil, terracotta, vizon
  sadness: 'bg-[#E6E6FA] text-[#4A4A6A] dark:bg-[#2A2A3A] dark:text-[#FFD1DC]', // Morning Glow: Lavanta, soluk altın, yumuşak pembe
  sleep: 'bg-[#0A1128] text-[#F8F9FA] dark:bg-[#0A1128] dark:text-[#F8F9FA]', // Midnight Ether: Derin lacivert, kömür gri, yıldız tozu beyazı
  burnout: 'bg-[#8B7E74] text-[#F5F5F0] dark:bg-[#4A3025] dark:text-[#F0E6E0]', // Vizon / Toprak
};

// Interfaces
interface AuthViewProps {
  onSignIn: () => void;
  key?: string;
}

interface HomeViewProps {
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  handleSubmit: () => void;
  onDeepReflection: () => void;
  onFeedback: () => void;
  onProfile: () => void;
  user: User | null;
  key?: string;
}

interface PlayerViewProps {
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  aiMessage: string;
  audioQueue: string[];
  setAudioQueue: React.Dispatch<React.SetStateAction<string[]>>;
  isGeneratingComplete: boolean;
  setView: (view: ViewState) => void;
  key?: string;
  theme: ThemeState;
}

interface CommunityViewProps {
  user: User | null;
  key?: string;
}

interface EmergencyViewProps {
  onBack: () => void;
  key?: string;
}

interface DeepReflectionViewProps {
  onBack: () => void;
  onComplete: (summary: { mood: string; aiResponse: string; theme: ThemeState; takeaways: string[] }) => void;
  user: User | null;
  key?: string;
}

interface FeedbackViewProps {
  onBack: () => void;
  user: User | null;
  key?: string;
}

interface ProfileViewProps {
  onBack: () => void;
  user: User | null;
  onProfileUpdate: () => void;
  key?: string;
}

interface HistoryViewProps {
  onBack: () => void;
  user: User | null;
  key?: string;
}

interface SettingsViewProps {
  user: User | null;
  key?: string;
}

interface MindmapViewProps {
  onBack: () => void;
  user: User | null;
  key?: string;
}

const SoftBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-black/30 blur-[120px]" />
    <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-black/40 blur-[120px]" />
    <div className="absolute inset-0 bg-black/10 backdrop-blur-3xl" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.5)_100%)]" />
  </div>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [view, setView] = useState<ViewState>('auth');
  const [theme, setTheme] = useState<ThemeState>('default');
  const [inputText, setInputText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [hugged, setHugged] = useState(false);
  const [aiMessage, setAiMessage] = useState("Derin bir nefes al. Yalnız değilsin, buradayım.");
  const [audioQueue, setAudioQueue] = useState<string[]>([]);
  const [isGeneratingComplete, setIsGeneratingComplete] = useState(true);
  const [sessionSummary, setSessionSummary] = useState<{ mood: string, aiResponse: string, theme: ThemeState, takeaways: string[] } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (currentUser && view === 'auth') {
        setView('home');
      } else if (!currentUser) {
        setView('auth');
      }
    });
    return () => unsubscribe();
  }, [view]);

  const emergencyKeywords = ['intihar', 'ölmek', 'kendime zarar', 'çaresiz'];

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    
    // Initialize audio context immediately on user gesture to allow autoplay later
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
    } catch (e) {
      console.error("Audio resume error:", e);
    }

    const lowerInput = inputText.toLowerCase();
    const isEmergency = emergencyKeywords.some(kw => lowerInput.includes(kw));
    
    if (isEmergency) {
      setView('emergency');
    } else {
      setView('generating');
      setAudioQueue([]); // Clear previous audio
      setIsGeneratingComplete(false);
      
      try {
        let recentContext = "";
        if (user) {
          const recentSessions = await getRecentSessions(user.uid, 3);
          if (recentSessions.length > 0) {
            recentContext = `\nKullanıcının geçmişteki son ruh halleri ve konuşmaları:\n${recentSessions.map(s => `- Ruh hali: ${s.mood}, Tema: ${s.theme || 'belirtilmemiş'}`).join('\n')}\nLütfen bu geçmişi göz önünde bulundurarak, eğer gerekliyse şefkatli bir şekilde önceki durumlarına atıfta bulun (örneğin "son zamanlarda zorlandığını biliyorum" gibi).`;
          }
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        // Fast AI Response using flash-lite
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-pro',
          contents: `Kullanıcı şu an şöyle hissediyor: "${inputText}". ${recentContext}
Sen 30'lu yaşlarda, bilge ama alçakgönüllü, nörobilim bilgisi olan bir meditasyon rehberisin.
Kullanıcının duygusal durumunu analiz et ve onu rahatlatacak, topraklayacak ve anlaşıldığını hissettirecek bir rehberli meditasyon metni yaz.
Kurallar:
- Yaklaşık 150-200 kelime uzunluğunda olsun.
- Nörobilimsel gerçeklere dayan ama bunu kullanıcının kafasını karıştırmadan, bir masal anlatır gibi sun.
- Ses tonun hiçbir zaman telaşlı olmasın, yavaşlığın gücünü temsil et.
- Bir "bot" gibi değil, kullanıcının en iyi arkadaşı gibi ama profesyonel sınırları koruyarak konuş.
- Asla tıbbi teşhis koyma, ilaç tavsiyesi verme, dogmatik dini yorumlar yapma.
- Toksik pozitiflik yapma ("her şey geçecek", "gülümse" gibi şeyler söyleme).
- Yasaklı kelimeler: "hemen", "şimdi", "hata", "yanlış", "tedavi", "zorundasın", "mükemmel". Bunlar yerine "hazır olduğunda", "yavaşça", "kendi ritminde", "sadece bir deneyim", "dengeleme", "belki denemek istersin", "olduğu gibi" kullan.
- Metin içinde uzun sessizlikler bırakmak için "..." kullan.
Sadece şefkatli, sakin, anı hissetmesini sağlayan ve yanında olduğunu hissettiren bir dil kullan. Türkçe yaz.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                theme: {
                  type: Type.STRING,
                  description: "Kullanıcının duygusal durumuna en uygun tema. Seçenekler: anxiety (kaygı/stres), sadness (hüzün/düşük enerji), sleep (uykusuzluk/gece krizi), burnout (tükenmişlik), default (genel/diğer).",
                },
                text: {
                  type: Type.STRING,
                  description: "Kullanıcıya okunacak olan rehberli meditasyon metni.",
                },
                takeaways: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Seansın ve analizin ardından kullanıcının cebine koyabileceği 2-3 adet çok kısa, bilgece ve şefkatli anahtar çıkarım/özet (örn. 'Duygularını kabul etmek ilk adımdır', 'Kendine şefkat göster').",
                }
              },
              required: ["theme", "text", "takeaways"]
            }
          }
        });
        
        let generatedText = "Derin bir nefes al. Yalnız değilsin, buradayım.";
        let generatedTheme = "default";
        let generatedTakeaways: string[] = [];
        if (response.text) {
          try {
            const parsed = JSON.parse(response.text);
            generatedText = parsed.text;
            if (parsed.takeaways) {
               generatedTakeaways = parsed.takeaways;
            }
            if (parsed.theme && ['default', 'anxiety', 'sadness', 'sleep', 'burnout'].includes(parsed.theme)) {
              generatedTheme = parsed.theme;
              setTheme(parsed.theme as ThemeState);
            }
          } catch (e) {
            console.error("Failed to parse JSON response", e);
            generatedText = response.text.replace(/["']/g, '').trim();
          }
          setAiMessage(generatedText);
        }

        setSessionSummary({
          mood: inputText,
          aiResponse: generatedText,
          theme: generatedTheme as ThemeState,
          takeaways: generatedTakeaways
        });

        setView('player');
        setIsPlaying(true);

        const fetchTTS = async (text: string, retries = 3): Promise<void> => {
          try {
            const apiKey = (import.meta as any).env.VITE_ELEVENLABS_API_KEY;
            const voiceId = (import.meta as any).env.VITE_ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Default: Rachel
            
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(apiKey ? { 'xi-api-key': apiKey } : {})
              },
              body: JSON.stringify({
                text: text,
                model_id: 'eleven_v3',
                voice_settings: {
                  stability: 0.75,
                  similarity_boost: 0.85
                }
              })
            });

            if (!response.ok) {
               throw new Error(`ElevenLabs API error: ${response.status}`);
            }

            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);
            setAudioQueue([audioUrl]);
            setIsGeneratingComplete(true);
          } catch (ttsError) {
            console.error("TTS Error:", ttsError);
            if (retries > 0) {
              console.log(`Retrying TTS, ${retries} retries left...`);
              await new Promise(resolve => setTimeout(resolve, 2000));
              await fetchTTS(text, retries - 1);
            } else {
              setIsGeneratingComplete(true);
            }
          }
        };

        fetchTTS(generatedText);
        
      } catch (error) {
        console.error("AI Error:", error);
        setAiMessage("Derin bir nefes al. Yalnız değilsin, buradayım.");
        setView('player');
        setIsPlaying(true);
        setIsGeneratingComplete(true);
      }
    }
  };

  if (!isAuthReady) {
    return <div className="fixed inset-0 bg-[#0a062b] dark:bg-[#0a062b] flex items-center justify-center" />;
  }

  const currentThemeClass = view === 'community' 
    ? 'bg-[#0A0B10] text-[#E0E0E0]' 
    : view === 'emergency'
    ? 'bg-[#1A1515] text-[#E8D8D8]'
    : view === 'deepReflection'
    ? 'bg-[#2A2B38] text-[#E0E0E0]'
    : view === 'feedback'
    ? 'bg-[#1C1C1E] text-[#F5F5F0]'
    : view === 'history' || view === 'summary' || view === 'settings' || view === 'profile' || view === 'mindmap'
    ? 'bg-[#15151A] text-[#E0E0E0]'
    : themeClasses[theme];

  return (
    <div className={`fixed inset-0 transition-colors duration-[3000ms] ease-in-out ${currentThemeClass} font-sans tracking-wider leading-relaxed overflow-hidden flex flex-col`}>
      <SoftBackground />
      {view === 'community' && <CommunityBackground />}
      
      <main className="flex-1 relative z-10 overflow-y-auto hide-scrollbar">
        <AnimatePresence mode="wait">
          {view === 'auth' && (
            <AuthView 
              key="auth"
              onSignIn={async () => {
                await signInWithGoogle();
                setView('home');
              }}
            />
          )}
          {view === 'home' && (
            <HomeView 
              key="home"
              inputText={inputText}
              setInputText={setInputText}
              handleSubmit={handleSubmit}
              onDeepReflection={() => setView('deepReflection')}
              onFeedback={() => setView('feedback')}
              onProfile={() => setView('profile')}
              user={user}
            />
          )}
          {view === 'generating' && <GeneratingView key="generating" />}
          {view === 'player' && (
            <PlayerView 
              key="player" 
              isPlaying={isPlaying} 
              setIsPlaying={setIsPlaying} 
              aiMessage={aiMessage}
              audioQueue={audioQueue}
              setAudioQueue={setAudioQueue}
              isGeneratingComplete={isGeneratingComplete}
              setView={setView}
              theme={theme}
            />
          )}
          {view === 'community' && (
            <CommunityView 
              key="community" 
              user={user} 
            />
          )}
          {view === 'emergency' && (
            <EmergencyView 
              key="emergency" 
              onBack={() => { setView('home'); setInputText(''); }} 
            />
          )}
          {view === 'deepReflection' && (
            <DeepReflectionView 
              key="deepReflection" 
              onBack={() => setView('home')} 
              user={user}
              onComplete={(summary) => {
                setSessionSummary(summary);
                setView('summary');
              }}
            />
          )}
          {view === 'summary' && (
            <SummaryView
              key="summary"
              user={user}
              summary={sessionSummary}
              onDone={() => setView('home')}
            />
          )}
          {view === 'feedback' && (
            <FeedbackView 
              key="feedback" 
              onBack={() => setView('home')} 
              user={user}
            />
          )}
          {view === 'profile' && (
            <ProfileView 
              key="profile" 
              onBack={() => setView('home')} 
              user={user}
              onProfileUpdate={() => setUser(auth.currentUser ? Object.assign(Object.create(Object.getPrototypeOf(auth.currentUser)), auth.currentUser) : null)}
            />
          )}
          {view === 'history' && (
            <HistoryView 
              key="history" 
              onBack={() => setView('home')} 
              user={user}
            />
          )}
          {view === 'mindmap' && (
            <MindmapView 
              key="mindmap" 
              onBack={() => setView('home')} 
              user={user}
            />
          )}
          {view === 'settings' && (
            <SettingsView
              key="settings"
              user={user}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <AnimatePresence>
        {(view === 'home' || view === 'community' || view === 'deepReflection' || view === 'feedback' || view === 'history' || view === 'settings' || view === 'profile' || view === 'mindmap') && user && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 p-6 flex justify-center z-50 pointer-events-none"
          >
            <div className="flex space-x-8 px-8 py-4 rounded-full backdrop-blur-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] pointer-events-auto">
              <button 
                onClick={() => { setView('home'); setTheme('default'); }} 
                className={`transition-opacity duration-700 ${view === 'home' ? 'opacity-100' : 'opacity-40'}`}
                aria-label="Ana Sayfa"
              >
                <Home className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <button 
                onClick={() => setView('deepReflection')} 
                className={`transition-opacity duration-700 ${view === 'deepReflection' ? 'opacity-100' : 'opacity-40'}`}
                aria-label="İçsel Keşif"
              >
                <Brain className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <button 
                onClick={() => setView('community')} 
                className={`transition-opacity duration-700 ${view === 'community' ? 'opacity-100' : 'opacity-40'}`}
                aria-label="Ortak Hisler"
              >
                <Sparkles className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <button 
                onClick={() => setView('history')} 
                className={`transition-opacity duration-700 ${view === 'history' ? 'opacity-100' : 'opacity-40'}`}
                aria-label="Geçmiş"
              >
                <History className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <button 
                onClick={() => setView('mindmap')} 
                className={`transition-opacity duration-700 ${view === 'mindmap' ? 'opacity-100' : 'opacity-40'}`}
                aria-label="Zihin Haritası"
              >
                <Network className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <button 
                onClick={() => setView('settings')} 
                className={`transition-opacity duration-700 ${view === 'settings' ? 'opacity-100' : 'opacity-40'}`}
                aria-label="Ayarlar"
              >
                <Settings className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AuthView({ onSignIn }: AuthViewProps) {
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setError(null);
      await onSignIn();
    } catch (err: any) {
      setError(getUserFriendlyErrorMessage(err));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      className="flex flex-col items-center justify-center h-full p-6 space-y-12"
    >
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-medium tracking-wider">Viwra</h1>
        <p className="text-sm font-light tracking-wide opacity-70">Zihninin sığınağına hoş geldin. Ben buradayım, seni dinlemeye hazırım.</p>
      </div>
      
      <div className="flex flex-col items-center space-y-4">
        <button 
          onClick={handleSignIn}
          className="px-8 py-4 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-700 flex items-center space-x-3"
        >
          <span className="text-sm font-medium tracking-wide">Google ile Giriş Yap</span>
        </button>
        {error && (
          <p className="text-xs text-red-500/80 max-w-xs text-center">{error}</p>
        )}
      </div>
    </motion.div>
  );
}

function HomeView({ inputText, setInputText, handleSubmit, onDeepReflection, onFeedback, onProfile, user }: HomeViewProps) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (user) {
        const p = await getUserProfile(user.uid);
        if (p) {
          setProfile(p);
        }
      }
    }
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'tr-TR';
        
        rec.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
             setInputText((prev: string) => {
               const newText = prev ? prev + ' ' + finalTranscript : finalTranscript;
               return newText;
             });
          }
        };

        rec.onend = () => {
          setIsListening(false);
        };

        rec.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          if (event.error === 'not-allowed') {
            setMicError("Mikrofon erişimi reddedildi. Lütfen tarayıcı ayarlarından izin verin.");
          } else {
            setMicError("Mikrofon dinlenirken küçük bir aksaklık oldu.");
          }
          setIsListening(false);
        };

        setRecognition(rec);
      }
    }
  }, [setInputText]);

  const toggleListening = () => {
    setMicError(null);
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    } else {
      try {
        recognition?.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      className="flex flex-col min-h-full justify-between p-6 pb-32"
    >
      <div className="absolute top-6 right-6 z-50 flex items-center space-x-2">
        <button 
          onClick={onProfile}
          className="p-3 rounded-full bg-black/5 dark:bg-white/5 opacity-40 hover:opacity-100 transition-opacity duration-700"
          aria-label="Profil"
        >
          <UserIcon className="w-4 h-4" />
        </button>
        <button 
          onClick={onFeedback}
          className="p-3 rounded-full bg-black/5 dark:bg-white/5 opacity-40 hover:opacity-100 transition-opacity duration-700"
          aria-label="Geri Bildirim ve Öneriler"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
        <button 
          onClick={logOut}
          className="p-3 rounded-full bg-black/5 dark:bg-white/5 opacity-40 hover:opacity-100 transition-opacity duration-700"
          aria-label="Çıkış Yap"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-16 mt-12">
        <div className="text-center space-y-4">
          <h1 className="text-2xl md:text-3xl font-medium tracking-wider">
            {(profile?.displayName || user?.displayName) ? `Hoş geldin, ${(profile?.displayName || user?.displayName || '').split(' ')[0]}. Zihninin yükünü hafifletmek için buradayım.` : 'Hoş geldin. Zihninin yükünü hafifletmek için buradayım.'}
          </h1>
          <p className="text-sm md:text-base font-light tracking-wide opacity-70">Sadece sesini duyur veya hissini yaz. Hazır olduğunda, yavaşça, kendi ritminde.</p>
        </div>

        <div className="flex flex-col items-center space-y-12 w-full max-w-md">
          <div className="flex flex-col items-center space-y-4 relative">
            {isListening && (
              <>
                <motion.div
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute w-24 h-24 rounded-full bg-red-500/20 dark:bg-red-500/30 pointer-events-none"
                />
                <motion.div
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                  className="absolute w-24 h-24 rounded-full bg-red-500/20 dark:bg-red-500/30 pointer-events-none"
                />
              </>
            )}
            <motion.button
              animate={isListening ? { scale: [1, 1.05, 1] } : { scale: [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: isListening ? 3 : 4, ease: "easeInOut" }}
              className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.03)] dark:shadow-[0_0_40px_rgba(255,255,255,0.03)] transition-colors duration-1000 ${isListening ? 'bg-red-500/20 dark:bg-red-500/30' : 'bg-black/5 dark:bg-white/5'}`}
              onClick={toggleListening}
            >
              <Mic className={`w-8 h-8 transition-colors duration-1000 ${isListening ? 'text-red-500 opacity-100' : 'opacity-60'}`} strokeWidth={1.5} />
            </motion.button>
            {micError && (
              <p className="text-xs text-red-500/80 text-center max-w-xs">{micError}</p>
            )}
          </div>

          <div className="relative w-full">
            <input
              type="text"
              placeholder={isListening ? "Seni duyuyorum..." : "Şu an içinden neler geçiyor?"}
              className="w-full bg-transparent border-b border-black/10 dark:border-white/10 pb-3 text-center text-lg font-light tracking-wide focus:outline-none focus:border-black/30 dark:focus:border-white/30 transition-colors duration-700 placeholder:opacity-30 pr-10"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <button 
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

interface SummaryViewProps {
  user: User | null;
  summary: { mood: string; aiResponse: string; theme: ThemeState; takeaways: string[] } | null;
  onDone: () => void;
  key?: string;
}

function SummaryView({ user, summary, onDone }: SummaryViewProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user || !summary || isSaved || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      await saveSession(user.uid, summary.mood, summary.aiResponse, summary.theme, summary.takeaways);
      setIsSaved(true);
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (!summary) {
    return (
      <div className="flex h-full items-center justify-center flex-col space-y-4">
        <p className="opacity-50 tracking-wide font-light">Özet bulunamadı.</p>
        <button onClick={onDone} className="text-xs opacity-60 hover:opacity-100 transition-opacity">Geri Dön</button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      className="flex flex-col h-full items-center justify-center p-6 space-y-12 overflow-y-auto"
    >
      <div className="max-w-xl w-full space-y-10 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-[40px] p-8 sm:p-12 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.1)] relative">
        <div className="space-y-4 text-center">
          <Sparkles className="w-8 h-8 opacity-40 mx-auto mb-6" strokeWidth={1.5} />
          <h2 className="text-2xl font-medium tracking-wider">İçsel Yankıların</h2>
          <p className="text-sm font-light tracking-wide opacity-60 leading-relaxed">
            Bu anın bir hediyesi olarak, cebine koyabileceğin birkaç küçük hatırlatma.
          </p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500/90 text-sm p-4 rounded-2xl mb-6 text-center">
            {error}
          </div>
        )}

        {summary.takeaways && summary.takeaways.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-xs font-medium tracking-widest uppercase opacity-40 text-center">Anahtar Çıkarımlar</h3>
            <ul className="space-y-4">
              {summary.takeaways.map((t, i) => (
                <li key={i} className="text-sm font-light leading-relaxed flex items-start space-x-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <span className="opacity-40">-</span>
                  <span className="opacity-90">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-8 border-t border-white/5 flex flex-col space-y-4">
          <button
            onClick={handleSave}
            disabled={isSaved || isSaving}
            className={`w-full py-4 rounded-full transition-all duration-700 text-sm font-medium tracking-wide ${isSaved ? 'bg-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/20' : 'bg-white/5 hover:bg-white/10 hover:border-white/20 border border-transparent'}`}
          >
            {isSaving ? 'Yankılar Kaydediliyor...' : isSaved ? 'Zamanın İzlerine Kaydedildi' : 'Geçmişe Kaydet'}
          </button>
          <button
            onClick={onDone}
            className="text-xs tracking-widest uppercase opacity-40 hover:opacity-100 transition-opacity text-center w-full py-2"
          >
            Ana Yolculuğa Dön
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function EditableNode({ id, data, isConnectable }: any) {
  const { setNodes } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.label);

  const onDoubleClick = () => {
    setIsEditing(true);
  };

  const onChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setText(evt.target.value);
  };

  const onBlur = () => {
    setIsEditing(false);
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          n.data = { ...n.data, label: text };
        }
        return n;
      })
    );
  };
  
  const onKeyDown = (evt: React.KeyboardEvent<HTMLInputElement>) => {
    if (evt.key === 'Enter') {
      onBlur();
    }
  };

  return (
    <div onDoubleClick={onDoubleClick} style={data.style || { borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', padding: '10px' }}>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="!w-2 !h-2 !bg-white/40 border-none" />
      {isEditing ? (
        <input 
          autoFocus
          value={text} 
          onChange={onChange} 
          onBlur={onBlur} 
          onKeyDown={onKeyDown}
          className="bg-transparent border-b border-white/40 outline-none text-white text-center w-full min-w-[80px]"
        />
      ) : (
        <div className="text-sm tracking-wide cursor-text min-w-[80px] text-center">{data.label}</div>
      )}
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="!w-2 !h-2 !bg-white/40 border-none" />
    </div>
  );
}

const nodeTypes = {
  editableNode: EditableNode,
};

const initialNodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Merkez Düşünce', style: { borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', padding: '10px' } }, type: 'editableNode' },
];
const initialEdges: any[] = [];

function MindmapView({ onBack, user }: MindmapViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeName, setNodeName] = useState('Yeni Düşünce');
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const onConnect = React.useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const handleAddNode = () => {
    const newNode = {
      id: Math.random().toString(),
      position: { x: (Math.random() - 0.5) * 400, y: (Math.random() - 0.5) * 400 },
      type: 'editableNode',
      data: { label: nodeName, style: { borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', padding: '10px' } }
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const handleUpdateNode = () => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNode.id) {
          n.data = { ...n.data, label: nodeName };
        }
        return n;
      })
    );
    setSelectedNode(null);
  };

  const onSelectionChange = React.useCallback(({ nodes }: any) => {
    if (nodes.length > 0) {
      setSelectedNode(nodes[0]);
      setNodeName(nodes[0].data.label);
    } else {
      setSelectedNode(null);
      setNodeName('Yeni Düşünce');
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full p-6 pb-32 relative z-10"
    >
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 p-4 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-20"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="flex-1 flex flex-col pt-16">
        <div className="text-center space-y-4 mb-4">
          <h1 className="text-2xl font-medium tracking-wider">Zihin Haritası</h1>
          <p className="text-sm font-light tracking-wide opacity-60 leading-relaxed">
            Düşüncelerini görselleştir ve düğümleri birbirine bağla.
          </p>
        </div>
        <div className="flex-1 min-h-[400px] border border-white/10 rounded-[32px] overflow-hidden relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            fitView
            colorMode="dark"
          >
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            <Controls className="!bg-black/50 !border-white/10 !fill-white" />
            <MiniMap className="!bg-black/50 overflow-hidden rounded-xl border border-white/10" maskColor="rgba(0,0,0,0.4)" nodeColor="rgba(255,255,255,0.2)" />
            <Panel position="top-right" className="bg-black/40 p-4 rounded-2xl border border-white/10 backdrop-blur-xl m-4 flex flex-col gap-3 shadow-lg w-48">
              <input 
                type="text" 
                value={nodeName} 
                onChange={(e) => setNodeName(e.target.value)} 
                placeholder="Düşünce..."
                className="bg-white/10 text-white rounded-xl p-3 text-sm focus:outline-none border border-white/10"
              />
              {selectedNode ? (
                <button 
                  onClick={handleUpdateNode}
                  className="bg-white/20 hover:bg-white/30 transition-colors rounded-xl p-3 text-sm font-medium tracking-wide flex items-center justify-center gap-2"
                >
                  <span>Düğümü Güncelle</span>
                </button>
              ) : (
                <button 
                  onClick={handleAddNode}
                  className="bg-white/20 hover:bg-white/30 transition-colors rounded-xl p-3 text-sm font-medium tracking-wide flex items-center justify-center gap-2"
                >
                  <span>Düğüm Ekle</span>
                </button>
              )}
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </motion.div>
  );
}

function SettingsView({ user }: SettingsViewProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExportData = async () => {
    if (!user) return;
    setIsExporting(true);
    setError(null);
    try {
      const dbSessions = await getRecentSessions(user.uid, 500);
      const journalEntries = await getJournalEntries(user.uid);
      
      const exportData = {
        sessions: dbSessions,
        journalEntries: journalEntries,
        exportedAt: new Date().toISOString()
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `sakin_izlerim_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      className="flex flex-col h-full items-center p-6 pt-32 overflow-y-auto"
    >
      <div className="max-w-xl w-full space-y-12 pb-32">
        <div className="text-center space-y-4">
          <Settings className="w-8 h-8 opacity-40 mx-auto mb-6" strokeWidth={1.5} />
          <h2 className="text-2xl font-medium tracking-wider">Veri ve Ayarlar</h2>
          <p className="text-sm font-light tracking-wide opacity-60 leading-relaxed">
            Burada daha önce kaydettiğin tüm zamanın izlerini ve günlüklerini indirebilirsin.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500/90 text-sm p-4 rounded-2xl w-full mb-6 text-center">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <h3 className="text-xs font-medium tracking-widest uppercase opacity-40">Veri Yönetimi</h3>
          <button
            onClick={handleExportData}
            disabled={isExporting || !user}
            className="w-full text-left p-6 rounded-3xl bg-black/5 dark:bg-white/5 hover:bg-white/10 transition-colors duration-700 border border-transparent disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium opacity-90">Kayıtlarımı İndir</h4>
                <p className="text-xs font-light opacity-50 mt-2">Uygulamada bıraktığın izleri bir JSON dosyası olarak cihazına kaydet.</p>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10">
                {isExporting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <span className="opacity-60 text-xs">↓</span>
                )}
              </div>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function HistoryView({ onBack, user }: HistoryViewProps) {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSessions = async () => {
      if (!user) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await getRecentSessions(user.uid, 50);
        if (isMounted) {
          setSessions(data.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
            return dateB.getTime() - dateA.getTime();
          }));
        }
      } catch (err) {
        if (isMounted) setError(getUserFriendlyErrorMessage(err));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchSessions();
    return () => { isMounted = false; };
  }, [user]);

  const getThemeName = (theme?: string) => {
    switch(theme) {
      case 'anxiety': return 'Kaygı';
      case 'sadness': return 'Hüzün';
      case 'sleep': return 'Uyku';
      case 'burnout': return 'Tükenmişlik';
      default: return 'Denge';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('tr-TR', { 
      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' 
    }).format(date);
  };

  const chartData = [...sessions].reverse().map((s) => {
    const date = s.createdAt?.toDate ? s.createdAt.toDate() : new Date();
    const themeName = getThemeName(s.theme);
    let yValue = 0;
    switch(themeName) {
      case 'Denge': yValue = 4; break;
      case 'Uyku': yValue = 3; break;
      case 'Tükenmişlik': yValue = 2; break;
      case 'Hüzün': yValue = 1; break;
      case 'Kaygı': yValue = 0; break;
    }
    return {
      date: date.getTime(),
      y: yValue,
      theme: themeName,
      label: new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(date),
      fullDate: formatDate(s.createdAt)
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1C1C1E] border border-white/10 p-3 rounded-xl shadow-xl">
          <p className="text-xs opacity-60 mb-1">{data.fullDate}</p>
          <p className="text-sm font-medium">{data.theme}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      className="flex flex-col min-h-full p-6 pb-32 relative"
    >
      <button
        onClick={onBack}
        className="absolute top-6 left-6 p-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors backdrop-blur-md border border-black/5 dark:border-white/5 z-50"
      >
        <ArrowLeft className="w-5 h-5 opacity-60" />
      </button>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full mt-20 space-y-8">
        <div className="text-center space-y-4 mb-8">
          <History className="w-8 h-8 opacity-40 mx-auto mb-6" strokeWidth={1.5} />
          <h1 className="text-2xl font-medium tracking-wider">Zamanın İzleri</h1>
          <p className="text-sm font-light tracking-wide opacity-60 leading-relaxed">
            Daha önce yürüdüğümüz yollar ve bulduğumuz yankılar.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500/90 text-sm p-4 rounded-2xl w-full mb-6 text-center">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-4 h-4 rounded-full bg-white/40"
            />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 opacity-50 font-light text-sm">
            Henüz bir iz bırakmadın. Ne zaman istersen, ilk adımı birlikte atabiliriz.
          </div>
        ) : (
          <div className="space-y-12">
            {/* Chart Section */}
            <div className="w-full h-48 bg-white/5 rounded-[32px] border border-white/10 p-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="label" 
                    stroke="rgba(255,255,255,0.2)" 
                    fontSize={10} 
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    domain={[0, 4]} 
                    ticks={[0, 1, 2, 3, 4]}
                    tickFormatter={(val) => {
                      switch(val) {
                        case 4: return 'Denge';
                        case 3: return 'Uyku';
                        case 2: return 'Tükenmişlik';
                        case 1: return 'Hüzün';
                        case 0: return 'Kaygı';
                        default: return '';
                      }
                    }}
                    stroke="rgba(255,255,255,0.2)" 
                    fontSize={10} 
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                  <Line 
                    type="monotone" 
                    dataKey="y" 
                    stroke="rgba(255,255,255,0.5)" 
                    strokeWidth={2}
                    dot={{ fill: '#15151A', stroke: 'rgba(255,255,255,0.8)', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: 'white' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-6">
              {sessions.map((session) => (
                <motion.div 
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-[32px] bg-white/5 border border-white/10 space-y-4"
                >
                  <div className="flex justify-between items-center opacity-60 text-xs tracking-wider">
                    <span>{formatDate(session.createdAt)}</span>
                    <span className="px-3 py-1 rounded-full bg-white/10">{getThemeName(session.theme)}</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium opacity-80">İçinden Geçenler:</h3>
                    <p className="text-sm font-light leading-relaxed opacity-90">"{session.mood}"</p>
                  </div>
                  <div className="space-y-2 pt-4 border-t border-white/5">
                    <h3 className="text-sm font-medium opacity-80">Benim Yankım:</h3>
                    <p className="text-sm font-light leading-relaxed opacity-70">{session.aiResponse}</p>
                  </div>
                  {session.takeaways && session.takeaways.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-white/5">
                      <h3 className="text-sm font-medium opacity-80">Anahtar Çıkarımlar:</h3>
                      <ul className="space-y-2 pt-1">
                        {session.takeaways.map((t, i) => (
                          <li key={i} className="text-sm font-light leading-relaxed opacity-70 flex items-start space-x-2">
                            <span className="opacity-50">•</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ProfileView({ onBack, user, onProfileUpdate }: ProfileViewProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.photoURL || '');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (user) {
        setIsLoading(true);
        setError(null);
        try {
          const data = await getUserProfile(user.uid);
          if (data) {
            setProfile(data);
            if (data.displayName) setDisplayName(data.displayName);
            if (data.bio) setBio(data.bio);
            if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
          }
        } catch (err) {
          setError(getUserFriendlyErrorMessage(err));
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setAvatarUrl(dataUrl);
        }
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);
    try {
      await saveUserProfile(user.uid, {
        displayName: displayName.trim() || null,
        bio: bio.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
      });
      setSaveSuccess(true);
      onProfileUpdate();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full p-6 pb-32 relative z-10 overflow-y-auto"
    >
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 p-4 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-20"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="flex-1 flex flex-col items-center max-w-md mx-auto w-full pt-10 pb-8 min-h-max">
        <div className="text-center space-y-4 mb-6">
          <h1 className="text-2xl font-medium tracking-wider">Benim Köşem</h1>
          <p className="text-sm font-light tracking-wide opacity-60 leading-relaxed">
            Burada seni yansıtan parçaları şekillendirebilirsin.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500/90 text-sm p-4 rounded-2xl w-full mb-6 text-center">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center flex-1 items-center">
             <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="w-8 h-8 rounded-full bg-white/20 blur-md" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="w-full space-y-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-24 h-24 rounded-full bg-white/5 overflow-hidden border border-white/10 flex items-center justify-center group cursor-pointer">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className="w-8 h-8 opacity-40" />
                )}
                <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all">
                   <div className="text-[10px] font-medium tracking-widest uppercase">Değiştir</div>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleImageUpload}
                />
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-medium tracking-widest uppercase opacity-40 ml-2">Görünür İsim</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="İsmin"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-light focus:outline-none focus:bg-white/10 transition-colors"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium tracking-widest uppercase opacity-40 ml-2">Hakkımda</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Kısa bir biyografi..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-light focus:outline-none focus:bg-white/10 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-4 rounded-[24px] bg-white text-black font-medium tracking-wide hover:bg-white/90 transition-colors disabled:opacity-50 relative overflow-hidden"
              >
                {isSaving ? (
                  <span className="opacity-50">Kaydediliyor...</span>
                ) : saveSuccess ? (
                  <span className="text-green-600 flex items-center justify-center space-x-2">
                    <Check className="w-4 h-4" />
                    <span>Kaydedildi</span>
                  </span>
                ) : (
                  'Değişiklikleri Kaydet'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
}

function FeedbackView({ onBack, user }: FeedbackViewProps) {
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }
    if (!user) {
      setError('Geri bildirim göndermek için giriş yapmalısınız.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await saveFeedback(user.uid, name.trim(), email.trim(), message.trim(), rating);
      setIsSuccess(true);
      setTimeout(() => {
        onBack();
      }, 3000);
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      className="flex flex-col min-h-full p-6 pb-32 relative"
    >
      <button
        onClick={onBack}
        className="absolute top-6 left-6 p-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors backdrop-blur-md border border-black/5 dark:border-white/5 z-50"
      >
        <ArrowLeft className="w-5 h-5 opacity-60" />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center space-y-12 max-w-lg mx-auto w-full mt-12">
        <div className="text-center space-y-4">
          <MessageSquare className="w-8 h-8 opacity-40 mx-auto mb-6" strokeWidth={1.5} />
          <h1 className="text-2xl font-medium tracking-wider">Geri Bildirim ve Öneriler</h1>
          <p className="text-sm font-light tracking-wide opacity-60 leading-relaxed">
            Düşüncelerin bizim için çok değerli. Viwra'yı nasıl daha iyi bir sığınak yapabiliriz?
          </p>
        </div>

        <div className="w-full">
          {isSuccess ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 rounded-[32px] bg-white/5 border border-white/10 text-center space-y-4"
            >
              <Heart className="w-8 h-8 opacity-60 mx-auto fill-current" strokeWidth={1.5} />
              <p className="text-sm font-medium tracking-wide">Teşekkürler.</p>
              <p className="text-xs font-light opacity-60 leading-relaxed">
                Sesini duyduk. Bu alanı birlikte güzelleştireceğiz.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-medium tracking-widest uppercase opacity-40 pl-4">İsim</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-sm font-light tracking-wide focus:outline-none focus:border-white/30 transition-colors duration-700 disabled:opacity-50"
                  placeholder="Sana nasıl hitap etmeliyim?"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium tracking-widest uppercase opacity-40 pl-4">E-posta</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-sm font-light tracking-wide focus:outline-none focus:border-white/30 transition-colors duration-700 disabled:opacity-50"
                  placeholder="Sana ulaşabileceğim bir adres..."
                />
              </div>

              <div className="space-y-4 pt-2">
                <label className="text-xs font-medium tracking-widest uppercase opacity-40 pl-4 text-center block">Viwra Deneyiminiz (Puanlama)</label>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-3 transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star 
                        className={`w-7 h-7 transition-colors duration-500 ${rating >= star ? 'fill-white opacity-90' : 'opacity-20'}`} 
                        strokeWidth={1.5} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium tracking-widest uppercase opacity-40 pl-4">Ayrıntılı Geri Bildirim ve Öneriler</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-[32px] p-6 text-sm font-light tracking-wide focus:outline-none focus:border-white/30 transition-colors duration-700 resize-none disabled:opacity-50"
                  placeholder="Daha iyi bir deneyim için önerilerini, yaşadığın sorunları veya hislerini buraya yazabilirsin..."
                />
              </div>

              {error && (
                <p className="text-xs text-red-500/80 text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-700 text-sm font-medium tracking-wide flex justify-center items-center disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="opacity-60">Gönderiliyor...</span>
                ) : (
                  <span>Gönder</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function DeepReflectionView({ onBack, onComplete, user }: DeepReflectionViewProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  
  // Create state
  const [reflection, setReflection] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const availableTags = ['Huzurlu', 'Kaygılı', 'Düşünceli', 'Yorgun', 'Umutlu', 'Hüzünlü', 'Tükenmiş', 'Sakin'];

  // History state
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'history' && user) {
      const loadHistory = async () => {
        setIsLoadingHistory(true);
        setError(null);
        try {
          const entries = await getJournalEntries(user.uid);
          setJournalEntries(entries);
        } catch (err) {
          setError(getUserFriendlyErrorMessage(err));
        } finally {
          setIsLoadingHistory(false);
        }
      };
      loadHistory();
    }
  }, [activeTab, user]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSaveEntry = async () => {
    if (!reflection.trim() || !user) return;
    setError(null);
    try {
      await saveJournalEntry(user.uid, reflection, selectedTags);
      setReflection('');
      setSelectedTags([]);
      setActiveTab('history');
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err));
    }
  };

  const handleReflect = async () => {
    if (!reflection.trim()) return;
    setIsThinking(true);
    setError(null);
    
    // Save to journal automatically when getting AI insight
    if (user) {
      try {
        await saveJournalEntry(user.uid, reflection, selectedTags);
      } catch (err) {
        console.error("Journal auto-save error:", err);
      }
    }
    
    try {
      let recentContext = "";
      if (user) {
        try {
          const recentSessions = await getRecentSessions(user.uid, 3);
          if (recentSessions.length > 0) {
            recentContext = `\nKullanıcının geçmişteki son ruh halleri ve konuşmaları:\n${recentSessions.map(s => `- Ruh hali: ${s.mood}, Tema: ${s.theme || 'belirtilmemiş'}`).join('\n')}\nLütfen bu geçmişi göz önünde bulundurarak, eğer gerekliyse şefkatli bir şekilde önceki durumlarına atıfta bulun.`;
          }
        } catch (err) {
          console.error("Session history fetch error:", err);
        }
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro',
        contents: `Kullanıcı derin bir düşünce/günlük girişi yazdı: "${reflection}". ${recentContext}
Sen 30'lu yaşlarda, bilge ama alçakgönüllü, nörobilim bilgisi olan bir rehbersin.
Bu düşüncenin altındaki temel duyguyu veya ihtiyacı analiz et. 
Onu yargılamadan, şefkatle ve derin bir empatiyle yanıtla.
Kurallar:
- Maksimum 3-4 cümlelik, çok derin, topraklayıcı ve içgörü dolu bir yanıt ver.
- Nörobilimsel gerçeklere dayan ama bunu kullanıcının kafasını karıştırmadan, bir masal anlatır gibi sun.
- Ses tonun hiçbir zaman telaşlı olmasın, yavaşlığın gücünü temsil et.
- Bir "bot" gibi değil, kullanıcının en iyi arkadaşı gibi ama profesyonel sınırları koruyarak konuş.
- Asla tıbbi teşhis koyma, ilaç tavsiyesi verme, dogmatik dini yorumlar yapma.
- Yasaklı kelimeler: "hemen", "şimdi", "hata", "yanlış", "tedavi", "zorundasın", "mükemmel". Bunlar yerine "hazır olduğunda", "yavaşça", "kendi ritminde", "sadece bir deneyim", "dengeleme", "belki denemek istersin", "olduğu gibi" kullan.
Türkçe yaz.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              theme: {
                type: Type.STRING,
                description: "Kullanıcının duygusal durumuna en uygun tema. Seçenekler: anxiety (kaygı/stres), sadness (hüzün/düşük enerji), sleep (uykusuzluk/gece krizi), burnout (tükenmişlik), default (genel/diğer).",
              },
              text: {
                type: Type.STRING,
                description: "Kullanıcıya verilecek olan derin, topraklayıcı ve içgörü dolu yanıt.",
              },
              takeaways: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Kullanıcının içgörüsünden çıkarılabilecek 2-3 adet bilgece ve kişiselleştirilmiş kısa anahtar çıkarım/not.",
              }
            },
            required: ["theme", "text", "takeaways"]
          }
        }
      });
      
      let generatedText = "Şu an zihninin çok dolu olduğunu hissediyorum. Sadece nefes al, buradayım.";
      let generatedTheme = "default";
      let generatedTakeaways: string[] = [];
      if (response.text) {
        try {
          const parsed = JSON.parse(response.text);
          generatedText = parsed.text;
          if (parsed.takeaways) {
             generatedTakeaways = parsed.takeaways;
          }
          if (parsed.theme && ['default', 'anxiety', 'sadness', 'sleep', 'burnout'].includes(parsed.theme)) {
            generatedTheme = parsed.theme;
          }
        } catch (e) {
          console.error("Failed to parse JSON response", e);
          generatedText = response.text.trim();
        }
      }
      
      onComplete({
        mood: `İçsel Keşif: ${reflection.substring(0, 50)}${reflection.length > 50 ? '...' : ''}`,
        aiResponse: generatedText,
        theme: generatedTheme as ThemeState,
        takeaways: generatedTakeaways
      });
      
    } catch (error) {
      console.error("Deep Reflection Error:", error);
      onComplete({
        mood: `İçsel Keşif: ${reflection.substring(0, 50)}${reflection.length > 50 ? '...' : ''}`,
        aiResponse: "Şu an zihninin çok dolu olduğunu hissediyorum. Sadece nefes al, buradayım.",
        theme: "default",
        takeaways: []
      });
    } finally {
      setIsThinking(false);
    }
  };

  const filteredEntries = journalEntries.filter(entry => {
    const query = searchQuery.toLowerCase();
    const dateStr = entry.createdAt ? new Date(entry.createdAt.toDate ? entry.createdAt.toDate() : entry.createdAt).toLocaleDateString('tr-TR') : '';
    return entry.text.toLowerCase().includes(query) || 
           entry.tags.some(t => t.toLowerCase().includes(query)) ||
           dateStr.includes(query);
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      className="flex flex-col h-full pt-16 p-6 pb-32 overflow-y-auto"
    >
      <div className="flex-1 flex flex-col max-w-xl mx-auto w-full mt-4 space-y-8">
        <div className="text-center space-y-4">
          <Brain className="w-8 h-8 opacity-40 mx-auto mb-2" strokeWidth={1.5} />
          <h1 className="text-2xl font-medium tracking-wider">İçsel Keşif ve Günlük</h1>
          <p className="text-sm font-light tracking-wide opacity-60 leading-relaxed">
            Zihnini kağıda dök. Yargı yok, acele yok.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500/90 text-sm p-4 rounded-2xl mb-6 text-center mx-auto w-full max-w-sm">
            {error}
          </div>
        )}

        <div className="flex p-1 bg-white/5 rounded-full mx-auto w-full max-w-sm mb-4">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 text-xs font-medium tracking-widest uppercase rounded-full transition-all duration-500 ${activeTab === 'create' ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white/80'}`}
          >
            Yaz
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-xs font-medium tracking-widest uppercase rounded-full transition-all duration-500 ${activeTab === 'history' ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white/80'}`}
          >
            Geçmiş
          </button>
        </div>

        {activeTab === 'create' && (
          <div className="w-full space-y-6">
            {!isThinking ? (
              <>
                <textarea
                  placeholder="Şu an içinden ne geçiyor? Filtrelemeden yaz..."
                  className="w-full h-48 bg-white/5 border border-white/10 rounded-[32px] p-6 text-sm font-light tracking-wide focus:outline-none focus:border-white/30 transition-colors duration-700 resize-none placeholder:opacity-30"
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                />
                
                <div className="space-y-3">
                  <h3 className="text-xs font-medium tracking-widest uppercase opacity-40 pl-2">Hissetiklerin (İsteğe Bağlı)</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 border ${selectedTags.includes(tag) ? 'bg-white/20 border-white/30 text-white' : 'bg-transparent border-white/10 text-white/50 hover:bg-white/5'}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleSaveEntry}
                    className="flex-1 py-4 rounded-full border border-white/10 hover:bg-white/5 transition-colors duration-700 text-xs font-medium tracking-widest uppercase"
                  >
                    Sadece Kaydet
                  </button>
                  <button
                    onClick={handleReflect}
                    className="flex-[2] py-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-700 text-xs font-medium tracking-widest uppercase"
                  >
                    Kaydet ve İçgörü Al
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-8 py-12">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-24 h-24 rounded-full bg-white/10 blur-xl"
                />
                <p className="text-sm font-light tracking-wide opacity-50">Zihninin derinliklerine iniliyor...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="w-full space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
              <input
                type="text"
                placeholder="Geçmiş notlarda ara (kelime, tarih veya duygu)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-6 text-sm font-light tracking-wide focus:outline-none focus:border-white/30 transition-colors duration-500 placeholder:opacity-30"
              />
            </div>

            <div className="space-y-4">
              {isLoadingHistory ? (
                <div className="text-center py-12 opacity-50 text-sm">Yükleniyor...</div>
              ) : filteredEntries.length === 0 ? (
                <div className="text-center py-12 opacity-50 text-sm font-light">Kayıt bulunamadı.</div>
              ) : (
                filteredEntries.map(entry => {
                  const dateObj = entry.createdAt ? (entry.createdAt.toDate ? entry.createdAt.toDate() : new Date(entry.createdAt)) : new Date();
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 border border-white/10 rounded-[28px] p-6 space-y-4"
                    >
                      <div className="flex justify-between items-center opacity-40 text-xs font-mono tracking-widest">
                        <span>{dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span>{dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-sm leading-relaxed font-light opacity-90 whitespace-pre-wrap">
                        {entry.text}
                      </p>
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {entry.tags.map(tag => (
                            <span key={tag} className="flex items-center space-x-1 px-3 py-1 bg-white/10 rounded-full text-[10px] font-medium tracking-wider uppercase opacity-70">
                              <Tag className="w-3 h-3" />
                              <span>{tag}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function PlayerView({ isPlaying, setIsPlaying, aiMessage, audioQueue, setAudioQueue, isGeneratingComplete, setView, theme }: PlayerViewProps) {
  useMeditationDrone(isPlaying, theme);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(() => {
    const saved = localStorage.getItem('sakin_playback_rate');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [breatheSettings, setBreatheSettings] = useState(() => {
    const saved = localStorage.getItem('sakin_breathe_settings');
    return saved ? JSON.parse(saved) : { inhale: 4, holdIn: 2, exhale: 4, holdOut: 0 };
  });
  const [breathePhase, setBreathePhase] = useState<'inhale' | 'holdIn' | 'exhale' | 'holdOut'>('inhale');

  useEffect(() => {
    localStorage.setItem('sakin_playback_rate', playbackRate.toString());
  }, [playbackRate]);

  useEffect(() => {
    localStorage.setItem('sakin_breathe_settings', JSON.stringify(breatheSettings));
  }, [breatheSettings]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isPlaying) {
      const duration = breatheSettings[breathePhase] * 1000;
      timeoutId = setTimeout(() => {
        setBreathePhase(prev => {
          if (prev === 'inhale') return breatheSettings.holdIn > 0 ? 'holdIn' : 'exhale';
          if (prev === 'holdIn') return 'exhale';
          if (prev === 'exhale') return breatheSettings.holdOut > 0 ? 'holdOut' : 'inhale';
          return 'inhale';
        });
      }, duration);
    } else {
      setBreathePhase('inhale');
    }
    return () => clearTimeout(timeoutId);
  }, [isPlaying, breathePhase, breatheSettings]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    if (audioQueue.length > 0 || isPlaying) {
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = getAudioContext();
        }
        setIsAudioReady(true);
      } catch (e) {
        console.error("Audio init error:", e);
      }
    }

    return () => {
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch (e) {}
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      setIsAudioReady(false);
    };
  }, []);

  useEffect(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.playbackRate.value = playbackRate;
      } catch (e) {}
    }
  }, [playbackRate]);

  useEffect(() => {
    if (!isAudioReady || !audioCtxRef.current) return;

    if (isPlaying) {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(e => console.error(e));
      }
      
      const playNext = async () => {
        if (sourceRef.current) return; // Already playing
        
        if (audioQueue.length > 0) {
          const nextAudio = audioQueue[0];
          
          try {
            const audioCtx = audioCtxRef.current!;
            let audioBuffer: AudioBuffer;

            if (nextAudio.startsWith('blob:') || nextAudio.startsWith('http')) {
              const response = await fetch(nextAudio);
              const arrayBuffer = await response.arrayBuffer();
              audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            } else {
              const binaryString = atob(nextAudio);
              const len = binaryString.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const buffer = new Int16Array(bytes.buffer);
              audioBuffer = audioCtx.createBuffer(1, buffer.length, 24000);
              const channelData = audioBuffer.getChannelData(0);
              for (let i = 0; i < buffer.length; i++) {
                channelData[i] = buffer[i] / 32768.0;
              }
            }

            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.playbackRate.value = playbackRate;
            source.connect(audioCtx.destination);
            source.onended = () => {
              sourceRef.current = null;
              setAudioQueue(prev => prev.slice(1)); // Remove played chunk
            };
            source.start();
            sourceRef.current = source;
          } catch (e) {
            console.error("Audio playback error:", e);
            setAudioQueue(prev => prev.slice(1)); // Skip bad chunk
          }
        }
      };

      playNext();
    } else {
      if (audioCtxRef.current.state === 'running') {
        audioCtxRef.current.suspend().catch(e => console.error(e));
      }
    }
  }, [isPlaying, isAudioReady, audioQueue, setAudioQueue, playbackRate]);

  useEffect(() => {
    if (isGeneratingComplete && audioQueue.length === 0 && !sourceRef.current && isPlaying) {
      setIsPlaying(false);
      setTimeout(() => {
        setView('summary');
      }, 1000);
    }
  }, [isGeneratingComplete, audioQueue.length, isPlaying, setIsPlaying, setView]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2 }}
      className="flex flex-col items-center justify-center h-full relative"
    >
      <button
        onClick={() => setView('summary')}
        className="absolute top-8 left-8 p-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors backdrop-blur-md border border-black/5 dark:border-white/5 z-50"
      >
        <ArrowLeft className="w-5 h-5 opacity-60" />
      </button>

      <button
        onClick={() => setShowSettings(true)}
        className="absolute top-8 right-8 p-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors backdrop-blur-md border border-black/5 dark:border-white/5 z-50"
      >
        <Sliders className="w-5 h-5 opacity-60" />
      </button>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute z-[60] inset-x-0 bottom-0 p-6 flex justify-center"
          >
            <div className="w-full max-w-sm bg-stone-900/90 dark:bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[32px] p-6 shadow-2xl space-y-6 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium opacity-90 tracking-wider uppercase">Seans Ayarları</h3>
                <button onClick={() => setShowSettings(false)} className="p-2 -mr-2 opacity-50 hover:opacity-100 transition-opacity">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs opacity-60"><span>Nefes Al</span><span>{breatheSettings.inhale}s</span></div>
                  <input type="range" min="2" max="8" value={breatheSettings.inhale} onChange={e => setBreatheSettings({...breatheSettings, inhale: parseInt(e.target.value)})} className="w-full accent-white/50" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs opacity-60"><span>İçeride Tut</span><span>{breatheSettings.holdIn}s</span></div>
                  <input type="range" min="0" max="8" value={breatheSettings.holdIn} onChange={e => setBreatheSettings({...breatheSettings, holdIn: parseInt(e.target.value)})} className="w-full accent-white/50" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs opacity-60"><span>Nefes Ver</span><span>{breatheSettings.exhale}s</span></div>
                  <input type="range" min="2" max="10" value={breatheSettings.exhale} onChange={e => setBreatheSettings({...breatheSettings, exhale: parseInt(e.target.value)})} className="w-full accent-white/50" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs opacity-60"><span>Dışarıda Tut</span><span>{breatheSettings.holdOut}s</span></div>
                  <input type="range" min="0" max="8" value={breatheSettings.holdOut} onChange={e => setBreatheSettings({...breatheSettings, holdOut: parseInt(e.target.value)})} className="w-full accent-white/50" />
                </div>

                <div className="space-y-2 pt-4 border-t border-white/10">
                  <div className="flex justify-between text-xs opacity-60"><span>Ses Hızı & Tonu</span><span>{playbackRate.toFixed(1)}x</span></div>
                  <input type="range" min="0.7" max="1.5" step="0.1" value={playbackRate} onChange={e => setPlaybackRate(parseFloat(e.target.value))} className="w-full accent-white/50" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex flex-col items-center flex-1 justify-center w-full">
        <div className="relative flex items-center justify-center w-full max-w-sm aspect-square mb-8">
          {/* Breathing Aura */}
          <motion.div
            animate={{ 
              scale: isPlaying ? (breathePhase === 'inhale' || breathePhase === 'holdIn' ? 1.4 : 1) : 1, 
              opacity: isPlaying ? (breathePhase === 'inhale' || breathePhase === 'holdIn' ? 0.3 : 0.1) : 0.1 
            }}
            transition={{ duration: isPlaying ? breatheSettings[breathePhase] : 4, ease: "easeInOut" }}
            className="absolute inset-12 rounded-full bg-current blur-3xl pointer-events-none"
          />
          {/* Inner Breathing Core */}
          <motion.div
            animate={{ 
              scale: isPlaying ? (breathePhase === 'inhale' || breathePhase === 'holdIn' ? 1.1 : 0.9) : 1, 
              opacity: isPlaying ? (breathePhase === 'inhale' || breathePhase === 'holdIn' ? 0.4 : 0.2) : 0.2 
            }}
            transition={{ duration: isPlaying ? breatheSettings[breathePhase] : 4, ease: "easeInOut" }}
            className="absolute inset-16 rounded-full bg-current blur-2xl pointer-events-none"
          />
          
          {/* Controls */}
          <div className="relative z-10 flex flex-col items-center space-y-8">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-20 h-20 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-1000 backdrop-blur-md border border-black/5 dark:border-white/5"
            >
              {isPlaying ? 
                <Pause className="w-8 h-8 opacity-60" strokeWidth={1} /> : 
                <Play className="w-8 h-8 opacity-60 ml-1" strokeWidth={1} />
              }
            </button>
            <div className="flex flex-col items-center space-y-2">
              <AnimatePresence mode="wait">
                {isPlaying && (
                  <motion.p
                    key={breathePhase}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.5 }}
                    className="text-xs font-light tracking-widest uppercase opacity-60"
                  >
                    {breathePhase === 'inhale' ? 'Nefes Al...' : 
                     breathePhase === 'holdIn' ? 'Nefes Tut...' : 
                     breathePhase === 'exhale' ? 'Nefes Ver...' : 
                     'Nefes Tut...'}
                  </motion.p>
                )}
              </AnimatePresence>
              <p className="text-sm font-mono tracking-widest opacity-40">{formatTime(timeElapsed)}</p>
            </div>
          </div>
        </div>
        
        {/* Subtitles / AI Message snippet at the bottom? Optional, let's keep it clean, maybe just a text blur */}
        {isPlaying && aiMessage && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ duration: 2 }}
             className="px-8 text-center max-w-md"
           >
             <p className="text-sm font-light leading-relaxed opacity-60 italic">
               "{aiMessage.substring(0, 100)}{aiMessage.length > 100 ? '...' : ''}"
             </p>
           </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function HrvTeaser() {
  const [isActive, setIsActive] = useState(false);
  const [showToast, setShowToast] = useState(false);

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
      <div className="backdrop-blur-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium tracking-wide">Biyometrik Senkronizasyon</h3>
          <button
            onClick={handleToggle}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-700 flex items-center ${isActive ? 'bg-emerald-500/40' : 'bg-black/10 dark:bg-white/10'}`}
          >
            <motion.div
              animate={{ x: isActive ? 24 : 0 }}
              className="w-4 h-4 rounded-full bg-white shadow-sm"
            />
          </button>
        </div>
        <p className="text-xs font-light opacity-60 leading-relaxed">
          Kalbinin sesini dinleyen teknoloji. Viwra, stres seviyeni (HRV) otonom olarak takip edip sen kriz yaşamadan sana alan açar.
        </p>
      </div>

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute -top-20 left-0 right-0 mx-auto w-full backdrop-blur-3xl bg-black/90 text-white dark:bg-white/90 dark:text-black rounded-[24px] p-4 shadow-2xl flex items-center space-x-4"
          >
            <div className="p-2 bg-white/10 dark:bg-black/10 rounded-full">
              <Lock className="w-4 h-4 opacity-80" strokeWidth={2} />
            </div>
            <p className="text-xs font-medium tracking-wide leading-relaxed">Çok Yakında. Vücudunla tam senkronizasyon için son hazırlıkları yapıyoruz.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GeneratingView() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      className="flex flex-col items-center justify-center h-full space-y-12"
    >
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="w-40 h-40 rounded-full bg-current opacity-10 blur-3xl"
      />
      <p className="text-sm font-light tracking-wide opacity-60 text-center px-8 max-w-xs leading-relaxed">
        Senin için, şu anki hislerine göre üretiliyor...
      </p>
    </motion.div>
  );
}

const ROOMS = [
  { id: 'genel', name: 'Genel Gökyüzü' },
  { id: 'kaygi', name: 'Kaygı Sığınağı' },
  { id: 'uyku', name: 'Uyku Öncesi' },
  { id: 'huzun', name: 'Hüzün Köşesi' },
  { id: 'denge', name: 'Denge Durağı' }
];

function CommunityView({ user }: CommunityViewProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'chat'>('posts');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPostText, setNewPostText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supportedPosts, setSupportedPosts] = useState<Set<string>>(new Set());
  const [selectedRoom, setSelectedRoom] = useState('genel');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState("");
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [cachedProfiles, setCachedProfiles] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    const fetchMissingProfiles = async () => {
      const missingIds = new Set<string>();
      chatMessages.forEach(msg => {
        if (!cachedProfiles[msg.userId]) {
          missingIds.add(msg.userId);
        }
      });
      if (user && !cachedProfiles[user.uid]) {
        missingIds.add(user.uid);
      }
      if (missingIds.size > 0) {
        const newProfiles = { ...cachedProfiles };
        for (const id of missingIds) {
          try {
            const profile = await getUserProfile(id);
            if (profile) {
              newProfiles[id] = profile;
            } else {
              newProfiles[id] = { userId: id, updatedAt: new Date() } as UserProfile;
            }
          } catch (err) {
            console.error("Failed to fetch profile for", id, err);
          }
        }
        setCachedProfiles(newProfiles);
      }
    };
    fetchMissingProfiles();
  }, [chatMessages, user]);

  useEffect(() => {
    if (activeTab === 'chat' && selectedRoom) {
      try {
        const unsubscribe = subscribeToChatMessages(selectedRoom, 50, (messages) => {
          setChatMessages(messages);
          setTimeout(() => {
            chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        });
        return () => unsubscribe();
      } catch (err) {
        setError(getUserFriendlyErrorMessage(err));
      }
    }
  }, [activeTab, selectedRoom]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim() || !user) return;
    const text = newChatMessage.trim();
    setNewChatMessage("");
    const MyName = cachedProfiles[user.uid]?.displayName || user.displayName?.split(' ')[0] || 'Anonim';
    const MyPic = cachedProfiles[user.uid]?.avatarUrl || user.photoURL || null;
    try {
      await sendChatMessage(user.uid, MyName, MyPic, selectedRoom, text);
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err));
    }
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCommunityPosts(50, selectedRoom);
      setPosts(data);
      
      if (user) {
        const supported = new Set<string>();
        data.forEach(post => {
          if (post.supportedBy && post.supportedBy.includes(user.uid)) {
            supported.add(post.id);
          }
        });
        setSupportedPosts(supported);
      }
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [user, selectedRoom]);

  const handleSubmit = async () => {
    if (!newPostText.trim() || !user) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await createCommunityPost(user.uid, newPostText.trim(), selectedRoom);
      setNewPostText("");
      await fetchPosts();
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSupport = async (postId: string) => {
    if (!user || supportedPosts.has(postId)) return;
    
    // Optimistic update
    setSupportedPosts(prev => new Set(prev).add(postId));
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, supportCount: p.supportCount + 1 } : p));
    
    try {
      await supportCommunityPost(postId, user.uid);
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err));
      // Revert optimistic update
      setSupportedPosts(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, supportCount: p.supportCount - 1 } : p));
    }
  };

  const handleDelete = async (postId: string) => {
    if (!user || (user.email !== 'efekandemir0509@gmail.com' && posts.find(p => p.id === postId)?.authorId !== user.uid)) return;
    
    const postToDelete = posts.find(p => p.id === postId);
    // Optimistic update
    setPosts(prev => prev.filter(p => p.id !== postId));
    try {
      await deleteCommunityPost(postId);
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err));
      if (postToDelete) {
        setPosts(prev => [postToDelete, ...prev]);
      }
    }
  };

  const handleEditSubmit = async (postId: string) => {
    if (!editingText.trim()) return;
    
    const originalPost = posts.find(p => p.id === postId);
    // Optimistic update
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, text: editingText.trim() } : p));
    setEditingPostId(null);
    
    try {
      await editCommunityPost(postId, editingText.trim());
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err));
      if (originalPost) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, text: originalPost.text } : p));
      }
    }
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Az önce';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Az önce';
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    return `${Math.floor(diffInHours / 24)} gün önce`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      className="flex flex-col h-full p-6 pt-16 pb-32 relative z-10 overflow-y-auto"
    >
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-2xl font-medium tracking-wider">Aynı Gökyüzü Altında.</h1>
        <p className="text-sm font-light tracking-wide opacity-60 px-4 leading-relaxed">
          Şu an seninle benzer hisleri paylaşan sessiz bir kalabalık var. Yalnız değilsin, aynı gökyüzünün altındayız.
        </p>
      </div>

      <div className="max-w-xl mx-auto w-full space-y-8 flex-1 flex flex-col h-full">
        {/* Rooms Navigation */}
        <div className="flex overflow-x-auto no-scrollbar py-2 -mx-6 px-6 sm:mx-0 sm:px-0 scroll-smooth space-x-3">
          {ROOMS.map((room) => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room.id)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-xs font-medium tracking-wide transition-all duration-500 ease-out flex-shrink-0 ${
                selectedRoom === room.id 
                  ? 'bg-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/20' 
                  : 'bg-white/5 opacity-60 hover:opacity-100 hover:bg-white/10 border border-transparent'
              }`}
            >
              {room.name}
            </button>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1 bg-white/5 rounded-full mx-auto w-full max-w-sm mb-4">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-[2] py-2 text-xs font-medium tracking-widest uppercase rounded-full transition-all duration-500 ${activeTab === 'posts' ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white/80'}`}
          >
            Sessiz Yankılar
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-[2] py-2 text-xs font-medium tracking-widest uppercase rounded-full transition-all duration-500 ${activeTab === 'chat' ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white/80'}`}
          >
            Canlı Bağ
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500/90 text-sm p-4 rounded-2xl mb-6 text-center">
            {error}
          </div>
        )}

        {activeTab === 'posts' ? (
          <>
            {/* Input Section */}
            <div className="space-y-4 bg-white/5 p-6 rounded-[32px] border border-white/10">
              <textarea
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="İçinden geçenleri gökyüzüne bırak..."
                className="w-full h-24 bg-transparent resize-none text-sm font-light tracking-wide focus:outline-none placeholder:opacity-40"
                disabled={isSubmitting}
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={!newPostText.trim() || isSubmitting}
                  className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-xs font-medium tracking-wide disabled:opacity-30 flex items-center space-x-2"
                >
                  <span>{isSubmitting ? 'Bırakılıyor...' : 'Gökyüzüne Bırak'}</span>
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Feed Section */}
            <div className="space-y-6 pb-12">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-8 h-8 rounded-full bg-white/20 blur-md"
                  />
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 opacity-40 font-light text-sm">
                  Gökyüzü şu an sakin. İlk fısıldayan sen ol.
                </div>
              ) : (
                posts.map(post => {
                  const hasSupported = supportedPosts.has(post.id);
                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-8 rounded-[40px] bg-white/5 border border-white/5 relative overflow-hidden backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.1)]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50" />
                      <div className="relative z-10 space-y-8">
                        {editingPostId === post.id ? (
                          <div className="space-y-4">
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="w-full h-24 bg-black/20 rounded-[20px] p-4 text-sm font-light tracking-wide focus:outline-none resize-none border border-white/10"
                            />
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => setEditingPostId(null)}
                                className="px-4 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-xs"
                              >
                                İptal
                              </button>
                              <button
                                onClick={() => handleEditSubmit(post.id)}
                                disabled={!editingText.trim()}
                                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-xs disabled:opacity-50 flex items-center space-x-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>Kaydet</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-base font-light leading-relaxed tracking-wide italic opacity-90 whitespace-pre-wrap">
                            "{post.text}"
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <span className="text-[10px] font-medium tracking-widest uppercase opacity-40">
                            {formatTimeAgo(post.createdAt)}
                          </span>
                          
                          <div className="flex items-center space-x-2">
                            {user?.uid === post.authorId && (
                              <button
                                onClick={() => {
                                  setEditingPostId(post.id);
                                  setEditingText(post.text);
                                }}
                                className="p-2 rounded-full border border-white/20 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                                title="Düzenle"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                            {(user?.email === 'efekandemir0509@gmail.com' || user?.uid === post.authorId) && (
                              <button
                                onClick={() => handleDelete(post.id)}
                                className="p-2 rounded-full border border-red-500/30 text-red-500/60 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                                title="Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleSupport(post.id)}
                              disabled={hasSupported}
                              className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-700 ${
                                hasSupported 
                                  ? 'bg-white/10 border border-white/10' 
                                  : 'bg-transparent border border-white/10 hover:bg-white/5'
                              }`}
                            >
                              <Heart 
                                className={`w-4 h-4 transition-all duration-700 ${hasSupported ? 'fill-white opacity-90' : 'opacity-40'}`} 
                                strokeWidth={1.5} 
                              />
                              <span className={`text-xs tracking-wide ${hasSupported ? 'opacity-90' : 'opacity-60'}`}>
                                {hasSupported ? 'Yanındasın' : 'Sessizce Yanında Ol'}
                              </span>
                              {post.supportCount > 0 && (
                                <span className="text-xs opacity-40 ml-2">({post.supportCount})</span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col h-[50vh] min-h-[400px] bg-white/5 border border-white/10 rounded-[32px] overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-black/20">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                <input
                  type="text"
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  placeholder="Mesajlarda ara..."
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-[20px] text-sm font-light focus:outline-none focus:bg-white/10 transition-colors"
                />
                {chatSearchQuery && (
                  <button 
                    onClick={() => setChatSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {chatMessages.filter(msg => msg.text.toLowerCase().includes(chatSearchQuery.toLowerCase())).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-sm opacity-40 font-light text-center space-y-2">
                  {chatMessages.length === 0 ? (
                    <>Bu odada henüz kimse konuşmadı.<br/>Sessizliği ilk sen boz.</>
                  ) : (
                    <>Arama sonucunda mesaj bulunamadı.</>
                  )}
                </div>
              ) : (
                chatMessages.filter(msg => msg.text.toLowerCase().includes(chatSearchQuery.toLowerCase())).map((msg, index, filteredArray) => {
                  const isMe = msg.userId === user?.uid;
                  const showHeader = index === 0 || filteredArray[index - 1].userId !== msg.userId;
                  const profile = cachedProfiles[msg.userId];
                  const displayAvatarUrl = profile?.avatarUrl || msg.userPhotoUrl;
                  const displayName = profile?.displayName || msg.userName || 'Anonim';
                  const msgTime = msg.createdAt ? (msg.createdAt.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt)).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '';
                  
                  return (
                    <div key={msg.id} className={`flex w-full mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/5 mb-4 ${isMe ? 'ml-3' : 'mr-3'}`}>
                          {displayAvatarUrl ? (
                            <img src={displayAvatarUrl} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-[10px] font-medium opacity-60 uppercase">{displayName.charAt(0)}</span>
                          )}
                        </div>
                        
                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          {showHeader && !isMe && (
                            <span className="text-[10px] font-medium opacity-40 uppercase tracking-widest pl-1 mb-1.5">{displayName}</span>
                          )}
                          <div className={`relative px-4 py-3 shadow-md text-sm font-light leading-relaxed break-words ${isMe ? 'bg-white/20 text-white rounded-[24px] rounded-br-[8px] border border-white/10' : 'bg-black/20 text-white/90 rounded-[24px] rounded-bl-[8px] border border-white/5'}`}>
                            {msg.text}
                          </div>
                          <span className={`text-[9px] mt-1 opacity-40 font-medium tracking-wide ${isMe ? 'mr-1' : 'ml-1'}`}>{msgTime}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>
            
            <form onSubmit={handleSendChat} className="p-4 bg-black/20 border-t border-white/5 flex items-center space-x-3">
              <input
                type="text"
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                placeholder="Canlı bağa bir mesaj bırak..."
                className="flex-1 bg-transparent border-none focus:outline-none text-sm font-light tracking-wide px-2 placeholder:opacity-40"
              />
              <button
                type="submit"
                disabled={!newChatMessage.trim()}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-30 disabled:hover:bg-white/10 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CommunityBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white/20 blur-[2px]"
          style={{
            width: Math.random() * 3 + 1 + 'px',
            height: Math.random() * 3 + 1 + 'px',
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
          }}
          animate={{
            opacity: [0.1, 0.6, 0.1],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: Math.random() * 4 + 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  );
}

function EmergencyView({ onBack }: EmergencyViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      className="flex flex-col items-center justify-center h-full p-8 text-center space-y-10"
    >
      <motion.div 
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.1)]"
      >
        <Phone className="w-8 h-8 text-red-400/80" strokeWidth={1.5} />
      </motion.div>
      
      <div className="space-y-4">
        <h1 className="text-2xl font-medium tracking-wider">Yalnız Değilsin.</h1>
        <p className="text-sm font-light tracking-wide opacity-70 leading-relaxed max-w-sm mx-auto">
          Şu an her şeyin çok karanlık göründüğünü biliyorum. Lütfen bu yükü tek başına taşıma. Seni yargılamadan dinleyecek, elini tutacak insanlar var.
        </p>
      </div>
      
      <div className="w-full max-w-sm space-y-4 mt-8">
        <a href="tel:112" className="block w-full p-6 rounded-[32px] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-700">
          <div className="text-lg font-medium tracking-wide">112 Acil Çağrı Merkezi</div>
          <div className="text-xs font-light opacity-50 mt-2 tracking-wide">7/24 Ücretsiz Destek</div>
        </a>
        <a href="tel:114" className="block w-full p-6 rounded-[32px] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-700">
          <div className="text-lg font-medium tracking-wide">114 Zehir Danışma</div>
          <div className="text-xs font-light opacity-50 mt-2 tracking-wide">7/24 Ücretsiz Destek</div>
        </a>
      </div>
      
      <button 
        onClick={onBack} 
        className="mt-12 text-xs font-medium tracking-widest uppercase opacity-40 hover:opacity-100 transition-opacity duration-700"
      >
        Geri Dön
      </button>
    </motion.div>
  );
}

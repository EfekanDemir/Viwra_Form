import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, ArrowLeft, Sliders, X } from 'lucide-react';
import { useMeditationDrone } from '../hooks/useMeditationDrone';
import type { ThemeState, SessionSummary } from '../ViwraApp';

let globalAudioCtx: AudioContext | null = null;
function getAudioContext() {
  if (!globalAudioCtx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    globalAudioCtx = new AC({ sampleRate: 24000 });
  }
  return globalAudioCtx;
}

interface PlayerViewProps {
  theme: ThemeState;
  aiMessage: string;
  audioQueue: string[];
  setAudioQueue: React.Dispatch<React.SetStateAction<string[]>>;
  isGeneratingComplete: boolean;
  onSummaryReady: (summary: SessionSummary) => void;
}

export function PlayerView({ theme, aiMessage, audioQueue, setAudioQueue, isGeneratingComplete }: PlayerViewProps) {
  const navigate = useNavigate();
  useMeditationDrone(true, theme);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
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

  useEffect(() => { localStorage.setItem('sakin_playback_rate', playbackRate.toString()); }, [playbackRate]);
  useEffect(() => { localStorage.setItem('sakin_breathe_settings', JSON.stringify(breatheSettings)); }, [breatheSettings]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) interval = setInterval(() => setTimeElapsed(p => p + 1), 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isPlaying) {
      timeoutId = setTimeout(() => {
        setBreathePhase(prev => {
          if (prev === 'inhale') return breatheSettings.holdIn > 0 ? 'holdIn' : 'exhale';
          if (prev === 'holdIn') return 'exhale';
          if (prev === 'exhale') return breatheSettings.holdOut > 0 ? 'holdOut' : 'inhale';
          return 'inhale';
        });
      }, breatheSettings[breathePhase] * 1000);
    } else setBreathePhase('inhale');
    return () => clearTimeout(timeoutId);
  }, [isPlaying, breathePhase, breatheSettings]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  useEffect(() => {
    try {
      audioCtxRef.current = getAudioContext();
      setIsAudioReady(true);
    } catch (e) { console.error(e); }
    return () => {
      if (sourceRef.current) { try { sourceRef.current.stop(); } catch {} sourceRef.current.disconnect(); sourceRef.current = null; }
    };
  }, []);

  useEffect(() => {
    if (!isAudioReady || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (isPlaying) {
      if (ctx.state === 'suspended') ctx.resume().catch(console.error);
      if (!sourceRef.current && audioQueue.length > 0) {
        try {
          const nextAudio = audioQueue[0];
          const playAudio = async () => {
            let audioBuffer: AudioBuffer;
            if (nextAudio.startsWith('blob:') || nextAudio.startsWith('http')) {
              const res = await fetch(nextAudio);
              const arrayBuf = await res.arrayBuffer();
              audioBuffer = await ctx.decodeAudioData(arrayBuf);
            } else {
              const binaryString = atob(nextAudio);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
              const buffer = new Int16Array(bytes.buffer);
              audioBuffer = ctx.createBuffer(1, buffer.length, 24000);
              const channelData = audioBuffer.getChannelData(0);
              for (let i = 0; i < buffer.length; i++) channelData[i] = buffer[i] / 32768.0;
            }

            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.playbackRate.value = playbackRate;
            source.connect(ctx.destination);
            source.onended = () => { sourceRef.current = null; setAudioQueue(prev => prev.slice(1)); };
            source.start();
            sourceRef.current = source;
          };
          playAudio().catch(e => { console.error(e); setAudioQueue(prev => prev.slice(1)); });
        } catch (e) { console.error(e); setAudioQueue(prev => prev.slice(1)); }
      }
    } else {
      if (ctx.state === 'running') ctx.suspend().catch(console.error);
    }
  }, [isPlaying, isAudioReady, audioQueue, setAudioQueue, playbackRate]);

  useEffect(() => {
    if (isGeneratingComplete && audioQueue.length === 0 && !sourceRef.current && isPlaying) {
      setIsPlaying(false);
      setTimeout(() => navigate('/summary'), 1000);
    }
  }, [isGeneratingComplete, audioQueue.length, isPlaying, navigate]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2 }}
      className="flex flex-col items-center justify-center h-full relative"
    >
      <button onClick={() => navigate('/summary')} className="absolute top-8 left-8 p-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md border border-white/5 z-50">
        <ArrowLeft className="w-5 h-5 opacity-60" />
      </button>
      <button onClick={() => setShowSettings(true)} className="absolute top-8 right-8 p-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md border border-white/5 z-50">
        <Sliders className="w-5 h-5 opacity-60" />
      </button>

      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute z-[60] inset-x-0 bottom-0 p-6 flex justify-center">
            <div className="w-full max-w-sm bg-stone-900/90 backdrop-blur-3xl border border-white/10 rounded-[32px] p-6 shadow-2xl space-y-6 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium opacity-90 tracking-wider uppercase">Seans Ayarları</h3>
                <button onClick={() => setShowSettings(false)} className="p-2 -mr-2 opacity-50 hover:opacity-100"><X className="w-5 h-5" /></button>
              </div>
              {[
                { key: 'inhale', label: 'Nefes Al', min: 2, max: 8 },
                { key: 'holdIn', label: 'İçeride Tut', min: 0, max: 8 },
                { key: 'exhale', label: 'Nefes Ver', min: 2, max: 10 },
                { key: 'holdOut', label: 'Dışarıda Tut', min: 0, max: 8 },
              ].map(({ key, label, min, max }) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between text-xs opacity-60"><span>{label}</span><span>{breatheSettings[key as keyof typeof breatheSettings]}s</span></div>
                  <input type="range" min={min} max={max} value={breatheSettings[key as keyof typeof breatheSettings]} onChange={e => setBreatheSettings({ ...breatheSettings, [key]: parseInt(e.target.value) })} className="w-full accent-white/50" />
                </div>
              ))}
              <div className="space-y-2 pt-4 border-t border-white/10">
                <div className="flex justify-between text-xs opacity-60"><span>Ses Hızı</span><span>{playbackRate.toFixed(1)}x</span></div>
                <input type="range" min="0.7" max="1.5" step="0.1" value={playbackRate} onChange={e => setPlaybackRate(parseFloat(e.target.value))} className="w-full accent-white/50" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex flex-col items-center flex-1 justify-center w-full">
        <div className="relative flex items-center justify-center w-full max-w-sm aspect-square mb-8">
          <motion.div animate={{ scale: isPlaying ? (breathePhase === 'inhale' || breathePhase === 'holdIn' ? 1.4 : 1) : 1, opacity: isPlaying ? 0.3 : 0.1 }} transition={{ duration: breatheSettings[breathePhase] || 4, ease: 'easeInOut' }} className="absolute inset-12 rounded-full bg-current blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center space-y-8">
            <button id="viwra-player-toggle" onClick={() => setIsPlaying(!isPlaying)} className="w-20 h-20 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/5 hover:bg-white/10 transition-colors duration-1000 backdrop-blur-md border border-white/5">
              {isPlaying ? <Pause className="w-8 h-8 opacity-60" strokeWidth={1} /> : <Play className="w-8 h-8 opacity-60 ml-1" strokeWidth={1} />}
            </button>
            <div className="flex flex-col items-center space-y-2">
              <AnimatePresence mode="wait">
                {isPlaying && (
                  <motion.p key={breathePhase} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="text-xs font-light tracking-widest uppercase opacity-60">
                    {breathePhase === 'inhale' ? 'Nefes Al...' : breathePhase === 'holdIn' ? 'Nefes Tut...' : breathePhase === 'exhale' ? 'Nefes Ver...' : 'Nefes Tut...'}
                  </motion.p>
                )}
              </AnimatePresence>
              <p className="text-sm font-mono tracking-widest opacity-40">{formatTime(timeElapsed)}</p>
            </div>
          </div>
        </div>
        {isPlaying && aiMessage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }} className="px-8 text-center max-w-md">
            <p className="text-sm font-light leading-relaxed opacity-60 italic">"{aiMessage.substring(0, 100)}{aiMessage.length > 100 ? '...' : ''}"</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

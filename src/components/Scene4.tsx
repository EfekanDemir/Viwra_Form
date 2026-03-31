import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

export const Scene4: React.FC = () => {
  const [isHealing, setIsHealing] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.05);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const startHealing = () => {
    setIsHealing(true);

    setTimeout(() => {
      setShowControls(true);
    }, 3000);

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioCtxRef.current;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(852, ctx.currentTime);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 7);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();

    oscillatorRef.current = osc;
    gainNodeRef.current = gainNode;
  };

  const togglePlay = () => {
    if (!audioCtxRef.current || !gainNodeRef.current) return;

    const ctx = audioCtxRef.current;
    const gainNode = gainNodeRef.current;

    if (isPlaying) {
      gainNode.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
    } else {
      gainNode.gain.setTargetAtTime(volume, ctx.currentTime, 0.1);
    }

    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);

    if (isPlaying && audioCtxRef.current && gainNodeRef.current) {
      const ctx = audioCtxRef.current;
      gainNodeRef.current.gain.setTargetAtTime(newVolume, ctx.currentTime, 0.1);
    }
  };

  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div className="scene-4 relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-viwra-navy">

      {/* Ambient gradient layer 1 — always subtly visible */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at center, rgba(80, 100, 220, 0.10) 0%, transparent 65%)',
          opacity: isHealing ? 0.9 : 0.3,
          transition: 'opacity 8s ease',
          mixBlendMode: 'screen',
        }}
      />
      {/* Ambient gradient layer 2 — wider, warmer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 60%, rgba(244, 242, 226, 0.06) 0%, transparent 75%)',
          opacity: isHealing ? 1 : 0,
          transition: 'opacity 10s ease',
          mixBlendMode: 'screen',
        }}
      />

      {/* Deep Breathing Logo */}
      <div className={`breathing-logo relative w-48 h-48 flex items-center justify-center transition-all duration-[3000ms] ${isHealing ? 'scale-125' : 'scale-100'}`}>
        <div className={`absolute w-full h-full border border-viwra-bone/20 rounded-full ${isHealing && isPlaying ? 'animate-deep-breathe' : ''}`}></div>
        <div className={`absolute w-3/4 h-3/4 border border-viwra-bone/30 rounded-full ${isHealing && isPlaying ? 'animate-deep-breathe' : ''}`} style={{ animationDelay: '1s' }}></div>
        <div className={`absolute w-1/2 h-1/2 border border-viwra-bone/40 rounded-full ${isHealing && isPlaying ? 'animate-deep-breathe' : ''}`} style={{ animationDelay: '2s' }}></div>
        <div className={`absolute w-1/4 h-1/4 bg-viwra-bone/30 rounded-full blur-xl transition-all duration-[4000ms] ${isHealing ? 'scale-150 opacity-100' : 'scale-100 opacity-50'}`}></div>
      </div>

      {/* Frequency label — always visible, subtle */}
      <div className={`mt-6 transition-opacity duration-[4000ms] ${isHealing ? 'opacity-40' : 'opacity-20'}`}>
        <span className="text-viwra-bone text-xs tracking-[0.35em] uppercase font-light">852 Hz · Solfeggio</span>
      </div>

      <div className="z-10 mt-10 h-20 flex flex-col items-center justify-center">
        {!isHealing ? (
          <button
            onClick={startHealing}
            className="scene-4-btn px-12 py-4 rounded-full border border-viwra-bone/30 text-xs tracking-[0.2em] uppercase transition-all duration-700 opacity-0 animate-btn-pulse hover:bg-viwra-bone hover:text-viwra-navy hover:scale-105 hover:shadow-[0_0_30px_rgba(244,242,226,0.15)] hover:border-viwra-bone/60"
          >
            Kapıyı Arala
          </button>
        ) : (
          <div className={`flex items-center space-x-6 transition-all duration-1000 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <button
              onClick={togglePlay}
              className="text-viwra-bone/50 hover:text-viwra-bone transition-colors p-2"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={20} strokeWidth={1.5} /> : <Play size={20} strokeWidth={1.5} />}
            </button>

            <div className="flex items-center space-x-3 group">
              {volume === 0 ? (
                <VolumeX size={16} className="text-viwra-bone/30" strokeWidth={1.5} />
              ) : (
                <Volume2 size={16} className="text-viwra-bone/50 group-hover:text-viwra-bone/80 transition-colors" strokeWidth={1.5} />
              )}
              <input
                type="range"
                min="0"
                max="0.1"
                step="0.001"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 h-1 bg-viwra-bone/20 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-viwra-bone [&::-webkit-slider-thumb]:rounded-full cursor-pointer opacity-50 group-hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

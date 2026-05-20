import { useEffect, useRef } from 'react';

export function useMeditationDrone(isPlaying: boolean, theme: string = 'default') {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{
    osc1: OscillatorNode;
    osc2: OscillatorNode;
    osc3: OscillatorNode;
    gain: GainNode;
    lfo?: OscillatorNode;
  } | null>(null);

  useEffect(() => {
    if (isPlaying && !nodesRef.current) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const osc3 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Theme-based chords/frequencies
      let f1 = 110.0; // A2
      let f2 = 164.81; // E3
      let f3 = 220.0; // A3
      let filterFreq = 400;
      let sweepAmount = 200;

      switch (theme) {
        case 'anxiety':
          // Grounding, deep, low frequencies (healing solfeggio 174Hz ish)
          f1 = 87.0; // F2
          f2 = 130.81; // C3
          f3 = 174.61; // F3
          filterFreq = 300;
          sweepAmount = 100;
          osc1.type = 'sine';
          osc2.type = 'sine';
          osc3.type = 'sine';
          break;
        case 'sadness':
          // Warm, slightly uplifting, major chord (C major)
          f1 = 130.81; // C3
          f2 = 164.81; // E3
          f3 = 196.00; // G3
          filterFreq = 500;
          sweepAmount = 300;
          osc1.type = 'triangle';
          osc2.type = 'sine';
          osc3.type = 'sine';
          break;
        case 'sleep':
          // Deep delta waves, very low, subtle beating
          f1 = 100;
          f2 = 102; // 2Hz beat
          f3 = 150;
          filterFreq = 200;
          sweepAmount = 50;
          osc1.type = 'sine';
          osc2.type = 'sine';
          osc3.type = 'sine';
          break;
        case 'burnout':
          // Gentle refreshing, higher pitched nature-like drones (D major)
          f1 = 146.83; // D3
          f2 = 185.00; // F#3
          f3 = 220.00; // A3
          filterFreq = 600;
          sweepAmount = 400;
          osc1.type = 'sine';
          osc2.type = 'sine';
          osc3.type = 'triangle';
          break;
        default:
          // A minor 9th-ish
          f1 = 110.0; // A2
          f2 = 164.81; // E3
          f3 = 220.0; // A3
          osc1.type = 'sine';
          osc2.type = 'sine';
          osc3.type = 'triangle';
          break;
      }

      osc1.frequency.value = f1;
      osc2.frequency.value = f2;
      osc3.frequency.value = f3;

      filter.type = 'lowpass';
      filter.frequency.value = filterFreq;

      // Add a slow LFO to the filter for a "breathing" effect
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.05; // 20 seconds per cycle for slower breathing
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = sweepAmount;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();

      gain.gain.value = 0; // Start at 0 for fade in

      osc1.connect(filter);
      osc2.connect(filter);
      osc3.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc3.start();

      // Fade in
      gain.gain.setTargetAtTime(0.04, ctx.currentTime, 2);

      nodesRef.current = { osc1, osc2, osc3, gain, lfo };
    } else if (!isPlaying && nodesRef.current && audioCtxRef.current) {
      // Fade out
      const { gain, osc1, osc2, osc3, lfo } = nodesRef.current;
      const ctx = audioCtxRef.current;
      
      gain.gain.setTargetAtTime(0, ctx.currentTime, 1);
      
      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
          osc3.stop();
          if (lfo) lfo.stop();
          gain.disconnect();
        } catch (e) {
          // Ignore errors if already stopped
        }
        nodesRef.current = null;
      }, 2000);
    }
  }, [isPlaying, theme]);

  useEffect(() => {
    return () => {
      // Real unmount cleanup
      if (nodesRef.current && audioCtxRef.current) {
        const { gain, osc1, osc2, osc3, lfo } = nodesRef.current;
        try {
          osc1.stop();
          osc2.stop();
          osc3.stop();
          if (lfo) lfo.stop();
          gain.disconnect();
        } catch (e) {}
        nodesRef.current = null;
      }
    };
  }, []);
}

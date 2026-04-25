import React, { useEffect, useRef, useState } from 'react';

export const Scene1: React.FC = () => {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    if (!mounted) return;
    const fullText = "Çok Yakında.";
    let i = 0;
    const typeTimer = setInterval(() => {
      setTypedText(fullText.slice(0, i + 1));
      i++;
      if (i >= fullText.length) clearInterval(typeTimer);
    }, 150);
    return () => clearInterval(typeTimer);
  }, [mounted]);

  useEffect(() => {
    // Fade in text after a short delay
    const timer = setTimeout(() => setMounted(true), 500);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cw = window.innerWidth;
    let ch = window.innerHeight;
    canvas.width  = cw;
    canvas.height = ch;

    // ─── Simulation grid (192×108 = 1/8 of 1536×864) ─────────────────────────
    const GW   = 192;
    const GH   = 108;
    const C2   = 0.20;    // wave speed² — slower, calmer propagation
    const DAMP = 0.984;   // higher damping — waves die out sooner

    // Colour constants
    const BG_R = 10, BG_G = 6,  BG_B = 43;   // navy #0a062b
    const CR_R = 55, CR_G = 65, CR_B = 145;   // crest colour delta
    const HEIGHT_SCALE = 26;  // h/scale normalises ±1
    const GRAD_SCALE   = 7;   // for specular (bright ring at wave front)
    const SPEC_AMT     = 125; // specular rgb contribution

    // Height-field buffers
    const cur  = new Float32Array(GW * GH);
    const prev = new Float32Array(GW * GH);
    const nxt  = new Float32Array(GW * GH);

    const at = (x: number, y: number) => y * GW + x;

    // Add Gaussian impulse at grid position
    const addDrop = (gx: number, gy: number, amp: number, sigma: number) => {
      const igx = Math.round(gx);
      const igy = Math.round(gy);
      const r   = Math.ceil(sigma * 3);
      const s2  = 2 * sigma * sigma;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = igx + dx, ny = igy + dy;
          if (nx < 1 || nx >= GW - 1 || ny < 1 || ny >= GH - 1) continue;
          cur[at(nx, ny)] += amp * Math.exp(-(dx * dx + dy * dy) / s2);
        }
      }
    };

    // ─── Offscreen canvas for the height map ──────────────────────────────────
    const off    = document.createElement('canvas');
    off.width    = GW;
    off.height   = GH;
    const offCtx = off.getContext('2d')!;
    const imgData = offCtx.createImageData(GW, GH);
    const px      = imgData.data;

    // ─── Pending drops queue (avoids setTimeout in render) ───────────────────
    type PendingDrop = { gx: number; gy: number; amp: number; sigma: number; atFrame: number };
    const pending: PendingDrop[] = [];

    // ─── Wave simulation step ─────────────────────────────────────────────────
    const step = () => {
      for (let y = 1; y < GH - 1; y++) {
        for (let x = 1; x < GW - 1; x++) {
          const i   = at(x, y);
          const nb  = cur[i - 1] + cur[i + 1] + cur[i - GW] + cur[i + GW];
          nxt[i]    = ((2 - 4 * C2) * cur[i] + C2 * nb - prev[i]) * DAMP;
        }
      }
      // Absorbing boundaries
      for (let x = 0; x < GW; x++) { nxt[at(x,0)] = 0; nxt[at(x, GH-1)] = 0; }
      for (let y = 0; y < GH; y++) { nxt[at(0,y)] = 0; nxt[at(GW-1, y)] = 0; }
      prev.set(cur);
      cur.set(nxt);
    };

    // ─── Render height field → ImageData → canvas ─────────────────────────────
    const renderGrid = () => {
      for (let y = 0; y < GH; y++) {
        for (let x = 0; x < GW; x++) {
          const i  = at(x, y);
          const h  = cur[i];
          // Gradient (specular highlight at wave front)
          const gx = x > 0 && x < GW - 1 ? (cur[i + 1] - cur[i - 1]) * 0.5 : 0;
          const gy = y > 0 && y < GH - 1 ? (cur[i + GW] - cur[i - GW]) * 0.5 : 0;
          const spec = Math.min(1, (gx * gx + gy * gy) / (GRAD_SCALE * GRAD_SCALE));
          const ht   = Math.max(-1, Math.min(1, h / HEIGHT_SCALE));
          const pi   = (y * GW + x) * 4;

          let r: number, g: number, b: number;
          if (ht >= 0) {
            r = BG_R + CR_R * ht + SPEC_AMT * spec;
            g = BG_G + CR_G * ht + SPEC_AMT * spec;
            b = BG_B + CR_B * ht + SPEC_AMT * spec;
          } else {
            const t = -ht;
            r = BG_R * (1 - t * 0.5) + SPEC_AMT * spec * 0.4;
            g = BG_G * (1 - t * 0.7) + SPEC_AMT * spec * 0.4;
            b = (BG_B - t * 8)        + SPEC_AMT * spec * 0.6;
          }
          px[pi]     = Math.min(255, Math.max(0, r));
          px[pi + 1] = Math.min(255, Math.max(0, g));
          px[pi + 2] = Math.min(255, Math.max(0, b));
          px[pi + 3] = 255;
        }
      }
      offCtx.putImageData(imgData, 0, 0);
      ctx.imageSmoothingEnabled  = true;
      ctx.imageSmoothingQuality  = 'high';
      ctx.drawImage(off, 0, 0, cw, ch);
    };

    // ─── Rain scheduler ───────────────────────────────────────────────────────
    let dropTimer   = 120;
    let frameCount  = 0;



    // ─── Main loop ────────────────────────────────────────────────────────────
    let animId:   number;
    let isVisible = true;

    const render = () => {
      animId = requestAnimationFrame(render);
      if (!isVisible) return;
      if (containerRef.current) {
        const op = containerRef.current.style.opacity;
        if (op && parseFloat(op) <= 0.01) return;
      }

      frameCount++;

      // Fire pending drops
      for (let i = pending.length - 1; i >= 0; i--) {
        if (pending[i].atFrame <= frameCount) {
          const d = pending[i];
          addDrop(d.gx, d.gy, d.amp, d.sigma);
          pending.splice(i, 1);
        }
      }

      // Auto rain drops — sparse, calm
      dropTimer--;
      if (dropTimer <= 0) {
        const heavy = Math.random() < 0.12;
        addDrop(
          2 + Math.random() * (GW - 4),
          2 + Math.random() * (GH - 4),
          heavy ? 50 + Math.random() * 35 : 15 + Math.random() * 25,
          heavy ? 2.2 : 0.8 + Math.random() * 1.0,
        );
        dropTimer = 150 + Math.floor(Math.random() * 210); // 2.5–6s between drops
      }

      step();
      renderGrid();
    };

    render();

    // ─── Mouse: ripples on move / big splash on click ─────────────────────────
    let lastMx = -1, lastMy = -1, cooldown = 0;
    const toGrid = (ex: number, ey: number, rect: DOMRect) => ({
      gx: ((ex - rect.left) / cw) * GW,
      gy: ((ey - rect.top)  / ch) * GH,
    });

    const onMouseMove = (e: MouseEvent) => {
      const rect  = canvas.getBoundingClientRect();
      const speed = Math.hypot(e.clientX - lastMx, e.clientY - lastMy);
      cooldown--;
      if (speed > 10 && cooldown <= 0) {
        const { gx, gy } = toGrid(e.clientX, e.clientY, rect);
        addDrop(gx, gy, 5 + speed * 0.18, 0.7);
        cooldown = 18;
      }
      lastMx = e.clientX; lastMy = e.clientY;
    };

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const { gx, gy } = toGrid(e.clientX, e.clientY, rect);
      addDrop(gx, gy, 90 + Math.random() * 40, 3);
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onClick);

    const onResize = () => {
      cw = window.innerWidth; ch = window.innerHeight;
      canvas.width = cw; canvas.height = ch;
    };
    window.addEventListener('resize', onResize);

    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        isVisible = e.isIntersecting;
        if (isVisible) { cancelAnimationFrame(animId); render(); }
      });
    }, { threshold: 0 });
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="scene-1 absolute inset-0 w-full h-screen flex items-center justify-center overflow-hidden z-10 pointer-events-none"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 pointer-events-auto cursor-crosshair"
      />
      <div className={`relative z-10 flex flex-col items-center text-center px-6 pointer-events-none transition-all duration-[3000ms] ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <img 
          src="/viwra-logo.webp" 
          alt="Viwra Logo" 
          className="w-20 h-20 md:w-28 md:h-28 mb-6 drop-shadow-[0_0_20px_rgba(10,6,43,0.9)] opacity-90"
        />
        <p className="text-xl md:text-2xl font-light tracking-widest text-viwra-bone/80 mt-2"
           style={{ textShadow: '0 0 20px rgba(10,6,43,0.9)' }}>
          {typedText}<span className="animate-pulse opacity-70">|</span>
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-12 pointer-events-auto">
          <button
            onClick={() => { window.history.pushState({}, '', '/form'); window.dispatchEvent(new PopStateEvent('popstate')); }}
            className="px-8 py-3 border border-viwra-bone/20 rounded-full text-viwra-bone/70 text-xs tracking-[0.3em] uppercase hover:bg-viwra-bone/10 hover:text-viwra-bone hover:border-viwra-bone/50 transition-all duration-500 cursor-pointer bg-transparent"
            style={{ textShadow: '0 0 10px rgba(10,6,43,0.9)', boxShadow: '0 0 20px rgba(10,6,43,0.5)' }}
          >
            Seçim Protokolüne Katıl
          </button>
          <button
            onClick={() => { window.history.pushState({}, '', '/rapor'); window.dispatchEvent(new PopStateEvent('popstate')); }}
            className="px-8 py-3 bg-viwra-bone/5 border border-viwra-bone/10 rounded-full text-viwra-bone/60 text-xs tracking-[0.3em] uppercase hover:bg-viwra-bone/20 hover:text-viwra-bone transition-all duration-500 backdrop-blur-md cursor-pointer"
            style={{ textShadow: '0 0 10px rgba(10,6,43,0.9)' }}
          >
            Stratejik Analiz Raporu
          </button>
        </div>
      </div>
    </div>
  );
};

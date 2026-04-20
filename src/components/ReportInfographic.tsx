import React, { useEffect, useState } from 'react';

export const ReportInfographic: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Add a small delay for smooth mount animation
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative h-full w-full bg-viwra-navy overflow-y-auto no-scrollbar font-['Inter'] selection:bg-viwra-bone/20 pb-32">
      {/* Noise Overlay is assumed to be provided by parent App, but adding a fallback just in case */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-30 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]"></div>
      
      {/* Floating Gradient Orbs for background depth */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-900/10 blur-[120px] pointer-events-none z-0"></div>

      <div className={`relative z-10 w-full max-w-5xl mx-auto px-6 pt-24 md:pt-32 transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        
        {/* Header Section */}
        <header className="mb-24 md:mb-32">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-12 h-[1px] bg-viwra-bone/30"></div>
            <span className="text-xs tracking-[0.3em] text-viwra-bone/60 uppercase">Gizli / Stratejik</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-viwra-bone leading-tight tracking-tight mb-8 drop-shadow-[0_0_15px_rgba(244,242,226,0.1)]">
            Dijital Esenlikte Proaktif Müdahale
          </h1>
          <p className="text-lg md:text-xl font-light text-viwra-bone/70 max-w-2xl leading-relaxed tracking-wide">
             Geleneksel 'wellness' uygulamalarının operasyonel sürekliliği korumadaki başarısızlığına karşın inşa edilen yeni nesil **Dijital Bağışıklık Sistemi**.
          </p>
        </header>

        {/* 1. Problem - Amygdala Hijack */}
        <section className="mb-24 relative">
          <div className="absolute -left-12 top-0 h-full w-[2px] bg-gradient-to-b from-viwra-bone/20 via-viwra-bone/5 to-transparent hidden md:block"></div>
          
          <h2 className="text-sm tracking-[0.2em] text-viwra-bone/50 uppercase mb-8 flex items-center">
            <span className="w-6 h-6 rounded-full border border-viwra-bone/20 flex items-center justify-center mr-4 text-[10px]">01</span>
            Biyolojik Darboğaz: Amigdala Gaspı
          </h2>
          
          <div className="p-8 md:p-12 bg-white/[0.02] backdrop-blur-2xl rounded-3xl border border-white/[0.05] shadow-[0_0_50px_rgba(10,6,43,0.5)]">
            <p className="text-xl md:text-2xl font-light text-viwra-bone/90 leading-loose mb-8">
              Mevcut esenlik çözümleri, kullanıcıların en çok ihtiyaç duyduğu "kriz anlarında" biyolojik olarak işlevsiz kalmaktadır. 
            </p>
            <div className="grid md:grid-cols-2 gap-8 text-viwra-bone/60 font-light text-sm leading-relaxed">
              <div>
                <strong className="text-viwra-bone/90 block mb-2 font-normal">Prefrontal Korteks Çöküşü</strong>
                Stres anında beynin rasyonel merkezi devre dışı kalır. Geleneksel uygulamaların varsaydığı "öz kontrol" ve "niyet" bu aşamada fiziksel olarak imkansızdır.
              </div>
              <div>
                <strong className="text-viwra-bone/90 block mb-2 font-normal">Tasarım Paradoksu</strong>
                Kullanıcı kriz anında uygulamayı arayamaz, bulamaz ve kullanamaz. İhtiyaç anı ile müdahale anı arasında ölümcül bir senkronizasyon kopukluğu vardır.
              </div>
            </div>
          </div>
        </section>

        {/* 2. Market Data & Stressflation */}
        <section className="mb-24">
          <h2 className="text-sm tracking-[0.2em] text-viwra-bone/50 uppercase mb-8 flex items-center">
            <span className="w-6 h-6 rounded-full border border-viwra-bone/20 flex items-center justify-center mr-4 text-[10px]">02</span>
            Ekonomik Etki & Stresflasyon
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-8 bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-xl rounded-3xl border border-white/[0.03]">
              <div className="text-5xl font-serif text-blue-200/90 mb-4 drop-shadow-[0_0_15px_rgba(191,219,254,0.3)]">$19B</div>
              <div className="text-xs tracking-[0.2em] text-viwra-bone/50 uppercase mb-4">Küresel Pazar (2029)</div>
              <p className="text-sm font-light text-viwra-bone/70 leading-relaxed">
                Pazar agresif bir şekilde büyürken, kurumsal taraftaki verimlilik sızıntıları devam etmektedir. Bu bir "wellness" sorunu değil, operasyonel bir krizdir.
              </p>
            </div>

            <div className="p-8 bg-gradient-to-br from-red-900/[0.05] to-transparent backdrop-blur-xl rounded-3xl border border-red-900/[0.1]">
              <div className="flex items-start justify-between mb-4">
                <div className="text-2xl font-serif text-viwra-bone/90">Stresflasyon</div>
                <div className="px-3 py-1 bg-red-900/20 text-red-200/70 text-[10px] uppercase tracking-widest rounded-full border border-red-900/30">Risk Analizi</div>
              </div>
              <p className="text-sm font-light text-viwra-bone/70 leading-relaxed">
                Tükenmişlik ve stres kaynaklı algısal daralmalar, modern şirketlerin görünmez maliyetidir. Karar alma mekanizmalarını doğrudan sabote eder.
              </p>
            </div>
          </div>
        </section>

        {/* 3. The Solution: Digital Immune System */}
        <section className="mb-24">
          <h2 className="text-sm tracking-[0.2em] text-viwra-bone/50 uppercase mb-8 flex items-center">
            <span className="w-6 h-6 rounded-full border border-viwra-bone/20 flex items-center justify-center mr-4 text-[10px]">03</span>
            Çözüm Mimarisi
          </h2>

          <div className="relative p-8 md:p-12 overflow-hidden rounded-3xl border border-cyan-900/20 bg-cyan-950/[0.02] backdrop-blur-2xl">
            {/* Ambient Pulse inside card */}
            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px]"></div>

            <h3 className="text-3xl font-serif text-cyan-100/90 mb-6 drop-shadow-[0_0_10px_rgba(207,250,254,0.2)]">Dijital Bağışıklık Sistemi</h3>
            <p className="text-base text-viwra-bone/80 font-light max-w-xl leading-relaxed mb-10">
              Viwra, kullanıcı inisiyatifinden bağımsız çalışır. Tıpkı biyolojik bağışıklık sistemi gibi, tehdidi (stres/kriz) algılar ve otonom olarak devreye girer.
            </p>

            <div className="flex flex-col space-y-6">
              <div className="flex items-center space-x-6">
                <div className="w-12 h-12 rounded-full border border-cyan-800/30 flex items-center justify-center bg-cyan-900/10 shadow-[0_0_15px_rgba(8,145,178,0.1)]">
                  <div className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse"></div>
                </div>
                <div>
                  <div className="text-sm font-medium text-cyan-100/80 tracking-wide">01. Algılama (Detection)</div>
                  <div className="text-xs text-viwra-bone/50 font-light mt-1">Biyometrik ve davranışsal veri ile kriz anını tespiti.</div>
                </div>
              </div>
              <div className="w-[1px] h-6 bg-cyan-900/30 ml-6"></div>
              <div className="flex items-center space-x-6">
                <div className="w-12 h-12 rounded-full border border-cyan-800/30 flex items-center justify-center bg-cyan-900/10">
                  <div className="w-3 h-3 rounded-full border border-cyan-300"></div>
                </div>
                <div>
                  <div className="text-sm font-medium text-cyan-100/80 tracking-wide">02. Müdahale (Intervention)</div>
                  <div className="text-xs text-viwra-bone/50 font-light mt-1">Otonom sinir sistemini regüle eden işitsel frekanslar (örn. 852Hz) ve anlık duygu durumuna göre kişiselleştirilmiş sesli öneriler.</div>
                </div>
              </div>
              <div className="w-[1px] h-6 bg-cyan-900/30 ml-6"></div>
              <div className="flex items-center space-x-6">
                <div className="w-12 h-12 rounded-full border border-cyan-800/30 flex items-center justify-center bg-cyan-900/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-100"></div>
                </div>
                <div>
                  <div className="text-sm font-medium text-cyan-100/80 tracking-wide">03. İyileşme (Recovery)</div>
                  <div className="text-xs text-viwra-bone/50 font-light mt-1">Prefrontal korteksin yeniden aktivasyonu ve operasyonel dönüş.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Technical ML Comparison */}
        <section className="mb-24">
          <h2 className="text-sm tracking-[0.2em] text-viwra-bone/50 uppercase mb-8 flex items-center">
            <span className="w-6 h-6 rounded-full border border-viwra-bone/20 flex items-center justify-center mr-4 text-[10px]">04</span>
            Teknik Mimari Karşılaştırması
          </h2>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Reactive (Standard) */}
            <div className="flex-1 p-8 rounded-3xl border border-white/[0.02] bg-white/[0.01]">
              <div className="text-viwra-bone/40 text-xs tracking-widest uppercase mb-6">Mevcut Standart</div>
              <h4 className="text-xl text-viwra-bone/70 mb-4 font-serif">Reaktif Algoritmalar</h4>
              <ul className="space-y-4 text-sm font-light text-viwra-bone/50">
                <li className="flex items-start">
                  <span className="mr-3 text-red-500/50">✕</span>
                  <span>Kullanıcı girişi (input) bekler.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-red-500/50">✕</span>
                  <span>Kriz anında terk edilme oranı (churn) %80+.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-red-500/50">✕</span>
                  <span>Duygu günlüğü gibi rasyonel efor gerektirir.</span>
                </li>
              </ul>
            </div>

            {/* Predictive (Viwra) */}
            <div className="flex-1 p-8 rounded-3xl border border-blue-400/20 bg-blue-900/[0.03] shadow-[0_0_30px_rgba(59,130,246,0.05)]">
              <div className="text-blue-300/60 text-xs tracking-widest uppercase mb-6 flex items-center">
                Viwra Protokolü
                <span className="ml-3 px-2 py-0.5 bg-blue-500/20 rounded-full text-[9px] text-blue-200">AKTİF</span>
              </div>
              <h4 className="text-xl text-blue-100/90 mb-4 font-serif">Prediktif Otonom Regülasyon</h4>
              <ul className="space-y-4 text-sm font-light text-viwra-bone/70">
                <li className="flex items-start">
                  <span className="mr-3 text-blue-400">✓</span>
                  <span>Sürekli arka plan veri analizi (Zero UI).</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-blue-400">✓</span>
                  <span>Kriz anından milisaniyeler önce müdahale başlangıcı.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-blue-400">✓</span>
                  <span>Nöroakustik frekanslar ile biyolojik baypas işlemi.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer actions */}
        <div className="flex justify-center mt-32">
          <a href="/" className="px-8 py-3 border border-viwra-bone/20 rounded-full text-viwra-bone/60 hover:text-viwra-bone hover:bg-viwra-bone/5 hover:border-viwra-bone/40 transition-all duration-300 text-xs tracking-[0.2em] uppercase backdrop-blur-md">
            Ana Merkeze Dön
          </a>
        </div>

      </div>
    </div>
  );
};

export default ReportInfographic;

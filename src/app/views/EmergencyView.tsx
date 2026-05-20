import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Heart, Phone } from 'lucide-react';

export function EmergencyView() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="flex flex-col items-center justify-center h-full p-8 space-y-12"
    >
      <div className="text-center space-y-6 max-w-sm">
        <Heart className="w-12 h-12 opacity-60 mx-auto" strokeWidth={1} />
        <h1 className="text-2xl font-medium tracking-wider">Seninleyim.</h1>
        <p className="text-sm font-light leading-relaxed opacity-80">
          Bu anın ne kadar ağır olduğunu görüyorum. Yalnız değilsin. Lütfen hemen yardım al.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <a
          id="emergency-call-182"
          href="tel:182"
          className="flex items-center justify-center space-x-3 w-full py-5 rounded-[28px] bg-white/10 border border-white/20 hover:bg-white/20 transition-colors duration-500"
        >
          <Phone className="w-5 h-5 opacity-80" />
          <span className="text-sm font-medium tracking-wide">182 — Türkiye İntihar Önleme Hattı</span>
        </a>
        <a
          id="emergency-call-156"
          href="tel:156"
          className="flex items-center justify-center space-x-3 w-full py-4 rounded-[28px] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-500"
        >
          <Phone className="w-5 h-5 opacity-60" />
          <span className="text-sm font-light tracking-wide opacity-80">156 — ALO Psikiyatri Hattı</span>
        </a>
      </div>

      <button
        id="emergency-back"
        onClick={() => navigate('/home')}
        className="text-xs tracking-widest uppercase opacity-30 hover:opacity-60 transition-opacity"
      >
        Ana Sayfaya Dön
      </button>
    </motion.div>
  );
}

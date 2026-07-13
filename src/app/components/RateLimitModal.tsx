import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

interface RateLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
}

export function RateLimitModal({ isOpen, onClose, onRetry }: RateLimitModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-6 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-sm bg-stone-950/95 border border-white/10 rounded-[32px] p-8 shadow-2xl backdrop-blur-3xl space-y-6">
              
              {/* Close button */}
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="p-2 -m-2 opacity-40 hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Icon */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-amber-400/80" strokeWidth={1.5} />
                </div>
              </div>

              {/* Text */}
              <div className="text-center space-y-3">
                <h3 className="text-base font-medium tracking-wide text-white/90">
                  Sunucu Şu An Yoğun
                </h3>
                <p className="text-sm font-light leading-relaxed text-white/50">
                  Çok fazla istek alıyoruz. Birkaç dakika sonra tekrar denersen seni hemen karşılarım.
                </p>
              </div>

              {/* Buttons */}
              <div className="space-y-3 pt-2">
                {onRetry && (
                  <button
                    onClick={() => { onClose(); onRetry(); }}
                    className="w-full py-3.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-500 text-sm font-medium tracking-wide text-white/90 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Tekrar Dene
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-full py-3.5 rounded-full text-sm font-light tracking-widest uppercase text-white/30 hover:text-white/60 transition-colors duration-500"
                >
                  Tamam
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Gelen hata objesi rate-limit (429) ya da quota aşım hatası mı? */
export function isRateLimitError(error: unknown): boolean {
  if (!error) return false;
  const msg = String(error instanceof Error ? error.message : error).toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests')
  );
}

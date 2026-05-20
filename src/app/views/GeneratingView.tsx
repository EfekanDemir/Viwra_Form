import React from 'react';
import { motion } from 'motion/react';

export function GeneratingView() {
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
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="w-40 h-40 rounded-full bg-current opacity-10 blur-3xl"
      />
      <p className="text-sm font-light tracking-wide opacity-60 text-center px-8 max-w-xs leading-relaxed">
        Senin için, şu anki hislerine göre üretiliyor...
      </p>
    </motion.div>
  );
}

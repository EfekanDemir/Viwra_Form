import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Check } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { saveSession } from '../services/viwraApi';
import { getUserFriendlyErrorMessage } from '../errorUtils';
import type { SessionSummary } from '../ViwraApp';

interface SummaryViewProps {
  user: User | null;
  summary: SessionSummary | null;
}

export function SummaryView({ user, summary }: SummaryViewProps) {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user || !summary || isSaved || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      await saveSession(user.id, summary.mood, summary.aiResponse, summary.theme, summary.takeaways);
      setIsSaved(true);
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  // Otomatik kaydet — görünüm açılır açılmaz seans kaydedilir
  useEffect(() => {
    handleSave();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!summary) {
    return (
      <div className="flex h-full items-center justify-center flex-col space-y-4">
        <p className="opacity-50 tracking-wide font-light">Özet bulunamadı.</p>
        <button onClick={() => navigate('/home')} className="text-xs opacity-60 hover:opacity-100 transition-opacity">Geri Dön</button>
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
      <div className="max-w-xl w-full space-y-10 bg-black/5 dark:bg-white/5 border border-white/5 rounded-[40px] p-8 sm:p-12 backdrop-blur-xl relative">
        <div className="space-y-4 text-center">
          <Sparkles className="w-8 h-8 opacity-40 mx-auto mb-6" strokeWidth={1.5} />
          <h2 className="text-2xl font-medium tracking-wider">İçsel Yankıların</h2>
          <p className="text-sm font-light tracking-wide opacity-60 leading-relaxed">Bu anın bir hediyesi olarak, cebine koyabileceğin birkaç küçük hatırlatma.</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500/90 text-sm p-4 rounded-2xl text-center">{error}</div>}

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
            id="viwra-summary-save"
            onClick={handleSave}
            disabled={isSaved || isSaving}
            className={`w-full py-4 rounded-full transition-all duration-700 text-sm font-medium tracking-wide ${isSaved ? 'bg-white/20 text-white border border-white/20' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}
          >
            {isSaving ? 'Kaydediliyor...' : isSaved ? (
              <span className="flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Zamanın İzlerine Kaydedildi</span>
            ) : 'Geçmişe Kaydet'}
          </button>
          <button onClick={() => navigate('/home')} className="text-xs tracking-widest uppercase opacity-40 hover:opacity-100 transition-opacity text-center w-full py-2">
            Ana Yolculuğa Dön
          </button>
        </div>
      </div>
    </motion.div>
  );
}

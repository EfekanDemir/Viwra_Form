import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { getRecentSessions, getJournalEntries } from '../services/viwraApi';
import { getUserFriendlyErrorMessage } from '../errorUtils';

interface SettingsViewProps { user: User | null; }

export function SettingsView({ user }: SettingsViewProps) {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExportData = async () => {
    if (!user) return;
    setIsExporting(true); setError(null);
    try {
      const [dbSessions, journalEntries] = await Promise.all([
        getRecentSessions(user.id, 500),
        getJournalEntries(user.id),
      ]);
      const exportData = { sessions: dbSessions, journalEntries, exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="flex flex-col h-full items-center p-6 pt-32 overflow-y-auto">
      <div className="max-w-xl w-full space-y-12 pb-32">
        <div className="text-center space-y-4">
          <Settings className="w-8 h-8 opacity-40 mx-auto mb-6" strokeWidth={1.5} />
          <h2 className="text-2xl font-medium tracking-wider">Veri ve Ayarlar</h2>
          <p className="text-sm font-light tracking-wide opacity-60 leading-relaxed">Burada daha önce kaydettiğin tüm zamanın izlerini ve günlüklerini indirebilirsin.</p>
        </div>
        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500/90 text-sm p-4 rounded-2xl w-full text-center">{error}</div>}
        <div className="space-y-6">
          <h3 className="text-xs font-medium tracking-widest uppercase opacity-40">Veri Yönetimi</h3>
          <button onClick={handleExportData} disabled={isExporting || !user} className="w-full text-left p-6 rounded-3xl bg-white/5 hover:bg-white/10 transition-colors duration-700 border border-transparent disabled:opacity-50">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium opacity-90">Kayıtlarımı İndir</h4>
                <p className="text-xs font-light opacity-50 mt-2">Uygulamada bıraktığın izleri bir JSON dosyası olarak cihazına kaydet.</p>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10">
                {isExporting ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
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

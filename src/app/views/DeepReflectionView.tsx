import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Brain, Search, Tag } from 'lucide-react';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type { User } from '@supabase/supabase-js';
import { saveJournalEntry, getJournalEntries, deleteJournalEntry, getRecentSessions, type JournalEntry } from '../services/viwraApi';
import { getUserFriendlyErrorMessage } from '../errorUtils';
import type { ThemeState, SessionSummary } from '../ViwraApp';
import { RateLimitModal, isRateLimitError } from '../components/RateLimitModal';

interface DeepReflectionViewProps {
  user: User | null;
  onComplete: (summary: SessionSummary) => void;
}

const availableTags = ['Huzurlu', 'Kaygılı', 'Düşünceli', 'Yorgun', 'Umutlu', 'Hüzünlü', 'Tükenmiş', 'Sakin'];

export function DeepReflectionView({ user, onComplete }: DeepReflectionViewProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [reflection, setReflection] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRateLimit, setShowRateLimit] = useState(false);

  useEffect(() => {
    if (activeTab === 'history' && user) {
      setIsLoadingHistory(true);
      setError(null);
      getJournalEntries(user.id).then(entries => {
        setJournalEntries(entries);
      }).catch(err => setError(getUserFriendlyErrorMessage(err))).finally(() => setIsLoadingHistory(false));
    }
  }, [activeTab, user]);

  const toggleTag = (tag: string) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleSaveEntry = async () => {
    if (!reflection.trim() || !user) return;
    setError(null);
    try {
      await saveJournalEntry(user.id, reflection, selectedTags);
      setReflection(''); setSelectedTags([]);
      setActiveTab('history');
    } catch (err) { setError(getUserFriendlyErrorMessage(err)); }
  };

  const handleReflect = async () => {
    if (!reflection.trim()) return;
    setIsThinking(true); setError(null);
    if (user) {
      try { await saveJournalEntry(user.id, reflection, selectedTags); } catch {}
    }
    try {
      let recentContext = '';
      if (user) {
        const recentSessions = await getRecentSessions(user.id, 3);
        if (recentSessions.length > 0) {
          recentContext = `\nKullanıcının geçmişteki son ruh halleri:\n${recentSessions.map(s => `- Ruh hali: ${s.mood}, Tema: ${s.theme || 'belirtilmemiş'}`).join('\n')}\n`;
        }
      }
      const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Kullanıcı derin bir düşünce/günlük girişi yazdı: "${reflection}". ${recentContext}\nBu düşüncenin altındaki temel duyguyu veya ihtiyacı analiz et. Maksimum 3-4 cümlelik, derin, topraklayıcı bir yanıt ver. Türkçe yaz.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              theme: { type: Type.STRING },
              text: { type: Type.STRING },
              takeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['theme', 'text', 'takeaways'],
          },
        },
      });

      let generatedText = 'Şu an zihninin çok dolu olduğunu hissediyorum. Sadece nefes al, buradayım.';
      let generatedTheme: ThemeState = 'default';
      let generatedTakeaways: string[] = [];

      if (response.text) {
        try {
          const parsed = JSON.parse(response.text);
          generatedText = parsed.text || generatedText;
          generatedTakeaways = parsed.takeaways || [];
          if (['default', 'anxiety', 'sadness', 'sleep', 'burnout'].includes(parsed.theme)) {
            generatedTheme = parsed.theme as ThemeState;
          }
        } catch { generatedText = response.text.trim(); }
      }

      onComplete({
        mood: `İçsel Keşif: ${reflection.substring(0, 50)}${reflection.length > 50 ? '...' : ''}`,
        aiResponse: generatedText,
        theme: generatedTheme,
        takeaways: generatedTakeaways,
      });
      navigate('/summary');
    } catch (err) {
      if (isRateLimitError(err)) {
        setShowRateLimit(true);
      } else {
        onComplete({ mood: `İçsel Keşif: ${reflection.substring(0, 50)}...`, aiResponse: 'Şu an zihninin çok dolu olduğunu hissediyorum. Sadece nefes al, buradayım.', theme: 'default', takeaways: [] });
        navigate('/summary');
      }
    } finally {
      setIsThinking(false);
    }
  };

  const filteredEntries = journalEntries.filter(entry => {
    const q = searchQuery.toLowerCase();
    const dateStr = entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('tr-TR') : '';
    return entry.text.toLowerCase().includes(q) || entry.tags.some(t => t.toLowerCase().includes(q)) || dateStr.includes(q);
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="flex flex-col h-full pt-16 p-6 pb-32 overflow-y-auto">
      <RateLimitModal
        isOpen={showRateLimit}
        onClose={() => setShowRateLimit(false)}
        onRetry={() => { setShowRateLimit(false); handleReflect(); }}
      />
      <div className="flex-1 flex flex-col max-w-xl mx-auto w-full mt-4 space-y-8">
        <div className="text-center space-y-4">
          <Brain className="w-8 h-8 opacity-40 mx-auto mb-2" strokeWidth={1.5} />
          <h1 className="text-2xl font-medium tracking-wider">İçsel Keşif ve Günlük</h1>
          <p className="text-sm font-light tracking-wide opacity-60 leading-relaxed">Zihnini kağıda dök. Yargı yok, acele yok.</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500/90 text-sm p-4 rounded-2xl text-center">{error}</div>}

        <div className="flex p-1 bg-white/5 rounded-full mx-auto w-full max-w-sm mb-4">
          {(['create', 'history'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-xs font-medium tracking-widest uppercase rounded-full transition-all duration-500 ${activeTab === tab ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'}`}>
              {tab === 'create' ? 'Yaz' : 'Geçmiş'}
            </button>
          ))}
        </div>

        {activeTab === 'create' && (
          <div className="w-full space-y-6">
            {!isThinking ? (
              <>
                <textarea
                  id="viwra-reflection-input"
                  placeholder="Şu an içinden ne geçiyor? Filtrelemeden yaz..."
                  className="w-full h-48 bg-white/5 border border-white/10 rounded-[32px] p-6 text-sm font-light tracking-wide focus:outline-none focus:border-white/30 transition-colors duration-700 resize-none placeholder:opacity-30"
                  value={reflection}
                  onChange={e => setReflection(e.target.value)}
                />
                <div className="space-y-3">
                  <h3 className="text-xs font-medium tracking-widest uppercase opacity-40 pl-2">Hissettiklerin (İsteğe Bağlı)</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => (
                      <button key={tag} onClick={() => toggleTag(tag)} className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 border ${selectedTags.includes(tag) ? 'bg-white/20 border-white/30 text-white' : 'bg-transparent border-white/10 text-white/50 hover:bg-white/5'}`}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button onClick={handleSaveEntry} className="flex-1 py-4 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-xs font-medium tracking-widest uppercase">Sadece Kaydet</button>
                  <button onClick={handleReflect} className="flex-[2] py-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-xs font-medium tracking-widest uppercase">Kaydet ve İçgörü Al</button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-8 py-12">
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 3, repeat: Infinity }} className="w-24 h-24 rounded-full bg-white/10 blur-xl" />
                <p className="text-sm font-light tracking-wide opacity-50">Zihninin derinliklerine iniliyor...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="w-full space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
              <input type="text" placeholder="Geçmiş notlarda ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-6 text-sm font-light tracking-wide focus:outline-none focus:border-white/30 transition-colors duration-500 placeholder:opacity-30" />
            </div>
            <div className="space-y-4">
              {isLoadingHistory ? (
                <div className="text-center py-12 opacity-50 text-sm">Yükleniyor...</div>
              ) : filteredEntries.length === 0 ? (
                <div className="text-center py-12 opacity-50 text-sm font-light">Kayıt bulunamadı.</div>
              ) : filteredEntries.map(entry => {
                const dateObj = new Date(entry.createdAt);
                return (
                  <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-[28px] p-6 space-y-4">
                    <div className="flex justify-between items-center opacity-40 text-xs font-mono tracking-widest">
                      <span>{dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      <span>{dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-sm leading-relaxed font-light opacity-90 whitespace-pre-wrap">{entry.text}</p>
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {entry.tags.map(tag => (
                          <span key={tag} className="flex items-center space-x-1 px-3 py-1 bg-white/10 rounded-full text-[10px] font-medium tracking-wider uppercase opacity-70">
                            <Tag className="w-3 h-3" /><span>{tag}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

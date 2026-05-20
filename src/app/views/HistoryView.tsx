import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { History, ArrowLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { User } from '@supabase/supabase-js';
import { getRecentSessions, type SessionData } from '../services/viwraApi';
import { getUserFriendlyErrorMessage } from '../errorUtils';

interface HistoryViewProps { user: User | null; }

const getThemeName = (theme?: string) => {
  switch (theme) {
    case 'anxiety': return 'Kaygı';
    case 'sadness': return 'Hüzün';
    case 'sleep': return 'Uyku';
    case 'burnout': return 'Tükenmişlik';
    default: return 'Denge';
  }
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(date);
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#1C1C1E] border border-white/10 p-3 rounded-xl shadow-xl">
        <p className="text-xs opacity-60 mb-1">{data.fullDate}</p>
        <p className="text-sm font-medium">{data.theme}</p>
      </div>
    );
  }
  return null;
};

export function HistoryView({ user }: HistoryViewProps) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetch = async () => {
      if (!user) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await getRecentSessions(user.id, 50);
        if (isMounted) setSessions(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (err) {
        if (isMounted) setError(getUserFriendlyErrorMessage(err));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetch();
    return () => { isMounted = false; };
  }, [user]);

  const chartData = [...sessions].reverse().map((s) => {
    const date = new Date(s.createdAt);
    const themeName = getThemeName(s.theme);
    const yMap: Record<string, number> = { 'Denge': 4, 'Uyku': 3, 'Tükenmişlik': 2, 'Hüzün': 1, 'Kaygı': 0 };
    return {
      y: yMap[themeName] ?? 2,
      theme: themeName,
      label: new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(date),
      fullDate: formatDate(s.createdAt),
    };
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="flex flex-col min-h-full p-6 pb-32 relative">
      <button onClick={() => navigate('/home')} className="absolute top-6 left-6 p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md border border-white/5 z-50">
        <ArrowLeft className="w-5 h-5 opacity-60" />
      </button>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full mt-20 space-y-8">
        <div className="text-center space-y-4 mb-8">
          <History className="w-8 h-8 opacity-40 mx-auto mb-6" strokeWidth={1.5} />
          <h1 className="text-2xl font-medium tracking-wider">Zamanın İzleri</h1>
          <p className="text-sm font-light tracking-wide opacity-60 leading-relaxed">Daha önce yürüdüğümüz yollar ve bulduğumuz yankılar.</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500/90 text-sm p-4 rounded-2xl text-center">{error}</div>}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="w-4 h-4 rounded-full bg-white/40" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 opacity-50 font-light text-sm">Henüz bir iz bırakmadın. Ne zaman istersen, ilk adımı birlikte atabiliriz.</div>
        ) : (
          <div className="space-y-12">
            {chartData.length > 1 && (
              <div className="w-full h-48 bg-white/5 rounded-[32px] border border-white/10 p-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="label" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                    <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tickFormatter={(v) => (['Kaygı', 'Hüzün', 'Tükenmişlik', 'Uyku', 'Denge'][v] || '')} stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                    <Line type="monotone" dataKey="y" stroke="rgba(255,255,255,0.5)" strokeWidth={2} dot={{ fill: '#15151A', stroke: 'rgba(255,255,255,0.8)', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: 'white' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="space-y-6">
              {sessions.map((session) => (
                <motion.div key={session.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-[32px] bg-white/5 border border-white/10 space-y-4">
                  <div className="flex justify-between items-center opacity-60 text-xs tracking-wider">
                    <span>{formatDate(session.createdAt)}</span>
                    <span className="px-3 py-1 rounded-full bg-white/10">{getThemeName(session.theme)}</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium opacity-80">İçinden Geçenler:</h3>
                    <p className="text-sm font-light leading-relaxed opacity-90">"{session.mood}"</p>
                  </div>
                  <div className="space-y-2 pt-4 border-t border-white/5">
                    <h3 className="text-sm font-medium opacity-80">Benim Yankım:</h3>
                    <p className="text-sm font-light leading-relaxed opacity-70">{session.aiResponse}</p>
                  </div>
                  {session.takeaways && session.takeaways.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-white/5">
                      <h3 className="text-sm font-medium opacity-80">Anahtar Çıkarımlar:</h3>
                      <ul className="space-y-2 pt-1">
                        {session.takeaways.map((t, i) => (
                          <li key={i} className="text-sm font-light leading-relaxed opacity-70 flex items-start space-x-2">
                            <span className="opacity-50">•</span><span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

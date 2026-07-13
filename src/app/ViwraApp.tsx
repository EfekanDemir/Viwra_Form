/**
 * ViwraApp — Main Router
 *
 * Modular entry point for the Viwra mental health app.
 * All views are lazy-loaded from src/app/views/.
 * Auth is handled by Supabase (replaces Firebase Auth).
 * Data is handled by src/app/services/viwraApi.ts (replaces Firebase Firestore).
 */

import React, { useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Brain, Sparkles, History, Network, Settings } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { RequireBeta } from '../components/RequireBeta';

// Lazy-loaded views for code splitting
const HomeView = lazy(() => import('./views/HomeView').then(m => ({ default: m.HomeView })));
const GeneratingView = lazy(() => import('./views/GeneratingView').then(m => ({ default: m.GeneratingView })));
const PlayerView = lazy(() => import('./views/PlayerView').then(m => ({ default: m.PlayerView })));
const CommunityView = lazy(() => import('./views/CommunityView').then(m => ({ default: m.CommunityView })));
const EmergencyView = lazy(() => import('./views/EmergencyView').then(m => ({ default: m.EmergencyView })));
const DeepReflectionView = lazy(() => import('./views/DeepReflectionView').then(m => ({ default: m.DeepReflectionView })));
const SummaryView = lazy(() => import('./views/SummaryView').then(m => ({ default: m.SummaryView })));
const FeedbackView = lazy(() => import('./views/FeedbackView').then(m => ({ default: m.FeedbackView })));
const ProfileView = lazy(() => import('./views/ProfileView').then(m => ({ default: m.ProfileView })));
const HistoryView = lazy(() => import('./views/HistoryView').then(m => ({ default: m.HistoryView })));
const SettingsView = lazy(() => import('./views/SettingsView').then(m => ({ default: m.SettingsView })));
const MindmapView = lazy(() => import('./views/MindmapView').then(m => ({ default: m.MindmapView })));

// Shared types passed through router state
export type ThemeState = 'default' | 'anxiety' | 'sadness' | 'sleep' | 'burnout';

export interface SessionSummary {
  mood: string;
  aiResponse: string;
  theme: ThemeState;
  takeaways: string[];
}

const themeClasses: Record<ThemeState, string> = {
  default: 'bg-[#0a062b] text-[#f4f2e2]',
  anxiety: 'bg-[#1A362D] text-[#F5F5F0]',
  sadness: 'bg-[#E6E6FA] text-[#4A4A6A]',
  sleep: 'bg-[#0A1128] text-[#F8F9FA]',
  burnout: 'bg-[#8B7E74] text-[#F5F5F0]',
};

const SoftBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-black/30 blur-[120px]" />
    <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-black/40 blur-[120px]" />
    <div className="absolute inset-0 bg-black/10 backdrop-blur-3xl" />
  </div>
);

const ViewLoader = () => (
  <div className="fixed inset-0 bg-[#0a062b] flex items-center justify-center">
    <motion.div
      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="w-8 h-8 rounded-full bg-white/20"
    />
  </div>
);

function BottomNav({ currentPath }: { currentPath: string }) {
  const navigate = useNavigate();
  const navItems = [
    { path: '/home', icon: Home, label: 'Ana Sayfa' },
    { path: '/deep-reflection', icon: Brain, label: 'İçsel Keşif' },
    { path: '/community', icon: Sparkles, label: 'Ortak Hisler' },
    { path: '/history', icon: History, label: 'Geçmiş' },
    { path: '/mindmap', icon: Network, label: 'Zihin Haritası' },
    { path: '/settings', icon: Settings, label: 'Ayarlar' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-0 left-0 right-0 p-6 flex justify-center z-50 pointer-events-none"
    >
      <div className="flex space-x-8 px-8 py-4 rounded-full backdrop-blur-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] pointer-events-auto">
        {navItems.map(({ path, icon: Icon, label }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`transition-opacity duration-700 ${currentPath === path ? 'opacity-100' : 'opacity-40'}`}
            aria-label={label}
          >
            <Icon className="w-5 h-5" strokeWidth={1.5} />
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// Routes where bottom nav should appear
const NAV_ROUTES = ['/home', '/community', '/deep-reflection', '/history', '/settings', '/profile', '/mindmap'];

export default function ViwraApp() {
  const { user, isAuthReady } = useAuth();
  const [theme, setTheme] = useState<ThemeState>('default');
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [playerState, setPlayerState] = useState({
    aiMessage: 'Derin bir nefes al. Yalnız değilsin, buradayım.',
    audioQueue: [] as string[],
    isGeneratingComplete: true,
  });

  const currentPath = window.location.pathname;

  const isCommunityRoute = currentPath === '/community';
  const isEmergencyRoute = currentPath === '/emergency';
  const isDeepReflectionRoute = currentPath === '/deep-reflection';

  const currentThemeClass =
    isCommunityRoute ? 'bg-[#0A0B10] text-[#E0E0E0]' :
    isEmergencyRoute ? 'bg-[#1A1515] text-[#E8D8D8]' :
    isDeepReflectionRoute ? 'bg-[#2A2B38] text-[#E0E0E0]' :
    ['/feedback', '/history', '/summary', '/settings', '/profile', '/mindmap'].some(p => currentPath.startsWith(p)) ? 'bg-[#15151A] text-[#E0E0E0]' :
    themeClasses[theme];

  if (!isAuthReady) return <ViewLoader />;

  const showBottomNav = user && NAV_ROUTES.some(r => currentPath === r);

  return (
    <div className={`fixed inset-0 transition-colors duration-[3000ms] ease-in-out ${currentThemeClass} font-sans tracking-wider leading-relaxed overflow-hidden flex flex-col`}>
      <SoftBackground />

      <main className="flex-1 relative z-10 overflow-y-auto hide-scrollbar">
        <Suspense fallback={<ViewLoader />}>
          <AnimatePresence mode="wait">
            <Routes>
              {/* Protected routes — require Supabase session */}
              <Route
                path="home"
                element={
                  <RequireBeta>
                    <HomeView
                      user={user}
                      onThemeChange={setTheme}
                      onSessionSummary={setSessionSummary}
                      setPlayerState={setPlayerState}
                    />
                  </RequireBeta>
                }
              />
              <Route
                path="generating"
                element={<RequireBeta><GeneratingView /></RequireBeta>}
              />
              <Route
                path="player"
                element={
                  <RequireBeta>
                    <PlayerView
                      theme={theme}
                      aiMessage={playerState.aiMessage}
                      audioQueue={playerState.audioQueue}
                      setAudioQueue={(q) => setPlayerState(s => ({ ...s, audioQueue: typeof q === 'function' ? q(s.audioQueue) : q }))}
                      isGeneratingComplete={playerState.isGeneratingComplete}
                      onSummaryReady={setSessionSummary}
                    />
                  </RequireBeta>
                }
              />
              <Route
                path="summary"
                element={<RequireBeta><SummaryView user={user} summary={sessionSummary} /></RequireBeta>}
              />
              <Route
                path="community"
                element={<RequireBeta><CommunityView user={user} /></RequireBeta>}
              />
              <Route
                path="emergency"
                element={<RequireBeta><EmergencyView /></RequireBeta>}
              />
              <Route
                path="deep-reflection"
                element={<RequireBeta><DeepReflectionView user={user} onComplete={setSessionSummary} /></RequireBeta>}
              />
              <Route
                path="feedback"
                element={<RequireBeta><FeedbackView user={user} /></RequireBeta>}
              />
              <Route
                path="profile"
                element={<RequireBeta><ProfileView user={user} /></RequireBeta>}
              />
              <Route
                path="history"
                element={<RequireBeta><HistoryView user={user} /></RequireBeta>}
              />
              <Route
                path="settings"
                element={<RequireBeta><SettingsView user={user} /></RequireBeta>}
              />
              <Route
                path="mindmap"
                element={<RequireBeta><MindmapView user={user} /></RequireBeta>}
              />

              {/* Default catch-all: auth callback hash → /home, unknown routes → /404 */}
              <Route
                path="*"
                element={
                  window.location.hash || window.location.search
                    ? <Navigate to={`/home${window.location.search}${window.location.hash}`} replace />
                    : <Navigate to="/404" replace />
                }
              />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>

      <AnimatePresence>
        {showBottomNav && <BottomNav currentPath={currentPath} />}
      </AnimatePresence>
    </div>
  );
}

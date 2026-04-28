import React, { useState, useEffect, useCallback } from 'react';
import { Scene1 } from './components/Scene1';
import { Scene2 } from './components/Scene2';
import { ReportInfographic } from './components/ReportInfographic';

const getPath = () => window.location.pathname.replace(/\/$/, '') || '/';

export default function App() {
  const [currentPath, setCurrentPath] = useState(getPath);

  // Single source of truth for navigation
  const navigate = useCallback((href: string) => {
    window.history.pushState({}, '', href);
    setCurrentPath(getPath());
  }, []);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => setCurrentPath(getPath());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Intercept same-origin <a> tag clicks (e.g. referral links)
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (
        anchor &&
        anchor.href &&
        anchor.href.startsWith(window.location.origin) &&
        !anchor.target // don't intercept _blank links
      ) {
        e.preventDefault();
        const url = new URL(anchor.href);
        navigate(url.pathname + url.search + url.hash);
      }
    };
    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, [navigate]);

  // Expose navigate globally so child components can use it without prop drilling
  useEffect(() => {
    (window as any).__viNavigate = navigate;
  }, [navigate]);

  return (
    <div className="w-full h-screen bg-viwra-navy text-viwra-bone selection:bg-viwra-bone/20 relative overflow-hidden">
      <div className="noise-overlay pointer-events-none absolute inset-0 z-0 opacity-40"></div>
      <div className="relative z-10 w-full h-full">
        {currentPath === '/rapor' ? <ReportInfographic /> : currentPath === '/form' ? <Scene2 /> : <Scene1 />}
      </div>
    </div>
  );
}


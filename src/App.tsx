import React, { useState, useEffect } from 'react';
import { Scene1 } from './components/Scene1';
import { Scene2 } from './components/Scene2';
import { ReportInfographic } from './components/ReportInfographic';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname.replace(/\/$/, "") || "/");

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname.replace(/\/$/, "") || "/");
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      // Intercept local links manually
      if (anchor && anchor.href && anchor.href.startsWith(window.location.origin)) {
        e.preventDefault();
        const url = new URL(anchor.href);
        const path = url.pathname.replace(/\/$/, "") || "/";
        const fullUrl = path + url.search + url.hash;
        window.history.pushState({}, '', fullUrl);
        setCurrentPath(path);
      }
    };
    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, []);

  return (
    <div className="w-full h-screen bg-viwra-navy text-viwra-bone selection:bg-viwra-bone/20 relative overflow-hidden">
      <div className="noise-overlay pointer-events-none absolute inset-0 z-0 opacity-40"></div>
      <div className="relative z-10 w-full h-full">
        {currentPath === '/rapor' ? <ReportInfographic /> : currentPath === '/form' ? <Scene2 /> : <Scene1 />}
      </div>
    </div>
  );
}


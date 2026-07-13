import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { BetaAccess } from './components/BetaAccess';
import { LandingPage } from './components/LandingPage';
import ViwraApp from './app/ViwraApp';

function LegacyRedirect() {
  const location = useLocation();
  const newPath = location.pathname.replace(/^\/app/, '');
  // Redirect to the same path without /app but PRESERVING search parameters and hash (very important for Supabase auth callback tokens!)
  return <Navigate to={`${newPath || '/'}${location.search}${location.hash}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="w-full h-screen bg-viwra-navy text-viwra-bone selection:bg-viwra-bone/20 relative overflow-hidden">
        <div className="noise-overlay pointer-events-none absolute inset-0 z-0 opacity-40" />
        <div className="relative z-10 w-full h-full">
          <Routes>
            {/* Legacy /app/* redirects to /* while preserving auth hashes */}
            <Route path="/app/*" element={<LegacyRedirect />} />

            {/* Beta Gatekeeper — email verification before entering app */}
            <Route path="/login" element={<BetaAccess />} />

            {/* Landing Page — viwra.com root */}
            <Route path="/" element={<LandingPage />} />

            {/* Viwra App — all subroutes handled inside ViwraApp */}
            <Route path="/*" element={<ViwraApp />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

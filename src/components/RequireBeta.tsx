/**
 * RequireBeta — Route Guard
 *
 * Checks for a valid Supabase session.
 * Magic link auth replaces the old sessionStorage token system.
 * If the user doesn't have an active session, redirects to /app (BetaAccess).
 */

import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../app/supabase';
import type { Session } from '@supabase/supabase-js';

interface RequireBetaProps {
  children: React.ReactNode;
}

export function RequireBeta({ children }: RequireBetaProps) {
  const location = useLocation();
  const [session, setSession] = useState<Session | null | 'loading'>('loading');
  const [timedOut, setTimedOut] = useState(false);

  // Check if URL has active auth parameters (magic link tokens)
  const hasAuthParams =
    window.location.hash.includes('access_token=') ||
    window.location.search.includes('code=');

  useEffect(() => {
    // Get initial session (handles magic link callback automatically)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for session changes (e.g., user clicks magic link while tab is open)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // If there are auth parameters in the URL, wait up to 4 seconds for Supabase to process them
  useEffect(() => {
    if (hasAuthParams && (session === null || session === 'loading')) {
      const timer = setTimeout(() => {
        setTimedOut(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [hasAuthParams, session]);

  // Still loading session (or waiting for Supabase to process auth hash/code)
  if (session === 'loading' || (hasAuthParams && !session && !timedOut)) {
    return (
      <div className="fixed inset-0 bg-[#0a062b] flex items-center justify-center">
        <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
      </div>
    );
  }

  // No session and no auth parameters in progress (or auth timed out/failed) → redirect to beta gate
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

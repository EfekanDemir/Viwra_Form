import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import type { User } from '@supabase/supabase-js';

/**
 * Hook that tracks Supabase auth state.
 * Replaces Firebase onAuthStateChanged.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // Get the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthReady(true);
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, isAuthReady };
}

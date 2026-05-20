/**
 * Viwra API Service
 * 
 * Replaces Firebase Firestore with Supabase.
 * All data types mirror the original Firebase structure for zero UI changes.
 */

import { supabase } from '../supabase';
import type { User } from '@supabase/supabase-js';

export type { User };

// ─── Auth ────────────────────────────────────────────────────────────────────

/**
 * Sends a magic link to the given email.
 * Only call this AFTER verifying the email is in the waitlist.
 */
export const sendMagicLink = async (email: string) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Redirect to /home after clicking the link
      emailRedirectTo: `${window.location.origin}/home`,
      shouldCreateUser: true,
    },
  });
  if (error) throw error;
};

export const logOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => subscription.unsubscribe();
};


// ─── Types ───────────────────────────────────────────────────────────────────

export interface SessionData {
  id: string;
  userId: string;
  mood: string;
  aiResponse: string;
  theme?: string;
  takeaways?: string[];
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  text: string;
  tags: string[];
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  text: string;
  room: string;
  supportCount: number;
  supportedBy: string[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userPhotoUrl?: string | null;
  text: string;
  createdAt: string;
}

export interface UserProfile {
  userId: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  updatedAt: string;
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export const saveSession = async (
  userId: string,
  mood: string,
  aiResponse: string,
  theme: string = 'default',
  takeaways?: string[]
) => {
  const { error } = await supabase.from('viwra_sessions').insert({
    user_id: userId,
    mood,
    ai_response: aiResponse,
    theme,
    takeaways: takeaways ?? [],
  });
  if (error) throw error;
};

export const getRecentSessions = async (userId: string, limitCount: number = 5): Promise<SessionData[]> => {
  const { data, error } = await supabase
    .from('viwra_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limitCount);

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    mood: row.mood,
    aiResponse: row.ai_response,
    theme: row.theme,
    takeaways: row.takeaways ?? [],
    createdAt: row.created_at,
  })).reverse(); // Chronological order like original
};

// ─── Journal ─────────────────────────────────────────────────────────────────

export const saveJournalEntry = async (userId: string, text: string, tags: string[]) => {
  const { error } = await supabase.from('viwra_journal_entries').insert({
    user_id: userId,
    text,
    tags,
  });
  if (error) throw error;
};

export const getJournalEntries = async (userId: string): Promise<JournalEntry[]> => {
  const { data, error } = await supabase
    .from('viwra_journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    text: row.text,
    tags: row.tags ?? [],
    createdAt: row.created_at,
  }));
};

export const deleteJournalEntry = async (entryId: string) => {
  const { error } = await supabase
    .from('viwra_journal_entries')
    .delete()
    .eq('id', entryId);
  if (error) throw error;
};

// ─── Feedback ────────────────────────────────────────────────────────────────

export const saveFeedback = async (
  userId: string,
  name: string,
  email: string,
  message: string,
  rating: number
) => {
  const { error } = await supabase.from('viwra_feedback').insert({
    user_id: userId,
    name,
    email,
    message,
    rating,
  });
  if (error) throw error;
};

// ─── Community Posts ──────────────────────────────────────────────────────────

export const getCommunityPosts = async (limitCount: number = 50, roomName?: string): Promise<CommunityPost[]> => {
  let query = supabase
    .from('viwra_community_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limitCount);

  if (roomName) {
    query = query.eq('room', roomName);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    authorId: row.author_id,
    text: row.text,
    room: row.room,
    supportCount: row.support_count,
    supportedBy: row.supported_by ?? [],
    createdAt: row.created_at,
  }));
};

export const createCommunityPost = async (authorId: string, text: string, room: string = 'genel') => {
  const { error } = await supabase.from('viwra_community_posts').insert({
    author_id: authorId,
    text,
    room,
  });
  if (error) throw error;
};

export const supportCommunityPost = async (postId: string, userId: string) => {
  const { error } = await supabase.rpc('support_community_post', {
    post_id: postId,
    supporter_id: userId,
  });
  if (error) throw error;
};

export const editCommunityPost = async (postId: string, text: string) => {
  const { error } = await supabase
    .from('viwra_community_posts')
    .update({ text })
    .eq('id', postId);
  if (error) throw error;
};

export const deleteCommunityPost = async (postId: string) => {
  const { error } = await supabase
    .from('viwra_community_posts')
    .delete()
    .eq('id', postId);
  if (error) throw error;
};

// ─── Chat Messages (Realtime) ─────────────────────────────────────────────────

export const sendChatMessage = async (
  userId: string,
  userName: string,
  userPhotoUrl: string | null = null,
  roomId: string,
  text: string
) => {
  const { error } = await supabase.from('viwra_chat_messages').insert({
    user_id: userId,
    user_name: userName,
    user_photo_url: userPhotoUrl,
    room_id: roomId,
    text,
  });
  if (error) throw error;
};

export const getInitialChatMessages = async (roomId: string, limitCount: number = 50): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('viwra_chat_messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(limitCount);

  if (error) throw error;
  return (data ?? []).map(rowToChatMessage).reverse();
};

const rowToChatMessage = (row: any): ChatMessage => ({
  id: row.id,
  roomId: row.room_id,
  userId: row.user_id,
  userName: row.user_name,
  userPhotoUrl: row.user_photo_url,
  text: row.text,
  createdAt: row.created_at,
});

/**
 * Subscribes to real-time chat messages for a room.
 * Replaces Firebase onSnapshot.
 * Returns an unsubscribe function.
 */
export const subscribeToChatMessages = (
  roomId: string,
  limitCount: number = 50,
  callback: (messages: ChatMessage[]) => void
) => {
  // Fetch initial messages
  getInitialChatMessages(roomId, limitCount).then(callback).catch(console.error);

  // Subscribe to new messages
  const channel = supabase
    .channel(`chat:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'viwra_chat_messages',
        filter: `room_id=eq.${roomId}`,
      },
      async () => {
        // Refetch on new message to maintain correct order & limit
        const messages = await getInitialChatMessages(roomId, limitCount);
        callback(messages);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// ─── User Profiles ────────────────────────────────────────────────────────────

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('viwra_user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  if (!data) return null;

  return {
    userId: data.user_id,
    displayName: data.display_name,
    bio: data.bio,
    avatarUrl: data.avatar_url,
    updatedAt: data.updated_at,
  };
};

export const saveUserProfile = async (userId: string, profileData: Partial<UserProfile>) => {
  const { error } = await supabase.from('viwra_user_profiles').upsert({
    user_id: userId,
    display_name: profileData.displayName,
    bio: profileData.bio,
    avatar_url: profileData.avatarUrl,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  if (error) throw error;
};

// ─── Waitlist Beta Check ──────────────────────────────────────────────────────

export const checkWaitlistEmail = async (email: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc('check_waitlist_email', { p_email: email });
  if (error) throw error;
  return data as boolean;
};

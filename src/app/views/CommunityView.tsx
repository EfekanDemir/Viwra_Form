import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, Edit3, Trash2, Filter } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { getCommunityPosts, createCommunityPost, supportCommunityPost, editCommunityPost, deleteCommunityPost, subscribeToChatMessages, sendChatMessage, type CommunityPost, type ChatMessage } from '../services/viwraApi';
import { getUserFriendlyErrorMessage } from '../errorUtils';

interface CommunityViewProps { user: User | null; }

const ROOMS = [
  { id: 'genel', label: 'Genel', emoji: '🌿' },
  { id: 'kaygı', label: 'Kaygı', emoji: '🌊' },
  { id: 'hüzün', label: 'Hüzün', emoji: '🌧️' },
  { id: 'yorgunluk', label: 'Yorgunluk', emoji: '🌑' },
  { id: 'bağlantı', label: 'Bağlantı', emoji: '✨' },
];

const formatDate = (timestamp: any) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  if (diffMinutes < 1) return 'Az önce';
  if (diffMinutes < 60) return `${diffMinutes}dk önce`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}s önce`;
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(date);
};

export function CommunityView({ user }: CommunityViewProps) {
  const [activeView, setActiveView] = useState<'posts' | 'chat'>('posts');
  const [selectedRoom, setSelectedRoom] = useState(ROOMS[0]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newPostText, setNewPostText] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [filterRoom, setFilterRoom] = useState<string>('tümü');
  const [editingPost, setEditingPost] = useState<{ id: string; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load posts
  const loadPosts = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const room = filterRoom === 'tümü' ? undefined : filterRoom;
      const data = await getCommunityPosts(50, room);
      setPosts(data);
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [filterRoom]);

  useEffect(() => { if (activeView === 'posts') loadPosts(); }, [activeView, loadPosts]);

  // Realtime chat subscription
  useEffect(() => {
    if (activeView !== 'chat') return;
    const unsubscribe = subscribeToChatMessages(selectedRoom.id, 50, (messages) => {
      setChatMessages(messages);
    });
    return unsubscribe;
  }, [activeView, selectedRoom.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newPostText.trim();
    if (!text || !user) return;
    if (text.length > 500) { setError('Gönderi 500 karakterden uzun olamaz.'); return; }
    setError(null);
    try {
      await createCommunityPost(user.id, text, filterRoom === 'tümü' ? 'genel' : filterRoom);
      setNewPostText('');
      loadPosts();
    } catch (err) { setError(getUserFriendlyErrorMessage(err)); }
  };

  const handleSupportPost = async (postId: string) => {
    if (!user) return;
    try {
      await supportCommunityPost(postId, user.id);
      setPosts(prev => prev.map(p => p.id === postId && !p.supportedBy.includes(user.id)
        ? { ...p, supportCount: p.supportCount + 1, supportedBy: [...p.supportedBy, user.id] } : p
      ));
    } catch (err) { setError(getUserFriendlyErrorMessage(err)); }
  };

  const handleEditPost = async () => {
    if (!editingPost || !editingPost.text.trim()) return;
    try {
      await editCommunityPost(editingPost.id, editingPost.text.trim());
      setEditingPost(null);
      loadPosts();
    } catch (err) { setError(getUserFriendlyErrorMessage(err)); }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteCommunityPost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) { setError(getUserFriendlyErrorMessage(err)); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !user) return;
    const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonim';
    const photoUrl = user.user_metadata?.avatar_url || null;
    setChatInput('');
    try {
      await sendChatMessage(user.id, displayName, photoUrl, selectedRoom.id, text);
    } catch (err) { setError(getUserFriendlyErrorMessage(err)); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="flex flex-col h-full pt-6 pb-32 overflow-hidden">
      {/* Header */}
      <div className="text-center space-y-6 px-6 mb-6">
        <h1 className="text-2xl font-medium tracking-wider">Ortak Hisler</h1>
        <p className="text-sm font-light tracking-wide opacity-60 leading-relaxed">Yalnız değilsin. Başkalarının da paylaştığı duygular burada.</p>
        <div className="flex p-1 bg-white/5 rounded-full mx-auto max-w-xs">
          {(['posts', 'chat'] as const).map(view => (
            <button key={view} onClick={() => setActiveView(view)} className={`flex-1 py-3 text-xs font-medium tracking-widest uppercase rounded-full transition-all duration-500 ${activeView === view ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'}`}>
              {view === 'posts' ? 'Paylaşımlar' : 'Canlı Sohbet'}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="mx-6 bg-red-500/10 border border-red-500/20 text-red-500/90 text-sm p-4 rounded-2xl text-center mb-4">{error}</div>}

      {activeView === 'posts' && (
        <div className="flex-1 flex flex-col overflow-hidden px-6">
          {/* Room filter */}
          <div className="flex space-x-2 pb-4 overflow-x-auto hide-scrollbar">
            <button key="tümü" onClick={() => setFilterRoom('tümü')} className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 border ${filterRoom === 'tümü' ? 'bg-white/20 border-white/30' : 'bg-transparent border-white/10 text-white/50'}`}>
              🌐 Tümü
            </button>
            {ROOMS.map(room => (
              <button key={room.id} onClick={() => setFilterRoom(room.id)} className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 border ${filterRoom === room.id ? 'bg-white/20 border-white/30' : 'bg-transparent border-white/10 text-white/50'}`}>
                {room.emoji} {room.label}
              </button>
            ))}
          </div>

          {/* New post form */}
          <form onSubmit={handleCreatePost} className="mb-4">
            <div className="relative">
              <textarea value={newPostText} onChange={e => setNewPostText(e.target.value)} placeholder="Bir düşünceni paylaş..." rows={2} maxLength={500} className="w-full bg-white/5 border border-white/10 rounded-[24px] p-4 pr-14 text-sm font-light tracking-wide focus:outline-none focus:border-white/30 transition-colors resize-none placeholder:opacity-30" />
              <button type="submit" disabled={!newPostText.trim()} className={`absolute bottom-4 right-4 p-2 rounded-full transition-opacity ${newPostText.trim() ? 'opacity-60 hover:opacity-100' : 'opacity-20 pointer-events-none'}`}>
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Posts */}
          <div className="flex-1 overflow-y-auto space-y-4 hide-scrollbar">
            {isLoading ? (
              <div className="text-center py-8 opacity-50 text-sm">Yükleniyor...</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8 opacity-50 text-sm font-light">Henüz paylaşım yok. İlk sen başla.</div>
            ) : posts.map(post => {
              const isOwner = user?.id === post.authorId;
              const hasSupported = user ? post.supportedBy.includes(user.id) : false;
              return (
                <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-[24px] bg-white/5 border border-white/10 space-y-3">
                  {editingPost?.id === post.id ? (
                    <div className="space-y-3">
                      <textarea value={editingPost.text} onChange={e => setEditingPost({ ...editingPost, text: e.target.value })} rows={3} className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-sm font-light focus:outline-none resize-none" />
                      <div className="flex space-x-3">
                        <button onClick={handleEditPost} className="flex-1 py-2 rounded-full bg-white/20 text-xs font-medium">Kaydet</button>
                        <button onClick={() => setEditingPost(null)} className="flex-1 py-2 rounded-full bg-white/5 text-xs font-medium">İptal</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-light leading-relaxed opacity-90 flex-1">{post.text}</p>
                        {isOwner && (
                          <div className="flex space-x-2 ml-3">
                            <button onClick={() => setEditingPost({ id: post.id, text: post.text })} className="p-1 opacity-40 hover:opacity-100 transition-opacity"><Edit3 className="w-3 h-3" /></button>
                            <button onClick={() => handleDeletePost(post.id)} className="p-1 opacity-40 hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs opacity-40">
                        <span>{formatDate(post.createdAt)}</span>
                        <button onClick={() => handleSupportPost(post.id)} disabled={hasSupported} className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-all duration-300 ${hasSupported ? 'bg-white/20 opacity-80' : 'hover:bg-white/10'}`}>
                          <span>{hasSupported ? '♥' : '♡'}</span>
                          <span>{post.supportCount}</span>
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {activeView === 'chat' && (
        <div className="flex-1 flex flex-col overflow-hidden px-6">
          {/* Room selector */}
          <div className="flex space-x-2 pb-4 overflow-x-auto hide-scrollbar">
            {ROOMS.map(room => (
              <button key={room.id} onClick={() => setSelectedRoom(room)} className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 border ${selectedRoom.id === room.id ? 'bg-white/20 border-white/30' : 'bg-transparent border-white/10 text-white/50'}`}>
                {room.emoji} {room.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 hide-scrollbar pb-4">
            {chatMessages.length === 0 ? (
              <div className="text-center py-12 opacity-50 text-sm font-light">Henüz mesaj yok. İlk mesajı sen gönder.</div>
            ) : chatMessages.map(msg => {
              const isOwn = user?.id === msg.userId;
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] space-y-1 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isOwn && (
                      <div className="flex items-center space-x-2 px-2">
                        {msg.userPhotoUrl && <img src={msg.userPhotoUrl} alt="" className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />}
                        <span className="text-[10px] opacity-50 font-medium">{msg.userName}</span>
                      </div>
                    )}
                    <div className={`px-4 py-3 rounded-2xl text-sm font-light leading-relaxed ${isOwn ? 'bg-white/15 rounded-br-sm' : 'bg-white/5 border border-white/10 rounded-bl-sm'}`}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] opacity-30 px-2">{formatDate(msg.createdAt)}</span>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <form onSubmit={handleSendMessage} className="relative mt-2">
            <input
              id="viwra-chat-input"
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder={`${selectedRoom.emoji} ${selectedRoom.label} odasına yaz...`}
              maxLength={1000}
              className="w-full bg-white/5 border border-white/10 rounded-full px-5 py-4 pr-14 text-sm font-light tracking-wide focus:outline-none focus:border-white/30 transition-colors placeholder:opacity-30"
            />
            <button type="submit" disabled={!chatInput.trim()} className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-opacity ${chatInput.trim() ? 'opacity-60 hover:opacity-100' : 'opacity-20 pointer-events-none'}`}>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </motion.div>
  );
}

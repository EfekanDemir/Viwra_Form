import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, ArrowLeft, Check } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { getUserProfile, saveUserProfile } from '../services/viwraApi';
import { getUserFriendlyErrorMessage } from '../errorUtils';

interface ProfileViewProps { user: User | null; }

export function ProfileView({ user }: ProfileViewProps) {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setIsLoading(false); return; }
    setAvatarUrl(user.user_metadata?.avatar_url || '');
    setDisplayName(user.user_metadata?.full_name || '');
    getUserProfile(user.id).then(p => {
      if (p) {
        if (p.displayName) setDisplayName(p.displayName);
        if (p.bio) setBio(p.bio);
        if (p.avatarUrl) setAvatarUrl(p.avatarUrl);
      }
    }).catch(err => setError(getUserFriendlyErrorMessage(err))).finally(() => setIsLoading(false));
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 200;
        let { width, height } = img;
        if (width > height) { if (width > maxSize) { height *= maxSize / width; width = maxSize; } }
        else { if (height > maxSize) { width *= maxSize / height; height = maxSize; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.drawImage(img, 0, 0, width, height); setAvatarUrl(canvas.toDataURL('image/jpeg', 0.8)); }
      };
      if (event.target?.result) img.src = event.target.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true); setSaveSuccess(false); setError(null);
    try {
      await saveUserProfile(user.id, { displayName: displayName.trim() || null, bio: bio.trim() || null, avatarUrl: avatarUrl.trim() || null });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full p-6 pb-32 relative z-10 overflow-y-auto">
      <button onClick={() => navigate('/home')} className="absolute top-6 left-6 p-4 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-20">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="flex-1 flex flex-col items-center max-w-md mx-auto w-full pt-10 pb-8">
        <div className="text-center space-y-4 mb-6">
          <h1 className="text-2xl font-medium tracking-wider">Benim Köşem</h1>
          <p className="text-sm font-light tracking-wide opacity-60 leading-relaxed">Burada seni yansıtan parçaları şekillendirebilirsin.</p>
        </div>
        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500/90 text-sm p-4 rounded-2xl w-full mb-6 text-center">{error}</div>}
        {isLoading ? (
          <div className="flex justify-center flex-1 items-center">
            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="w-8 h-8 rounded-full bg-white/20 blur-md" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="w-full space-y-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-24 h-24 rounded-full bg-white/5 overflow-hidden border border-white/10 flex items-center justify-center group cursor-pointer">
                {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <UserIcon className="w-8 h-8 opacity-40" />}
                <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center"><div className="text-[10px] font-medium tracking-widest uppercase">Değiştir</div></div>
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-medium tracking-widest uppercase opacity-40 ml-2">Görünür İsim</label>
                <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="İsmin" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-light focus:outline-none focus:bg-white/10 transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium tracking-widest uppercase opacity-40 ml-2">Hakkımda</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Kısa bir biyografi..." rows={3} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-light focus:outline-none focus:bg-white/10 transition-colors resize-none" />
              </div>
            </div>
            <div className="pt-4">
              <button type="submit" disabled={isSaving} className="w-full py-4 rounded-[24px] bg-white text-black font-medium tracking-wide hover:bg-white/90 transition-colors disabled:opacity-50">
                {isSaving ? 'Kaydediliyor...' : saveSuccess ? (
                  <span className="text-green-600 flex items-center justify-center space-x-2"><Check className="w-4 h-4" /><span>Kaydedildi</span></span>
                ) : 'Değişiklikleri Kaydet'}
              </button>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
}

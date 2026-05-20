import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowLeft, Heart, Star } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { saveFeedback } from '../services/viwraApi';
import { getUserFriendlyErrorMessage } from '../errorUtils';

interface FeedbackViewProps { user: User | null; }

export function FeedbackView({ user }: FeedbackViewProps) {
  const navigate = useNavigate();
  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) { setError('Lütfen tüm alanları doldurun.'); return; }
    if (!user) { setError('Geri bildirim göndermek için giriş yapmalısınız.'); return; }
    setIsSubmitting(true); setError('');
    try {
      await saveFeedback(user.id, name.trim(), email.trim(), message.trim(), rating);
      setIsSuccess(true);
      setTimeout(() => navigate('/home'), 3000);
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="flex flex-col min-h-full p-6 pb-32 relative">
      <button onClick={() => navigate('/home')} className="absolute top-6 left-6 p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md border border-white/5 z-50">
        <ArrowLeft className="w-5 h-5 opacity-60" />
      </button>
      <div className="flex-1 flex flex-col items-center justify-center space-y-12 max-w-lg mx-auto w-full mt-12">
        <div className="text-center space-y-4">
          <MessageSquare className="w-8 h-8 opacity-40 mx-auto mb-6" strokeWidth={1.5} />
          <h1 className="text-2xl font-medium tracking-wider">Geri Bildirim ve Öneriler</h1>
          <p className="text-sm font-light tracking-wide opacity-60 leading-relaxed">Düşüncelerin bizim için çok değerli. Viwra'yı nasıl daha iyi bir sığınak yapabiliriz?</p>
        </div>
        <div className="w-full">
          {isSuccess ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-8 rounded-[32px] bg-white/5 border border-white/10 text-center space-y-4">
              <Heart className="w-8 h-8 opacity-60 mx-auto fill-current" strokeWidth={1.5} />
              <p className="text-sm font-medium tracking-wide">Teşekkürler.</p>
              <p className="text-xs font-light opacity-60 leading-relaxed">Sesini duyduk. Bu alanı birlikte güzelleştireceğiz.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {[{ label: 'İsim', value: name, setValue: setName, type: 'text', placeholder: 'Sana nasıl hitap etmeliyim?' }, { label: 'E-posta', value: email, setValue: setEmail, type: 'email', placeholder: 'Sana ulaşabileceğim bir adres...' }].map(({ label, value, setValue, type, placeholder }) => (
                <div key={label} className="space-y-2">
                  <label className="text-xs font-medium tracking-widest uppercase opacity-40 pl-4">{label}</label>
                  <input type={type} value={value} onChange={e => setValue(e.target.value)} disabled={isSubmitting} className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-sm font-light tracking-wide focus:outline-none focus:border-white/30 transition-colors duration-700 disabled:opacity-50" placeholder={placeholder} />
                </div>
              ))}
              <div className="space-y-4 pt-2">
                <label className="text-xs font-medium tracking-widest uppercase opacity-40 pl-4 text-center block">Viwra Deneyiminiz</label>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} type="button" onClick={() => setRating(star)} className="p-3 transition-transform hover:scale-110 focus:outline-none">
                      <Star className={`w-7 h-7 transition-colors duration-500 ${rating >= star ? 'fill-white opacity-90' : 'opacity-20'}`} strokeWidth={1.5} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium tracking-widest uppercase opacity-40 pl-4">Ayrıntılı Geri Bildirim</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} disabled={isSubmitting} className="w-full h-32 bg-white/5 border border-white/10 rounded-[32px] p-6 text-sm font-light tracking-wide focus:outline-none focus:border-white/30 transition-colors duration-700 resize-none disabled:opacity-50" placeholder="Daha iyi bir deneyim için önerilerini buraya yazabilirsin..." />
              </div>
              {error && <p className="text-xs text-red-500/80 text-center">{error}</p>}
              <button type="submit" disabled={isSubmitting} className="w-full py-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-700 text-sm font-medium tracking-wide disabled:opacity-50">
                {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
              </button>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}

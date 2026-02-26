import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Moon, Sparkles, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { Dream, Mood } from '../types';
import { analyzeDream } from '../services/gemini';

interface DreamModalProps {
  dream: Dream | null;
  onClose: () => void;
}

const MOOD_LABELS: Record<string, string> = {
  peaceful: 'Спокойный',
  intense: 'Интенсивный',
  lucid: 'Осознанный',
  nightmare: 'Кошмар',
  mysterious: 'Загадочный',
  ordinary: 'Обычный',
};

export default function DreamModal({ dream, onClose }: DreamModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [localAnalysis, setLocalAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!dream) return null;

  const analysis = localAnalysis || dream.analysis;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeDream(dream.content);
      setLocalAnalysis(result);
      
      // Update the dream in the database if possible
      if (dream.id) {
        await fetch(`/api/dreams/${dream.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analysis: result }),
        });
      }
    } catch (err: any) {
      setError(err.message || "Ошибка анализа");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/95 backdrop-blur-xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 40 }}
          className="glass max-w-5xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl shadow-dream-accent/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="fixed md:absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all z-[110] text-white border border-white/10"
          >
            <X size={24} />
          </button>

          <div className="flex flex-col h-full">
            {/* Header Image (if exists) */}
            {dream.image_url && (
              <div className="w-full h-64 md:h-96 relative">
                <img 
                  src={dream.image_url} 
                  alt={dream.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              </div>
            )}

            {/* Content & Analysis */}
            <div className="w-full p-8 md:p-16 space-y-12">
              <div className="space-y-6">
                <div className="flex items-center gap-6 text-[10px] uppercase tracking-[0.4em] text-dream-accent font-bold">
                  <span className="flex items-center gap-2">
                    <Calendar size={14} />
                    {dream.date}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <span className="flex items-center gap-2">
                    <Moon size={14} />
                    {MOOD_LABELS[dream.mood] || dream.mood}
                  </span>
                </div>
                <h2 className="serif text-5xl md:text-7xl text-white leading-tight tracking-tight max-w-4xl">
                  {dream.title}
                </h2>
              </div>

              <div className="space-y-12">
                <section className="space-y-6">
                  <h3 className="text-[10px] uppercase tracking-[0.5em] text-white/30 font-bold">Воспоминание</h3>
                  <p className="text-white/90 text-xl md:text-2xl leading-relaxed whitespace-pre-wrap font-light serif italic max-w-4xl">
                    «{dream.content}»
                  </p>
                </section>

                <section className="space-y-6 pt-12 border-t border-white/5">
                  <div className="flex justify-between items-center max-w-4xl">
                    <h3 className="text-[10px] uppercase tracking-[0.5em] text-dream-accent font-bold flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-dream-accent animate-pulse" />
                      Психоанализ ИИ
                    </h3>
                    {!analysis && !isAnalyzing && (
                      <button 
                        onClick={handleAnalyze}
                        className="text-[10px] uppercase tracking-widest text-white/40 hover:text-dream-accent transition-colors flex items-center gap-2"
                      >
                        <Sparkles size={12} />
                        Провести анализ
                      </button>
                    )}
                  </div>

                  {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-6 bg-white/5 rounded-3xl border border-white/5 max-w-4xl">
                      <Loader2 className="animate-spin text-dream-accent" size={40} />
                      <p className="text-xs uppercase tracking-widest text-white/40">Расшифровка символов...</p>
                    </div>
                  ) : analysis ? (
                    <div className="markdown-body prose prose-invert prose-lg max-w-4xl text-white/80 leading-relaxed bg-white/5 p-10 md:p-16 rounded-[3rem] border border-white/10 shadow-inner">
                      <Markdown>{analysis}</Markdown>
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 space-y-6 max-w-4xl">
                      <p className="text-lg text-white/30 italic">Анализ этого сновидения еще не проводился.</p>
                      <button 
                        onClick={handleAnalyze}
                        className="bg-white/10 hover:bg-white/20 text-white px-10 py-3 rounded-full text-sm font-bold transition-all border border-white/10"
                      >
                        Начать анализ
                      </button>
                    </div>
                  )}

                  {error && (
                    <p className="text-red-400 text-sm text-center max-w-4xl">{error}</p>
                  )}
                </section>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

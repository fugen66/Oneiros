import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Moon, Sparkles, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { Dream } from '../types';
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/95 backdrop-blur-xl" onClick={onClose}>
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 40 }} className="glass max-w-5xl w-full max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="fixed md:absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full z-[110] text-white"><X size={24} /></button>
          <div className="flex flex-col lg:flex-row h-full">
            <div className="w-full lg:w-2/5 bg-black/40 border-r border-white/5">
              {dream.image_url ? <img src={dream.image_url} alt={dream.title} className="w-full h-full object-cover" /> : <div className="w-full aspect-square flex items-center justify-center"><Moon size={64} className="text-white/10" /></div>}
            </div>
            <div className="w-full lg:w-3/5 p-8 md:p-12 space-y-10">
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.4em] text-dream-accent font-bold">
                  <span><Calendar size={14} className="inline mr-2" />{dream.date}</span>
                  <span><Moon size={14} className="inline mr-2" />{MOOD_LABELS[dream.mood] || dream.mood}</span>
                </div>
                <h2 className="serif text-4xl md:text-6xl text-white">{dream.title}</h2>
              </div>
              <div className="space-y-8">
                <section className="space-y-4">
                  <h3 className="text-[10px] uppercase tracking-[0.5em] text-white/30 font-bold">Воспоминание</h3>
                  <p className="text-white/90 text-lg serif italic">«{dream.content}»</p>
                </section>
                <section className="space-y-4 pt-8 border-t border-white/5">
                  <h3 className="text-[10px] uppercase tracking-[0.5em] text-dream-accent font-bold">Психоанализ ИИ</h3>
                  {isAnalyzing ? <Loader2 className="animate-spin text-dream-accent mx-auto" size={32} /> : analysis ? <div className="markdown-body prose prose-invert prose-sm text-white/80 bg-white/5 p-8 rounded-3xl border border-white/10"><Markdown>{analysis}</Markdown></div> : <button onClick={handleAnalyze} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full text-xs font-bold">Начать анализ</button>}
                </section>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

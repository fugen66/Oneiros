import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Loader2, Brain, TrendingUp, Zap } from 'lucide-react';
import Markdown from 'react-markdown';
import { Dream } from '../types';

interface InsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dreams: Dream[];
}

export default function InsightsModal({ isOpen, onClose, dreams }: InsightsModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateInsights = async () => {
    if (dreams.length === 0) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const dreamTexts = dreams.map(d => `- ${d.title}: ${d.content}`).join('\n\n');
      const prompt = `Проанализируй серию сновидений и выяви общие паттерны, эмоциональное состояние и скрытые инсайты. Вот список снов:\n\n${dreamTexts}\n\nОтвет на русском в Markdown. Сделай его вдохновляющим и глубоким.`;
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('dream_user_id') || ''
        },
        body: JSON.stringify({ content: prompt }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ошибка анализа");
      setInsights(data.text);
    } catch (err: any) {
      setError(err.message || "Не удалось сгенерировать инсайты");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-2xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 40 }}
          className="glass max-w-4xl w-full max-h-[85vh] overflow-y-auto relative p-8 md:p-12"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-white"
          >
            <X size={24} />
          </button>

          <div className="space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-dream-accent">
                <Brain size={32} />
                <h2 className="serif text-4xl md:text-5xl text-white">Глубинные Инсайты</h2>
              </div>
              <p className="text-white/50 text-lg font-light max-w-2xl">
                Искусственный интеллект анализирует всю историю ваших сновидений, чтобы найти скрытые связи и помочь вам лучше понять себя.
              </p>
            </div>

            {!insights && !isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-8 bg-white/5 rounded-[2rem] border border-white/5">
                <div className="grid grid-cols-3 gap-8 text-white/20">
                  <TrendingUp size={48} />
                  <Zap size={48} />
                  <Sparkles size={48} />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-white/60 text-lg">Готовы заглянуть в глубину подсознания?</p>
                  <p className="text-white/30 text-sm">Для анализа будет использовано {dreams.length} записей</p>
                </div>
                <button 
                  onClick={handleGenerateInsights}
                  className="bg-dream-accent hover:scale-105 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-dream-accent/20 flex items-center gap-3"
                >
                  <Sparkles size={20} />
                  Сгенерировать отчет
                </button>
              </div>
            ) : isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-6">
                <Loader2 className="animate-spin text-dream-accent" size={48} />
                <div className="text-center space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-dream-accent font-bold">Синхронизация нейронов...</p>
                  <p className="text-white/30 text-sm italic">Ищем паттерны в ваших снах</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="markdown-body prose prose-invert prose-lg max-w-none text-white/80 leading-relaxed bg-white/5 p-10 md:p-16 rounded-[3rem] border border-white/10 shadow-inner">
                  <Markdown>{insights}</Markdown>
                </div>
                
                <div className="flex flex-col items-center gap-6">
                  <button 
                    onClick={onClose}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-12 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-3 uppercase tracking-widest text-sm"
                  >
                    Сохранить в память
                  </button>
                  
                  <button 
                    onClick={() => setInsights(null)}
                    className="text-[10px] uppercase tracking-widest text-white/20 hover:text-dream-accent transition-colors"
                  >
                    Перезапустить анализ
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

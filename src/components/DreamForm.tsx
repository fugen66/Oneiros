import React, { useState, useRef } from 'react';
import { Mic, Send, Sparkles, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeDream, generateDreamImage } from '../services/gemini';
import { Dream, Mood } from '../types';

interface DreamFormProps {
  onSave: (dream: Dream) => void;
  onClose: () => void;
}

const MOODS: { label: string; value: Mood; color: string }[] = [
  { label: 'Спокойный', value: 'peaceful', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { label: 'Интенсивный', value: 'intense', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { label: 'Осознанный', value: 'lucid', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { label: 'Кошмар', value: 'nightmare', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { label: 'Загадочный', value: 'mysterious', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { label: 'Обычный', value: 'ordinary', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
];

export default function DreamForm({ onSave, onClose }: DreamFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<Mood>('ordinary');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [analysis, setAnalysis] = useState<string | undefined>();
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  const handleStartRecording = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Распознавание речи не поддерживается в этом браузере.');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'ru-RU';
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      setContent(prev => prev + ' ' + transcript);
    };

    recognitionRef.current.onend = () => setIsRecording(false);
    recognitionRef.current.start();
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleAnalyze = async () => {
    if (!content) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeDream(content);
      setAnalysis(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ошибка при анализе");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleVisualize = async () => {
    if (!content) return;
    setIsVisualizing(true);
    setError(null);
    try {
      const result = await generateDreamImage(content);
      if (result) setImageUrl(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ошибка при визуализации");
    } finally {
      setIsVisualizing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: title || 'Без названия',
      content,
      date: new Date().toLocaleDateString('ru-RU'),
      mood,
      analysis,
      image_url: imageUrl,
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="glass p-8 w-full max-w-4xl mx-auto overflow-hidden relative"
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
      >
        <X size={20} />
      </button>

      <h2 className="serif text-4xl mb-8 text-white/100">Записать видение</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-white/50 font-semibold">Название</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Назовите ваше путешествие..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-dream-accent/50 transition-colors text-lg"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-white/50 font-semibold">Сон</label>
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Что вы видели?"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-[200px] focus:outline-none focus:border-dream-accent/50 transition-colors text-lg resize-none"
            />
            <button
              type="button"
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={`absolute bottom-4 right-4 p-3 rounded-full transition-all ${
                isRecording ? 'bg-red-500 animate-pulse' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <Mic size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-white/50 font-semibold">Атмосфера</label>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(m.value)}
                className={`px-4 py-2 rounded-full border text-sm transition-all ${
                  mood === m.value ? m.color : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-4">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !content}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 transition-all border border-white/10"
          >
            {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} className="text-dream-accent" />}
            Анализ смысла
          </button>

          <button
            type="button"
            onClick={handleVisualize}
            disabled={isVisualizing || !content}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 transition-all border border-white/10"
          >
            {isVisualizing ? <Loader2 className="animate-spin" size={18} /> : <ImageIcon size={18} className="text-dream-accent" />}
            Визуализировать
          </button>

          <div className="flex-grow" />

          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-dream-accent text-white font-semibold hover:scale-105 transition-all shadow-lg shadow-dream-accent/20"
          >
            <Send size={18} />
            Сохранить в дневник
          </button>
        </div>

        {error && (
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20"
          >
            {error}
          </motion.p>
        )}

        <AnimatePresence>
          {(analysis || imageUrl) && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/10"
            >
              {imageUrl && (
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-white/50 font-semibold">Визуализация</label>
                  <img src={imageUrl} alt="Визуализация сна" className="w-full rounded-2xl border border-white/10 shadow-2xl" />
                </div>
              )}
              {analysis && (
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-white/50 font-semibold">Инсайт</label>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-sm leading-relaxed text-white/70 italic">
                    {analysis}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
}

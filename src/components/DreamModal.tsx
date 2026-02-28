import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Moon, Sparkles, Loader2, Edit2, Check, Image as ImageIcon, Upload } from 'lucide-react';
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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [localTitle, setLocalTitle] = useState<string | null>(null);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  if (!dream) return null;

  const analysis = localAnalysis || dream.analysis;
  const title = localTitle || dream.title;
  const currentImage = localImage || dream.image_url;

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

  const startEditingTitle = () => {
    setEditedTitle(title);
    setIsEditingTitle(true);
  };

  const triggerSavedFeedback = () => {
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 2000);
  };

  const saveTitle = async () => {
    if (!editedTitle.trim()) return;
    setIsSaving(true);
    try {
      if (dream.id) {
        await fetch(`/api/dreams/${dream.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: editedTitle }),
        });
        setLocalTitle(editedTitle);
        triggerSavedFeedback();
      }
      setIsEditingTitle(false);
    } catch (err) {
      setError("Не удалось сохранить название");
    } finally {
      setIsSaving(false);
    }
  };

  const saveImage = async (url: string) => {
    setIsSaving(true);
    try {
      if (dream.id) {
        await fetch(`/api/dreams/${dream.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: url }),
        });
        setLocalImage(url);
        triggerSavedFeedback();
      }
      setIsEditingImage(false);
    } catch (err) {
      setError("Не удалось сохранить изображение");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        saveImage(base64String);
      };
      reader.readAsDataURL(file);
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
          {/* Saved Feedback Toast */}
          <AnimatePresence>
            {showSavedFeedback && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-6 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest z-[150] shadow-xl shadow-emerald-500/20 flex items-center gap-2"
              >
                <Check size={14} />
                Сохранено
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={onClose}
            className="fixed md:absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all z-[110] text-white border border-white/10"
          >
            <X size={24} />
          </button>

          <div className="flex flex-col h-full">
            <div className="w-full h-64 md:h-96 relative group/image">
              {currentImage ? (
                <img 
                  src={currentImage} 
                  alt={title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center">
                  <ImageIcon className="text-white/10" size={64} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              
              <div className="absolute bottom-6 right-6 transition-opacity flex gap-2">
                <button 
                  onClick={() => setIsEditingImage(!isEditingImage)}
                  className="p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white border border-white/20 flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Edit2 size={16} />}
                  {currentImage ? 'Изменить фото' : 'Добавить фото'}
                </button>
              </div>

              <AnimatePresence>
                {isEditingImage && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-20 right-6 glass p-6 space-y-4 w-80 z-[120]"
                  >
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40">Ссылка на изображение</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="https://..."
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white w-full focus:outline-none focus:border-dream-accent"
                        />
                        <button 
                          onClick={() => saveImage(imageUrl)}
                          disabled={isSaving}
                          className="p-2 bg-dream-accent rounded-lg text-white disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                      <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-[#0a0a0a] px-2 text-white/20">или</span></div>
                    </div>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSaving}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-xl text-xs text-white/60 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      Загрузить файл
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      accept="image/*"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
                
                <div className="group relative flex items-center gap-4">
                  {isEditingTitle ? (
                    <div className="flex items-center gap-2 w-full max-w-4xl">
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-3xl md:text-5xl serif text-white w-full focus:outline-none focus:border-dream-accent"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
                      />
                      <button 
                        onClick={saveTitle}
                        disabled={isSaving}
                        className="p-3 bg-dream-accent rounded-xl text-white hover:scale-105 transition-transform disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 size={24} className="animate-spin" /> : <Check size={24} />}
                      </button>
                    </div>
                  ) : (
                    <>
                      <h2 className="serif text-5xl md:text-7xl text-white leading-tight tracking-tight max-w-4xl">
                        {title}
                      </h2>
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={startEditingTitle}
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/50 hover:text-white transition-all"
                          title="Изменить название"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button 
                          onClick={onClose}
                          className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg text-emerald-400 border border-emerald-500/30 transition-all text-[8px] uppercase tracking-widest font-bold"
                          title="Сохранить изменения"
                        >
                          Сохранить
                        </button>
                      </div>
                    </>
                  )}
                </div>
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

                {/* Explicit Save Button at the bottom */}
                <div className="pt-12 flex justify-center max-w-4xl">
                  <button 
                    onClick={onClose}
                    className="bg-white/10 hover:bg-white/20 text-white px-12 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all border border-white/10 flex items-center gap-3"
                  >
                    <Check size={18} className="text-emerald-400" />
                    Завершить редактирование
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

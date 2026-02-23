import React, { useState, useEffect } from 'react';
import { Plus, Moon, Sparkles, Ghost, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DreamForm from './components/DreamForm';
import DreamCard from './components/DreamCard';
import { Dream } from './types';

export default function App() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDreams();
  }, []);

  const moodStats = dreams.reduce((acc, dream) => {
    acc[dream.mood] = (acc[dream.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const MOOD_LABELS: Record<string, string> = {
    peaceful: 'Спокойные',
    intense: 'Интенсивные',
    lucid: 'Осознанные',
    nightmare: 'Кошмары',
    mysterious: 'Загадочные',
    ordinary: 'Обычные',
  };

  const fetchDreams = async () => {
    try {
      const response = await fetch('/api/dreams');
      const data = await response.json();
      setDreams(data);
    } catch (error) {
      console.error('Failed to fetch dreams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDream = async (dream: Dream) => {
    try {
      const response = await fetch('/api/dreams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dream),
      });
      if (response.ok) {
        setIsAdding(false);
        fetchDreams();
      }
    } catch (error) {
      console.error('Failed to save dream:', error);
    }
  };

  const handleDeleteDream = async (id: number) => {
    try {
      await fetch(`/api/dreams/${id}`, { method: 'DELETE' });
      setDreams(dreams.filter(d => d.id !== id));
    } catch (error) {
      console.error('Failed to delete dream:', error);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <header className="relative h-[70vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dream-bg z-10" />
          <img 
            src="https://picsum.photos/seed/dream/1920/1080?blur=10" 
            alt="Dreamscape" 
            className="w-full h-full object-cover opacity-30"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Top Controls - Moved higher and to the sides */}
        <div className="absolute top-12 left-0 right-0 px-8 flex justify-between items-start z-30">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-left"
          >
            <h2 className="serif text-2xl text-white/90">Ваш дневник</h2>
            <p className="text-white/30 text-[10px] uppercase tracking-widest">
              сновидений
            </p>
          </motion.div>

          <motion.button
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1 }}
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:scale-105 transition-all shadow-xl shadow-white/10"
          >
            <Plus size={16} />
            Записать сон
          </motion.button>
        </div>

        <div className="relative z-20 space-y-6 mt-12">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-3 text-dream-accent"
          >
            <Moon size={20} />
            <span className="text-xs uppercase tracking-[0.4em] font-bold">Коллективное бессознательное</span>
            <Moon size={20} className="rotate-180" />
          </motion.div>

          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="serif text-7xl md:text-9xl text-white tracking-tighter"
          >
            Онейрос
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-white/40 max-w-md mx-auto text-sm md:text-base font-light tracking-wide"
          >
            Сосуд для ваших ночных странствий. Записывайте, визуализируйте и расшифровывайте язык вашей души.
          </motion.p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 relative z-30 pb-20">
        <AnimatePresence mode="wait">
          {isAdding ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-20"
            >
              <DreamForm onSave={handleSaveDream} onClose={() => setIsAdding(false)} />
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {dreams.map((dream) => (
                <DreamCard key={dream.id} dream={dream} onDelete={handleDeleteDream} />
              ))}
              
              {dreams.length === 0 && !isLoading && (
                <div className="col-span-full py-40 text-center space-y-4 opacity-20">
                  <Ghost size={64} className="mx-auto" />
                  <p className="serif text-2xl">Дневник пуст, как ночь без звезд.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Navigation / Stats */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 glass px-8 py-4 flex items-center gap-12 z-50">
        <button 
          onClick={() => setShowInsights(true)}
          className="flex flex-col items-center gap-1 group cursor-pointer bg-transparent border-none"
        >
          <Sparkles size={20} className={`${showInsights ? 'text-dream-accent' : 'text-white/40'} group-hover:text-dream-accent transition-colors`} />
          <span className="text-[8px] uppercase tracking-widest text-white/20">Инсайты</span>
        </button>
        <button 
          onClick={() => alert('Раздел "Исследовать" находится в разработке. Здесь вы сможете видеть анонимные сны других участников сообщества.')}
          className="flex flex-col items-center gap-1 group cursor-pointer bg-transparent border-none"
        >
          <Compass size={20} className="text-white/40 group-hover:text-dream-accent transition-colors" />
          <span className="text-[8px] uppercase tracking-widest text-white/20">Исследовать</span>
        </button>
        <div className="w-px h-8 bg-white/10" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-lg font-bold text-dream-accent">{dreams.length}</span>
          <span className="text-[8px] uppercase tracking-widest text-white/20">Снов</span>
        </div>
      </nav>

      {/* Insights Modal */}
      <AnimatePresence>
        {showInsights && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowInsights(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass p-8 max-w-lg w-full space-y-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center">
                <h2 className="serif text-3xl">Ваша статистика</h2>
                <button onClick={() => setShowInsights(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-white/60 text-sm">Распределение настроений в ваших сновидениях:</p>
                <div className="space-y-3">
                  {Object.entries(MOOD_LABELS).map(([key, label]) => {
                    const count = moodStats[key] || 0;
                    const percentage = dreams.length > 0 ? (count / dreams.length) * 100 : 0;
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-xs uppercase tracking-widest">
                          <span className="text-white/40">{label}</span>
                          <span className="text-dream-accent">{count}</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            className="h-full bg-dream-accent"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                <p className="text-xs text-white/30 italic text-center">
                  "Сны — это королевская дорога к познанию бессознательного." — З. Фрейд
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

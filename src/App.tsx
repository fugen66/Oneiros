import React, { useState, useEffect } from 'react';
import { Plus, Moon, Sparkles, Ghost, Compass, Archive, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DreamForm from './components/DreamForm';
import DreamCard from './components/DreamCard';
import DreamModal from './components/DreamModal';
import InsightsModal from './components/InsightsModal';
import { Dream } from './types';

export default function App() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [selectedDream, setSelectedDream] = useState<Dream | null>(null);
  const [view, setView] = useState<'main' | 'archive'>('main');
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    let id = localStorage.getItem('dream_user_id');
    if (!id) {
      id = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('dream_user_id', id);
    }
    console.log('Client User ID:', id);
    setUserId(id);
  }, []);

  useEffect(() => {
    if (userId) {
      fetchDreams();
    }
  }, [view, userId]);

  const fetchDreams = async () => {
    try {
      const response = await fetch('/api/dreams', {
        headers: {
          'x-user-id': userId
        }
      });
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setDreams(data);
      } else {
        console.error('Server returned non-array data:', data);
        setDreams([]);
      }
    } catch (error) {
      console.error('Failed to fetch dreams:', error);
      setDreams([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDream = async (dream: Dream) => {
    try {
      const response = await fetch('/api/dreams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dream, user_id: userId }),
      });
      if (response.ok) {
        setIsAdding(false);
        fetchDreams();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save dream');
      }
    } catch (error) {
      console.error('Failed to save dream:', error);
      throw error;
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
      <header className={`relative transition-all duration-1000 ${view === 'archive' ? 'h-[30vh]' : 'h-[70vh]'} flex flex-col items-center justify-center text-center px-4 overflow-hidden`}>
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

        {/* Top Controls */}
        <div className="absolute top-12 left-0 right-0 px-8 flex justify-between items-start z-30">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-left cursor-pointer"
            onClick={() => setView('main')}
          >
            <h2 className="serif text-2xl text-white/90">Ваш дневник</h2>
            <p className="text-white/30 text-[10px] uppercase tracking-widest">
              сновидений
            </p>
          </motion.div>

          {view === 'main' ? (
            <div className="flex gap-4">
              <motion.button
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1 }}
                onClick={() => setView('archive')}
                className="flex items-center gap-2 bg-white/10 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-white/20 transition-all border border-white/20"
              >
                <Archive size={16} />
                Архив
              </motion.button>
              <motion.button
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.1 }}
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:scale-105 transition-all shadow-xl shadow-white/10"
              >
                <Plus size={16} />
                Записать сон
              </motion.button>
            </div>
          ) : (
            <motion.button
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              onClick={() => setView('main')}
              className="flex items-center gap-2 bg-white/10 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-white/20 transition-all border border-white/20"
            >
              <ArrowLeft size={16} />
              Назад
            </motion.button>
          )}
        </div>

        <AnimatePresence>
          {view === 'main' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative z-20 space-y-6 mt-12"
            >
              <div className="flex items-center justify-center gap-3 text-dream-accent">
                <Moon size={20} />
                <span className="text-xs uppercase tracking-[0.4em] font-bold">Коллективное бессознательное</span>
                <Moon size={20} className="rotate-180" />
              </div>

              <h1 className="serif text-7xl md:text-9xl text-white tracking-tighter">
                Онейрос
              </h1>

              <p className="text-white/40 max-w-md mx-auto text-sm md:text-base font-light tracking-wide">
                Сосуд для ваших ночных странствий. Записывайте, визуализируйте и расшифровывайте язык вашей души.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
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
          ) : view === 'archive' ? (
            <motion.div 
              key="archive"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-12"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-6">
                <div className="flex items-center gap-4">
                  <Archive className="text-dream-accent" size={32} />
                  <h2 className="serif text-4xl text-white">Архив сновидений</h2>
                </div>
                <button 
                  onClick={fetchDreams}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-dream-accent transition-all"
                  title="Обновить"
                >
                  <Loader2 className={isLoading ? "animate-spin" : ""} size={20} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {dreams.map((dream) => (
                  <DreamCard 
                    key={dream.id} 
                    dream={dream} 
                    onDelete={handleDeleteDream} 
                    onClick={setSelectedDream}
                  />
                ))}
                
                {dreams.length === 0 && !isLoading && (
                  <div className="col-span-full py-20 text-center space-y-4 opacity-20">
                    <Ghost size={64} className="mx-auto" />
                    <p className="serif text-2xl">Архив пуст.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                {dreams.slice(0, 2).map((dream) => (
                  <DreamCard 
                    key={dream.id} 
                    dream={dream} 
                    onDelete={handleDeleteDream} 
                    onClick={setSelectedDream}
                  />
                ))}
              </div>
              
              {dreams.length > 2 && (
                <button 
                  onClick={() => setView('archive')}
                  className="text-dream-accent hover:underline text-sm uppercase tracking-widest font-bold"
                >
                  Смотреть все записи ({dreams.length})
                </button>
              )}

              {dreams.length === 0 && !isLoading && (
                <div className="py-20 text-center space-y-4 opacity-20">
                  <Ghost size={64} className="mx-auto" />
                  <p className="serif text-2xl">Начните свое путешествие, записав первый сон.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <DreamModal dream={selectedDream} onClose={() => setSelectedDream(null)} />
      <InsightsModal isOpen={showInsights} onClose={() => setShowInsights(false)} dreams={dreams} />

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
      
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 text-[6px] uppercase tracking-[0.2em] text-white/5 pointer-events-none">
        ID: {userId}
      </div>
    </div>
  );
}

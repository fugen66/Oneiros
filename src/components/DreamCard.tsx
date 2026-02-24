import React from 'react';
import { Calendar, Trash2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { Dream, Mood } from '../types';
import { motion } from 'motion/react';

interface DreamCardProps {
  dream: Dream;
  onDelete: (id: number) => void;
  onClick: (dream: Dream) => void;
}

const MOOD_COLORS: Record<Mood, string> = {
  peaceful: 'text-emerald-400',
  intense: 'text-orange-400',
  lucid: 'text-blue-400',
  nightmare: 'text-red-400',
  mysterious: 'text-purple-400',
  ordinary: 'text-zinc-400',
};

const MOOD_LABELS: Record<Mood, string> = {
  peaceful: 'Спокойный',
  intense: 'Интенсивный',
  lucid: 'Осознанный',
  nightmare: 'Кошмар',
  mysterious: 'Загадочный',
  ordinary: 'Обычный',
};

export default function DreamCard({ dream, onDelete, onClick }: DreamCardProps) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => onClick(dream)}
      className="glass overflow-hidden group cursor-pointer hover:border-white/20 transition-colors"
    >
      {dream.image_url && (
        <div className="relative aspect-video overflow-hidden">
          <img src={dream.image_url} alt={dream.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-dream-bg via-transparent to-transparent opacity-60" />
        </div>
      )}
      
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="serif text-2xl text-white/100 mb-1">{dream.title}</h3>
            <div className="flex items-center gap-3 text-xs text-white/40">
              <span className="flex items-center gap-1"><Calendar size={12} />{dream.date}</span>
              <span className={`uppercase tracking-widest font-bold ${MOOD_COLORS[dream.mood as Mood]}`}>{MOOD_LABELS[dream.mood as Mood]}</span>
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); dream.id && onDelete(dream.id); }}
            className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all"
          >
            <Trash2 size={18} />
          </button>
        </div>
        <p className="text-white/70 line-clamp-3 text-sm leading-relaxed">{dream.content}</p>
      </div>
    </motion.div>
  );
}

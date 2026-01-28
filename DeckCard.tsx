
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, MoreVertical, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { Deck, Card, CardState } from '../types';
import { AR } from '../constants';

interface Props {
  deck: Deck;
  cards: Card[];
  onDelete: (id: string) => void;
  index: number;
}

const DeckCard: React.FC<Props> = ({ deck, cards, onDelete, index }) => {
  const navigate = useNavigate();
  const now = Date.now();
  
  const counts = {
    new: cards.filter(c => c.state === CardState.NEW).length,
    learning: cards.filter(c => c.state === CardState.LEARNING || c.state === CardState.RELEARNING).length,
    due: cards.filter(c => c.state === CardState.REVIEW && c.nextReview <= now).length
  };

  const totalDue = counts.new + counts.learning + counts.due;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-400/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700" />
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
            <BookOpen size={24} />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{deck.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{deck.description || 'لا يوجد وصف متاح حالياً'}</p>
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(deck.id); }}
          className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <MoreVertical size={20} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8 relative z-10">
        <div className="bg-blue-50/50 dark:bg-blue-900/20 p-3 rounded-2xl text-center">
          <div className="text-blue-600 dark:text-blue-400 font-black text-xl leading-tight">{counts.new}</div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider">{AR.newCards}</div>
        </div>
        <div className="bg-red-50/50 dark:bg-red-900/20 p-3 rounded-2xl text-center">
          <div className="text-red-500 dark:text-red-400 font-black text-xl leading-tight">{counts.learning}</div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider">{AR.learning}</div>
        </div>
        <div className="bg-green-50/50 dark:bg-green-900/20 p-3 rounded-2xl text-center">
          <div className="text-green-600 dark:text-green-400 font-black text-xl leading-tight">{counts.due}</div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider">{AR.due}</div>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate(`/study/${deck.id}`)}
        disabled={totalDue === 0}
        className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-lg transition-all relative z-10 ${
          totalDue > 0
            ? 'bg-blue-600 dark:bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500 shadow-lg shadow-blue-200 dark:shadow-none'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
        }`}
      >
        <Play size={20} fill="currentColor" />
        {AR.study}
      </motion.button>
    </motion.div>
  );
};

export default DeckCard;

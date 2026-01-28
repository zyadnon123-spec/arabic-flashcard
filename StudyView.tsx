
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, CheckCircle, Info, Brain, Zap, RotateCcw, Volume2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Card, Rating, CardState } from '../types';
import { calculateNextReview, getIntervalString } from '../services/sm2';
import { AR } from '../constants';
import { storage } from '../services/storage';
import { playArabicTTS } from '../services/audio';

interface Props {
  cards: Card[];
  onCardsUpdate: (cards: Card[]) => void;
}

const WaveformAnimation = () => (
  <div className="flex items-center gap-0.5 h-4">
    {[1, 2, 3, 4].map((i) => (
      <motion.div
        key={i}
        animate={{ height: ["20%", "100%", "20%"] }}
        transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
        className="w-1 bg-blue-500 rounded-full"
      />
    ))}
  </div>
);

const StudyView: React.FC<Props> = ({ cards, onCardsUpdate }) => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const dueCards = useMemo(() => {
    const now = Date.now();
    return cards
      .filter(c => c.deckId === deckId)
      .filter(c => {
        if (c.state === CardState.NEW) return true;
        if (c.state === CardState.LEARNING || c.state === CardState.RELEARNING) return true;
        return c.nextReview <= now;
      })
      .sort((a, b) => a.nextReview - b.nextReview);
  }, [cards, deckId]);

  const currentCard = dueCards[currentIndex];

  useEffect(() => {
    setStartTime(Date.now());
    setIsFlipped(false);
    setShowAnswer(false);
    setIsPlaying(false);
  }, [currentIndex]);

  const handleRate = (rating: Rating) => {
    const timeSpent = Date.now() - startTime;
    const updates = calculateNextReview(currentCard, rating);
    const updatedCard = { ...currentCard, ...updates };
    
    const newCards = cards.map(c => c.id === updatedCard.id ? updatedCard : c);
    onCardsUpdate(newCards);

    storage.addLog({
      id: crypto.randomUUID(),
      cardId: updatedCard.id,
      rating,
      interval: updatedCard.interval,
      easeFactor: updatedCard.easeFactor,
      timestamp: Date.now(),
      timeSpent
    });

    if (currentIndex < dueCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#10b981', '#f59e0b']
      });
      setCurrentIndex(-1);
    }
  };

  const handleTTS = async (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if (isPlaying) return;
    setIsPlaying(true);
    await playArabicTTS(text, () => setIsPlaying(false));
  };

  const renderContent = (text: string, isAnswer: boolean) => {
    if (currentCard.type === 'CLOZE') {
      const parts = text.split(/\{\{c\d+::(.*?)\}\}/g);
      return (
        <div className="leading-relaxed relative">
          {parts.map((part, i) => {
            if (i % 2 === 1) {
              return showAnswer || !isAnswer ? (
                <span key={i} className="text-blue-600 dark:text-blue-400 font-black border-b-2 border-blue-200 dark:border-blue-800 px-1">{part}</span>
              ) : (
                <span key={i} className="bg-blue-100 dark:bg-slate-800 text-transparent rounded-lg px-6 mx-1 animate-pulse select-none">...</span>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </div>
      );
    }
    return <div className="whitespace-pre-wrap leading-relaxed relative">{text}</div>;
  };

  if (currentIndex === -1 || !currentCard) {
    return (
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 space-y-8 text-center"
      >
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 bg-gradient-to-tr from-green-500 to-blue-500 rounded-full blur-2xl opacity-20"
          />
          <div className="w-32 h-32 bg-green-100 dark:bg-green-900/30 rounded-[2.5rem] flex items-center justify-center text-green-600 dark:text-green-400 shadow-2xl relative z-10">
            <CheckCircle size={64} />
          </div>
        </div>
        <div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100">مذهل، لقد انتهيت!</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-3 max-w-sm text-lg">{AR.emptyDeck}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-black text-xl shadow-xl shadow-blue-200 dark:shadow-none transition-all"
        >
          العودة للرزم
        </motion.button>
      </motion.div>
    );
  }

  const progress = ((currentIndex) / dueCards.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10">
      <div className="flex items-center justify-between px-2">
        <button 
          onClick={() => navigate('/')}
          className="text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 flex items-center gap-2 font-black transition-colors px-4 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900"
        >
          <RotateCcw size={20} className="rotate-180" />
          إلغاء الجلسة
        </button>
        <div className="flex items-center gap-3 text-sm font-black text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 px-5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <Brain size={18} className="text-blue-500" />
          {dueCards.length - currentIndex} بطاقة متبقية
        </div>
      </div>

      <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-100 dark:border-slate-800 shadow-inner">
        <motion.div 
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <div className="perspective-1000 w-full min-h-[450px]">
        <motion.div 
          className={`w-full h-full min-h-[450px] relative preserve-3d transition-all duration-700 cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
          onClick={() => !isFlipped && (setIsFlipped(true), setShowAnswer(true))}
        >
          {/* Front Side */}
          <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl dark:shadow-none flex flex-col p-8 md:p-14 text-center justify-center overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 -translate-y-20 translate-x-20 rounded-full" />
            
            <div className="absolute top-8 left-8">
              <button 
                onClick={(e) => handleTTS(e, currentCard.front)}
                className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
              >
                {isPlaying && !isFlipped ? <WaveformAnimation /> : <Volume2 size={24} />}
              </button>
            </div>

            <div className="text-xs font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em] mb-10">السؤال</div>
            <div className="text-2xl md:text-4xl text-slate-800 dark:text-slate-100 font-bold leading-relaxed relative z-10">
              {renderContent(currentCard.front, false)}
            </div>
            {!showAnswer && (
              <div className="mt-12 flex items-center justify-center gap-2 text-blue-500 dark:text-blue-400 font-black animate-pulse uppercase tracking-widest text-sm">
                <Zap size={16} /> انقر للإجابة
              </div>
            )}
          </div>

          {/* Back Side */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-blue-100 dark:border-blue-900/30 shadow-2xl dark:shadow-none flex flex-col p-8 md:p-14 text-center justify-center overflow-hidden">
             <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/5 -translate-y-20 translate-x-20 rounded-full" />
             
             <div className="absolute top-8 left-8">
              <button 
                onClick={(e) => handleTTS(e, currentCard.type === 'BASIC' ? currentCard.back : currentCard.front)}
                className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
              >
                {isPlaying && isFlipped ? <WaveformAnimation /> : <Volume2 size={24} />}
              </button>
            </div>

             <div className="text-xs font-black text-green-500/30 dark:text-green-500/10 uppercase tracking-[0.3em] mb-10">الإجابة</div>
             <div className="text-2xl md:text-4xl text-slate-800 dark:text-slate-100 font-bold leading-relaxed relative z-10">
               {currentCard.type === 'BASIC' ? renderContent(currentCard.back, true) : renderContent(currentCard.front, true)}
             </div>
             {currentCard.type === 'CLOZE' && currentCard.back && (
               <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-lg italic font-medium">
                 {currentCard.back}
               </div>
             )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showAnswer && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleRate(Rating.AGAIN)}
              className="flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 transition-all p-6 rounded-[2rem] border-2 border-red-100 dark:border-red-900/30 group"
            >
              <div className="text-red-600 dark:text-red-400 group-hover:text-white font-black text-xl mb-1">{AR.again}</div>
              <div className="text-[10px] text-red-400 dark:text-red-500 group-hover:text-red-100 uppercase font-black tracking-widest">
                {getIntervalString(currentCard, Rating.AGAIN)}
              </div>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleRate(Rating.HARD)}
              className="flex flex-col items-center justify-center bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 transition-all p-6 rounded-[2rem] border-2 border-orange-100 dark:border-orange-900/30 group"
            >
              <div className="text-orange-600 dark:text-orange-400 group-hover:text-white font-black text-xl mb-1">{AR.hard}</div>
              <div className="text-[10px] text-orange-400 dark:text-orange-500 group-hover:text-orange-100 uppercase font-black tracking-widest">
                {getIntervalString(currentCard, Rating.HARD)}
              </div>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleRate(Rating.GOOD)}
              className="flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all p-6 rounded-[2rem] border-2 border-blue-100 dark:border-blue-900/30 group"
            >
              <div className="text-blue-600 dark:text-blue-400 group-hover:text-white font-black text-xl mb-1">{AR.good}</div>
              <div className="text-[10px] text-blue-400 dark:text-blue-500 group-hover:text-blue-100 uppercase font-black tracking-widest">
                {getIntervalString(currentCard, Rating.GOOD)}
              </div>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleRate(Rating.EASY)}
              className="flex flex-col items-center justify-center bg-green-50 dark:bg-green-900/20 hover:bg-green-600 hover:text-white dark:hover:bg-green-600 transition-all p-6 rounded-[2rem] border-2 border-green-100 dark:border-green-900/30 group"
            >
              <div className="text-green-600 dark:text-green-400 group-hover:text-white font-black text-xl mb-1">{AR.easy}</div>
              <div className="text-[10px] text-green-400 dark:text-green-500 group-hover:text-green-100 uppercase font-black tracking-widest">
                {getIntervalString(currentCard, Rating.EASY)}
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudyView;


import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles, BarChart2, Settings, PlusCircle, Brain, LayoutGrid, Calendar, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DeckCard from '../components/DeckCard';
import { Deck, Card, CardState } from '../types';
import { AR } from '../constants';

interface Props {
  decks: Deck[];
  cards: Card[];
  onDecksUpdate: (decks: Deck[]) => void;
}

const FeatureTile = ({ 
  icon: Icon, 
  label, 
  description, 
  colorClass, 
  onClick, 
  delay = 0,
  badge = null 
}: { 
  icon: any, 
  label: string, 
  description?: string, 
  colorClass: string, 
  onClick: () => void, 
  delay?: number,
  badge?: string | number | null
}) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ y: -4, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`relative overflow-hidden group p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-right flex flex-col justify-between min-h-[160px] shadow-sm hover:shadow-xl transition-all`}
  >
    <div className={`p-3 rounded-2xl w-fit ${colorClass} group-hover:scale-110 transition-transform`}>
      <Icon size={28} />
    </div>
    
    <div>
      <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors">{label}</h3>
      {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-bold">{description}</p>}
    </div>

    {badge !== null && (
      <div className="absolute top-6 left-6 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg shadow-red-200 dark:shadow-none animate-pulse">
        {badge} {AR.due}
      </div>
    )}
    
    <div className="absolute -bottom-6 -left-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
      <Icon size={120} />
    </div>
  </motion.button>
);

const DeckList: React.FC<Props> = ({ decks, cards, onDecksUpdate }) => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');

  const stats = useMemo(() => {
    const now = Date.now();
    return {
      totalNew: cards.filter(c => c.state === CardState.NEW).length,
      totalDue: cards.filter(c => c.state === CardState.REVIEW && c.nextReview <= now).length,
      learning: cards.filter(c => c.state === CardState.LEARNING || c.state === CardState.RELEARNING).length
    };
  }, [cards]);

  const handleCreateDeck = () => {
    if (!newDeckName.trim()) return;
    const newDeck: Deck = {
      id: crypto.randomUUID(),
      name: newDeckName,
      settings: {
        newCardsPerDay: 20,
        reviewLimitPerDay: 100,
        learningSteps: [1, 10],
        graduatingInterval: 1,
        easyInterval: 4,
        startingEase: 2.5
      }
    };
    onDecksUpdate([...decks, newDeck]);
    setNewDeckName('');
    setIsCreating(false);
  };

  const handleDeleteDeck = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الرزمة؟ سيتم حذف جميع البطاقات بداخلها أيضاً.')) {
      onDecksUpdate(decks.filter(d => d.id !== id));
    }
  };

  return (
    <div className="space-y-12 pb-24">
      {/* Dashboard Grid Section */}
      <section className="space-y-6">
        <header className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <LayoutGrid size={24} className="text-blue-600" />
            لوحة التحكم الرئيسية
          </h2>
        </header>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureTile 
            icon={Brain} 
            label="ابدأ المراجعة" 
            description="دراسة البطاقات المستحقة حالياً"
            colorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            onClick={() => navigate('/study/default')}
            badge={stats.totalDue > 0 ? stats.totalDue : null}
            delay={0.1}
          />
          <FeatureTile 
            icon={Sparkles} 
            label="استيراد PDF" 
            description="تحويل الجداول لبطاقات بالذكاء الاصطناعي"
            colorClass="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
            onClick={() => navigate('/import')}
            delay={0.2}
          />
          <FeatureTile 
            icon={PlusCircle} 
            label="إضافة بطاقة" 
            description="إنشاء بطاقة يدوية جديدة"
            colorClass="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
            onClick={() => navigate('/add')}
            delay={0.3}
          />
          <FeatureTile 
            icon={BarChart2} 
            label="الإحصائيات" 
            description="تحليل الأداء ومعدلات الحفظ"
            colorClass="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
            onClick={() => navigate('/stats')}
            delay={0.4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-slate-900 text-white p-6 rounded-[2.5rem] flex items-center justify-between group cursor-pointer hover:bg-slate-800 transition-all"
            onClick={() => navigate('/settings')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-800 rounded-2xl text-slate-400 group-hover:text-blue-400 transition-colors">
                <Settings size={24} />
              </div>
              <div>
                <h4 className="font-black text-lg">إعدادات النظام</h4>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">تحكم في خوارزمية التكرار</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-slate-600 group-hover:translate-x-[-4px] transition-transform" />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-blue-600 text-white p-6 rounded-[2.5rem] flex items-center justify-between group cursor-pointer hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 dark:shadow-none"
            onClick={() => setIsCreating(true)}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <Plus size={24} />
              </div>
              <div>
                <h4 className="font-black text-lg">إنشاء رزمة جديدة</h4>
                <p className="text-xs text-blue-100 font-bold uppercase tracking-widest">نظم بطاقاتك في فئات</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-blue-200 group-hover:translate-x-[-4px] transition-transform" />
          </motion.div>
        </div>
      </section>

      {/* Decks Grid Section */}
      <section className="space-y-6">
        <header className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <Calendar size={24} className="text-blue-600" />
            {AR.decks}
          </h2>
          <span className="text-xs font-black text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            {decks.length} رزم متاحة
          </span>
        </header>

        <AnimatePresence>
          {isCreating && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 p-8 rounded-[2.5rem] flex flex-col md:flex-row gap-6 items-end shadow-inner transition-colors">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-black text-blue-900 dark:text-blue-400 mb-3 uppercase tracking-widest">{AR.deckName}</label>
                  <input
                    autoFocus
                    className="w-full px-6 py-4 rounded-2xl border-2 border-blue-100 dark:border-blue-900/50 focus:border-blue-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xl font-bold transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                    placeholder="مثلاً: مفردات الكيمياء"
                  />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <button
                    onClick={handleCreateDeck}
                    className="flex-1 md:flex-none bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700"
                  >
                    {AR.add}
                  </button>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="flex-1 md:flex-none bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-10 py-4 rounded-2xl font-black text-lg border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    {AR.cancel}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {decks.map((deck, idx) => (
            <DeckCard
              key={deck.id}
              index={idx}
              deck={deck}
              cards={cards.filter(c => c.deckId === deck.id)}
              onDelete={handleDeleteDeck}
            />
          ))}
        </div>
        
        {decks.length === 0 && !isCreating && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800"
          >
            <div className="bg-slate-100 dark:bg-slate-800 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-400 dark:text-slate-600">
              <PlusCircle size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200">ابدأ رحلة تعلمك</h3>
            <p className="text-slate-500 dark:text-slate-500 mt-2 max-w-sm mx-auto font-medium">قم بإنشاء رزمتك الأولى لاستخدام التكرار المتباعد في الحفظ.</p>
            <button 
              onClick={() => setIsCreating(true)}
              className="mt-8 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-all"
            >
              إضافة أول رزمة
            </button>
          </motion.div>
        )}
      </section>
    </div>
  );
};

export default DeckList;

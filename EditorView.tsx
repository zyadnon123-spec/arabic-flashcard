
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, X, Type, Layers, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { Deck, Card, CardType, CardState } from '../types';
import { AR } from '../constants';

interface Props {
  decks: Deck[];
  cards: Card[];
  onCardsUpdate: (cards: Card[]) => void;
}

const EditorView: React.FC<Props> = ({ decks, cards, onCardsUpdate }) => {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();

  const [deckId, setDeckId] = useState(decks[0]?.id || 'default');
  const [type, setType] = useState<CardType>(CardType.BASIC);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (cardId) {
      const card = cards.find(c => c.id === cardId);
      if (card) {
        setDeckId(card.deckId);
        setType(card.type);
        setFront(card.front);
        setBack(card.back);
        setTags(card.tags.join(', '));
      }
    }
  }, [cardId, cards]);

  const handleSave = () => {
    if (!front.trim()) return;

    const newCard: Card = {
      id: cardId || crypto.randomUUID(),
      deckId,
      type,
      front,
      back,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      state: CardState.NEW,
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      lapses: 0,
      nextReview: Date.now(),
      createdAt: Date.now(),
    };

    if (cardId) {
      onCardsUpdate(cards.map(c => c.id === cardId ? newCard : c));
    } else {
      onCardsUpdate([...cards, newCard]);
    }
    
    if (cardId) {
      navigate(-1);
    } else {
      setFront('');
      setBack('');
      setTags('');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 max-w-3xl mx-auto pb-20"
    >
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {cardId ? 'تعديل بطاقة' : 'إضافة بطاقة جديدة'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">قم بتصميم بطاقاتك التعليمية بدقة.</p>
        </div>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="p-3 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
        >
          <X size={28} />
        </motion.button>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 p-8 md:p-12 shadow-sm space-y-8 transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-2">{AR.decks}</label>
            <div className="relative group">
              <select 
                value={deckId}
                onChange={(e) => setDeckId(e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 px-12 py-4 rounded-2xl focus:border-blue-500 focus:outline-none font-bold text-slate-900 dark:text-slate-100 transition-all cursor-pointer group-hover:border-slate-200 dark:group-hover:border-slate-700"
              >
                {decks.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
                <Layers size={22} />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-2">{AR.cardType}</label>
            <div className="relative group">
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as CardType)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 px-12 py-4 rounded-2xl focus:border-blue-500 focus:outline-none font-bold text-slate-900 dark:text-slate-100 transition-all cursor-pointer group-hover:border-slate-200 dark:group-hover:border-slate-700"
              >
                <option value={CardType.BASIC}>{AR.basicType}</option>
                <option value={CardType.CLOZE}>{AR.clozeType}</option>
              </select>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
                <Type size={22} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-2">{AR.front}</label>
          <textarea
            rows={4}
            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 px-8 py-6 rounded-[2rem] focus:border-blue-500 focus:outline-none text-xl font-medium resize-none text-slate-900 dark:text-slate-100 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-inner"
            placeholder={type === CardType.CLOZE ? AR.clozeHint : "اكتب السؤال هنا..."}
            value={front}
            onChange={(e) => setFront(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-2">{AR.back}</label>
          <textarea
            rows={4}
            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 px-8 py-6 rounded-[2rem] focus:border-blue-500 focus:outline-none text-xl font-medium resize-none text-slate-900 dark:text-slate-100 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-inner"
            placeholder="اكتب الإجابة أو ملاحظات إضافية..."
            value={back}
            onChange={(e) => setBack(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-2">الوسوم (اختياري)</label>
          <div className="relative group">
            <input
              type="text"
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 pr-12 pl-6 py-4 rounded-2xl focus:border-blue-500 focus:outline-none font-bold text-slate-900 dark:text-slate-100 transition-all"
              placeholder="مثلاً: طب، مفردات، هام"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Tag size={20} />
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-xl shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-all"
          >
            <Save size={24} />
            {AR.save}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(-1)}
            className="px-12 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 py-5 rounded-2xl font-black text-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            {AR.cancel}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default EditorView;

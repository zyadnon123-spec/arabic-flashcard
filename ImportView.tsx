
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI, Type } from "@google/genai";
import { Sparkles, Link, FileText, Check, AlertCircle, Loader2, Layers, Trash2, Upload, Send, User, Bot, PlusCircle, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AR } from '../constants';
import { Deck, Card, CardType, CardState } from '../types';

interface Props {
  decks: Deck[];
  onCardsUpdate: (cards: Card[]) => void;
  cards: Card[];
}

interface GeneratedCard {
  front: string;
  back: string;
  type: CardType;
  selected: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  cards?: GeneratedCard[];
  loading?: boolean;
  fileName?: string;
}

const ImportView: React.FC<Props> = ({ decks, cards, onCardsUpdate }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'bot', text: AR.chatWelcome }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [base64File, setBase64File] = useState<string | null>(null);
  const [selectedDeckId, setSelectedDeckId] = useState(decks[0]?.id || 'default');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 20 * 1024 * 1024) {
        addBotMessage("حجم الملف كبير جداً. يرجى اختيار ملف أقل من 20 ميجابايت.");
        return;
      }
      setSelectedFile(file);
      const b64 = await fileToBase64(file);
      setBase64File(b64);
      
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'user',
        text: `تم اختيار ملف: ${file.name}`,
        fileName: file.name
      }]);
      
      addBotMessage(AR.confirmExtraction);
    }
  };

  const addBotMessage = (text: string, extra?: Partial<Message>) => {
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'bot',
      text,
      ...extra
    }]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedFile) return;
    if (!selectedFile && inputValue.trim()) {
      addBotMessage(AR.noFileUploaded);
      return;
    }

    const userText = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', text: userText }]);

    setIsProcessing(true);
    const botMsgId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: botMsgId, role: 'bot', text: 'جاري التحليل...', loading: true }]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const contentParts = [
        { inlineData: { mimeType: 'application/pdf', data: base64File! } },
        { text: `User Request: ${userText}. 
          Analyze the PDF tables or text based on this request. 
          If the user asked for specific pages, only process those. 
          If they said 'all', process everything.
          Return a JSON array of cards with 'front', 'back', and 'type' ('BASIC' or 'CLOZE').
          Strictly Arabic output. Clear and accurate word/definition pairs from tables.` 
        }
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: contentParts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                front: { type: Type.STRING },
                back: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['BASIC', 'CLOZE'] }
              },
              required: ['front', 'back', 'type']
            }
          }
        }
      });

      const data = JSON.parse(response.text || '[]');
      
      if (data.length === 0) {
        updateBotMessage(botMsgId, AR.noCardsGenerated, { loading: false });
      } else {
        const generated: GeneratedCard[] = data.map((c: any) => ({ ...c, selected: true }));
        updateBotMessage(botMsgId, AR.extractionSuccess.replace('{count}', data.length.toString()).replace('{source}', userText || 'الملف'), { 
          loading: false, 
          cards: generated 
        });
      }
    } catch (err) {
      updateBotMessage(botMsgId, "حدث خطأ أثناء المعالجة. يرجى المحاولة مرة أخرى.", { loading: false });
    } finally {
      setIsProcessing(false);
    }
  };

  const updateBotMessage = (id: string, text: string, extra: Partial<Message>) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, text, ...extra } : m));
  };

  const handleSaveCards = (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg || !msg.cards) return;

    const selected = msg.cards.filter(c => c.selected);
    const newCards: Card[] = selected.map(gc => ({
      id: crypto.randomUUID(),
      deckId: selectedDeckId,
      type: gc.type,
      front: gc.front,
      back: gc.back,
      tags: ['AI_Chat_Import'],
      state: CardState.NEW,
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      lapses: 0,
      nextReview: Date.now(),
      createdAt: Date.now(),
    }));

    onCardsUpdate([...cards, ...newCards]);
    
    // Mark these as saved in UI
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, cards: undefined, text: `✅ تم حفظ ${selected.length} بطاقة في الرزمة!` } : m));
    
    // Check if we should go home or stay
    if (confirm("تم الحفظ بنجاح! هل تود العودة للرئيسية؟")) {
      navigate('/');
    }
  };

  const toggleCardSelection = (msgId: string, cardIdx: number) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId && m.cards) {
        const newCards = [...m.cards];
        newCards[cardIdx].selected = !newCards[cardIdx].selected;
        return { ...m, cards: newCards };
      }
      return m;
    }));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in duration-500">
      
      {/* Header */}
      <header className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200 dark:shadow-none">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">{AR.importPdfTitle}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">مدعوم بذكاء Gemini 3 Pro</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase">الرزمة المستهدفة:</label>
          <select 
            value={selectedDeckId}
            onChange={(e) => setSelectedDeckId(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 ring-blue-500 outline-none"
          >
            {decks.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </header>

      {/* Chat Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3 items-end`}
            >
              {msg.role === 'bot' && (
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 shrink-0 border border-slate-200 dark:border-slate-700">
                  <Bot size={20} />
                </div>
              )}
              
              <div className="max-w-[85%] space-y-2">
                <div className={`p-4 rounded-[2rem] text-sm md:text-base font-medium shadow-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-bl-none shadow-blue-100 dark:shadow-none' 
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-br-none border border-slate-100 dark:border-slate-700'
                }`}>
                  {msg.loading ? (
                    <div className="flex items-center gap-3 px-4 py-1">
                      <Loader2 className="animate-spin text-blue-500" size={18} />
                      <span className="animate-pulse">جاري تحليل البيانات...</span>
                    </div>
                  ) : (
                    msg.text
                  )}
                  {msg.fileName && (
                    <div className="mt-2 pt-2 border-t border-white/20 flex items-center gap-2 text-xs font-bold opacity-80">
                      <FileText size={14} /> {msg.fileName}
                    </div>
                  )}
                </div>

                {/* Cards Preview Section */}
                {msg.cards && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden mt-3 shadow-xl"
                  >
                    <div className="max-h-[350px] overflow-y-auto p-4 space-y-3">
                      {msg.cards.map((card, idx) => (
                        <div 
                          key={idx}
                          onClick={() => toggleCardSelection(msg.id, idx)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                            card.selected 
                              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' 
                              : 'border-slate-100 dark:border-slate-800 opacity-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 text-right">
                             <div className={`p-1 rounded-full border-2 ${card.selected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-700 text-transparent'}`}>
                               <Check size={12} />
                             </div>
                             <div className="flex-1 space-y-1">
                                <div className="text-xs font-black text-slate-400 uppercase">{AR.front}</div>
                                <div className="text-slate-900 dark:text-slate-100 font-bold">{card.front}</div>
                                <div className="text-xs font-black text-slate-400 uppercase mt-2">{AR.back}</div>
                                <div className="text-slate-600 dark:text-slate-400 italic text-sm">{card.back}</div>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-500">
                        {msg.cards.filter(c => c.selected).length} بطاقة مختارة من أصل {msg.cards.length}
                      </div>
                      <button 
                        onClick={() => handleSaveCards(msg.id)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black text-sm shadow-md shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-all"
                      >
                        حفظ البطاقات
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-100 dark:shadow-none">
                  <User size={20} />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <footer className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-3xl mx-auto flex items-end gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-600 hover:border-blue-200 rounded-[1.5rem] transition-all shrink-0"
            title="إرفاق ملف PDF"
          >
            <Paperclip size={24} />
          </button>
          
          <div className="relative flex-1">
            <textarea
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={AR.chatInputPlaceholder}
              className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-[1.5rem] px-6 py-4 pr-14 focus:border-blue-500 focus:outline-none text-slate-900 dark:text-slate-100 font-medium resize-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
            />
            <button 
              onClick={handleSendMessage}
              disabled={isProcessing || (!inputValue.trim() && !selectedFile)}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:shadow-none transition-all"
            >
              <Send size={20} className="rotate-180" />
            </button>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".pdf" 
            onChange={handleFileChange} 
          />
        </div>
        
        {selectedFile && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border border-blue-100 dark:border-blue-900/50">
              <FileText size={14} /> {selectedFile.name}
              <button onClick={() => { setSelectedFile(null); setBase64File(null); }} className="hover:text-red-500 p-0.5">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};

export default ImportView;


import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Clock, AlertCircle, CheckCircle2, Volume2, ShieldCheck, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Deck } from '../types';
import { AR } from '../constants';
import { notificationService, NotificationSettings } from '../services/notifications';

interface Props {
  decks: Deck[];
  onDecksUpdate: (decks: Deck[]) => void;
}

const SettingsView: React.FC<Props> = ({ decks, onDecksUpdate }) => {
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(notificationService.getSettings());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleUpdateLimit = (deckId: string, type: 'new' | 'review', value: string) => {
    const val = parseInt(value) || 0;
    const newDecks = decks.map(d => {
      if (d.id === deckId) {
        return {
          ...d,
          settings: {
            ...d.settings,
            newCardsPerDay: type === 'new' ? val : d.settings.newCardsPerDay,
            reviewLimitPerDay: type === 'review' ? val : d.settings.reviewLimitPerDay
          }
        };
      }
      return d;
    });
    onDecksUpdate(newDecks);
  };

  const handleToggleNotifs = async () => {
    if (!notifSettings.enabled) {
      const granted = await notificationService.requestPermission();
      if (!granted) {
        alert(AR.notifPermissionDenied);
        return;
      }
    }
    const updated = { ...notifSettings, enabled: !notifSettings.enabled };
    setNotifSettings(updated);
    notificationService.saveSettings(updated);
    triggerSaveFeedback();
  };

  const updateNotifConfig = (key: keyof NotificationSettings, value: any) => {
    const updated = { ...notifSettings, [key]: value };
    setNotifSettings(updated);
    notificationService.saveSettings(updated);
    triggerSaveFeedback();
  };

  const triggerSaveFeedback = () => {
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const testNotif = () => {
    notificationService.sendNotification(
      AR.appName,
      AR.notifMessageDue.replace('{count}', '10'),
      () => console.log('Test notification clicked')
    );
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{AR.settings}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">قم بتخصيص فترات الدراسة وحدود المراجعة اليومية والتنبيهات.</p>
        </div>
        <AnimatePresence>
          {saveStatus === 'saved' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg"
            >
              <CheckCircle2 size={16} />
              {AR.notifSettingsSaved}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Notifications Section */}
      <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 md:p-12 shadow-sm space-y-10">
        <div className="flex items-center gap-4 border-b border-slate-50 dark:border-slate-800 pb-6">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
            <Bell size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{AR.notifTitle}</h3>
            <p className="text-sm text-slate-500 font-bold">التذكيرات الذكية تعزز الذاكرة وتضمن عدم فوات المراجعات.</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${notifSettings.enabled ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-slate-400 bg-slate-100 dark:bg-slate-800'}`}>
                {notifSettings.enabled ? <Bell size={20} /> : <BellOff size={20} />}
              </div>
              <span className="font-black text-slate-700 dark:text-slate-200 text-lg">{AR.notifEnabled}</span>
            </div>
            <button 
              onClick={handleToggleNotifs}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${notifSettings.enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${notifSettings.enabled ? '-translate-x-7' : '-translate-x-1'}`} />
            </button>
          </div>

          <AnimatePresence>
            {notifSettings.enabled && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8 overflow-hidden"
              >
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-2">
                    <Clock size={16} />
                    {AR.notifPreferredTime}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['morning', 'afternoon', 'evening'] as const).map((time) => (
                      <button
                        key={time}
                        onClick={() => updateNotifConfig('preferredTime', time)}
                        className={`py-3 rounded-2xl font-bold transition-all border-2 ${
                          notifSettings.preferredTime === time 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200 dark:shadow-none' 
                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-blue-200'
                        }`}
                      >
                        {time === 'morning' ? AR.notifMorning : time === 'afternoon' ? AR.notifAfternoon : AR.notifEvening}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-2">
                    <AlertCircle size={16} />
                    {AR.notifDailyLimit}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={notifSettings.dailyLimit}
                    onChange={(e) => updateNotifConfig('dailyLimit', parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs font-bold text-slate-400 px-1">
                    <span>1</span>
                    <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">{notifSettings.dailyLimit} تنبيهات</span>
                    <span>10</span>
                  </div>
                </div>

                <div className="md:col-span-2 pt-6 flex gap-4">
                  <button 
                    onClick={testNotif}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                  >
                    <Volume2 size={20} />
                    {AR.notifTest}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Decks Settings Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <SettingsIcon className="text-blue-600" size={24} />
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">إعدادات الرزم</h3>
        </div>
        
        {decks.map(deck => (
          <motion.div 
            key={deck.id} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md"
          >
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-8 border-b border-slate-50 dark:border-slate-800 pb-4">{deck.name}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-black text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-widest px-1">عدد البطاقات الجديدة يومياً</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 px-6 py-4 rounded-2xl focus:border-blue-500 focus:outline-none text-slate-900 dark:text-slate-100 font-bold text-lg transition-all"
                    value={deck.settings.newCardsPerDay}
                    onChange={(e) => handleUpdateLimit(deck.id, 'new', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-black text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-widest px-1">حد مراجعات اليوم الواحد</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 px-6 py-4 rounded-2xl focus:border-blue-500 focus:outline-none text-slate-900 dark:text-slate-100 font-bold text-lg transition-all"
                    value={deck.settings.reviewLimitPerDay}
                    onChange={(e) => handleUpdateLimit(deck.id, 'review', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl transition-colors">
                <div className="text-xs font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-tighter">عامل السهولة المبدئي</div>
                <div className="text-2xl font-black text-slate-800 dark:text-slate-200">{deck.settings.startingEase * 100}%</div>
              </div>
              <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl transition-colors">
                <div className="text-xs font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-tighter">فترة التخرج (أيام)</div>
                <div className="text-2xl font-black text-slate-800 dark:text-slate-200">{deck.settings.graduatingInterval}</div>
              </div>
              <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl transition-colors">
                <div className="text-xs font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-tighter">خطوات التعلم</div>
                <div className="text-2xl font-black text-slate-800 dark:text-slate-200 flex gap-2">
                  {deck.settings.learningSteps.map((s, i) => (
                    <span key={i} className="text-blue-600 dark:text-blue-400">{s}{i < deck.settings.learningSteps.length - 1 ? ',' : ''}</span>
                  ))}
                  <span className="text-sm font-bold text-slate-400 self-end mb-1">دقيقة</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <motion.div 
        whileHover={{ scale: 1.01 }}
        className="bg-blue-600 dark:bg-blue-700 p-10 rounded-[3rem] text-white shadow-2xl shadow-blue-200 dark:shadow-none transition-all relative overflow-hidden group"
      >
        <div className="absolute -right-10 -top-10 opacity-10 rotate-12 group-hover:scale-150 transition-transform duration-1000">
          <ShieldCheck size={200} />
        </div>
        <div className="relative z-10">
          <h3 className="text-3xl font-black mb-4 flex items-center gap-3">
            تزامن السحاب الاحترافي
          </h3>
          <p className="text-blue-100 text-lg mb-8 max-w-xl font-medium leading-relaxed">
            حافظ على سلامة بياناتك ومزامنتها عبر جميع أجهزتك. استمتع بتجربة دراسة مستمرة في أي وقت ومكان.
          </p>
          <button className="bg-white text-blue-600 dark:text-blue-700 px-10 py-4 rounded-2xl font-black text-xl shadow-xl hover:bg-slate-100 transition-all tap-bounce">
            تسجيل الدخول الآن
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsView;

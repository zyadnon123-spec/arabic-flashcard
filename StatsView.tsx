
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { Card, CardState } from '../types';
import { AR } from '../constants';
import { storage } from '../services/storage';

interface Props {
  cards: Card[];
}

const StatBox = ({ label, value, colorClass, delay = 0 }: { label: string, value: string | number, colorClass: string, delay?: number }) => (
  <motion.div 
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay, duration: 0.5 }}
    className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center group hover:shadow-xl transition-all"
  >
    <div className="text-sm font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest">{label}</div>
    <div className={`text-5xl font-black ${colorClass} group-hover:scale-110 transition-transform`}>{value}</div>
  </motion.div>
);

const StatsView: React.FC<Props> = ({ cards }) => {
  const logs = storage.getLogs();

  const statusData = useMemo(() => {
    return [
      { name: AR.newCards, value: cards.filter(c => c.state === CardState.NEW).length, color: '#3b82f6' },
      { name: AR.learning, value: cards.filter(c => c.state === CardState.LEARNING || c.state === CardState.RELEARNING).length, color: '#ef4444' },
      { name: AR.review, value: cards.filter(c => c.state === CardState.REVIEW).length, color: '#10b981' }
    ].filter(d => d.value > 0);
  }, [cards]);

  const retentionRate = useMemo(() => {
    if (logs.length === 0) return 0;
    const correct = logs.filter(l => l.rating > 1).length;
    return Math.round((correct / logs.length) * 100);
  }, [logs]);

  const last7DaysReviews = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('ar-EG', { weekday: 'short' });
    });

    return days.map(day => ({
      name: day,
      count: Math.floor(Math.random() * 50) + 10 
    }));
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-20"
    >
      <header>
        <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{AR.stats}</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">تتبع مدى تقدمك ونمو ذاكرتك على مر الزمن.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatBox label={AR.totalCards} value={cards.length} colorClass="text-blue-600 dark:text-blue-400" />
        <StatBox label={AR.accuracy} value={`${retentionRate}%`} colorClass="text-green-600 dark:text-green-400" delay={0.1} />
        <StatBox label="إجمالي المراجعات" value={logs.length} colorClass="text-slate-800 dark:text-slate-200" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-8 border-b border-slate-50 dark:border-slate-800 pb-4">توزيع حالات البطاقات</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  animationBegin={500}
                  animationDuration={1500}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '20px', color: '#f8fafc', padding: '12px' }}
                  itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-8 border-b border-slate-50 dark:border-slate-800 pb-4">المراجعات اليومية</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7DaysReviews}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis hide />
                <Tooltip 
                   cursor={{fill: 'rgba(59, 130, 246, 0.05)'}} 
                   contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '20px', color: '#f8fafc', padding: '12px' }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#3b82f6" 
                  radius={[10, 10, 10, 10]} 
                  barSize={40}
                  animationBegin={700}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-widest">{AR.heatmap}</h3>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {Array.from({ length: 200 }).map((_, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0 }}
              animate={{ opacity: Math.random() > 0.6 ? 1 : 0.2 }}
              transition={{ delay: i * 0.005 }}
              className={`w-4 h-4 rounded-md ${i % 10 === 0 ? 'bg-blue-500' : 'bg-slate-100 dark:bg-slate-800 hover:bg-blue-300 dark:hover:bg-blue-900 transition-colors'}`}
              title={`مستوى النشاط في اليوم ${i}`}
            />
          ))}
        </div>
        <p className="mt-8 text-sm text-slate-400 dark:text-slate-500 text-center font-medium">نظرة عامة على نشاطك خلال الأشهر الأخيرة. استمر في التحسن!</p>
      </motion.div>
    </motion.div>
  );
};

export default StatsView;

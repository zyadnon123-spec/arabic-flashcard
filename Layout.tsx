
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BrainCircuit, Moon, Sun, ArrowRight, Home } from 'lucide-react';
import { AR } from '../constants';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-500 overflow-x-hidden">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200 dark:shadow-none transition-transform group-hover:scale-110">
              <BrainCircuit size={24} />
            </div>
            <h1 className="text-xl font-black text-blue-900 dark:text-blue-400 hidden sm:block">
              {AR.appName}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {!isHome && (
              <button 
                onClick={() => navigate('/')}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors"
              >
                <Home size={20} />
              </button>
            )}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-all tap-bounce"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className={`flex-1 transition-all duration-500 ${isHome ? 'p-4 md:p-8' : 'p-4 md:p-8 pt-6'}`}>
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
      
      {/* Mobile Indicator */}
      <div className="md:hidden h-20" />
    </div>
  );
};

export default Layout;

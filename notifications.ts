
import { AR } from '../constants';
import { Card, CardState } from '../types';

export interface NotificationSettings {
  enabled: boolean;
  preferredTime: 'morning' | 'afternoon' | 'evening';
  dailyLimit: number;
}

const STORAGE_KEY = 'anki_arab_notif_settings';

export const notificationService = {
  getSettings: (): NotificationSettings => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {
      enabled: false,
      preferredTime: 'morning',
      dailyLimit: 2
    };
  },

  saveSettings: (settings: NotificationSettings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  },

  requestPermission: async (): Promise<boolean> => {
    if (!("Notification" in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === "granted";
  },

  sendNotification: (title: string, body: string, onClick?: () => void) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico', // Standard icon path
      dir: 'rtl',
      lang: 'ar'
    });

    if (onClick) {
      notification.onclick = (e) => {
        e.preventDefault();
        window.focus();
        onClick();
        notification.close();
      };
    }
  },

  checkAndNotify: (cards: Card[], navigate: (path: string) => void) => {
    const settings = notificationService.getSettings();
    if (!settings.enabled) return;

    const now = Date.now();
    const dueCount = cards.filter(c => 
      (c.state === CardState.NEW || 
       c.state === CardState.LEARNING || 
       c.state === CardState.RELEARNING || 
       (c.state === CardState.REVIEW && c.nextReview <= now))
    ).length;

    if (dueCount > 0) {
      // Logic for smart notification (e.g., don't notify too often)
      const lastNotified = localStorage.getItem('last_notified_timestamp');
      const dayInMs = 24 * 60 * 60 * 1000;
      
      // Simple cooldown: once per 4 hours if cards are due
      if (!lastNotified || (now - parseInt(lastNotified) > (dayInMs / settings.dailyLimit))) {
        notificationService.sendNotification(
          AR.appName,
          AR.notifMessageDue.replace('{count}', dueCount.toString()),
          () => navigate('/study/default')
        );
        localStorage.setItem('last_notified_timestamp', now.toString());
      }
    }
  }
};

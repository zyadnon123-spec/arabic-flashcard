
import { Deck, Card, ReviewLog } from '../types';

const STORAGE_KEYS = {
  DECKS: 'anki_arab_decks',
  CARDS: 'anki_arab_cards',
  LOGS: 'anki_arab_logs'
};

export const storage = {
  getDecks: (): Deck[] => {
    const data = localStorage.getItem(STORAGE_KEYS.DECKS);
    return data ? JSON.parse(data) : [];
  },
  saveDecks: (decks: Deck[]) => {
    localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks));
  },
  getCards: (): Card[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CARDS);
    return data ? JSON.parse(data) : [];
  },
  saveCards: (cards: Card[]) => {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  },
  getLogs: (): ReviewLog[] => {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    return data ? JSON.parse(data) : [];
  },
  saveLogs: (logs: ReviewLog[]) => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  },
  addLog: (log: ReviewLog) => {
    const logs = storage.getLogs();
    logs.push(log);
    storage.saveLogs(logs);
  }
};

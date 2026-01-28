
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DeckList from './views/DeckList';
import StudyView from './views/StudyView';
import EditorView from './views/EditorView';
import StatsView from './views/StatsView';
import SettingsView from './views/SettingsView';
import ImportView from './views/ImportView';
import { storage } from './services/storage';
import { Deck, Card } from './types';
import { DEFAULT_DECK_SETTINGS } from './constants';
import { notificationService } from './services/notifications';

const App: React.FC = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);

  useEffect(() => {
    const loadedDecks = storage.getDecks();
    const loadedCards = storage.getCards();
    
    if (loadedDecks.length === 0) {
      const defaultDeck: Deck = {
        id: 'default',
        name: 'الرزمة الافتراضية',
        description: 'ابدأ إضافة بطاقاتك هنا',
        settings: DEFAULT_DECK_SETTINGS
      };
      storage.saveDecks([defaultDeck]);
      setDecks([defaultDeck]);
    } else {
      setDecks(loadedDecks);
    }
    setCards(loadedCards);
  }, []);

  // Set up periodic check for due cards to trigger notifications
  useEffect(() => {
    if (cards.length > 0) {
      // Immediate check
      // We need a router-less navigate here or we can just use window.location
      const triggerCheck = () => {
         notificationService.checkAndNotify(cards, (path) => {
           window.location.hash = path;
         });
      };
      
      triggerCheck();
      
      // Check every 30 minutes
      const interval = setInterval(triggerCheck, 30 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [cards]);

  const handleUpdateCards = (newCards: Card[]) => {
    storage.saveCards(newCards);
    setCards(newCards);
  };

  const handleUpdateDecks = (newDecks: Deck[]) => {
    storage.saveDecks(newDecks);
    setDecks(newDecks);
  };

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DeckList decks={decks} cards={cards} onDecksUpdate={handleUpdateDecks} />} />
          <Route path="/study/:deckId" element={<StudyView cards={cards} onCardsUpdate={handleUpdateCards} />} />
          <Route path="/add" element={<EditorView decks={decks} cards={cards} onCardsUpdate={handleUpdateCards} />} />
          <Route path="/edit/:cardId" element={<EditorView decks={decks} cards={cards} onCardsUpdate={handleUpdateCards} />} />
          <Route path="/import" element={<ImportView decks={decks} cards={cards} onCardsUpdate={handleUpdateCards} />} />
          <Route path="/stats" element={<StatsView cards={cards} />} />
          <Route path="/settings" element={<SettingsView decks={decks} onDecksUpdate={handleUpdateDecks} />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;

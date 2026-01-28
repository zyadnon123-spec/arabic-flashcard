
export enum CardType {
  BASIC = 'BASIC',
  CLOZE = 'CLOZE'
}

export enum CardState {
  NEW = 'NEW',
  LEARNING = 'LEARNING',
  REVIEW = 'REVIEW',
  RELEARNING = 'RELEARNING'
}

export interface Card {
  id: string;
  deckId: string;
  type: CardType;
  front: string;
  back: string;
  tags: string[];
  
  // SM-2 Algorithm State
  state: CardState;
  easeFactor: number; // Starts at 2.5
  interval: number; // Days
  repetitions: number;
  lapses: number;
  nextReview: number; // Timestamp
  createdAt: number;
  lastReview?: number;
}

export interface Deck {
  id: string;
  name: string;
  parentId?: string;
  description?: string;
  settings: DeckSettings;
}

export interface DeckSettings {
  newCardsPerDay: number;
  reviewLimitPerDay: number;
  learningSteps: number[]; // Minutes
  graduatingInterval: number; // Days
  easyInterval: number; // Days
  startingEase: number;
}

export interface ReviewLog {
  id: string;
  cardId: string;
  rating: number; // 1-4
  interval: number;
  easeFactor: number;
  timestamp: number;
  timeSpent: number; // milliseconds
}

export enum Rating {
  AGAIN = 1,
  HARD = 2,
  GOOD = 3,
  EASY = 4
}

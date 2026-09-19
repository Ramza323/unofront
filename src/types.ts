export type Color = 'yellow' | 'red' | 'blue' | 'green' | 'wild';
export type CardValue = '0'|'1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'skip'|'reverse'|'draw2'|'wild'|'wild4';

export interface Card {
  id: string;
  color: Color;
  value: CardValue;
}

export interface PlayerView {
  id: string;
  name: string;
  isReady: boolean;
  saidUno: boolean;
  connected: boolean;
  cardCount: number;
  hand: Card[];
}

export interface PenaltyStack {
  amount: number;
  color: Color;
}

export interface GameView {
  deck: number;
  discardPile: Card[];
  currentPlayerIndex: number;
  direction: 1 | -1;
  penalty: PenaltyStack | null;
  declaredColor: Color | null;
  stealWindow: { card: Card; byPlayerIndex: number; expiresAt: number } | null;
  started: boolean;
  winner: string | null;
  players: PlayerView[];
}

export interface RoomView {
  id: string;
  players: PlayerView[];
  hostId: string;
  game: GameView | null;
}

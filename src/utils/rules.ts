import { Card, Color } from '../types';

type Penalty = { amount: number; color: Color } | null;

export function canPlayClient(card: Card, topCard: Card, penalty: Penalty): boolean {
  if (penalty) return canRespondToPenalty(card, penalty);
  if (card.value === 'wild' || card.value === 'wild4') return true;
  const effectiveColor = (topCard.value === 'wild' || topCard.value === 'wild4') ? topCard.color : topCard.color;
  return card.color === effectiveColor || card.value === topCard.value;
}

function canRespondToPenalty(card: Card, penalty: Penalty): boolean {
  if (!penalty) return false;
  if (card.value === 'wild4') return true;
  if (card.color !== penalty.color) return false;
  return card.value === 'draw2' || card.value === 'skip' || card.value === 'reverse';
}

export function canStealClient(card: Card, lastPlayed: Card, penalty: Penalty): boolean {
  if (penalty) return canRespondToPenalty(card, penalty);
  return card.color === lastPlayed.color && card.value === lastPlayed.value;
}

export function needsColorPick(card: Card): boolean {
  return card.value === 'wild' || card.value === 'wild4';
}

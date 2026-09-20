import { Card, Color } from '../types';

type Penalty = { amount: number; color: Color } | null;

export function canPlayClient(card: Card, topCard: Card, penalty: Penalty, declaredColor?: Color | null): boolean {
  if (penalty) return canRespondToPenalty(card, penalty);
  if (card.value === 'wild' || card.value === 'wild4') return true;
  const effectiveColor: Color = (topCard.value === 'wild' || topCard.value === 'wild4')
    ? (declaredColor ?? topCard.color)
    : topCard.color;
  return card.color === effectiveColor || card.value === topCard.value;
}

function canRespondToPenalty(card: Card, penalty: Penalty): boolean {
  if (!penalty) return false;
  if (card.value === 'wild4') return true;
  if (card.value === 'draw2') return true;
  if (card.color !== penalty.color) return false;
  return card.value === 'skip' || card.value === 'reverse';
}

export function canStealClient(card: Card, lastPlayed: Card, declaredColor: Color | null | undefined, penalty: Penalty): boolean {
  if (penalty) return canRespondToPenalty(card, penalty);
  if ((card.value === 'wild' || card.value === 'wild4') && card.value === lastPlayed.value) return true;
  const effectiveColor: Color = (lastPlayed.value === 'wild' || lastPlayed.value === 'wild4')
    ? (declaredColor ?? lastPlayed.color)
    : lastPlayed.color;
  return card.color === effectiveColor && card.value === lastPlayed.value;
}

export function needsColorPick(card: Card): boolean {
  return card.value === 'wild' || card.value === 'wild4';
}

import { Card, Color } from '../types';

const COL_X = [5, 94, 182, 270, 359, 447, 535, 625, 713, 802, 890, 978];
const ROW_Y = [0, 136, 272, 408, 544, 680];

export const CARD_W = 77;
export const CARD_H = 133;

interface SpritePos { x: number; y: number }

const sp = (row: number, col: number): SpritePos => ({ x: COL_X[col], y: ROW_Y[row] });

const SPRITE_MAP: Record<string, SpritePos> = {
  'back':           sp(0, 0),
  'wild-wild':      sp(0, 1),
  'wild-yellow':    sp(0, 2),
  'wild-red':       sp(0, 3),
  'wild-blue':      sp(0, 4),
  'wild-green':     sp(0, 5),
  'wild4-wild':     sp(0, 6),
  'wild4-yellow':   sp(0, 7),
  'wild4-red':      sp(0, 8),
  'wild4-blue':     sp(0, 9),
  'wild4-green':    sp(0, 10),
  // Yellow
  'yellow-1': sp(1, 0), 'yellow-2': sp(1, 1), 'yellow-3': sp(1, 2),
  'yellow-4': sp(1, 3), 'yellow-5': sp(1, 4), 'yellow-6': sp(1, 5),
  'yellow-7': sp(1, 6), 'yellow-8': sp(1, 7), 'yellow-9': sp(1, 8),
  'yellow-0': sp(1, 9), 'yellow-draw2': sp(1, 10), 'yellow-skip': sp(1, 11),
  'yellow-reverse': sp(2, 0),
  // Red
  'red-1': sp(2, 1), 'red-2': sp(2, 2), 'red-3': sp(2, 3),
  'red-4': sp(2, 4), 'red-5': sp(2, 5), 'red-6': sp(2, 6),
  'red-7': sp(2, 7), 'red-8': sp(2, 8), 'red-9': sp(2, 9),
  'red-0': sp(2, 10), 'red-draw2': sp(2, 11), 'red-skip': sp(3, 0),
  'red-reverse': sp(3, 1),
  // Blue
  'blue-1': sp(3, 2), 'blue-2': sp(3, 3), 'blue-3': sp(3, 4),
  'blue-4': sp(3, 5), 'blue-5': sp(3, 6), 'blue-6': sp(3, 7),
  'blue-7': sp(3, 8), 'blue-8': sp(3, 9), 'blue-9': sp(3, 10),
  'blue-0': sp(3, 11), 'blue-draw2': sp(4, 0), 'blue-skip': sp(4, 1),
  'blue-reverse': sp(4, 2),
  // Green
  'green-1': sp(4, 3), 'green-2': sp(4, 4), 'green-3': sp(4, 5),
  'green-4': sp(4, 6), 'green-5': sp(4, 7), 'green-6': sp(4, 8),
  'green-7': sp(4, 9), 'green-8': sp(4, 10), 'green-9': sp(4, 11),
  'green-0': sp(5, 0), 'green-draw2': sp(5, 1), 'green-skip': sp(5, 2),
  'green-reverse': sp(5, 3),
};

export function getSpritePos(card: Card, declaredColor?: Color): SpritePos {
  if (card.value === 'wild' || card.value === 'wild4') {
    const colorKey = declaredColor ?? card.color;
    const key = `${card.value}-${colorKey}`;
    return SPRITE_MAP[key] ?? SPRITE_MAP[`${card.value}-wild`];
  }
  const key = `${card.color}-${card.value}`;
  return SPRITE_MAP[key] ?? SPRITE_MAP['back'];
}

export function getBackPos(): SpritePos {
  return SPRITE_MAP['back'];
}

export function spriteStyle(pos: SpritePos, scale = 1) {
  const w = Math.round(CARD_W * scale);
  const h = Math.round(CARD_H * scale);
  return {
    width: `${w}px`,
    height: `${h}px`,
    backgroundImage: 'url(/cartas.png)',
    backgroundPosition: `-${Math.round(pos.x * scale)}px -${Math.round((pos.y + 3) * scale)}px`,
    backgroundSize: `${Math.round(1080 * scale)}px ${Math.round(1080 * scale)}px`,
    backgroundRepeat: 'no-repeat',
  };
}

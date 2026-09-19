import { Card as CardType, Color } from '../types';
import { getSpritePos, getBackPos, spriteStyle } from '../utils/cardSprite';

interface Props {
  card?: CardType;
  facedown?: boolean;
  scale?: number;
  onClick?: () => void;
  playable?: boolean;
  glow?: boolean;
  declaredColor?: Color;
  className?: string;
}

export default function Card({ card, facedown, scale = 1, onClick, playable, glow, declaredColor, className = '' }: Props) {
  const pos = facedown || !card ? getBackPos() : getSpritePos(card, declaredColor);
  const style = spriteStyle(pos, scale);

  const classes = ['card-sprite',
    facedown ? 'facedown' : '',
    playable === false ? 'unplayable' : '',
    glow ? 'steal-pulse' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      style={style}
      onClick={playable !== false && !facedown ? onClick : undefined}
      title={card && !facedown ? `${card.color} ${card.value}` : undefined}
    />
  );
}

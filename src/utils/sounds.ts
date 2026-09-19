import { Card } from '../types';

function mk(src: string, vol = 1) {
  const a = new Audio(src);
  a.volume = vol;
  return a;
}

const sfx = {
  cardNormal:  mk('/sounds/SFX_Card_Effect_Show_Norm_Comm_New.wav', 0.8),
  cardPunish:  mk('/sounds/SFX_Card_Effect_Show_Punish_Comm_New.wav', 0.8),
  cardSkip:    mk('/sounds/SFX_Card_Effect_Stop_New.wav', 0.8),
  cardReverse: mk('/sounds/Uno_SFX_ArrowSwitch_012.wav', 0.8),
  cardWild:    mk('/sounds/SFX_Card_OpenDeck.wav', 0.8),
  draw: [
    mk('/sounds/SFX_Card_Draw_Comm_1_New.wav', 0.7),
    mk('/sounds/SFX_Card_Draw_Comm_2_New.wav', 0.7),
    mk('/sounds/SFX_Card_Draw_Comm_3_New.wav', 0.7),
    mk('/sounds/SFX_Card_Draw_Comm_4_New.wav', 0.7),
  ],
  deal:      mk('/sounds/Uno_SFX_Card_Deal_Comm_01.wav', 0.6),
  uno:       mk('/sounds/uno.mp3', 1),
  win:       mk('/sounds/SFX_UI_Victory_Token_04.wav', 0.9),
  steal:     mk('/sounds/SFX_Card_Pick.wav', 0.8),
  gameStart: mk('/sounds/Uno_SFX_Gamestart_02.wav', 0.7),
};

const music = mk('/sounds/unogamesong.mp3', 0.25);
music.loop = true;

function play(a: HTMLAudioElement) {
  a.currentTime = 0;
  a.play().catch(() => {});
}

export function playCardSound(card: Card) {
  if (card.value === 'wild4')    return play(sfx.cardPunish);
  if (card.value === 'draw2')    return play(sfx.cardPunish);
  if (card.value === 'skip')     return play(sfx.cardSkip);
  if (card.value === 'reverse')  return play(sfx.cardReverse);
  if (card.value === 'wild')     return play(sfx.cardWild);
  play(sfx.cardNormal);
}

export function playDraw()      { play(sfx.draw[Math.floor(Math.random() * sfx.draw.length)]); }
export function playUno()       { play(sfx.uno); }
export function playWin()       { play(sfx.win); }
export function playSteal()     { play(sfx.steal); }
export function playGameStart() { play(sfx.gameStart); }
export function playDeal()      { play(sfx.deal); }

export function startMusic() { music.play().catch(() => {}); }
export function stopMusic()  { music.pause(); music.currentTime = 0; }
export function setMusicMuted(m: boolean) { music.muted = m; }

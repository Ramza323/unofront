import { useEffect, useRef, useState } from 'react';
import { socket } from '../socket';
import { Card as CardType, Color, RoomView } from '../types';
import Card from './Card';
import ColorPicker from './ColorPicker';
import { canPlayClient, canStealClient, needsColorPick } from '../utils/rules';
import { useCardScale, useIsMobile } from '../utils/useScreenSize';
import { saveSession } from '../App';

interface Props { room: RoomView; myId: string; }

const COLOR_BG: Record<string, string> = {
  red: '#e63946', blue: '#0077b6', green: '#2dc653', yellow: '#ffd60a', wild: '#555',
};
const PLAYER_COLORS = ['#e63946','#2ec4b6','#f4a261','#a8dadc','#8338ec','#06d6a0','#fb5607','#ffbe0b'];

export default function Game({ room, myId }: Props) {
  const game = room.game!;
  const players = game.players;
  const myIndex = players.findIndex(p => p.id === myId);
  const me = myIndex !== -1 ? players[myIndex] : null;
  const isMyTurn = myIndex !== -1 && game.currentPlayerIndex === myIndex;
  const topCard = game.discardPile[game.discardPile.length - 1];

  const cardScale = useCardScale();
  const isMobile = useIsMobile();
  const centerScale = isMobile ? cardScale + 0.1 : 0.9;
  const facedownScale = isMobile ? 0.28 : 0.35;

  const [pendingCard, setPendingCard] = useState<CardType | null>(null);
  const [stealCountdown, setStealCountdown] = useState(0);
  const [notification, setNotification] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persist session para reconexión
  useEffect(() => {
    if (room.id && me?.name) {
      saveSession(room.id, me.name);
    }
  }, [room.id, me?.name]);

  // Limpiar ColorPicker si cambia el turno o la steal window (evita zombie)
  useEffect(() => {
    setPendingCard(null);
  }, [game.currentPlayerIndex, game.stealWindow]);

  // Steal window countdown — se autolimpia al llegar a 0
  useEffect(() => {
    if (game.stealWindow) {
      const tick = () => {
        const remaining = Math.max(0, game.stealWindow!.expiresAt - Date.now());
        setStealCountdown(remaining);
        if (remaining === 0 && timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
      tick();
      timerRef.current = setInterval(tick, 50);
    } else {
      setStealCountdown(0);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [game.stealWindow]);

  useEffect(() => {
    const handlers: Array<[string, (...args: any[]) => void]> = [
      ['turn-stolen',       ({ byPlayerName }: any) => showNotif(`⚡ ${byPlayerName} robó el turno!`)],
      ['penalty-deflected', ({ type, amount }: any) => showNotif(type === 'block' ? `🛡️ Bloqueado! +${amount} al siguiente` : `↩️ Reversa! +${amount} devuelto`)],
      ['uno-penalty',       ({ playerName }: any) => showNotif(`😬 ${playerName} olvidó decir UNO! +2 cartas`)],
      ['player-reconnected',({ name }: any) => showNotif(`✅ ${name} volvió`)],
      ['player-disconnected',({ name }: any) => showNotif(`📵 ${name} se desconectó`)],
    ];
    handlers.forEach(([ev, fn]) => socket.on(ev, fn));
    return () => handlers.forEach(([ev, fn]) => socket.off(ev, fn));
  }, []);

  function showNotif(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(''), 2500);
  }

  function playCard(card: CardType) {
    if (!isMyTurn) return;
    if (!canPlayClient(card, topCard, game.penalty, game.declaredColor)) return;
    if (needsColorPick(card)) { setPendingCard(card); return; }
    socket.emit('play-card', { cardId: card.id });
  }

  function stealCard(card: CardType) {
    if (!game.stealWindow || game.stealWindow.byPlayerIndex === myIndex) return;
    if (!canStealClient(card, game.stealWindow.card, game.declaredColor, game.penalty)) return;
    if (needsColorPick(card)) { setPendingCard(card); return; }
    socket.emit('steal-card', { cardId: card.id });
  }

  function handleCardClick(card: CardType) {
    if (game.stealWindow && myIndex !== game.stealWindow.byPlayerIndex) {
      stealCard(card);
    } else if (isMyTurn && !game.stealWindow) {
      playCard(card);
    }
  }

  function handleColorPick(color: Color) {
    if (!pendingCard) return;
    const isSteal = game.stealWindow && myIndex !== game.currentPlayerIndex;
    if (isSteal) {
      socket.emit('steal-card', { cardId: pendingCard.id, declaredColor: color });
    } else {
      socket.emit('play-card', { cardId: pendingCard.id, declaredColor: color });
    }
    setPendingCard(null);
  }

  function isCardPlayable(card: CardType): boolean {
    if (game.stealWindow) {
      if (myIndex === game.stealWindow.byPlayerIndex) return false;
      return canStealClient(card, game.stealWindow.card, game.declaredColor, game.penalty);
    }
    if (!isMyTurn) return false;
    return canPlayClient(card, topCard, game.penalty, game.declaredColor);
  }

  if (game.winner) {
    const winner = players.find(p => p.id === game.winner);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 24, padding: 16 }}>
        <div style={{ fontSize: '4rem' }}>🎉</div>
        <h1 style={{ color: '#e63946', fontSize: '2rem', textAlign: 'center' }}>{winner?.name ?? 'Alguien'} ganó!</h1>
        {game.winner === myId && <p style={{ color: '#06d6a0', fontSize: '1.2rem' }}>¡Felicitaciones!</p>}
      </div>
    );
  }

  // Guard: currentPlayerIndex puede ser out of bounds momentáneamente
  const currentPlayer = players[game.currentPlayerIndex] ?? null;
  const otherPlayers = players.map((p, i) => ({ ...p, index: i })).filter(p => p.id !== myId);
  const topColor = topCard
    ? (topCard.color === 'wild' ? (game.declaredColor ?? game.penalty?.color ?? 'wild') : topCard.color)
    : 'wild';
  const handHeight = isMobile ? Math.round(77 * cardScale * 1.33) + 28 : 140;

  // Si soy un espectador (me = null), mostrar vista simplificada
  if (!me) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 16, padding: 16 }}>
        <p style={{ color: '#aaa' }}>Reconectando a la partida...</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#0f172a', overflow: 'hidden' }}>
      {pendingCard && <ColorPicker onPick={handleColorPick} />}

      {notification && (
        <div className="slide-up" style={{
          position: 'fixed', top: 8, left: '50%', transform: 'translateX(-50%)',
          background: '#1e3a5f', padding: '8px 16px', borderRadius: 8,
          fontWeight: 600, zIndex: 999, fontSize: isMobile ? '0.8rem' : '1rem',
          whiteSpace: 'nowrap', maxWidth: '90vw', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{notification}</div>
      )}

      {/* Steal window banner */}
      {game.stealWindow && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          background: '#ffd60a', color: '#111', padding: isMobile ? '6px 10px' : '8px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontWeight: 700, fontSize: isMobile ? '0.85rem' : '1rem', zIndex: 500,
        }}>
          <span>⚡ ROBAR TURNO</span>
          <div style={{ width: 80, height: 5, background: '#0003', borderRadius: 3, flexShrink: 0 }}>
            <div style={{ height: '100%', background: '#111', borderRadius: 3, width: `${(stealCountdown / 1500) * 100}%`, transition: 'width 0.05s linear' }} />
          </div>
          {myIndex !== game.currentPlayerIndex && <span style={{ fontSize: '0.75rem' }}>¡Rápido!</span>}
        </div>
      )}

      {/* Penalty banner */}
      {game.penalty && (
        <div style={{
          position: 'fixed', bottom: handHeight + 44, left: '50%', transform: 'translateX(-50%)',
          background: COLOR_BG[game.penalty.color] ?? '#555',
          color: game.penalty.color === 'yellow' ? '#111' : '#fff',
          padding: '6px 14px', borderRadius: 10, fontWeight: 700,
          fontSize: isMobile ? '0.8rem' : '1rem', zIndex: 400, whiteSpace: 'nowrap',
        }}>
          +{game.penalty.amount} {game.penalty.color}
          {isMyTurn && <span style={{ marginLeft: 8, opacity: 0.85 }}>— responde o roba</span>}
        </div>
      )}

      {/* Other players */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6,
        padding: game.stealWindow ? '36px 10px 6px' : '10px 10px 6px',
        justifyContent: 'center', flexShrink: 0,
      }}>
        {otherPlayers.map((p) => {
          const globalIdx = players.findIndex(x => x.id === p.id);
          const isActive = p.index === game.currentPlayerIndex;
          return (
            <div key={p.id} style={{
              background: isActive ? '#1e3a5f' : '#16213e',
              border: `2px solid ${isActive ? PLAYER_COLORS[globalIdx] : 'transparent'}`,
              borderRadius: 10, padding: isMobile ? '5px 8px' : '8px 12px',
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: p.connected ? 1 : 0.5,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.connected ? PLAYER_COLORS[globalIdx] : '#666', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: isMobile ? '0.75rem' : '0.9rem', lineHeight: 1.2 }}>
                  {p.name}{!p.connected && ' 📵'}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#aaa' }}>
                  {p.cardCount} cartas {p.saidUno && <span style={{ color: '#e63946', fontWeight: 700 }}>UNO!</span>}
                </div>
              </div>
              <div style={{ display: 'flex', marginLeft: 2 }}>
                {Array.from({ length: Math.min(p.cardCount, isMobile ? 4 : 5) }).map((_, ci) => (
                  <Card key={ci} facedown scale={facedownScale} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Center: draw pile + discard */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 20 : 40, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div onClick={() => isMyTurn && socket.emit('draw-card')} style={{ cursor: isMyTurn ? 'pointer' : 'default' }}>
            <Card facedown scale={centerScale} glow={isMyTurn && !game.stealWindow && !me.hand.some(c => isCardPlayable(c))} />
          </div>
          <span style={{ fontSize: '0.7rem', color: '#aaa' }}>{game.deck}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          {topCard && <Card card={topCard} scale={centerScale} declaredColor={game.declaredColor ?? undefined} glow={!!game.stealWindow} />}
          <span style={{
            fontSize: '0.7rem', padding: '2px 8px', borderRadius: 20,
            background: COLOR_BG[topColor] ?? '#555', color: topColor === 'yellow' ? '#111' : '#fff', fontWeight: 700,
          }}>{topColor}</span>
        </div>
      </div>

      {/* Turn indicator */}
      <div style={{ textAlign: 'center', padding: '4px 8px', fontSize: isMobile ? '0.8rem' : '0.9rem', color: '#aaa', flexShrink: 0 }}>
        {isMyTurn
          ? <span style={{ color: '#06d6a0', fontWeight: 700 }}>Tu turno</span>
          : <span>Turno de <strong>{currentPlayer?.name ?? '...'}</strong>{!currentPlayer?.connected ? ' 📵' : ''}</span>}
        <span style={{ marginLeft: 8, opacity: 0.5 }}>{game.direction === 1 ? '→' : '←'}</span>
      </div>

      {/* My hand */}
      <div style={{
        padding: '10px 10px 8px', background: '#0a0f1e', borderTop: '1px solid #1e3a5f',
        display: 'flex', gap: 6, overflowX: 'auto', overflowY: 'hidden',
        alignItems: 'flex-end', flexShrink: 0,
        WebkitOverflowScrolling: 'touch' as any, scrollbarWidth: 'none' as any,
      }}>
        {me.hand.map(card => (
          <Card
            key={card.id} card={card} scale={cardScale}
            playable={isCardPlayable(card)}
            onClick={() => handleCardClick(card)}
            glow={isCardPlayable(card) && (!!game.stealWindow || isMyTurn)}
          />
        ))}
      </div>

      {/* UNO button */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 10px', background: '#0a0f1e', flexShrink: 0 }}>
        <button
          className="btn-primary"
          style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: 2, padding: '8px 28px', borderRadius: 20, minHeight: 44 }}
          onClick={() => socket.emit('say-uno')}
        >
          UNO!
        </button>
      </div>
    </div>
  );
}

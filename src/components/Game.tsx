import { useEffect, useRef, useState } from 'react';
import { socket } from '../socket';
import { Card as CardType, Color, RoomView } from '../types';
import Card from './Card';
import ColorPicker from './ColorPicker';
import { canPlayClient, canStealClient, needsColorPick } from '../utils/rules';

interface Props { room: RoomView; myId: string; }

const COLOR_BG: Record<string, string> = {
  red: '#e63946', blue: '#0077b6', green: '#2dc653', yellow: '#ffd60a', wild: '#555',
};
const PLAYER_COLORS = ['#e63946','#2ec4b6','#f4a261','#a8dadc','#8338ec','#06d6a0','#fb5607','#ffbe0b'];

export default function Game({ room, myId }: Props) {
  const game = room.game!;
  const players = game.players;
  const myIndex = players.findIndex(p => p.id === myId);
  const me = players[myIndex];
  const isMyTurn = game.currentPlayerIndex === myIndex;
  const topCard = game.discardPile[game.discardPile.length - 1];

  const [pendingCard, setPendingCard] = useState<CardType | null>(null);
  const [stealCountdown, setStealCountdown] = useState(0);
  const [notification, setNotification] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Steal window countdown
  useEffect(() => {
    if (game.stealWindow) {
      const tick = () => {
        const remaining = Math.max(0, game.stealWindow!.expiresAt - Date.now());
        setStealCountdown(remaining);
      };
      tick();
      timerRef.current = setInterval(tick, 50);
    } else {
      setStealCountdown(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [game.stealWindow]);

  useEffect(() => {
    const handlers: Array<[string, (...args: any[]) => void]> = [
      ['turn-stolen',    ({ byPlayerName }: any) => showNotif(`⚡ ${byPlayerName} robó el turno!`)],
      ['penalty-deflected', ({ type, amount }: any) => showNotif(type === 'block' ? `🛡️ Bloqueado! +${amount} al siguiente` : `↩️ Reversa! +${amount} devuelto`)],
      ['uno-penalty',   ({ playerName }: any) => showNotif(`😬 ${playerName} olvidó decir UNO! +2 cartas`)],
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
    if (!canPlayClient(card, topCard, game.penalty)) return;
    if (needsColorPick(card)) { setPendingCard(card); return; }
    socket.emit('play-card', { cardId: card.id });
  }

  function stealCard(card: CardType) {
    if (!game.stealWindow || game.stealWindow.byPlayerIndex === myIndex) return;
    if (!canStealClient(card, game.stealWindow.card, game.penalty)) return;
    if (needsColorPick(card)) { setPendingCard(card); return; }
    socket.emit('steal-card', { cardId: card.id });
  }

  function handleCardClick(card: CardType) {
    if (game.stealWindow && game.stealWindow.byPlayerIndex !== myIndex) {
      stealCard(card);
    } else if (isMyTurn) {
      playCard(card);
    }
  }

  function handleColorPick(color: Color) {
    if (!pendingCard) return;
    const isSteal = game.stealWindow && game.stealWindow.byPlayerIndex !== myIndex;
    if (isSteal) {
      socket.emit('steal-card', { cardId: pendingCard.id, declaredColor: color });
    } else {
      socket.emit('play-card', { cardId: pendingCard.id, declaredColor: color });
    }
    setPendingCard(null);
  }

  function isCardPlayable(card: CardType): boolean {
    if (game.stealWindow && game.stealWindow.byPlayerIndex !== myIndex) {
      return canStealClient(card, game.stealWindow.card, game.penalty);
    }
    if (!isMyTurn) return false;
    return canPlayClient(card, topCard, game.penalty);
  }

  if (game.winner) {
    const winner = players.find(p => p.id === game.winner);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 24 }}>
        <div style={{ fontSize: '4rem' }}>🎉</div>
        <h1 style={{ color: '#e63946', fontSize: '2.5rem' }}>{winner?.name ?? 'Alguien'} ganó!</h1>
        {game.winner === myId && <p style={{ color: '#06d6a0', fontSize: '1.3rem' }}>¡Felicitaciones!</p>}
      </div>
    );
  }

  const currentPlayer = players[game.currentPlayerIndex];
  const otherPlayers = players.map((p, i) => ({ ...p, index: i })).filter(p => p.id !== myId);
  const topColor = topCard?.color === 'wild' ? (game.penalty?.color ?? 'wild') : topCard?.color ?? 'wild';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
      {pendingCard && <ColorPicker onPick={handleColorPick} />}

      {/* Notification */}
      {notification && (
        <div className="slide-up" style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: '#1e3a5f', padding: '10px 24px', borderRadius: 8,
          fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap',
        }}>{notification}</div>
      )}

      {/* Steal window banner */}
      {game.stealWindow && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          background: '#ffd60a', color: '#111', padding: '8px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          fontWeight: 700, fontSize: '1rem', zIndex: 500,
        }}>
          <span>⚡ ROBAR TURNO</span>
          <div style={{ width: 120, height: 6, background: '#0003', borderRadius: 3 }}>
            <div style={{ height: '100%', background: '#111', borderRadius: 3, width: `${(stealCountdown / 1500) * 100}%`, transition: 'width 0.05s linear' }} />
          </div>
          {game.stealWindow.byPlayerIndex !== myIndex &&
            <span style={{ fontSize: '0.85rem' }}>¡Juega la misma carta rápido!</span>
          }
        </div>
      )}

      {/* Penalty banner */}
      {game.penalty && (
        <div style={{
          position: 'fixed', bottom: 200, left: '50%', transform: 'translateX(-50%)',
          background: COLOR_BG[game.penalty.color] ?? '#555',
          color: game.penalty.color === 'yellow' ? '#111' : '#fff',
          padding: '8px 20px', borderRadius: 12, fontWeight: 700,
          fontSize: '1rem', zIndex: 400, whiteSpace: 'nowrap',
        }}>
          Acumulado: +{game.penalty.amount} — Color: {game.penalty.color}
          {isMyTurn && <span style={{ marginLeft: 12, opacity: 0.8 }}>(Responde o roba)</span>}
        </div>
      )}

      {/* Other players */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '56px 16px 8px', justifyContent: 'center' }}>
        {otherPlayers.map((p, i) => (
          <div key={p.id} style={{
            background: p.index === game.currentPlayerIndex ? '#1e3a5f' : '#16213e',
            border: p.index === game.currentPlayerIndex ? `2px solid ${PLAYER_COLORS[players.findIndex(x => x.id === p.id)]}` : '2px solid transparent',
            borderRadius: 12, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: PLAYER_COLORS[players.findIndex(x => x.id === p.id)] }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#aaa' }}>
                {p.cardCount} cartas {p.saidUno && <span style={{ color: '#e63946', fontWeight: 700 }}>UNO!</span>}
              </div>
            </div>
            {/* Show face-down cards fan */}
            <div style={{ display: 'flex' }}>
              {Array.from({ length: Math.min(p.cardCount, 5) }).map((_, ci) => (
                <Card key={ci} facedown scale={0.35} className="" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Center: draw pile + discard */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
        {/* Draw pile */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div onClick={() => isMyTurn && socket.emit('draw-card')}
            style={{ cursor: isMyTurn ? 'pointer' : 'default' }}>
            <Card facedown scale={0.9} glow={isMyTurn && !me?.hand.some(c => isCardPlayable(c))} />
          </div>
          <span style={{ fontSize: '0.75rem', color: '#aaa' }}>{game.deck} cartas</span>
        </div>

        {/* Discard pile */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          {topCard && (
            <Card
              card={topCard}
              scale={0.9}
              declaredColor={game.penalty?.color}
              glow={!!game.stealWindow}
            />
          )}
          <span style={{ fontSize: '0.75rem', padding: '2px 10px', borderRadius: 20, background: COLOR_BG[topColor], color: topColor === 'yellow' ? '#111' : '#fff', fontWeight: 700 }}>
            {topColor}
          </span>
        </div>
      </div>

      {/* Turn indicator */}
      <div style={{ textAlign: 'center', padding: '8px', fontSize: '0.9rem', color: '#aaa' }}>
        {isMyTurn ? <span style={{ color: '#06d6a0', fontWeight: 700 }}>Tu turno</span>
          : <span>Turno de <strong>{currentPlayer?.name}</strong></span>}
        <span style={{ marginLeft: 12, opacity: 0.5 }}>{game.direction === 1 ? '→' : '←'}</span>
      </div>

      {/* My hand */}
      <div style={{
        padding: '12px 16px 20px',
        background: '#0a0f1e',
        borderTop: '1px solid #1e3a5f',
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        alignItems: 'flex-end',
        minHeight: 140,
      }}>
        {me?.hand.map(card => (
          <Card
            key={card.id}
            card={card}
            scale={0.8}
            playable={isCardPlayable(card)}
            onClick={() => handleCardClick(card)}
            glow={isCardPlayable(card) && (!!game.stealWindow || isMyTurn)}
          />
        ))}
      </div>

      {/* UNO button */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 12px', background: '#0a0f1e' }}>
        <button
          className="btn-primary"
          style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: 2, padding: '8px 32px', borderRadius: 20 }}
          onClick={() => socket.emit('say-uno')}
        >
          UNO!
        </button>
      </div>
    </div>
  );
}

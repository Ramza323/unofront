import { useEffect, useRef, useState } from 'react';
import { socket } from './socket';
import { RoomView } from './types';
import Home from './components/Home';
import Lobby from './components/Lobby';
import Game from './components/Game';
import { UI_VERSION } from './version';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

type Screen = 'home' | 'lobby' | 'game';

const SESSION_KEY = 'uno_session';

export function saveSession(roomId: string, name: string) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ roomId, name }));
}
export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
export function getSession(): { roomId: string; name: string } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [room, setRoom] = useState<RoomView | null>(null);
  const [myId, setMyId] = useState('');
  const [error, setError] = useState('');
  const [reconnecting, setReconnecting] = useState(false);
  const [bkVersion, setBkVersion] = useState<string>('...');
  const screenRef = useRef<Screen>('home');

  useEffect(() => { screenRef.current = screen; }, [screen]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/version`)
      .then(r => r.json())
      .then(d => setBkVersion(d.version))
      .catch(() => setBkVersion('?'));
  }, []);

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      setMyId(socket.id ?? '');
      setReconnecting(false);

      // Intentar reconexión automática si hay sesión guardada
      const session = getSession();
      if (session && screenRef.current !== 'home') {
        socket.emit('rejoin-room', session);
      } else if (session && screenRef.current === 'home') {
        // Venimos de recarga: intentar reconectar
        socket.emit('rejoin-room', session);
      }
    });

    socket.on('disconnect', (reason) => {
      if (reason !== 'io client disconnect') {
        setReconnecting(true);
        setError('Conexión perdida. Reconectando...');
      }
    });

    socket.on('room-joined', (r: RoomView) => {
      setRoom(r);
      setReconnecting(false);
      setError('');
      setScreen(r.game?.started ? 'game' : 'lobby');
    });

    socket.on('rejoin-failed', () => {
      clearSession();
      setReconnecting(false);
      setScreen('home');
    });

    socket.on('room-updated', (r: RoomView) => {
      setRoom(r);
      setScreen(prev => {
        if (r.game?.started && prev !== 'game') return 'game';
        if (!r.game?.started && !r.game && prev === 'game') return 'lobby';
        return prev;
      });
    });

    socket.on('player-reconnected', ({ name }: { name: string }) => {
      setError(`${name} volvió a conectarse`);
    });

    socket.on('player-disconnected', ({ name }: { name: string }) => {
      setError(`${name} se desconectó`);
    });

    socket.on('error', ({ msg }: { msg: string }) => setError(msg));

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(''), 3500);
      return () => clearTimeout(t);
    }
  }, [error]);

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ position: 'fixed', bottom: 6, left: 10, fontSize: '0.65rem', color: '#333', zIndex: 1, pointerEvents: 'none', userSelect: 'none' }}>
        UI {UI_VERSION} · BK {bkVersion}
      </div>
      {error && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: reconnecting ? '#1e3a5f' : '#c1121f',
          color: '#fff', padding: '10px 24px',
          borderRadius: 8, zIndex: 9999, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {reconnecting && <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>}
          {error}
        </div>
      )}
      {screen === 'home' && <Home />}
      {screen === 'lobby' && room && <Lobby room={room} myId={myId} />}
      {screen === 'game' && room && <Game room={room} myId={myId} />}
    </div>
  );
}

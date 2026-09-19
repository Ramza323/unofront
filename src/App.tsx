import { useEffect, useState } from 'react';
import { socket } from './socket';
import { RoomView } from './types';
import Home from './components/Home';
import Lobby from './components/Lobby';
import Game from './components/Game';

type Screen = 'home' | 'lobby' | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [room, setRoom] = useState<RoomView | null>(null);
  const [myId, setMyId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    socket.connect();
    socket.on('connect', () => setMyId(socket.id ?? ''));
    socket.on('room-joined', (r: RoomView) => { setRoom(r); setScreen('lobby'); });
    socket.on('room-updated', (r: RoomView) => {
      setRoom(r);
      if (r.game?.started && screen !== 'game') setScreen('game');
    });
    socket.on('error', ({ msg }: { msg: string }) => setError(msg));

    return () => { socket.removeAllListeners(); socket.disconnect(); };
  }, []);

  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(''), 3000); return () => clearTimeout(t); }
  }, [error]);

  return (
    <div style={{ minHeight: '100vh' }}>
      {error && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: '#c1121f', color: '#fff', padding: '10px 24px',
          borderRadius: 8, zIndex: 9999, fontWeight: 600,
        }}>{error}</div>
      )}
      {screen === 'home' && <Home />}
      {screen === 'lobby' && room && <Lobby room={room} myId={myId} />}
      {screen === 'game' && room && <Game room={room} myId={myId} />}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { socket } from '../socket';
import { saveSession } from '../App';
import { startMusic } from '../utils/sounds';

export default function Home() {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [tab, setTab] = useState<'create' | 'join'>('create');

  useEffect(() => {
    startMusic();
    const tryPlay = () => startMusic();
    document.addEventListener('pointerdown', tryPlay, { once: true });
    return () => document.removeEventListener('pointerdown', tryPlay);
  }, []);

  const handleCreate = () => {
    if (!name.trim()) return;
    saveSession('', name.trim()); // roomId se actualiza en room-joined
    socket.emit('create-room', { name: name.trim() });
  };

  const handleJoin = () => {
    if (!name.trim() || !roomId.trim()) return;
    const id = roomId.trim().toUpperCase();
    saveSession(id, name.trim());
    socket.emit('join-room', { roomId: id, name: name.trim() });
  };

  // Detectar ?sala=XXXXX en URL para prellenar el código
  useState(() => {
    const params = new URLSearchParams(window.location.search);
    const sala = params.get('sala');
    if (sala) { setRoomId(sala.toUpperCase()); setTab('join'); }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 32, padding: 16 }}>
      <img src="/cartas.png" style={{ width: 80, height: 80, objectFit: 'none', objectPosition: '-5px -3px', borderRadius: 8 }} alt="UNO" />
      <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#e63946', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>UNO Online</h1>

      <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: 32, borderRadius: 16, width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 16, border: '1px solid rgba(255,255,255,0.07)' }}>
        <input
          placeholder="Tu nombre"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={20}
          onKeyDown={e => { if (e.key === 'Enter') tab === 'create' ? handleCreate() : handleJoin(); }}
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <button className={tab === 'create' ? 'btn-primary' : 'btn-secondary'} style={{ flex: 1 }} onClick={() => setTab('create')}>
            Crear sala
          </button>
          <button className={tab === 'join' ? 'btn-primary' : 'btn-secondary'} style={{ flex: 1 }} onClick={() => setTab('join')}>
            Unirse
          </button>
        </div>

        {tab === 'join' && (
          <input
            placeholder="Código de sala (ej: AB3K7)"
            value={roomId}
            onChange={e => setRoomId(e.target.value.toUpperCase())}
            maxLength={6}
            onKeyDown={e => { if (e.key === 'Enter') handleJoin(); }}
          />
        )}

        <button
          className="btn-primary"
          disabled={!name.trim() || (tab === 'join' && !roomId.trim())}
          onClick={tab === 'create' ? handleCreate : handleJoin}
        >
          {tab === 'create' ? 'Crear sala' : 'Unirse a sala'}
        </button>
      </div>
      <p style={{ color: '#666', fontSize: '0.85rem' }}>Hasta 8 jugadores por sala</p>
    </div>
  );
}

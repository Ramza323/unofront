import { useEffect, useState } from 'react';
import { socket } from '../socket';
import { RoomView } from '../types';
import { startMusic } from '../utils/sounds';

interface Props { room: RoomView; myId: string; }

export default function Lobby({ room, myId }: Props) {
  const [editingName, setEditingName] = useState('');
  const [editing, setEditing] = useState(false);

  const me = room.players.find(p => p.id === myId);
  const isHost = room.hostId === myId;
  const allReady = room.players.length >= 2 && room.players.every(p => p.isReady || p.id === room.hostId);

  const saveName = () => {
    if (editingName.trim()) socket.emit('change-name', { name: editingName.trim() });
    setEditing(false);
  };

  useEffect(() => { startMusic(); }, []);

  const colorFor = (i: number) => ['#e63946','#2ec4b6','#f4a261','#a8dadc','#8338ec','#06d6a0','#fb5607','#ffbe0b'][i % 8];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 24, padding: 24 }}>
      <h1 style={{ fontSize: '2rem', color: '#e63946' }}>Sala de Espera</h1>

      <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: 12, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(255,255,255,0.07)' }}>
        <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Código de sala:</span>
        <span style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 900, color: '#e63946', letterSpacing: 4 }}>{room.id}</span>
        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          onClick={() => navigator.clipboard.writeText(window.location.origin + '?sala=' + room.id)}>
          Copiar link
        </button>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: 24, borderRadius: 16, width: '100%', maxWidth: 440, border: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ marginBottom: 16 }}>
          {editing ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={editingName} onChange={e => setEditingName(e.target.value)} maxLength={20}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditing(false); }}
                autoFocus />
              <button className="btn-primary" onClick={saveName}>OK</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Tu nombre: <strong>{me?.name}</strong></span>
              <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                onClick={() => { setEditingName(me?.name ?? ''); setEditing(true); }}>
                Editar
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {room.players.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 8,
              background: p.id === myId ? 'rgba(31,43,94,0.7)' : 'rgba(0,0,0,0.3)',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: colorFor(i), flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{p.name}{p.id === room.hostId ? ' 👑' : ''}</span>
              <span style={{ fontSize: '0.8rem', color: p.isReady ? '#06d6a0' : '#aaa' }}>
                {p.id === room.hostId ? 'Host' : p.isReady ? 'Listo ✓' : 'Esperando...'}
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          {!isHost && (
            <button className={me?.isReady ? 'btn-secondary' : 'btn-primary'} style={{ flex: 1 }}
              onClick={() => socket.emit('toggle-ready')}>
              {me?.isReady ? 'Cancelar' : 'Estoy listo'}
            </button>
          )}
          {isHost && (
            <button className="btn-primary" style={{ flex: 1 }}
              disabled={room.players.length < 2}
              onClick={() => socket.emit('start-game')}>
              {room.players.length < 2 ? 'Esperando jugadores...' : 'Iniciar juego'}
            </button>
          )}
        </div>
        {room.players.length < 2 && <p style={{ color: '#666', fontSize: '0.8rem', marginTop: 8, textAlign: 'center' }}>Se necesitan al menos 2 jugadores</p>}
      </div>
    </div>
  );
}

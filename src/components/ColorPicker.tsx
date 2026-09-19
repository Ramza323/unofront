import { Color } from '../types';

interface Props {
  onPick: (color: Color) => void;
}

const COLORS: { color: Color; label: string; bg: string }[] = [
  { color: 'red',    label: 'Rojo',      bg: '#e63946' },
  { color: 'blue',   label: 'Azul',      bg: '#0077b6' },
  { color: 'green',  label: 'Verde',     bg: '#2dc653' },
  { color: 'yellow', label: 'Amarillo',  bg: '#ffd60a' },
];

export default function ColorPicker({ onPick }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{ background: '#16213e', padding: 32, borderRadius: 16, textAlign: 'center' }}>
        <h2 style={{ marginBottom: 24, color: '#eee' }}>Elige un color</h2>
        <div style={{ display: 'flex', gap: 16 }}>
          {COLORS.map(c => (
            <button
              key={c.color}
              onClick={() => onPick(c.color)}
              style={{
                background: c.bg, color: c.color === 'yellow' ? '#111' : '#fff',
                width: 80, height: 80, borderRadius: 12,
                fontSize: '0.85rem', fontWeight: 700,
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

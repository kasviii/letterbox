import React, { useMemo } from 'react';

const ENVELOPE_COUNT = 12;

const MOOD_COLORS = ['#c8b4c8', '#a8b89a', '#e8c4c4', '#d4a574', '#b0b8d4', '#c8c4b0'];

function Envelope({ style, color, rotation, scale }) {
  return (
    <div style={{
      position: 'fixed',
      pointerEvents: 'none',
      zIndex: 0,
      opacity: 0.18,
      transform: `rotate(${rotation}deg) scale(${scale})`,
      ...style,
    }}>
      <svg width="64" height="46" viewBox="0 0 64 46" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="46" rx="5" fill={color} fillOpacity="0.5"/>
        <rect x="0.75" y="0.75" width="62.5" height="44.5" rx="4.25" stroke={color} strokeWidth="1.5"/>
        <path d="M2 2L32 26L62 2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

function FloatingEnvelopes() {
  const envelopes = useMemo(() => {
    return Array.from({ length: ENVELOPE_COUNT }, (_, i) => ({
      id: i,
      left: `${5 + Math.random() * 90}%`,
      top: `${5 + Math.random() * 90}%`,
      color: MOOD_COLORS[i % MOOD_COLORS.length],
      rotation: Math.random() * 40 - 20,
      scale: 0.7 + Math.random() * 0.7,
      animDuration: `${6 + Math.random() * 6}s`,
      animDelay: `${Math.random() * 5}s`,
    }));
  }, []);

  return (
    <>
      <style>{`
        @keyframes bgFloat {
          0%, 100% { transform: translateY(0px) rotate(var(--rot)); }
          50% { transform: translateY(-18px) rotate(calc(var(--rot) + 4deg)); }
        }
      `}</style>
      {envelopes.map(env => (
        <div
          key={env.id}
          style={{
            position: 'fixed',
            left: env.left,
            top: env.top,
            pointerEvents: 'none',
            zIndex: 0,
            opacity: 0.16,
            '--rot': `${env.rotation}deg`,
            transform: `rotate(${env.rotation}deg) scale(${env.scale})`,
            animation: `bgFloat ${env.animDuration} ease-in-out ${env.animDelay} infinite`,
          }}
        >
          <svg width="64" height="46" viewBox="0 0 64 46" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="64" height="46" rx="5" fill={env.color} fillOpacity="0.6"/>
            <rect x="0.75" y="0.75" width="62.5" height="44.5" rx="4.25" stroke={env.color} strokeWidth="1.5"/>
            <path d="M2 2L32 26L62 2" stroke={env.color} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      ))}
    </>
  );
}

export default FloatingEnvelopes;
'use client';

import React from 'react';

interface WaveformProps {
  animate?: boolean;
}

export const Waveform: React.FC<WaveformProps> = ({ animate = false }) => {
  const bars = 30;
  return (
    <div className="flex items-center justify-center gap-2 h-20">
      {[...Array(bars)].map((_, i) => (
        <div
          key={i}
          className={`w-1 bg-yellow-400 rounded-full transition-all duration-300 ${
            animate ? 'animate-pulse' : ''
          }`}
          style={{
            height: `${30 + Math.sin(i * 0.3) * 30}%`,
            animationDelay: `${i * 50}ms`,
          }}
        />
      ))}
    </div>
  );
};
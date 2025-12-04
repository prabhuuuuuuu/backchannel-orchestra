'use client';

import React from 'react';
import { GlassCard } from './GlassCard';

export const WaveformVisualization = () => {
  return (
    <GlassCard hover={false} className="max-w-3xl mx-auto">
      <div className="h-32 flex items-center justify-center">
        <div className="flex items-center gap-1">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 bg-gradient-to-t from-yellow-400 to-amber-500 rounded-full animate-pulse"
              style={{
                height: `${Math.random() * 80 + 20}px`,
                animationDelay: `${i * 0.05}s`,
                animationDuration: '1.5s'
              }}
            />
          ))}
        </div>
      </div>
    </GlassCard>
  );
};
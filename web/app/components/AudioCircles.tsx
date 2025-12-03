import React from 'react';

export const AudioCircles: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 border border-cyan-500/10 rounded-full animate-ping" 
           style={{ animationDuration: '3s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 border border-cyan-500/10 rounded-full animate-ping" 
           style={{ animationDuration: '4s', animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-1/3 w-48 h-48 border border-cyan-500/10 rounded-full animate-ping" 
           style={{ animationDuration: '5s', animationDelay: '2s' }} />
    </div>
  );
};

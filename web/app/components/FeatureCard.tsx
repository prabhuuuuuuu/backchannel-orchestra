'use client';

import React, { useState } from 'react';

interface FeatureCardProps {
  number: string;
  title: string;
  description: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ 
  number,
  title, 
  description
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`p-8 bg-zinc-900/50 backdrop-blur-sm rounded-3xl border border-yellow-400/20 transition-all duration-300 ${
        isHovered ? 'border-yellow-400/60 bg-zinc-900/70 animate-shake' : ''
      }`}
    >
      <div className="text-6xl font-black text-yellow-400/20 mb-4">{number}</div>
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
};
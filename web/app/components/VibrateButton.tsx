'use client';

import React, { useState } from 'react';

interface VibrateButtonProps {
  children: React.ReactNode;
  primary?: boolean;
  onClick?: () => void;
  href?: string;
}

export const VibrateButton: React.FC<VibrateButtonProps> = ({ 
  children, 
  primary = false, 
  onClick, 
  href 
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  
  const baseClasses = primary
    ? "px-8 py-4 bg-cyan-600 text-white text-lg font-bold border-2 border-cyan-400"
    : "px-6 py-3 bg-transparent text-cyan-400 border-2 border-cyan-400/50 hover:border-cyan-400";
  
  const ButtonComponent = href ? 'a' : 'button';
  
  return (
    <ButtonComponent
      href={href}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`${baseClasses} relative overflow-hidden transition-all duration-200 ${
        isHovered ? 'animate-shake' : ''
      }`}
      style={{
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {isHovered && (
        <div className="absolute inset-0 bg-cyan-400/10" />
      )}
    </ButtonComponent>
  );
};

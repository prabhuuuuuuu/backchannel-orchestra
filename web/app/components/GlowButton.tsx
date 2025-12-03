'use client';

import React, { useState } from 'react';

interface GlowButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  href?: string;
  className?: string;
}

export const GlowButton: React.FC<GlowButtonProps> = ({ 
  children, 
  variant = 'primary',
  onClick, 
  href,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  
  const variants = {
    primary: "bg-gradient-to-r from-yellow-400 to-pink-500 text-black font-bold hover:from-yellow-300 hover:to-pink-400 shadow-lg shadow-yellow-500/50 hover:shadow-yellow-500/70",
    secondary: "bg-black/40 backdrop-blur-sm text-yellow-400 border-2 border-yellow-400/30 hover:border-yellow-400 hover:bg-yellow-400/10"
  };
  
  const ButtonComponent = href ? 'a' : 'button';
  
  return (
    <ButtonComponent
      href={href}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`${variants[variant]} px-8 py-4 rounded-full transition-all duration-300 relative overflow-hidden ${
        isHovered ? 'scale-105 animate-shake' : ''
      } ${className}`}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
      {isHovered && variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-yellow-300 opacity-20 animate-pulse" />
      )}
    </ButtonComponent>
  );
};
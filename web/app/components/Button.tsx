'use client';

import React, { useState } from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  href?: string;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary',
  href,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  
  const baseStyles = "px-8 py-4 rounded-full font-semibold transition-all duration-200 inline-flex items-center gap-3";
  
  const variants = {
    primary: "bg-yellow-400 text-black hover:bg-yellow-300",
    secondary: "bg-transparent border-2 border-yellow-400/50 text-yellow-400 hover:border-yellow-400"
  };
  
  const Component = href ? 'a' : 'button';
  
  return (
    <Component
      href={href}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`${baseStyles} ${variants[variant]} ${isHovered ? 'scale-105 animate-shake' : ''} ${className}`}
    >
      {children}
    </Component>
  );
};
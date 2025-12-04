import React from 'react';

interface GlassButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  onClick?: () => void;
}

export const GlassButton = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  onClick 
}: GlassButtonProps) => {
  const variants = {
    primary: 'bg-gradient-to-br from-yellow-400/20 to-amber-500/20 border-yellow-400/30 hover:from-yellow-400/30 hover:to-amber-500/30 text-yellow-400 shadow-yellow-400/20',
    secondary: 'bg-white/5 border-white/10 hover:bg-white/10 text-white shadow-white/10',
    ghost: 'bg-white/[0.02] border-white/5 hover:bg-white/5 text-gray-300'
  };

  return (
    <button
      onClick={onClick}
      className={`
        group relative px-8 py-4 rounded-2xl
        backdrop-blur-xl border
        transition-all duration-300
        hover:scale-[1.02] hover:shadow-2xl
        active:scale-[0.98]
        ${variants[variant]}
        ${className}
      `}
    >
      <div className="relative z-10 flex items-center gap-3 font-semibold">
        {children}
      </div>
      {/* Shine effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12" />
    </button>
  );
};
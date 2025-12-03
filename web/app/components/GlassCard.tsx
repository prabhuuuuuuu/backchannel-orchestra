import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const GlassCard = ({ children, className = '', hover = true }: GlassCardProps) => {
  return (
    <div
      className={`
        relative group
        bg-gradient-to-br from-white/[0.07] to-white/[0.02]
        backdrop-blur-2xl
        border border-white/10
        rounded-3xl p-8
        shadow-2xl shadow-black/20
        transition-all duration-500
        ${hover ? 'hover:border-white/20 hover:shadow-white/5 hover:scale-[1.02]' : ''}
        ${className}
      `}
    >
      {/* Inner glow */}
      <div className="absolute inset-[1px] rounded-3xl bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Ambient light effect */}
      {hover && (
        <div className="absolute -inset-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-radial from-yellow-400/5 via-transparent to-transparent blur-3xl" />
        </div>
      )}
    </div>
  );
};
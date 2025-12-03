'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-white/5 border border-white/10"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Menu Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-6 right-6 mt-4">
          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-4 space-y-2">
            <Link 
              href="/features"
              className="block px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="/pricing"
              className="block px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Pricing
            </Link>
            <Link 
              href="/signin"
              className="block px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
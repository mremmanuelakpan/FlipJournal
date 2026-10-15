import React from 'react';
import { Theme } from '../types/journal';
import { getTheme } from '../utils/theme';

interface SpiralBindingProps {
  ringCount?: number;
  className?: string;
  theme?: Theme;
}

export const SpiralBinding: React.FC<SpiralBindingProps> = ({
  ringCount = 22,
  className = '',
  theme = 'forest',
}) => {
  const rings = Array.from({ length: ringCount });
  const themeConfig = getTheme(theme);

  return (
    <div
      className={`hidden lg:flex flex-col justify-between items-center w-10 sm:w-12 h-full absolute left-1/2 -translate-x-1/2 top-0 bottom-0 z-30 pointer-events-none select-none py-6 ${className}`}
      aria-hidden="true"
    >
      {/* Center spine gutter / page divider trough matching the theme color */}
      <div
        className="absolute inset-y-0 w-8 sm:w-9 shadow-[inset_0_0_10px_rgba(0,0,0,0.8),0_0_4px_rgba(0,0,0,0.3)] z-0 transition-colors duration-500 border-l border-r border-black/40"
        style={{
          background: `linear-gradient(to right, rgba(0,0,0,0.65) 0%, ${themeConfig.bookCoverBg} 25%, ${themeConfig.navbarBg} 50%, ${themeConfig.bookCoverBg} 75%, rgba(0,0,0,0.65) 100%)`,
        }}
      />

      {rings.map((_, i) => (
        <div key={i} className="relative w-full h-5 flex items-center justify-between px-1 z-10">
          {/* Left punched hole on left page margin */}
          <div
            className="w-2.5 h-3.5 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.85),0_1px_1px_rgba(255,255,255,0.4)] border"
            style={{
              backgroundColor: '#201b14',
              borderColor: '#17140f',
            }}
          />

          {/* Realistic metallic Wire-O spiral ring */}
          <div className="absolute left-1/2 -translate-x-1/2 w-8 sm:w-9 h-3.5 rounded-full shadow-[0_3px_5px_rgba(0,0,0,0.6)] border-t border-b border-[#dfc187]/80 bg-gradient-to-b from-[#dfc187] via-[#a88242] to-[#5a421b] transform -rotate-3 hover:scale-105 transition-transform">
            {/* Metallic light highlight line */}
            <div className="w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#fff4d6] to-transparent opacity-90 mt-[1px]" />
          </div>

          {/* Right punched hole on right page margin */}
          <div
            className="w-2.5 h-3.5 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.85),0_1px_1px_rgba(255,255,255,0.4)] border"
            style={{
              backgroundColor: '#201b14',
              borderColor: '#17140f',
            }}
          />
        </div>
      ))}
    </div>
  );
};

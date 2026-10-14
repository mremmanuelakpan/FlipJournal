import React from 'react';

interface SpiralBindingProps {
  ringCount?: number;
  className?: string;
}

export const SpiralBinding: React.FC<SpiralBindingProps> = ({ ringCount = 22, className = '' }) => {
  const rings = Array.from({ length: ringCount });

  return (
    <div
      className={`hidden lg:flex flex-col justify-between items-center w-10 sm:w-12 h-full absolute left-1/2 -translate-x-1/2 top-0 bottom-0 z-30 pointer-events-none select-none py-6 ${className}`}
      aria-hidden="true"
    >
      {/* Center spine shadow trough */}
      <div className="absolute inset-y-0 w-8 bg-gradient-to-r from-black/25 via-black/45 to-black/25 -z-10" />

      {rings.map((_, i) => (
        <div key={i} className="relative w-full h-5 flex items-center justify-between px-1">
          {/* Left punched hole on left page margin */}
          <div className="w-2.5 h-3.5 rounded-full bg-[#2a241b] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_1px_rgba(255,255,255,0.4)] border border-[#1b1712]" />

          {/* Realistic metallic Wire-O spiral ring */}
          <div className="absolute left-1/2 -translate-x-1/2 w-8 sm:w-9 h-3.5 rounded-full shadow-[0_3px_5px_rgba(0,0,0,0.55)] border-t border-b border-[#dfc187]/80 bg-gradient-to-b from-[#dfc187] via-[#a88242] to-[#5a421b] transform -rotate-3 hover:scale-105 transition-transform">
            {/* Metallic light highlight line */}
            <div className="w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#fff4d6] to-transparent opacity-90 mt-[1px]" />
          </div>

          {/* Right punched hole on right page margin */}
          <div className="w-2.5 h-3.5 rounded-full bg-[#2a241b] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_1px_rgba(255,255,255,0.4)] border border-[#1b1712]" />
        </div>
      ))}
    </div>
  );
};

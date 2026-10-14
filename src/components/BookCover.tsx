import React from 'react';
import { BookOpen, Sparkles, Key, ShieldCheck } from 'lucide-react';
import { Theme } from '../types/journal';

interface BookCoverProps {
  theme: Theme;
  onOpenBook: () => void;
  isAuthenticated: boolean;
  userDisplayName?: string | null;
  onOpenAuth: () => void;
}

export const BookCover: React.FC<BookCoverProps> = ({
  theme,
  onOpenBook,
  isAuthenticated,
  userDisplayName,
  onOpenAuth,
}) => {
  const getThemeClass = (t: Theme) => {
    switch (t) {
      case 'burgundy':
        return 'theme-burgundy';
      case 'navy':
        return 'theme-navy';
      case 'parchment':
        return 'theme-parchment';
      default:
        return 'book-cover-surface';
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 lg:p-10 perspective-container">
      {/* 3D Realistic Hardcover */}
      <div
        className={`relative w-full max-w-[460px] sm:max-w-[520px] aspect-[1/1.38] rounded-r-2xl rounded-l-md p-6 sm:p-10 text-stone-200 transition-all duration-700 ease-out transform hover:-rotate-y-2 hover:scale-[1.01] ${getThemeClass(
          theme
        )}`}
        style={{
          boxShadow:
            'inset 4px 0 10px rgba(255,255,255,0.06), inset -6px 0 15px rgba(0,0,0,0.6), 25px 25px 50px rgba(0,0,0,0.8), 5px 10px 20px rgba(0,0,0,0.5)',
        }}
      >
        {/* Left Book Spine visual ridge */}
        <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-10 rounded-l-md book-spine-gradient border-r border-amber-900/30 flex flex-col justify-between py-8 items-center pointer-events-none">
          <div className="w-full h-1 bg-amber-400/20 shadow-sm" />
          <div className="w-full h-1 bg-amber-400/20 shadow-sm" />
          <div className="w-full h-1 bg-amber-400/20 shadow-sm" />
          <div className="w-full h-1 bg-amber-400/20 shadow-sm" />
        </div>

        {/* Layered Paper Edges protruding from right edge */}
        <div className="absolute -right-3 top-3 bottom-3 w-3 bg-[#e6decb] rounded-r-sm paper-stack-edges-right pointer-events-none opacity-90 hidden sm:block" />
        <div className="absolute -bottom-2.5 left-8 right-2 h-2.5 bg-[#d9cfba] rounded-b-sm paper-stack-edges-bottom pointer-events-none opacity-90" />

        {/* Gold Ribbon Bookmark peaking out from top */}
        <div className="absolute left-1/3 -top-6 w-7 h-16 ribbon-bookmark z-10 pointer-events-none" />

        {/* Embossed Gold Foil Outer Border */}
        <div className="relative h-full w-full border-2 border-[#c5a66a]/60 rounded-r-xl rounded-l-sm p-4 sm:p-8 flex flex-col justify-between items-center text-center">
          {/* Inner Corner Filigree Accents */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#dfc187]/70" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#dfc187]/70" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#dfc187]/70" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#dfc187]/70" />

          {/* Top Emblem */}
          <div className="pt-2 sm:pt-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[#c5a66a]/40 bg-black/20 mb-2">
              <Sparkles className="w-5 h-5 text-[#dfc187]" />
            </div>
            <p className="text-[11px] sm:text-xs tracking-[0.3em] uppercase text-[#dfc187]/80 font-cinzel">
              Private Journal & Ledger
            </p>
          </div>

          {/* Center Main Title */}
          <div className="my-auto py-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-cinzel font-bold tracking-wider gold-foil-text uppercase mb-3">
              The Journal
            </h1>
            <div className="w-24 h-[1.5px] mx-auto gold-foil-accent my-3 rounded-full opacity-80" />
            <p className="font-cormorant italic text-lg sm:text-xl text-[#f3e5c8] max-w-xs mx-auto leading-snug">
              A little more intentional, every day.
            </p>
            {isAuthenticated && userDisplayName && (
              <p className="text-xs uppercase tracking-widest text-[#dfc187]/70 font-cinzel mt-4">
                Kept by {userDisplayName}
              </p>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="w-full space-y-3 pb-2 z-10">
            <button
              onClick={onOpenBook}
              className="w-full py-3.5 px-6 rounded-lg text-sm sm:text-base font-cinzel font-semibold tracking-wider text-stone-900 bg-gradient-to-r from-[#dfc187] via-[#c5a66a] to-[#dfc187] hover:brightness-110 active:scale-[0.99] transition-all shadow-lg flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <BookOpen className="w-5 h-5 text-stone-900" />
              <span>{isAuthenticated ? 'Open Journal' : 'Explore The Journal'}</span>
            </button>

            {!isAuthenticated ? (
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={onOpenAuth}
                  className="text-xs text-[#dfc187]/80 hover:text-[#dfc187] hover:underline transition-colors flex items-center gap-1.5 py-1 px-3 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Sign In / Create Account</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#dfc187]/70">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/80" />
                <span>Protected with Private Authentication & RLS</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

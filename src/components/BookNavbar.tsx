import React from 'react';
import {
  Book,
  Calendar,
  Target,
  CheckCircle2,
  BookOpenCheck,
  Settings,
  BookMarked,
  RotateCcw,
  AlertCircle,
  CloudCheck,
  CloudUpload,
  User,
} from 'lucide-react';
import { BookSection, SaveStatus } from '../types/journal';

interface BookNavbarProps {
  activeSection: BookSection;
  onSelectSection: (section: BookSection) => void;
  onCloseBook: () => void;
  saveStatus: SaveStatus;
  onRetrySave?: () => void;
  isAuthenticated: boolean;
  userEmail?: string;
  onOpenAuth: () => void;
}

export const BookNavbar: React.FC<BookNavbarProps> = ({
  activeSection,
  onSelectSection,
  onCloseBook,
  saveStatus,
  onRetrySave,
  isAuthenticated,
  userEmail,
  onOpenAuth,
}) => {
  const navItems: { id: BookSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'journal', label: 'Journal', icon: Book },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'habits', label: 'Habits', icon: CheckCircle2 },
    { id: 'reviews', label: 'Review', icon: BookOpenCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderSaveIndicator = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-1.5 text-xs text-amber-300 animate-pulse">
            <CloudUpload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Saving…</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-1.5 text-xs text-stone-400">
            <CloudCheck className="w-3.5 h-3.5 text-emerald-400/90" />
            <span className="hidden sm:inline">Saved</span>
          </div>
        );
      case 'unsaved':
        return (
          <div className="flex items-center gap-1.5 text-xs text-stone-400">
            <div className="w-2 h-2 rounded-full bg-amber-400/80" />
            <span className="hidden sm:inline">Draft local</span>
          </div>
        );
      case 'conflict':
        return (
          <div className="flex items-center gap-1.5 text-xs text-rose-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Conflict</span>
          </div>
        );
      case 'error':
        return (
          <button
            onClick={onRetrySave}
            className="flex items-center gap-1.5 text-xs text-rose-300 hover:text-rose-100 transition-colors cursor-pointer"
            title="Click to retry save"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry save</span>
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <header className="w-full bg-[#1b362a] border-b border-[#2d5845] text-stone-200 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-6 shadow-md select-none sticky top-0 z-40">
      {/* Zone 1: Brand & Close Book Action */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <button
          onClick={onCloseBook}
          className="flex items-center gap-2 py-1 px-2.5 rounded hover:bg-black/20 text-[#dfc187] transition-all cursor-pointer group"
          title="Close Journal and return to cover"
        >
          <BookMarked className="w-4 h-4 text-[#dfc187] group-hover:scale-105 transition-transform" />
          <span className="font-cinzel font-bold text-sm tracking-widest whitespace-nowrap hidden md:inline">
            THE JOURNAL
          </span>
        </button>
      </div>

      {/* Zone 2: Navigation Links (Tactile Ribbon Bookmarks) */}
      <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#c5a66a] text-stone-900 font-semibold shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-stone-900' : 'text-stone-300'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Save Status Indicator & Account Profile */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {activeSection === 'journal' && renderSaveIndicator()}

        {isAuthenticated ? (
          <button
            onClick={() => onSelectSection('settings')}
            className="flex items-center gap-1.5 text-xs text-stone-300 hover:text-white bg-black/20 px-2.5 py-1.5 rounded transition-colors cursor-pointer"
            title={userEmail || 'Account Settings'}
          >
            <User className="w-3.5 h-3.5 text-[#dfc187]" />
            <span className="max-w-[100px] truncate hidden sm:inline">{userEmail?.split('@')[0]}</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="text-xs bg-[#c5a66a]/20 border border-[#c5a66a]/60 text-[#dfc187] hover:bg-[#c5a66a]/30 px-2.5 py-1.5 rounded transition-colors cursor-pointer font-medium"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};

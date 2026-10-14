import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar as CalendarIcon,
  Filter,
  X,
  BookOpen,
  Smile,
  FileText,
} from 'lucide-react';
import { JournalEntry, Mood, Profile } from '../types/journal';
import { SpiralBinding } from './SpiralBinding';
import { getTheme } from '../utils/theme';

interface CalendarHistoryProps {
  entries: JournalEntry[];
  onOpenEntry: (entry: JournalEntry) => void;
  onNewEntryForDate: (dateStr: string) => void;
  profile: Profile;
}

const MOOD_FILTERS: { id: Mood | 'all'; label: string; symbol?: string }[] = [
  { id: 'all', label: 'All Moods' },
  { id: 'calm', label: 'Calm', symbol: '🍃' },
  { id: 'grateful', label: 'Grateful', symbol: '✨' },
  { id: 'focused', label: 'Focused', symbol: '🎯' },
  { id: 'reflective', label: 'Reflective', symbol: '🌙' },
  { id: 'energized', label: 'Energized', symbol: '⚡' },
  { id: 'anxious', label: 'Anxious', symbol: '🌊' },
  { id: 'tired', label: 'Tired', symbol: '🍂' },
  { id: 'content', label: 'Content', symbol: '☕' },
];

export const CalendarHistory: React.FC<CalendarHistoryProps> = ({
  entries,
  onOpenEntry,
  onNewEntryForDate,
  profile,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<Mood | 'all'>('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [activeDate, setActiveDate] = useState<string | null>(null);

  // Month navigation
  const prevMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  };
  const goToToday = () => {
    const now = new Date();
    setSelectedMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setActiveDate(now.toISOString().split('T')[0]);
  };

  // Calendar days generation
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  // Account for profile.week_starts_on (0 = Sun, 1 = Mon)
  const offset = (firstDayIndex - profile.week_starts_on + 7) % 7;

  // Group entries by date
  const entriesByDate = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    for (const entry of entries) {
      const list = map.get(entry.journal_date) || [];
      list.push(entry);
      map.set(entry.journal_date, list);
    }
    return map;
  }, [entries]);

  // Filtered search results
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Date range filter
      if (startDateFilter && entry.journal_date < startDateFilter) return false;
      if (endDateFilter && entry.journal_date > endDateFilter) return false;

      // Active selected calendar date filter
      if (activeDate && entry.journal_date !== activeDate) return false;

      // Mood filter
      if (selectedMood !== 'all' && entry.mood !== selectedMood) return false;

      // Text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = entry.title?.toLowerCase().includes(q) || false;
        const inBody = entry.body.toLowerCase().includes(q);
        const inSections = JSON.stringify(entry.sections).toLowerCase().includes(q);
        if (!inTitle && !inBody && !inSections) return false;
      }

      return true;
    });
  }, [entries, searchQuery, selectedMood, startDateFilter, endDateFilter, activeDate]);

  const monthName = selectedMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const weekDays = profile.week_starts_on === 1 ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const themeConfig = getTheme(profile.theme);

  return (
    <div className="w-full max-w-7xl mx-auto py-3 sm:py-5 px-2 sm:px-4">
      <div
        className="relative rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] border-2 border-[#c5a66a]/60 p-3 sm:p-4 lg:p-5 transition-colors duration-500"
        style={themeConfig.bookCoverStyle}
      >
        <div className="absolute inset-1.5 sm:inset-2 rounded-xl border border-[#c5a66a]/30 pointer-events-none" />

        <div className="relative rounded-lg overflow-hidden bg-[#f7f2e8] border border-[#d6c7ab] shadow-[0_2px_4px_rgba(0,0,0,0.08),2px_2px_0px_#ede4d4,4px_4px_0px_#dfd2bc,0_16px_36px_-6px_rgba(0,0,0,0.5)]">
          <SpiralBinding ringCount={22} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[660px]">
            {/* ========================================================= */}
            {/* LEFT PAGE: Interactive Calendar & Date Filters           */}
            {/* ========================================================= */}
            <div className="paper-surface paper-surface-left p-6 sm:p-8 lg:p-9 lg:pr-12 border-b lg:border-b-0 lg:border-r border-[#d9ceb9] flex flex-col justify-between text-stone-800">
              <div>
                <div className="border-b border-stone-300/80 pb-3 mb-5 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-cinzel tracking-[0.25em] uppercase text-stone-500 block mb-1">
                      Historical Archive
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-cormorant font-semibold text-stone-900">
                      The Calendar Ledger
                    </h2>
                  </div>
                  <button
                    onClick={goToToday}
                    className="px-2.5 py-1 text-xs font-cinzel bg-stone-200 hover:bg-stone-300 text-stone-800 rounded transition-colors cursor-pointer"
                  >
                    Today
                  </button>
                </div>

              {/* Month Navigation Header */}
              <div className="flex items-center justify-between mb-4 bg-stone-200/40 p-2 rounded">
                <button
                  onClick={prevMonth}
                  className="p-1 hover:bg-stone-300/60 rounded text-stone-700 transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-cinzel font-semibold text-stone-900 tracking-wider">
                  {monthName}
                </span>
                <button
                  onClick={nextMonth}
                  className="p-1 hover:bg-stone-300/60 rounded text-stone-700 transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center mb-6">
                {weekDays.map((d) => (
                  <span key={d} className="text-[11px] font-cinzel font-semibold text-stone-500 py-1">
                    {d}
                  </span>
                ))}

                {/* Empty offset days */}
                {Array.from({ length: offset }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-10" />
                ))}

                {/* Month Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const dayEntries = entriesByDate.get(dateStr) || [];
                  const hasEntries = dayEntries.length > 0;
                  const isSelected = activeDate === dateStr;
                  const isToday = dateStr === new Date().toISOString().split('T')[0];

                  return (
                    <button
                      key={dayNum}
                      onClick={() => {
                        if (activeDate === dateStr) {
                          setActiveDate(null);
                        } else {
                          setActiveDate(dateStr);
                        }
                      }}
                      className={`h-11 rounded-md flex flex-col items-center justify-between py-1 transition-all relative cursor-pointer ${
                        isSelected
                          ? 'bg-[#244637] text-amber-100 shadow-md font-bold'
                          : hasEntries
                          ? 'bg-amber-100/70 hover:bg-amber-200/80 text-stone-900 border border-amber-300/60'
                          : 'hover:bg-stone-200/60 text-stone-700'
                      }`}
                    >
                      <span className={`text-xs ${isToday ? 'underline decoration-amber-600 decoration-2 font-bold' : ''}`}>
                        {dayNum}
                      </span>
                      {hasEntries && (
                        <div className="flex gap-0.5 mt-auto">
                          {dayEntries.slice(0, 3).map((_, idx) => (
                            <span
                              key={idx}
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected ? 'bg-amber-300' : 'bg-[#244637]'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active date details callout */}
              {activeDate && (
                <div className="bg-stone-100 p-3 rounded-lg border border-stone-300/80 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-cinzel font-semibold text-stone-800">
                      Entries on {activeDate}
                    </span>
                    <button
                      onClick={() => setActiveDate(null)}
                      className="text-stone-400 hover:text-stone-700 text-xs"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onNewEntryForDate(activeDate)}
                      className="text-xs px-3 py-1.5 rounded bg-[#244637] text-amber-100 hover:bg-[#1b362a] transition-colors cursor-pointer"
                    >
                      + Write New Entry for {activeDate}
                    </button>
                  </div>
                </div>
              )}

              {/* Date Range & Mood Filters */}
              <div className="space-y-3 pt-3 border-t border-stone-300/60">
                <div className="flex items-center gap-1.5 text-xs font-cinzel text-stone-600 uppercase">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter by Mood & Date</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {MOOD_FILTERS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMood(m.id)}
                      className={`text-[11px] px-2 py-0.5 rounded transition-colors cursor-pointer ${
                        selectedMood === m.id
                          ? 'bg-[#244637] text-amber-100 font-semibold'
                          : 'bg-stone-200/80 text-stone-700 hover:bg-stone-300'
                      }`}
                    >
                      {m.symbol && <span className="mr-1">{m.symbol}</span>}
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-cinzel text-stone-500 block mb-0.5">From</label>
                    <input
                      type="date"
                      value={startDateFilter}
                      onChange={(e) => setStartDateFilter(e.target.value)}
                      className="w-full text-xs bg-stone-200/50 border border-stone-300 rounded px-2 py-1 text-stone-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-cinzel text-stone-500 block mb-0.5">To</label>
                    <input
                      type="date"
                      value={endDateFilter}
                      onChange={(e) => setEndDateFilter(e.target.value)}
                      className="w-full text-xs bg-stone-200/50 border border-stone-300 rounded px-2 py-1 text-stone-800 focus:outline-none"
                    />
                  </div>
                </div>

                {(startDateFilter || endDateFilter || selectedMood !== 'all' || activeDate) && (
                  <button
                    onClick={() => {
                      setStartDateFilter('');
                      setEndDateFilter('');
                      setSelectedMood('all');
                      setActiveDate(null);
                    }}
                    className="text-xs text-amber-900/80 hover:text-amber-950 underline flex items-center gap-1 pt-1 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    Reset all filters
                  </button>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-stone-300/60 text-[11px] font-cinzel text-stone-400 flex items-center justify-between">
              <span>Total Entries Kept: {entries.length}</span>
              <span>Ledger Page 1</span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT PAGE: Search Bar & Chronological Entry Index       */}
          {/* ========================================================= */}
          <div className="paper-surface paper-surface-right p-6 sm:p-8 lg:p-9 lg:pl-12 flex flex-col justify-between text-stone-800">
            <div className="flex-1 flex flex-col">
              <div className="border-b border-stone-300/80 pb-3 mb-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-cinzel tracking-[0.25em] uppercase text-stone-500 block">
                    Chronological Index
                  </span>
                  <h3 className="text-xl font-cormorant font-semibold text-stone-900">
                    Search & Entries Record
                  </h3>
                </div>
                <span className="text-xs font-mono text-stone-500">
                  {filteredEntries.length} results
                </span>
              </div>

              {/* Search Bar Input */}
              <div className="relative mb-5">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search entries by title, thoughts, keywords…"
                  className="w-full bg-stone-200/60 border border-stone-300/80 rounded-md pl-9 pr-8 py-2 text-xs font-serif text-stone-900 placeholder:text-stone-400 placeholder:italic focus:outline-none focus:border-[#244637] focus:bg-stone-200/90 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Entries List */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {filteredEntries.length === 0 ? (
                  <div className="text-center py-12 px-4 border border-dashed border-stone-300 rounded-lg">
                    <FileText className="w-8 h-8 text-stone-400 mx-auto mb-2 opacity-60" />
                    <p className="font-cormorant text-lg text-stone-700 italic mb-1">
                      No matching records found.
                    </p>
                    <p className="text-xs text-stone-500 max-w-xs mx-auto">
                      Try clearing search parameters or write a new entry for this period.
                    </p>
                  </div>
                ) : (
                  filteredEntries.map((entry) => {
                    const words = entry.body.trim() ? entry.body.trim().split(/\s+/).length : 0;
                    const previewText = entry.body.trim()
                      ? entry.body.slice(0, 140) + (entry.body.length > 140 ? '…' : '')
                      : 'No text written yet.';

                    return (
                      <div
                        key={entry.id}
                        onClick={() => onOpenEntry(entry)}
                        className="p-3.5 rounded-lg bg-stone-200/50 hover:bg-stone-200/90 border border-stone-300/70 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[11px] font-cinzel text-stone-500 font-semibold">
                            {entry.journal_date}
                          </span>
                          <div className="flex items-center gap-2">
                            {entry.mood && (
                              <span className="text-xs capitalize text-stone-600">
                                {entry.mood}
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-stone-400">
                              {words} words
                            </span>
                          </div>
                        </div>

                        <h4 className="font-cormorant text-base font-semibold text-stone-900 group-hover:text-[#244637] transition-colors mb-1">
                          {entry.title || 'Untitled Reflection'}
                        </h4>

                        <p className="font-lora text-xs text-stone-600 line-clamp-2 leading-relaxed">
                          {previewText}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-stone-300/60 text-[11px] font-cinzel text-stone-400 flex items-center justify-between">
              <span>Click any entry to open in writer</span>
              <span>Ledger Page 2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Sparkles,
  Smile,
  CheckSquare,
  ListTodo,
  FileText,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import {
  JournalEntry,
  Mood,
  Profile,
  Habit,
  HabitCompletion,
  SaveStatus,
} from '../types/journal';
import { SpiralBinding } from './SpiralBinding';
import { getTheme } from '../utils/theme';

interface DailyJournalProps {
  entries: JournalEntry[];
  currentEntry: JournalEntry | null;
  onSelectEntry: (entry: JournalEntry | null) => void;
  onSaveEntry: (entryData: {
    id?: string;
    journal_date: string;
    title: string | null;
    body: string;
    mood: Mood | null;
    sections: any;
    expected_revision?: number;
  }) => Promise<{ success: boolean; entry?: JournalEntry; conflict?: boolean; error?: string }>;
  onDeleteEntry: (entryId: string) => Promise<boolean>;
  profile: Profile;
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  onToggleHabit: (habitId: string, dateStr: string) => Promise<void>;
  saveStatus: SaveStatus;
  setSaveStatus: (status: SaveStatus) => void;
  onNavigateToCalendar: () => void;
}

const MOODS: { id: Mood; label: string; symbol: string }[] = [
  { id: 'calm', label: 'Calm', symbol: '🍃' },
  { id: 'grateful', label: 'Grateful', symbol: '✨' },
  { id: 'focused', label: 'Focused', symbol: '🎯' },
  { id: 'reflective', label: 'Reflective', symbol: '🌙' },
  { id: 'energized', label: 'Energized', symbol: '⚡' },
  { id: 'anxious', label: 'Anxious', symbol: '🌊' },
  { id: 'tired', label: 'Tired', symbol: '🍂' },
  { id: 'content', label: 'Content', symbol: '☕' },
];

const DEFAULT_PROMPTS = [
  'What brought you quiet clarity or satisfaction today?',
  'What is one challenge you navigated, and what did it teach you?',
  'What thought or worry are you willing to set down for the evening?',
];

export const DailyJournal: React.FC<DailyJournalProps> = ({
  entries,
  currentEntry,
  onSelectEntry,
  onSaveEntry,
  onDeleteEntry,
  profile,
  habits,
  habitCompletions,
  onToggleHabit,
  saveStatus,
  setSaveStatus,
  onNavigateToCalendar,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const themeConfig = getTheme(profile.theme);

  // Editor local form state
  const [entryId, setEntryId] = useState<string | undefined>(currentEntry?.id);
  const [journalDate, setJournalDate] = useState<string>(currentEntry?.journal_date || todayStr);
  const [title, setTitle] = useState<string>(currentEntry?.title || '');
  const [body, setBody] = useState<string>(currentEntry?.body || '');
  const [mood, setMood] = useState<Mood | null>(currentEntry?.mood || null);
  const [sections, setSections] = useState<any>(currentEntry?.sections || {});
  const [revision, setRevision] = useState<number>(currentEntry?.revision || 1);

  // Active entries on this date
  const entriesOnCurrentDate = entries.filter((e) => e.journal_date === journalDate);

  // Conflict modal state
  const [conflictData, setConflictData] = useState<{ localBody: string; errorMsg: string } | null>(null);

  // Keep refs for latest values so autosave never reads stale closures
  const stateRef = useRef({
    entryId,
    journalDate,
    title,
    body,
    mood,
    sections,
    revision,
  });

  useEffect(() => {
    stateRef.current = { entryId, journalDate, title, body, mood, sections, revision };
  }, [entryId, journalDate, title, body, mood, sections, revision]);

  // Track the entry ID that is currently loaded in the editor
  const loadedEntryIdRef = useRef<string | undefined>(currentEntry?.id);
  const isDirtyRef = useRef(false);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ONLY sync from props when user explicitly switches to a DIFFERENT entry or creates a new entry
  useEffect(() => {
    // If the entry ID changed (e.g., user clicked an entry in list/calendar)
    if (currentEntry?.id !== loadedEntryIdRef.current) {
      // If currentEntry prop just caught up with the entry that was just saved, do NOT wipe or reset!
      if (currentEntry && currentEntry.id === entryId) {
        loadedEntryIdRef.current = currentEntry.id;
        return;
      }
      // If user is actively typing an unsaved draft and currentEntry is null, do NOT wipe!
      if (!currentEntry && isDirtyRef.current) {
        return;
      }

      loadedEntryIdRef.current = currentEntry?.id;
      if (currentEntry) {
        setEntryId(currentEntry.id);
        setJournalDate(currentEntry.journal_date);
        setTitle(currentEntry.title || '');
        setBody(currentEntry.body || '');
        setMood(currentEntry.mood || null);
        setSections(currentEntry.sections || {});
        setRevision(currentEntry.revision || 1);
      } else {
        setEntryId(undefined);
        setJournalDate(todayStr);
        setTitle('');
        setBody('');
        setMood(null);
        setSections({});
        setRevision(1);
      }
      isDirtyRef.current = false;
      setSaveStatus('saved');
    }
  }, [currentEntry, entryId, todayStr, setSaveStatus]);

  // Non-intrusive Autosave executor
  const performSave = useCallback(
    async (manual = false) => {
      if (!isDirtyRef.current && !manual) return;

      const current = stateRef.current;

      // Don't save completely blank draft
      if (
        !current.entryId &&
        !current.title.trim() &&
        !current.body.trim() &&
        !current.mood &&
        Object.keys(current.sections || {}).length === 0
      ) {
        return;
      }

      setSaveStatus('saving');

      try {
        const res = await onSaveEntry({
          id: current.entryId,
          journal_date: current.journalDate,
          title: current.title.trim() || null,
          body: current.body,
          mood: current.mood,
          sections: current.sections,
          expected_revision: current.entryId ? current.revision : undefined,
        });

        if (res.success && res.entry) {
          // Update revision & id without re-rendering or touching text input
          setEntryId(res.entry.id);
          setRevision(res.entry.revision);
          loadedEntryIdRef.current = res.entry.id;
          stateRef.current.entryId = res.entry.id;
          stateRef.current.revision = res.entry.revision;
          isDirtyRef.current = false;
          setSaveStatus('saved');
          onSelectEntry(res.entry);
        } else if (res.conflict) {
          setSaveStatus('conflict');
          setConflictData({
            localBody: current.body,
            errorMsg: res.error || 'Revision mismatch. Stored entry was updated in another session.',
          });
        } else {
          setSaveStatus('error');
        }
      } catch (err) {
        console.error('Autosave error:', err);
        setSaveStatus('error');
      }
    },
    [onSaveEntry, onSelectEntry, setSaveStatus]
  );

  // Debounce autosave: 1500ms after user pauses typing (completely smooth, no typing stutter)
  const scheduleAutosave = useCallback(() => {
    isDirtyRef.current = true;
    setSaveStatus('unsaved');

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
    autosaveTimeoutRef.current = setTimeout(() => {
      performSave(false);
    }, 1500);
  }, [performSave, setSaveStatus]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        performSave(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [performSave]);

  // Create another new entry on current date
  const handleCreateNewOnDate = () => {
    if (isDirtyRef.current) {
      performSave(true);
    }
    loadedEntryIdRef.current = undefined;
    setEntryId(undefined);
    setTitle('');
    setBody('');
    setMood(null);
    setSections({});
    setRevision(1);
    onSelectEntry(null);
    setSaveStatus('saved');
    isDirtyRef.current = false;
  };

  // Delete current entry
  const handleDeleteCurrent = async () => {
    if (!entryId) return;
    if (window.confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
      const ok = await onDeleteEntry(entryId);
      if (ok) {
        handleCreateNewOnDate();
      }
    }
  };

  // Chronological navigation
  const currentIndex = entries.findIndex((e) => e.id === entryId);
  const hasOlder = currentIndex >= 0 && currentIndex < entries.length - 1;
  const hasNewer = currentIndex > 0;

  const handleNavigateOlder = () => {
    if (isDirtyRef.current) performSave(true);
    if (hasOlder) {
      onSelectEntry(entries[currentIndex + 1]);
    }
  };

  const handleNavigateNewer = () => {
    if (isDirtyRef.current) performSave(true);
    if (hasNewer) {
      onSelectEntry(entries[currentIndex - 1]);
    }
  };

  // Section handlers
  const handlePromptChange = (index: number, text: string) => {
    const currentPrompts = sections.prompts || [
      { prompt: DEFAULT_PROMPTS[0], response: '' },
      { prompt: DEFAULT_PROMPTS[1], response: '' },
      { prompt: DEFAULT_PROMPTS[2], response: '' },
    ];
    const updated = [...currentPrompts];
    updated[index] = { ...updated[index], response: text };
    setSections((prev: any) => ({ ...prev, prompts: updated }));
    scheduleAutosave();
  };

  const handlePriorityChange = (index: number, text: string) => {
    const prios = sections.priorities || ['', '', ''];
    const updated = [...prios];
    updated[index] = text;
    setSections((prev: any) => ({ ...prev, priorities: updated }));
    scheduleAutosave();
  };

  const handleHighlightChange = (index: number, text: string) => {
    const hl = sections.highlights || ['', '', ''];
    const updated = [...hl];
    updated[index] = text;
    setSections((prev: any) => ({ ...prev, highlights: updated }));
    scheduleAutosave();
  };

  // Format date readable
  const formattedDate = new Date(journalDate + 'T12:00:00Z').toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const charCount = body.length;

  return (
    <div className="w-full max-w-7xl mx-auto py-3 sm:py-5 px-2 sm:px-4">
      {/* Top Ledger Bar: Navigation & Date Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 px-2 select-none">
        <div className="flex items-center gap-2">
          <button
            onClick={handleNavigateOlder}
            disabled={!hasOlder}
            className={`p-1.5 rounded border border-amber-900/20 bg-stone-900/60 text-stone-300 transition-colors cursor-pointer ${
              !hasOlder ? 'opacity-30 cursor-not-allowed' : 'hover:bg-stone-800 hover:text-white'
            }`}
            title="Older Entry"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNavigateNewer}
            disabled={!hasNewer}
            className={`p-1.5 rounded border border-amber-900/20 bg-stone-900/60 text-stone-300 transition-colors cursor-pointer ${
              !hasNewer ? 'opacity-30 cursor-not-allowed' : 'hover:bg-stone-800 hover:text-white'
            }`}
            title="Newer Entry"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 pl-2">
            <input
              type="date"
              value={journalDate}
              onChange={(e) => {
                const newD = e.target.value;
                if (newD) {
                  setJournalDate(newD);
                  const match = entries.find((en) => en.journal_date === newD);
                  if (match) {
                    onSelectEntry(match);
                  } else {
                    loadedEntryIdRef.current = undefined;
                    setEntryId(undefined);
                    setTitle('');
                    setBody('');
                    setMood(null);
                    setSections({});
                    setRevision(1);
                    onSelectEntry(null);
                  }
                  scheduleAutosave();
                }
              }}
              className="bg-stone-900/80 border border-stone-700 text-stone-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-amber-500 cursor-pointer"
            />
            <button
              onClick={onNavigateToCalendar}
              className="p-1.5 rounded text-stone-400 hover:text-amber-200 transition-colors"
              title="Open Calendar View"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Multi-entry indicator & Actions */}
        <div className="flex items-center gap-2">
          {entriesOnCurrentDate.length > 1 && (
            <div className="flex items-center gap-1 text-xs text-stone-300 mr-2">
              <span className="hidden sm:inline">Entries:</span>
              <div className="flex gap-1">
                {entriesOnCurrentDate.map((en, idx) => (
                  <button
                    key={en.id}
                    onClick={() => onSelectEntry(en)}
                    className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                      en.id === entryId
                        ? 'bg-[#c5a66a] text-stone-900 font-semibold'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    #{idx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleCreateNewOnDate}
            className="flex items-center gap-1.5 text-xs bg-stone-900/80 hover:bg-stone-800 text-[#dfc187] px-3 py-1.5 rounded border border-[#c5a66a]/40 transition-colors cursor-pointer"
            title="Create another entry on this date"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Entry</span>
          </button>

          {entryId && (
            <button
              onClick={handleDeleteCurrent}
              className="p-1.5 text-stone-400 hover:text-rose-400 transition-colors rounded cursor-pointer"
              title="Delete this entry"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Realistic Hardcover Book Spread with Uniform Overhang Gap */}
      <div
        className="relative rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] border-2 border-[#c5a66a]/60 p-3 sm:p-4 lg:p-5 transition-colors duration-500"
        style={themeConfig.bookCoverStyle}
      >
        {/* Embossed inner hardcover border accent */}
        <div className="absolute inset-1.5 sm:inset-2 rounded-xl border border-[#c5a66a]/30 pointer-events-none" />

        {/* Interior Paper Block with Note Depth (stacked pages thickness) directly on the notes */}
        <div className="relative rounded-lg overflow-hidden bg-[#f7f2e8] border border-[#d6c7ab] shadow-[0_2px_4px_rgba(0,0,0,0.08),2px_2px_0px_#ede4d4,4px_4px_0px_#dfd2bc,0_16px_36px_-6px_rgba(0,0,0,0.5)]">
          {/* Metallic Spiral Binding between Pages */}
          <SpiralBinding ringCount={22} theme={profile.theme} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[660px]">
            {/* ========================================================= */}
            {/* LEFT PAGE: Reflection, Mood, Priorities & Habit Check-ins */}
            {/* ========================================================= */}
            <div
              className="paper-surface paper-surface-left p-6 sm:p-8 lg:p-9 lg:pr-12 flex flex-col justify-between text-stone-800 border-b lg:border-b-0 lg:border-r border-[#d9ceb9]"
              style={{ borderRightColor: themeConfig.navbarBorder }}
            >
              <div>
                {/* Date Header */}
                <div className="border-b border-stone-300/80 pb-3 mb-5">
                  <span className="text-[11px] font-cinzel tracking-[0.25em] uppercase text-stone-500 block mb-1">
                    Flip Journal · Left Page
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-cormorant font-semibold text-stone-900 tracking-wide">
                    {formattedDate}
                  </h2>
                </div>

                {/* Section 1: State of Mind Mood Selector */}
                <div className="mb-5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Smile className="w-4 h-4 text-stone-600" />
                    <span className="text-xs uppercase tracking-wider font-cinzel text-stone-600">
                      State of Mind
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {MOODS.map((m) => {
                      const isSelected = mood === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setMood(isSelected ? null : m.id);
                            scheduleAutosave();
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-all cursor-pointer ${
                            isSelected
                              ? 'font-medium shadow-sm'
                              : 'bg-stone-200/70 hover:bg-stone-300 text-stone-700'
                          }`}
                          style={isSelected ? { backgroundColor: themeConfig.primaryBtnBg, color: themeConfig.activeHighlightText } : undefined}
                        >
                          <span>{m.symbol}</span>
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Reflection Prompts */}
                <div className="mb-5 space-y-3.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-4 h-4 text-stone-600" />
                    <span className="text-xs uppercase tracking-wider font-cinzel text-stone-600">
                      Evening Reflection
                    </span>
                  </div>

                  {DEFAULT_PROMPTS.map((promptText, idx) => {
                    const responses = sections.prompts || [];
                    const val = responses[idx]?.response || '';
                    return (
                      <div key={idx} className="space-y-1">
                        <label className="block text-xs font-serif italic text-stone-700 leading-snug">
                          {promptText}
                        </label>
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => handlePromptChange(idx, e.target.value)}
                          placeholder="Write a thought…"
                          className="w-full text-xs font-lora text-stone-900 bg-transparent border-b border-stone-300 focus:border-stone-700 pb-1 focus:outline-none placeholder:text-stone-400 placeholder:italic transition-colors"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Section 3: Today's Priorities */}
                <div className="mb-5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <ListTodo className="w-4 h-4 text-stone-600" />
                    <span className="text-xs uppercase tracking-wider font-cinzel text-stone-600">
                      Primary Intentions
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {[0, 1, 2].map((idx) => {
                      const prios = sections.priorities || ['', '', ''];
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs font-serif text-stone-400 w-3">{idx + 1}.</span>
                          <input
                            type="text"
                            value={prios[idx] || ''}
                            onChange={(e) => handlePriorityChange(idx, e.target.value)}
                            placeholder={`Intention ${idx + 1}…`}
                            className="flex-1 text-xs font-lora text-stone-900 bg-transparent border-b border-stone-300 focus:border-stone-700 pb-1 focus:outline-none placeholder:text-stone-400 placeholder:italic transition-colors"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 4: Habits due today */}
                {habits.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <CheckSquare className="w-4 h-4 text-stone-600" />
                      <span className="text-xs uppercase tracking-wider font-cinzel text-stone-600">
                        Daily Habits
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {habits
                        .filter((h) => h.status === 'active')
                        .map((habit) => {
                          const isDone = habitCompletions.some(
                            (c) => c.habit_id === habit.id && c.completed_on === journalDate
                          );
                          return (
                            <label
                              key={habit.id}
                              className="flex items-center gap-2 text-xs font-serif text-stone-800 cursor-pointer group"
                            >
                              <input
                                type="checkbox"
                                checked={isDone}
                                onChange={() => onToggleHabit(habit.id, journalDate)}
                                className="rounded border-stone-400 text-stone-800 focus:ring-0 cursor-pointer"
                              />
                              <span className={isDone ? 'line-through text-stone-400' : 'group-hover:text-black'}>
                                {habit.name}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* Left page footer */}
              <div className="pt-3 mt-4 border-t border-stone-300/60 text-[11px] font-cinzel text-stone-400 flex items-center justify-between">
                <span>Section: Intentions & Prompts</span>
                <span>Ref: {journalDate}</span>
              </div>
            </div>

            {/* ========================================================= */}
            {/* RIGHT PAGE: Main Writing Canvas, Title & Autosave Area    */}
            {/* ========================================================= */}
            <div className="paper-surface paper-surface-right p-6 sm:p-8 lg:p-9 lg:pl-12 flex flex-col justify-between text-stone-800">
              <div className="flex-1 flex flex-col">
                {/* Right Page Header */}
                <div className="border-b border-stone-300/80 pb-3 mb-4 flex items-center justify-between">
                  <span className="text-[11px] font-cinzel tracking-[0.25em] uppercase text-stone-500">
                    Flip Journal · Right Page
                  </span>
                  <span className="text-xs font-mono text-stone-400">
                    {wordCount} words · {charCount} chars
                  </span>
                </div>

                {/* Entry Title Input */}
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    scheduleAutosave();
                  }}
                  placeholder="Give this entry a title…"
                  className="w-full text-xl sm:text-2xl font-cormorant font-semibold text-stone-900 bg-transparent border-b border-stone-300/60 focus:border-stone-700 pb-2 focus:outline-none placeholder:text-stone-400 placeholder:italic mb-4 transition-colors"
                />

                {/* Main Body Free-Writing Canvas - Absolutely smooth, no interference */}
                <div className="flex-1 relative min-h-[340px]">
                  <textarea
                    value={body}
                    onChange={(e) => {
                      setBody(e.target.value);
                      scheduleAutosave();
                    }}
                    placeholder="Begin writing your thoughts, reflections, or notes for the day…"
                    className={`w-full h-full min-h-[340px] bg-transparent resize-none focus:outline-none font-lora text-stone-800 placeholder:text-stone-400/80 placeholder:italic lined-paper leading-7 text-pref-${profile.text_size} spacing-pref-${profile.line_spacing}`}
                    style={{ border: 'none' }}
                  />
                </div>

                {/* Highlights & Gratitude subsection */}
                <div className="mt-3 pt-3 border-t border-stone-300/60">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-stone-500" />
                    <span className="text-[11px] uppercase tracking-wider font-cinzel text-stone-500">
                      Highlights & Gratitude
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[0, 1, 2].map((idx) => {
                      const hl = sections.highlights || ['', '', ''];
                      return (
                        <input
                          key={idx}
                          type="text"
                          value={hl[idx] || ''}
                          onChange={(e) => handleHighlightChange(idx, e.target.value)}
                          placeholder={`Gratitude #${idx + 1}`}
                          className="text-xs font-lora bg-stone-200/50 rounded px-2.5 py-1 text-stone-900 focus:bg-stone-200 focus:outline-none placeholder:text-stone-400 placeholder:italic transition-colors"
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Page Bottom Status Strip */}
              <div className="pt-3 mt-4 border-t border-stone-300/60 flex items-center justify-between text-xs text-stone-500">
                <div className="flex items-center gap-2">
                  {saveStatus === 'saved' && (
                    <span className="text-emerald-700/90 font-medium">✓ Saved</span>
                  )}
                  {saveStatus === 'saving' && (
                    <span className="text-amber-700 font-medium animate-pulse">Saving in background…</span>
                  )}
                  {saveStatus === 'unsaved' && (
                    <span className="text-stone-500">Draft edited</span>
                  )}
                  {saveStatus === 'error' && (
                    <button
                      onClick={() => performSave(true)}
                      className="text-rose-700 font-medium underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Retry save
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-stone-400">Rev. {revision}</span>
                  <button
                    type="button"
                    onClick={() => performSave(true)}
                    className="px-3.5 py-1 text-amber-100 rounded text-xs font-cinzel font-medium transition-all hover:brightness-110 cursor-pointer shadow-sm"
                    style={{ backgroundColor: themeConfig.primaryBtnBg }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revision Concurrency Conflict Modal */}
      {conflictData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-stone-900 border border-amber-600/60 rounded-xl max-w-lg w-full p-6 text-stone-200 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-cinzel font-bold">Concurrency Conflict Detected</h3>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed mb-4">
              Another session modified this entry while you were typing. Your local text is preserved below so you never lose your words.
            </p>
            <div className="bg-black/40 border border-stone-800 rounded p-3 mb-4 max-h-36 overflow-y-auto text-xs font-mono text-amber-100/90">
              {conflictData.localBody}
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConflictData(null)}
                className="px-4 py-2 text-xs rounded bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer"
              >
                Close & Keep Local Draft
              </button>
              <button
                onClick={async () => {
                  setConflictData(null);
                  setRevision((prev) => prev + 1);
                  performSave(true);
                }}
                className="px-4 py-2 text-xs rounded bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold cursor-pointer"
              >
                Overwrite with Local Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

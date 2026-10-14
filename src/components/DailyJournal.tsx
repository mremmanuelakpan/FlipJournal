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

  // Editor local form state
  const [entryId, setEntryId] = useState<string | undefined>(currentEntry?.id);
  const [journalDate, setJournalDate] = useState<string>(currentEntry?.journal_date || todayStr);
  const [title, setTitle] = useState<string>(currentEntry?.title || '');
  const [body, setBody] = useState<string>(currentEntry?.body || '');
  const [mood, setMood] = useState<Mood | null>(currentEntry?.mood || null);
  const [sections, setSections] = useState<any>(currentEntry?.sections || {});
  const [revision, setRevision] = useState<number>(currentEntry?.revision || 1);

  // Active entries on this date (to handle multiple entries per date as required)
  const entriesOnCurrentDate = entries.filter((e) => e.journal_date === journalDate);

  // Conflict modal state
  const [conflictData, setConflictData] = useState<{ localBody: string; errorMsg: string } | null>(null);

  // Autosave timer ref
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);
  const isDirtyRef = useRef(false);

  // Sync state when currentEntry changes from props
  useEffect(() => {
    if (currentEntry) {
      setEntryId(currentEntry.id);
      setJournalDate(currentEntry.journal_date);
      setTitle(currentEntry.title || '');
      setBody(currentEntry.body || '');
      setMood(currentEntry.mood || null);
      setSections(currentEntry.sections || {});
      setRevision(currentEntry.revision || 1);
      isDirtyRef.current = false;
    } else {
      // If no entry, create blank state for today
      setEntryId(undefined);
      setJournalDate(todayStr);
      setTitle('');
      setBody('');
      setMood(null);
      setSections({});
      setRevision(1);
      isDirtyRef.current = false;
    }
  }, [currentEntry?.id, currentEntry?.updated_at]);

  // Autosave executor
  const performSave = useCallback(
    async (manual = false) => {
      if (!isDirtyRef.current && !manual) return;

      // Don't save completely empty new entry
      if (!entryId && !title.trim() && !body.trim() && !mood && Object.keys(sections).length === 0) {
        return;
      }

      setSaveStatus('saving');

      try {
        const res = await onSaveEntry({
          id: entryId,
          journal_date: journalDate,
          title: title.trim() || null,
          body,
          mood,
          sections,
          expected_revision: entryId ? revision : undefined,
        });

        if (res.success && res.entry) {
          setEntryId(res.entry.id);
          setRevision(res.entry.revision);
          setSaveStatus('saved');
          isDirtyRef.current = false;
        } else if (res.conflict) {
          setSaveStatus('conflict');
          setConflictData({
            localBody: body,
            errorMsg: res.error || 'Revision mismatch. Stored entry was updated elsewhere.',
          });
        } else {
          setSaveStatus('error');
        }
      } catch (err) {
        console.error('Autosave failed:', err);
        setSaveStatus('error');
      }
    },
    [entryId, journalDate, title, body, mood, sections, revision, onSaveEntry, setSaveStatus]
  );

  // Debounced trigger on keystrokes/changes (750ms)
  const markDirtyAndScheduleSave = useCallback(() => {
    isDirtyRef.current = true;
    setSaveStatus('unsaved');

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
    autosaveTimeoutRef.current = setTimeout(() => {
      performSave();
    }, 850);
  }, [performSave, setSaveStatus]);

  // Clean up timer on unmount
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
    // If dirty, save first
    if (isDirtyRef.current) {
      performSave(true);
    }
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

  // Previous & Next navigation in chronological order
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
    setSections({ ...sections, prompts: updated });
    markDirtyAndScheduleSave();
  };

  const handlePriorityChange = (index: number, text: string) => {
    const prios = sections.priorities || ['', '', ''];
    const updated = [...prios];
    updated[index] = text;
    setSections({ ...sections, priorities: updated });
    markDirtyAndScheduleSave();
  };

  const handleHighlightChange = (index: number, text: string) => {
    const hl = sections.highlights || ['', '', ''];
    const updated = [...hl];
    updated[index] = text;
    setSections({ ...sections, highlights: updated });
    markDirtyAndScheduleSave();
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
    <div className="w-full max-w-7xl mx-auto py-4 sm:py-6 px-2 sm:px-4">
      {/* Top Ledger Bar: Navigation & Date Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-2 select-none">
        <div className="flex items-center gap-2">
          <button
            onClick={handleNavigateOlder}
            disabled={!hasOlder}
            className={`p-1.5 rounded border border-amber-900/20 bg-stone-800/40 text-stone-300 transition-colors cursor-pointer ${
              !hasOlder ? 'opacity-30 cursor-not-allowed' : 'hover:bg-stone-700/60 hover:text-white'
            }`}
            title="Older Entry"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNavigateNewer}
            disabled={!hasNewer}
            className={`p-1.5 rounded border border-amber-900/20 bg-stone-800/40 text-stone-300 transition-colors cursor-pointer ${
              !hasNewer ? 'opacity-30 cursor-not-allowed' : 'hover:bg-stone-700/60 hover:text-white'
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
                  // Check if entry exists on this date
                  const match = entries.find((en) => en.journal_date === newD);
                  if (match) {
                    onSelectEntry(match);
                  } else {
                    setEntryId(undefined);
                    setTitle('');
                    setBody('');
                    setMood(null);
                    setSections({});
                    setRevision(1);
                    onSelectEntry(null);
                  }
                  markDirtyAndScheduleSave();
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
            <div className="flex items-center gap-1 text-xs text-stone-400 mr-2">
              <span>Entries on this date:</span>
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
            className="flex items-center gap-1.5 text-xs bg-stone-800 hover:bg-stone-700 text-[#dfc187] px-3 py-1.5 rounded border border-[#c5a66a]/30 transition-colors cursor-pointer"
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

      {/* Realistic Book Open Spread (2-Page Desktop, 1-Page Mobile) */}
      <div className="relative rounded-lg shadow-2xl overflow-hidden border border-[#c5a66a]/40 bg-[#244637] p-2 sm:p-4">
        {/* Layered book spine center shadow visible on desktop */}
        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 z-20 pointer-events-none bg-gradient-to-r from-black/20 via-black/40 to-black/20 shadow-inner" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-0 bg-transparent min-h-[680px]">
          {/* ========================================================= */}
          {/* LEFT PAGE: Reflection, Mood, Priorities & Habit Check-ins */}
          {/* ========================================================= */}
          <div className="paper-surface paper-surface-left p-6 sm:p-8 lg:p-10 rounded-l-md border-r border-[#e0d6c1] flex flex-col justify-between text-stone-800 paper-scroll overflow-y-auto max-h-[82vh]">
            <div>
              {/* Left Page Top Header: Date and Page marker */}
              <div className="border-b border-stone-300/80 pb-4 mb-6">
                <span className="text-[11px] font-cinzel tracking-[0.25em] uppercase text-stone-500 block mb-1">
                  Daily Record · Page Left
                </span>
                <h2 className="text-2xl sm:text-3xl font-cormorant font-semibold text-stone-900 tracking-wide">
                  {formattedDate}
                </h2>
              </div>

              {/* Section 1: Mood Check-in */}
              <div className="mb-6">
                <div className="flex items-center gap-1.5 mb-2.5">
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
                          markDirtyAndScheduleSave();
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#244637] text-amber-100 font-medium shadow-sm'
                            : 'bg-stone-200/70 hover:bg-stone-300 text-stone-700'
                        }`}
                      >
                        <span>{m.symbol}</span>
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Reflection Prompts */}
              <div className="mb-6 space-y-4">
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
                        className="w-full text-xs font-serif text-stone-800 bg-transparent border-b border-stone-300 focus:border-[#244637] pb-1 focus:outline-none placeholder:text-stone-400 placeholder:italic transition-colors"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Section 3: Today's 3 Intentions / Priorities */}
              <div className="mb-6">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <ListTodo className="w-4 h-4 text-stone-600" />
                  <span className="text-xs uppercase tracking-wider font-cinzel text-stone-600">
                    Primary Intentions
                  </span>
                </div>
                <div className="space-y-2">
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
                          className="flex-1 text-xs font-serif text-stone-800 bg-transparent border-b border-stone-300 focus:border-[#244637] pb-1 focus:outline-none placeholder:text-stone-400 placeholder:italic transition-colors"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 4: Habits due today */}
              {habits.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-1.5 mb-2.5">
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
                              className="rounded border-stone-400 text-[#244637] focus:ring-0 cursor-pointer"
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
            <div className="pt-4 border-t border-stone-300/60 text-[11px] font-cinzel text-stone-400 flex items-center justify-between">
              <span>Section: Journal Intention</span>
              <span>Ref: {journalDate}</span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT PAGE: Main Writing Canvas, Title & Autosave Area    */}
          {/* ========================================================= */}
          <div className="paper-surface paper-surface-right p-6 sm:p-8 lg:p-10 rounded-r-md flex flex-col justify-between text-stone-800 paper-scroll overflow-y-auto max-h-[82vh]">
            <div className="flex-1 flex flex-col">
              {/* Right Page Header */}
              <div className="border-b border-stone-300/80 pb-3 mb-4 flex items-center justify-between">
                <span className="text-[11px] font-cinzel tracking-[0.25em] uppercase text-stone-500">
                  Journal Entry · Page Right
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
                  markDirtyAndScheduleSave();
                }}
                placeholder="Give this entry a title…"
                className="w-full text-xl sm:text-2xl font-cormorant font-semibold text-stone-900 bg-transparent border-b border-stone-300/60 focus:border-[#244637] pb-2 focus:outline-none placeholder:text-stone-400 placeholder:italic mb-4 transition-colors"
              />

              {/* Main Body Free-Writing Canvas with realistic lined texture */}
              <div className="flex-1 relative min-h-[360px]">
                <textarea
                  value={body}
                  onChange={(e) => {
                    setBody(e.target.value);
                    markDirtyAndScheduleSave();
                  }}
                  placeholder="Begin writing your thoughts, feelings, or record of the day…"
                  className={`w-full h-full min-h-[380px] bg-transparent resize-none focus:outline-none font-lora text-stone-800 placeholder:text-stone-400/80 placeholder:italic lined-paper leading-7 text-pref-${profile.text_size} spacing-pref-${profile.line_spacing}`}
                  style={{
                    border: 'none',
                  }}
                />
              </div>

              {/* Highlights & Gratitude subsection */}
              <div className="mt-4 pt-4 border-t border-stone-300/60">
                <div className="flex items-center gap-1.5 mb-2">
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
                        className="text-xs font-serif bg-stone-200/50 rounded px-2.5 py-1.5 text-stone-800 focus:bg-stone-200 focus:outline-none placeholder:text-stone-400 placeholder:italic transition-colors"
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Page Bottom Status Strip */}
            <div className="pt-4 mt-6 border-t border-stone-300/60 flex items-center justify-between text-xs text-stone-500">
              <div className="flex items-center gap-2">
                {saveStatus === 'saved' && (
                  <span className="text-emerald-700/80 font-medium">✓ Authoritative save confirmed</span>
                )}
                {saveStatus === 'saving' && (
                  <span className="text-amber-700 font-medium animate-pulse">Saving changes…</span>
                )}
                {saveStatus === 'unsaved' && (
                  <span className="text-stone-500">Unsaved draft in memory</span>
                )}
                {saveStatus === 'error' && (
                  <button
                    onClick={() => performSave(true)}
                    className="text-rose-700 font-medium underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Save failed. Click to retry.
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-stone-400">Rev. {revision}</span>
                <button
                  type="button"
                  onClick={() => performSave(true)}
                  className="px-3 py-1 bg-[#244637] hover:bg-[#1b362a] text-amber-100 rounded text-xs font-cinzel font-medium transition-colors cursor-pointer"
                >
                  Save Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revision Concurrency Conflict Modal (PRD Section 12.2) */}
      {conflictData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-stone-900 border border-amber-600/60 rounded-xl max-w-lg w-full p-6 text-stone-200 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-cinzel font-bold">Concurrency Conflict Detected</h3>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed mb-4">
              Another session or device modified this journal entry while you were typing. To prevent silent data loss, your changes are preserved below.
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
                  // Force save with latest revision
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

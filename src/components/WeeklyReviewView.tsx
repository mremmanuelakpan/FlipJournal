import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  BookOpenCheck,
  CheckCircle2,
  FileText,
  Target,
  Sparkles,
  HelpCircle,
  Save,
} from 'lucide-react';
import {
  WeeklyReview,
  WeeklyReflectionQuestions,
  JournalEntry,
  Habit,
  HabitCompletion,
  Goal,
  Profile,
} from '../types/journal';
import { SpiralBinding } from './SpiralBinding';
import { getTheme } from '../utils/theme';

interface WeeklyReviewViewProps {
  entries: JournalEntry[];
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  goals: Goal[];
  profile: Profile;
  onFetchReview: (weekStart: string) => Promise<WeeklyReview | null>;
  onSaveReview: (
    weekStart: string,
    reflection: string,
    questions: WeeklyReflectionQuestions
  ) => Promise<WeeklyReview>;
}

export const WeeklyReviewView: React.FC<WeeklyReviewViewProps> = ({
  entries,
  habits,
  habitCompletions,
  goals,
  profile,
  onFetchReview,
  onSaveReview,
}) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [review, setReview] = useState<WeeklyReview | null>(null);
  const [reflection, setReflection] = useState('');
  const [questions, setQuestions] = useState<WeeklyReflectionQuestions>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Compute the current week's start date (Monday or Sunday per profile)
  const { weekStartStr, weekEndStr, weekRangeLabel } = useMemo(() => {
    const now = new Date();
    now.setDate(now.getDate() + weekOffset * 7);

    const currentDay = now.getDay();
    const distanceToStart = (currentDay - profile.week_starts_on + 7) % 7;
    const start = new Date(now);
    start.setDate(now.getDate() - distanceToStart);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const label = `${start.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })} – ${end.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;

    return { weekStartStr: startStr, weekEndStr: endStr, weekRangeLabel: label };
  }, [profile.week_starts_on, weekOffset]);

  // Load existing weekly review for this week
  useEffect(() => {
    let mounted = true;
    (async () => {
      const existing = await onFetchReview(weekStartStr);
      if (mounted) {
        if (existing) {
          setReview(existing);
          setReflection(existing.reflection || '');
          setQuestions(existing.questions || {});
        } else {
          setReview(null);
          setReflection('');
          setQuestions({});
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [weekStartStr, onFetchReview]);

  // Calculate actual statistics from real saved records (PRD requirement: "All statistics must be calculated from actual saved records")
  const weekStats = useMemo(() => {
    const entriesThisWeek = entries.filter(
      (e) => e.journal_date >= weekStartStr && e.journal_date <= weekEndStr
    );

    const completionsThisWeek = habitCompletions.filter(
      (c) => c.completed_on >= weekStartStr && c.completed_on <= weekEndStr
    );

    const activeGoals = goals.filter((g) => g.status === 'in_progress' || g.status === 'completed');

    // Total words written this week
    const totalWords = entriesThisWeek.reduce((sum, e) => {
      const words = e.body.trim() ? e.body.trim().split(/\s+/).length : 0;
      return sum + words;
    }, 0);

    return {
      entriesCount: entriesThisWeek.length,
      completionsCount: completionsThisWeek.length,
      activeGoalsCount: activeGoals.length,
      totalWords,
      entriesThisWeek,
    };
  }, [entries, habitCompletions, goals, weekStartStr, weekEndStr]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await onSaveReview(weekStartStr, reflection, questions);
      setReview(updated);
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

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
            {/* LEFT PAGE: Factual Activity Ledger for the Week           */}
            {/* ========================================================= */}
            <div className="paper-surface paper-surface-left p-6 sm:p-8 lg:p-9 lg:pr-12 border-b lg:border-b-0 lg:border-r border-[#d9ceb9] flex flex-col justify-between text-stone-800">
              <div>
                <div className="border-b border-stone-300/80 pb-3 mb-4 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-cinzel tracking-[0.25em] uppercase text-stone-500 block mb-1">
                      Weekly Synthesis
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-cormorant font-semibold text-stone-900">
                      Activity & Evidence
                    </h2>
                  </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setWeekOffset((p) => p - 1)}
                    className="p-1 hover:bg-stone-300/60 rounded text-stone-700 cursor-pointer"
                    title="Previous Week"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setWeekOffset((p) => p + 1)}
                    className="p-1 hover:bg-stone-300/60 rounded text-stone-700 cursor-pointer"
                    title="Next Week"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Week header label */}
              <div className="bg-stone-200/50 p-3 rounded-lg border border-stone-300/60 mb-6 flex items-center justify-between">
                <div>
                  <span className="text-xs font-cinzel font-semibold text-stone-900 block">
                    Review Period: {weekRangeLabel}
                  </span>
                  <span className="text-[11px] text-stone-500">
                    {weekOffset === 0 ? 'Current Week' : weekOffset < 0 ? `${Math.abs(weekOffset)} week(s) ago` : `${weekOffset} week(s) ahead`}
                  </span>
                </div>
                {weekOffset !== 0 && (
                  <button
                    onClick={() => setWeekOffset(0)}
                    className="text-xs text-amber-900 underline font-cinzel"
                  >
                    Current
                  </button>
                )}
              </div>

              {/* Factual Stats Cards (Calculated directly from actual records, no vanity scores) */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3.5 bg-stone-200/60 rounded-lg border border-stone-300/60">
                  <div className="flex items-center gap-1.5 text-stone-600 mb-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="text-[10px] uppercase font-cinzel font-semibold tracking-wider">
                      Journal Entries
                    </span>
                  </div>
                  <span className="text-2xl font-cormorant font-bold text-stone-900">
                    {weekStats.entriesCount}
                  </span>
                  <span className="text-[11px] text-stone-500 block font-mono">
                    {weekStats.totalWords} words recorded
                  </span>
                </div>

                <div className="p-3.5 bg-stone-200/60 rounded-lg border border-stone-300/60">
                  <div className="flex items-center gap-1.5 text-stone-600 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="text-[10px] uppercase font-cinzel font-semibold tracking-wider">
                      Habit Check-ins
                    </span>
                  </div>
                  <span className="text-2xl font-cormorant font-bold text-stone-900">
                    {weekStats.completionsCount}
                  </span>
                  <span className="text-[11px] text-stone-500 block">
                    across {habits.filter((h) => h.status === 'active').length} habits
                  </span>
                </div>
              </div>

              {/* Entries Written this week */}
              <div className="mb-4">
                <span className="text-xs font-cinzel uppercase tracking-wider text-stone-600 font-semibold block mb-2">
                  Entries Recorded This Week
                </span>
                {weekStats.entriesThisWeek.length === 0 ? (
                  <p className="text-xs font-serif italic text-stone-500 bg-stone-200/30 p-3 rounded">
                    No journal entries recorded during this week.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {weekStats.entriesThisWeek.map((en) => (
                      <div
                        key={en.id}
                        className="text-xs font-serif p-2 rounded bg-stone-200/40 flex items-center justify-between"
                      >
                        <span className="font-medium text-stone-800 truncate max-w-[200px]">
                          {en.title || 'Untitled'}
                        </span>
                        <span className="text-[10px] font-mono text-stone-500">
                          {en.journal_date}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-stone-300/60 text-[11px] font-cinzel text-stone-400 flex items-center justify-between">
              <span>Weekly Audit</span>
              <span>Ledger Page 7</span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT PAGE: Guided Reflection & Weekly Synthesis          */}
          {/* ========================================================= */}
          <div className="paper-surface paper-surface-right p-6 sm:p-8 lg:p-9 lg:pl-12 flex flex-col justify-between text-stone-800">
            <div className="flex-1 flex flex-col">
              <div className="border-b border-stone-300/80 pb-3 mb-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-cinzel tracking-[0.25em] uppercase text-stone-500 block">
                    Personal Inquiry
                  </span>
                  <h3 className="text-xl font-cormorant font-semibold text-stone-900">
                    Quiet Reflection
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {savedFeedback && (
                    <span className="text-xs text-emerald-700 font-medium animate-fade-in">
                      Saved ✓
                    </span>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#244637] hover:bg-[#1b362a] text-amber-100 font-cinzel text-xs font-medium cursor-pointer transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving…' : 'Save Review'}</span>
                  </button>
                </div>
              </div>

              {/* 4 Guided Reflection Prompts prescribed in PRD Section 7.9 */}
              <div className="space-y-3.5 mb-5">
                <div>
                  <label className="block text-xs font-cormorant font-semibold text-stone-900 mb-0.5">
                    1. What went well this week?
                  </label>
                  <input
                    type="text"
                    value={questions.went_well || ''}
                    onChange={(e) => setQuestions({ ...questions, went_well: e.target.value })}
                    placeholder="Small wins, clarity gained, moments of peace…"
                    className="w-full text-xs font-serif bg-stone-200/50 border border-stone-300 rounded px-2.5 py-1.5 text-stone-900 focus:outline-none focus:border-[#244637]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-cormorant font-semibold text-stone-900 mb-0.5">
                    2. What did I learn?
                  </label>
                  <input
                    type="text"
                    value={questions.learned || ''}
                    onChange={(e) => setQuestions({ ...questions, learned: e.target.value })}
                    placeholder="Insights from experience, books, or mistakes…"
                    className="w-full text-xs font-serif bg-stone-200/50 border border-stone-300 rounded px-2.5 py-1.5 text-stone-900 focus:outline-none focus:border-[#244637]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-cormorant font-semibold text-stone-900 mb-0.5">
                    3. What would I like to approach differently?
                  </label>
                  <input
                    type="text"
                    value={questions.approach_differently || ''}
                    onChange={(e) =>
                      setQuestions({ ...questions, approach_differently: e.target.value })
                    }
                    placeholder="A habit tweak, boundary, or reaction to improve…"
                    className="w-full text-xs font-serif bg-stone-200/50 border border-stone-300 rounded px-2.5 py-1.5 text-stone-900 focus:outline-none focus:border-[#244637]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-cormorant font-semibold text-stone-900 mb-0.5">
                    4. What matters most next week?
                  </label>
                  <input
                    type="text"
                    value={questions.matters_most_next || ''}
                    onChange={(e) =>
                      setQuestions({ ...questions, matters_most_next: e.target.value })
                    }
                    placeholder="The core priority to guard your energy for…"
                    className="w-full text-xs font-serif bg-stone-200/50 border border-stone-300 rounded px-2.5 py-1.5 text-stone-900 focus:outline-none focus:border-[#244637]"
                  />
                </div>
              </div>

              {/* Freeform weekly synthesis textarea */}
              <div className="flex-1 flex flex-col">
                <label className="block text-xs uppercase font-cinzel text-stone-600 mb-1">
                  Weekly Narrative & Synthesis
                </label>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="Synthesize the week's theme, emotional texture, and gentle intentions for the upcoming cycle…"
                  className="flex-1 min-h-[140px] w-full bg-stone-200/50 border border-stone-300 rounded p-3 text-xs font-serif text-stone-900 resize-none focus:outline-none focus:border-[#244637] leading-relaxed"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-stone-300/60 text-[11px] font-cinzel text-stone-400 flex items-center justify-between">
              <span>Weekly Reflection Record</span>
              <span>Ledger Page 8</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Flame,
  Calendar,
  Trash2,
  PauseCircle,
  PlayCircle,
  Archive,
  ChevronLeft,
  ChevronRight,
  Target,
} from 'lucide-react';
import { Habit, HabitCompletion, HabitScheduleType, Profile, Goal } from '../types/journal';
import { SpiralBinding } from './SpiralBinding';
import { getTheme } from '../utils/theme';

interface HabitsTrackerProps {
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  onCreateHabit: (habit: {
    name: string;
    description: string | null;
    goal_id: string | null;
    schedule_type: HabitScheduleType;
    schedule_config: any;
  }) => Promise<Habit>;
  onUpdateHabit: (habitId: string, updates: Partial<Habit>) => Promise<Habit | null>;
  onDeleteHabit: (habitId: string) => Promise<boolean>;
  onToggleCompletion: (habitId: string, dateStr: string) => Promise<void>;
  profile: Profile;
  goals: Goal[];
}

export const HabitsTracker: React.FC<HabitsTrackerProps> = ({
  habits,
  habitCompletions,
  onCreateHabit,
  onUpdateHabit,
  onDeleteHabit,
  onToggleCompletion,
  profile,
  goals,
}) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goalId, setGoalId] = useState<string>('');
  const [scheduleType, setScheduleType] = useState<HabitScheduleType>('daily');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [timesPerWeek, setTimesPerWeek] = useState(3);

  // Compute 7 days of the active week based on profile.week_starts_on and weekOffset
  const weekDays = useMemo(() => {
    const now = new Date();
    // Offset by full weeks
    now.setDate(now.getDate() + weekOffset * 7);

    const currentDay = now.getDay();
    const distanceToStart = (currentDay - profile.week_starts_on + 7) % 7;
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - distanceToStart);

    const days: { date: Date; dateStr: string; dayName: string; dayNum: number; isToday: boolean }[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: d,
        dateStr,
        dayName: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
        dayNum: d.getDate(),
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [profile.week_starts_on, weekOffset]);

  // Fast completion lookup set: `habitId:::dateStr`
  const completionSet = useMemo(() => {
    const s = new Set<string>();
    for (const c of habitCompletions) {
      s.add(`${c.habit_id}:::${c.completed_on}`);
    }
    return s;
  }, [habitCompletions]);

  // Compute streaks for a habit
  const computeStreak = (habitId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    let streak = 0;
    const checkDate = new Date();

    // If today is completed, start with today. If not, check if yesterday was completed.
    const isTodayDone = completionSet.has(`${habitId}:::${todayStr}`);
    if (!isTodayDone) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dStr = checkDate.toISOString().split('T')[0];
      if (completionSet.has(`${habitId}:::${dStr}`)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let schedule_config: any = {};
    if (scheduleType === 'selected_weekdays') {
      schedule_config = { weekdays: selectedWeekdays };
    } else if (scheduleType === 'times_per_week') {
      schedule_config = { times_per_week: timesPerWeek };
    }

    await onCreateHabit({
      name: name.trim(),
      description: description.trim() || null,
      goal_id: goalId ? goalId : null,
      schedule_type: scheduleType,
      schedule_config,
    });

    setName('');
    setDescription('');
    setGoalId('');
    setScheduleType('daily');
    setIsCreating(false);
  };

  const toggleWeekday = (day: number) => {
    setSelectedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const activeHabits = habits.filter((h) => h.status === 'active');
  const otherHabits = habits.filter((h) => h.status !== 'active');

  const weekRangeLabel = `${weekDays[0].date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })} – ${weekDays[6].date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;

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
            {/* LEFT PAGE: 7-Day Completion Matrix Grid                   */}
            {/* ========================================================= */}
            <div className="paper-surface paper-surface-left p-6 sm:p-8 lg:p-9 lg:pr-12 border-b lg:border-b-0 lg:border-r border-[#d9ceb9] flex flex-col justify-between text-stone-800">
              <div>
                <div className="border-b border-stone-300/80 pb-3 mb-4 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-cinzel tracking-[0.25em] uppercase text-stone-500 block mb-1">
                      Daily Practices
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-cormorant font-semibold text-stone-900">
                      Habit Completion Grid
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-cinzel bg-[#244637] hover:bg-[#1b362a] text-amber-100 rounded transition-colors cursor-pointer"
                  >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Habit</span>
                </button>
              </div>

              {/* Week Navigation Header */}
              <div className="flex items-center justify-between bg-stone-200/50 p-2 rounded mb-4">
                <button
                  onClick={() => setWeekOffset((prev) => prev - 1)}
                  className="p-1 hover:bg-stone-300 rounded text-stone-700 cursor-pointer"
                  title="Previous Week"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <span className="text-xs font-cinzel font-semibold text-stone-900 block">
                    {weekRangeLabel}
                  </span>
                  {weekOffset !== 0 && (
                    <button
                      onClick={() => setWeekOffset(0)}
                      className="text-[10px] text-amber-900 underline"
                    >
                      Return to current week
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setWeekOffset((prev) => prev + 1)}
                  className="p-1 hover:bg-stone-300 rounded text-stone-700 cursor-pointer"
                  title="Next Week"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Habit Matrix Table */}
              {activeHabits.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-stone-300 rounded-lg">
                  <CheckCircle2 className="w-8 h-8 text-stone-400 mx-auto mb-2 opacity-60" />
                  <p className="font-cormorant text-lg text-stone-700 italic mb-1">
                    No active habits tracked.
                  </p>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto mb-3">
                    Habits build the quiet foundation of intentional living.
                  </p>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="text-xs px-3 py-1.5 rounded bg-[#244637] text-amber-100 font-cinzel"
                  >
                    Form a Habit
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-stone-300/80">
                        <th className="py-2 text-xs font-cinzel text-stone-600 font-medium">Habit</th>
                        {weekDays.map((d) => (
                          <th
                            key={d.dateStr}
                            className={`py-2 px-1 text-center font-cinzel text-[11px] ${
                              d.isToday ? 'text-[#244637] font-bold underline' : 'text-stone-500'
                            }`}
                          >
                            <span>{d.dayName}</span>
                            <span className="block text-[10px] font-mono">{d.dayNum}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {activeHabits.map((habit) => {
                        const streak = computeStreak(habit.id);
                        return (
                          <tr key={habit.id} className="hover:bg-stone-200/30 transition-colors">
                            <td className="py-3 pr-2">
                              <span className="font-serif text-xs font-medium text-stone-900 block">
                                {habit.name}
                              </span>
                              <div className="flex items-center gap-1.5 text-[10px] text-stone-500">
                                {streak > 0 && (
                                  <span className="flex items-center gap-0.5 text-amber-700 font-medium">
                                    <Flame className="w-3 h-3 text-amber-600" />
                                    {streak}d
                                  </span>
                                )}
                                <span className="capitalize">{habit.schedule_type.replace('_', ' ')}</span>
                              </div>
                            </td>

                            {weekDays.map((d) => {
                              const isCompleted = completionSet.has(`${habit.id}:::${d.dateStr}`);
                              return (
                                <td key={d.dateStr} className="py-3 px-1 text-center">
                                  <button
                                    onClick={() => onToggleCompletion(habit.id, d.dateStr)}
                                    className="p-1 rounded hover:bg-stone-300/70 transition-colors cursor-pointer inline-flex items-center justify-center"
                                    title={`Toggle ${habit.name} for ${d.dateStr}`}
                                  >
                                    {isCompleted ? (
                                      <CheckCircle2 className="w-5 h-5 text-[#244637]" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-stone-300 hover:text-stone-500" />
                                    )}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-stone-300/60 text-[11px] font-cinzel text-stone-400 flex items-center justify-between">
              <span>{activeHabits.length} Active Habits</span>
              <span>Ledger Page 5</span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT PAGE: Habit Management & New Habit Form             */}
          {/* ========================================================= */}
          <div className="paper-surface paper-surface-right p-6 sm:p-8 lg:p-9 lg:pl-12 flex flex-col justify-between text-stone-800">
            {isCreating ? (
              <div className="flex-1 flex flex-col">
                <div className="border-b border-stone-300/80 pb-3 mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-cormorant font-semibold text-stone-900">
                    Inscribe New Habit
                  </h3>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="text-xs text-stone-500 hover:text-stone-800"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleCreateSubmit} className="space-y-4 flex-1">
                  <div>
                    <label className="block text-xs uppercase font-cinzel text-stone-600 mb-1">
                      Habit Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Morning 20m Walk, Read Philosophy, Meditate"
                      className="w-full text-xs font-serif bg-stone-200/60 border border-stone-300 rounded px-3 py-2 text-stone-900 focus:outline-none focus:border-[#244637]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-cinzel text-stone-600 mb-1">
                      Context / Notes
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Immediately upon waking with black tea"
                      className="w-full text-xs font-serif bg-stone-200/60 border border-stone-300 rounded px-3 py-2 text-stone-900 focus:outline-none focus:border-[#244637]"
                    />
                  </div>

                  {goals.length > 0 && (
                    <div>
                      <label className="block text-xs uppercase font-cinzel text-stone-600 mb-1">
                        Connect to Goal (Optional)
                      </label>
                      <select
                        value={goalId}
                        onChange={(e) => setGoalId(e.target.value)}
                        className="w-full text-xs font-serif bg-stone-200/60 border border-stone-300 rounded px-2.5 py-1.5 text-stone-900 focus:outline-none"
                      >
                        <option value="">No goal connected</option>
                        {goals.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs uppercase font-cinzel text-stone-600 mb-1">
                      Schedule Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'daily', label: 'Every Day' },
                        { id: 'selected_weekdays', label: 'Selected Days' },
                        { id: 'times_per_week', label: 'Times / Week' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setScheduleType(t.id as HabitScheduleType)}
                          className={`text-xs py-1.5 px-2 rounded font-cinzel transition-all cursor-pointer ${
                            scheduleType === t.id
                              ? 'bg-[#244637] text-amber-100 font-semibold'
                              : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {scheduleType === 'selected_weekdays' && (
                    <div>
                      <label className="block text-xs uppercase font-cinzel text-stone-600 mb-1">
                        Select Active Weekdays
                      </label>
                      <div className="flex gap-1">
                        {[
                          { d: 1, label: 'M' },
                          { d: 2, label: 'T' },
                          { d: 3, label: 'W' },
                          { d: 4, label: 'T' },
                          { d: 5, label: 'F' },
                          { d: 6, label: 'S' },
                          { d: 0, label: 'S' },
                        ].map((item) => (
                          <button
                            key={item.d}
                            type="button"
                            onClick={() => toggleWeekday(item.d)}
                            className={`w-8 h-8 rounded text-xs font-cinzel font-semibold cursor-pointer ${
                              selectedWeekdays.includes(item.d)
                                ? 'bg-[#244637] text-amber-100'
                                : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {scheduleType === 'times_per_week' && (
                    <div>
                      <label className="block text-xs uppercase font-cinzel text-stone-600 mb-1">
                        Completions Target per Week
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={7}
                        value={timesPerWeek}
                        onChange={(e) => setTimesPerWeek(Number(e.target.value))}
                        className="w-24 text-xs bg-stone-200/60 border border-stone-300 rounded px-2.5 py-1.5 text-stone-900"
                      />
                    </div>
                  )}

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded bg-[#244637] hover:bg-[#1b362a] text-amber-100 font-cinzel font-medium text-xs tracking-wider transition-colors cursor-pointer"
                    >
                      Commit Habit
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Habit List and Status Controls */
              <div className="flex-1 flex flex-col">
                <div className="border-b border-stone-300/80 pb-3 mb-4">
                  <span className="text-[11px] font-cinzel tracking-[0.25em] uppercase text-stone-500 block">
                    Discipline & Rhythms
                  </span>
                  <h3 className="text-xl font-cormorant font-semibold text-stone-900">
                    Habit Register & Archives
                  </h3>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {habits.map((habit) => {
                    const streak = computeStreak(habit.id);
                    const totalCompletions = habitCompletions.filter((c) => c.habit_id === habit.id).length;

                    return (
                      <div
                        key={habit.id}
                        className="p-3 rounded-lg bg-stone-200/50 border border-stone-300/70 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <h4 className="font-cormorant font-semibold text-base text-stone-900">
                              {habit.name}
                            </h4>
                            {habit.description && (
                              <p className="text-xs font-serif text-stone-600 italic">
                                {habit.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() =>
                                onUpdateHabit(habit.id, {
                                  status: habit.status === 'active' ? 'paused' : 'active',
                                })
                              }
                              className="p-1 text-stone-500 hover:text-stone-800"
                              title={habit.status === 'active' ? 'Pause habit' : 'Activate habit'}
                            >
                              {habit.status === 'active' ? (
                                <PauseCircle className="w-4 h-4" />
                              ) : (
                                <PlayCircle className="w-4 h-4 text-emerald-700" />
                              )}
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm('Delete habit? Historical completions will be removed.')) {
                                  onDeleteHabit(habit.id);
                                }
                              }}
                              className="p-1 text-stone-400 hover:text-rose-500"
                              title="Delete habit"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-stone-500 mt-2 pt-2 border-t border-stone-300/50">
                          <span className="capitalize">{habit.schedule_type.replace('_', ' ')}</span>
                          <span className="font-mono">{totalCompletions} total completed</span>
                          {streak > 0 ? (
                            <span className="text-amber-700 font-medium">🔥 {streak} day streak</span>
                          ) : (
                            <span className="text-stone-400 italic">No current streak</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-stone-300/60 text-[11px] font-cinzel text-stone-400 flex items-center justify-between">
              <span>Habit Persistence Engine</span>
              <span>Ledger Page 6</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

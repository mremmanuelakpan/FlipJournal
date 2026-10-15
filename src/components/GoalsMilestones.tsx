import React, { useState } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Calendar,
  Sparkles,
  Award,
  ChevronRight,
  Clock,
  PauseCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Goal, GoalMilestone, GoalStatus, Profile } from '../types/journal';
import { SpiralBinding } from './SpiralBinding';
import { getTheme } from '../utils/theme';

interface GoalsMilestonesProps {
  goals: Goal[];
  profile: Profile;
  onCreateGoal: (goal: {
    name: string;
    description: string | null;
    status: GoalStatus;
    target_date: string | null;
    progress_current: number | null;
    progress_target: number | null;
  }) => Promise<Goal>;
  onUpdateGoal: (goalId: string, updates: Partial<Goal>) => Promise<Goal | null>;
  onDeleteGoal: (goalId: string) => Promise<boolean>;
  onAddMilestone: (goalId: string, name: string, description?: string) => Promise<GoalMilestone>;
  onToggleMilestone: (milestoneId: string, completed: boolean) => Promise<GoalMilestone | null>;
  onDeleteMilestone: (milestoneId: string) => Promise<boolean>;
}

export const GoalsMilestones: React.FC<GoalsMilestonesProps> = ({
  goals,
  profile,
  onCreateGoal,
  onUpdateGoal,
  onDeleteGoal,
  onAddMilestone,
  onToggleMilestone,
  onDeleteMilestone,
}) => {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(goals[0]?.id || null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // New goal form state
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [newHasTarget, setNewHasTarget] = useState(false);
  const [newProgressTarget, setNewProgressTarget] = useState<string>('10');

  // New milestone form state
  const [milestoneName, setMilestoneName] = useState('');

  const activeGoal = goals.find((g) => g.id === selectedGoalId) || goals[0] || null;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#c5a66a', themeConfig.primaryBtnBg, '#dfc187'],
      });
    } catch {
      // Ignore if confetti not supported
    }
  };

  const handleCreateGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const g = await onCreateGoal({
      name: newName.trim(),
      description: newDesc.trim() || null,
      status: 'not_started',
      target_date: newTargetDate || null,
      progress_current: newHasTarget ? 0 : null,
      progress_target: newHasTarget ? Number(newProgressTarget) || 10 : null,
    });

    setNewName('');
    setNewDesc('');
    setNewTargetDate('');
    setNewHasTarget(false);
    setIsCreatingNew(false);
    setSelectedGoalId(g.id);
  };

  const handleAddMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGoal || !milestoneName.trim()) return;
    if (activeGoal.status === 'completed') return;

    await onAddMilestone(activeGoal.id, milestoneName.trim());
    setMilestoneName('');
  };

  const handleToggleMilestone = async (m: GoalMilestone) => {
    const nextCompleted = !m.completed;
    if (nextCompleted) {
      triggerConfetti();
    }
    await onToggleMilestone(m.id, nextCompleted);

    // Auto-update goal status to completed if all milestones are met
    if (activeGoal) {
      const allMilestones = activeGoal.milestones || [];
      const willAllBeCompleted =
        allMilestones.length > 0 &&
        allMilestones.every((item) => (item.id === m.id ? nextCompleted : item.completed));

      if (willAllBeCompleted && activeGoal.status !== 'completed') {
        triggerConfetti();
        await onUpdateGoal(activeGoal.id, { status: 'completed' });
      }
    }
  };

  const handleNumericalProgressChange = async (newCurrent: number) => {
    if (!activeGoal || activeGoal.progress_target === null) return;
    const clamped = Math.max(0, newCurrent);
    const isNowCompleted = clamped >= activeGoal.progress_target;

    if (isNowCompleted && activeGoal.status !== 'completed') {
      triggerConfetti();
      await onUpdateGoal(activeGoal.id, {
        progress_current: clamped,
        status: 'completed',
      });
    } else {
      await onUpdateGoal(activeGoal.id, {
        progress_current: clamped,
      });
    }
  };

  const handleStatusChange = async (goalId: string, status: GoalStatus) => {
    if (status === 'completed') {
      triggerConfetti();
    }
    await onUpdateGoal(goalId, { status });
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
          <SpiralBinding ringCount={22} theme={profile.theme} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[660px]">
            {/* ========================================================= */}
            {/* LEFT PAGE: Goals Index & Progress Overview                */}
            {/* ========================================================= */}
            <div
              className="paper-surface paper-surface-left p-6 sm:p-8 lg:p-9 lg:pr-12 border-b lg:border-b-0 lg:border-r border-[#d9ceb9] flex flex-col justify-between text-stone-800"
              style={{ borderRightColor: themeConfig.navbarBorder }}
            >
              <div>
                <div className="border-b border-stone-300/80 pb-3 mb-5 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-cinzel tracking-[0.25em] uppercase text-stone-500 block mb-1">
                      Life Architecture
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-cormorant font-semibold text-stone-900">
                      Goals & Aspirations
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setIsCreatingNew(true);
                      setSelectedGoalId(null);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-cinzel text-amber-100 rounded transition-all cursor-pointer hover:brightness-110 shadow-sm"
                    style={{ backgroundColor: themeConfig.primaryBtnBg }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Goal</span>
                  </button>
                </div>

                {/* Goals list */}
                <div className="space-y-3">
                  {goals.length === 0 ? (
                    <div className="text-center py-12 px-4 border border-dashed border-stone-300 rounded-lg">
                      <Target className="w-8 h-8 text-stone-400 mx-auto mb-2 opacity-60" />
                      <p className="font-cormorant text-lg text-stone-700 italic mb-1">
                        No goals inscribed yet.
                      </p>
                      <p className="text-xs text-stone-500 max-w-xs mx-auto mb-4">
                        Goals represent clear intentional pursuits. Add your first goal to begin tracking milestones.
                      </p>
                      <button
                        onClick={() => setIsCreatingNew(true)}
                        className="text-xs px-3.5 py-2 rounded text-amber-100 font-cinzel hover:brightness-110 transition-all cursor-pointer shadow-sm"
                        style={{ backgroundColor: themeConfig.primaryBtnBg }}
                      >
                        Define a Goal
                      </button>
                    </div>
                  ) : (
                    goals.map((g) => {
                      const isSelected = activeGoal?.id === g.id && !isCreatingNew;
                      const completedMilestones = (g.milestones || []).filter((m) => m.completed).length;
                      const totalMilestones = (g.milestones || []).length;
                      const milestoneRatio = totalMilestones > 0 ? completedMilestones / totalMilestones : 0;

                      return (
                        <div
                          key={g.id}
                          onClick={() => {
                            setSelectedGoalId(g.id);
                            setIsCreatingNew(false);
                          }}
                          className={`p-3.5 rounded-lg border transition-all cursor-pointer group ${
                            isSelected
                              ? 'bg-stone-200/90 shadow-sm ring-1 ring-black/10'
                              : 'bg-stone-200/50 hover:bg-stone-200/70 border-stone-300/70'
                          }`}
                          style={isSelected ? { borderColor: themeConfig.primaryBtnBg } : undefined}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <h4
                              className="font-cormorant font-semibold text-base text-stone-900 transition-colors"
                              style={isSelected ? { color: themeConfig.primaryBtnBg } : undefined}
                            >
                              {g.name}
                            </h4>
                            <span
                              className={`text-[10px] uppercase font-cinzel px-2 py-0.5 rounded font-semibold ${
                                g.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : g.status === 'paused'
                                  ? 'bg-stone-300 text-stone-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {g.status.replace('_', ' ')}
                            </span>
                          </div>

                          {g.description && (
                            <p className="text-xs font-serif text-stone-600 line-clamp-1 mb-2">
                              {g.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-xs text-stone-500">
                            {totalMilestones > 0 ? (
                              <span>
                                {completedMilestones} of {totalMilestones} milestones
                              </span>
                            ) : g.progress_target ? (
                              <span>
                                {g.progress_current || 0} / {g.progress_target} completed
                              </span>
                            ) : (
                              <span className="italic">No milestones yet</span>
                            )}

                            {g.target_date && (
                              <div className="flex items-center gap-1 text-[11px]">
                                <Calendar className="w-3 h-3 text-stone-400" />
                                <span>{g.target_date}</span>
                              </div>
                            )}
                          </div>

                          {/* Progress Bar with Active Theme Gradient */}
                          <div className="w-full bg-stone-300 h-2 rounded-full overflow-hidden mt-2">
                            <div
                              className="h-full transition-all duration-300 rounded-full"
                              style={{
                                background: themeConfig.progressBarGradient,
                                width: `${
                                  totalMilestones > 0
                                    ? Math.round(milestoneRatio * 100)
                                    : g.progress_target
                                    ? Math.min(100, Math.round(((g.progress_current || 0) / g.progress_target) * 100))
                                    : g.status === 'completed'
                                    ? 100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            <div className="pt-4 border-t border-stone-300/60 text-[11px] font-cinzel text-stone-400 flex items-center justify-between">
              <span>{goals.length} Goals Registered</span>
              <span>Ledger Page 3</span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT PAGE: Goal Details & Milestones Checklist / Form    */}
          {/* ========================================================= */}
          {/* ========================================================= */}
          {/* RIGHT PAGE: Goal Details & Milestones Checklist / Form    */}
          {/* ========================================================= */}
          <div
            key={isCreatingNew ? 'create-new-goal' : (activeGoal ? activeGoal.id : 'no-active-goal')}
            className="paper-surface paper-surface-right p-6 sm:p-8 lg:p-9 lg:pl-12 flex flex-col justify-between text-stone-800 book-page-flip"
          >
            {isCreatingNew ? (
              /* Create New Goal View */
              <div className="flex-1 flex flex-col">
                <div className="border-b border-stone-300/80 pb-3 mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-cormorant font-semibold text-stone-900">
                    Inscribe New Goal
                  </h3>
                  <button
                    onClick={() => setIsCreatingNew(false)}
                    className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleCreateGoalSubmit} className="space-y-4 flex-1">
                  <div>
                    <label className="block text-xs uppercase font-cinzel text-stone-600 mb-1">
                      Goal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Master Classical Piano Sonata, Write 50k Words, Run Marathon"
                      className="w-full text-sm font-lora bg-stone-200/60 border border-stone-300 rounded px-3 py-2 text-stone-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-cinzel text-stone-600 mb-1">
                      Description / Intention
                    </label>
                    <textarea
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      rows={3}
                      placeholder="Why does this pursuit matter? What will it bring into your life?"
                      className="w-full text-xs font-lora bg-stone-200/60 border border-stone-300 rounded px-3 py-2 text-stone-900 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs uppercase font-cinzel text-stone-600 mb-1">
                        Target Date
                      </label>
                      <input
                        type="date"
                        value={newTargetDate}
                        onChange={(e) => setNewTargetDate(e.target.value)}
                        className="w-full text-xs font-lora bg-stone-200/60 border border-stone-300 rounded px-2.5 py-1.5 text-stone-800 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs uppercase font-cinzel text-stone-600 mb-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newHasTarget}
                          onChange={(e) => setNewHasTarget(e.target.checked)}
                          className="rounded border-stone-400 cursor-pointer"
                          style={{ accentColor: themeConfig.primaryBtnBg }}
                        />
                        <span>Numerical Target</span>
                      </label>
                      {newHasTarget && (
                        <input
                          type="number"
                          min={1}
                          value={newProgressTarget}
                          onChange={(e) => setNewProgressTarget(e.target.value)}
                          placeholder="Target amount (e.g. 10)"
                          className="w-full text-xs font-lora bg-stone-200/60 border border-stone-300 rounded px-2.5 py-1.5 text-stone-800 focus:outline-none"
                        />
                      )}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded font-cinzel font-medium text-xs tracking-wider transition-all cursor-pointer hover:brightness-110 shadow-sm"
                      style={{ backgroundColor: themeConfig.primaryBtnBg, color: themeConfig.activeHighlightText }}
                    >
                      Commit Goal to Ledger
                    </button>
                  </div>
                </form>
              </div>
            ) : activeGoal ? (
              /* View Active Goal Details & Milestones */
              <div className="flex-1 flex flex-col">
                <div className="border-b border-stone-300/80 pb-3 mb-4 flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-cinzel tracking-[0.25em] uppercase text-stone-500 block">
                      Active Pursuit
                    </span>
                    <h3 className="text-2xl font-cormorant font-semibold text-stone-900 leading-tight">
                      {activeGoal.name}
                    </h3>
                  </div>

                  {/* Goal Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <select
                      value={activeGoal.status}
                      onChange={(e) => handleStatusChange(activeGoal.id, e.target.value as GoalStatus)}
                      className="text-xs bg-stone-200 border border-stone-300 rounded px-2 py-1 text-stone-800 font-cinzel focus:outline-none cursor-pointer"
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="paused">Paused</option>
                    </select>

                    <button
                      onClick={() => {
                        if (window.confirm('Delete this goal and all its milestones?')) {
                          onDeleteGoal(activeGoal.id);
                        }
                      }}
                      className="p-1.5 text-stone-400 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {activeGoal.description && (
                  <p className="text-xs font-lora italic text-stone-700 leading-relaxed mb-4 bg-stone-200/40 p-3 rounded border border-stone-300/50">
                    "{activeGoal.description}"
                  </p>
                )}

                {/* Numerical Progress Section if progress_target exists */}
                {activeGoal.progress_target !== null && (
                  <div className="mb-4 p-3 rounded bg-stone-200/50 border border-stone-300/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs uppercase font-cinzel tracking-wider text-stone-700 font-semibold">
                        Progress Metric
                      </span>
                      <span className="text-xs font-mono font-medium text-stone-700">
                        {activeGoal.progress_current || 0} / {activeGoal.progress_target} completed
                      </span>
                    </div>
                    <div className="w-full bg-stone-300 h-2 rounded-full overflow-hidden mb-2.5">
                      <div
                        className="h-full transition-all duration-300 rounded-full"
                        style={{
                          background: themeConfig.progressBarGradient,
                          width: `${Math.min(100, Math.round(((activeGoal.progress_current || 0) / activeGoal.progress_target) * 100))}%`,
                        }}
                      />
                    </div>
                    {activeGoal.status !== 'completed' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleNumericalProgressChange((activeGoal.progress_current || 0) - 1)}
                          disabled={(activeGoal.progress_current || 0) <= 0}
                          className="px-2.5 py-1 text-xs rounded bg-stone-300 hover:bg-stone-400 text-stone-800 disabled:opacity-40 cursor-pointer"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNumericalProgressChange((activeGoal.progress_current || 0) + 1)}
                          className="px-2.5 py-1 text-xs rounded cursor-pointer hover:brightness-110 transition-all shadow-sm"
                          style={{ backgroundColor: themeConfig.primaryBtnBg, color: themeConfig.activeHighlightText }}
                        >
                          +1 Progress
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={activeGoal.progress_target * 2}
                          value={activeGoal.progress_current || 0}
                          onChange={(e) => handleNumericalProgressChange(Number(e.target.value) || 0)}
                          className="w-16 text-xs text-center font-lora bg-stone-100 border border-stone-300 rounded py-1 px-1 text-stone-900"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Milestones Checklist Section */}
                <div className="flex-1 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-stone-600" />
                      <span className="text-xs uppercase font-cinzel tracking-wider text-stone-700 font-semibold">
                        Milestones & Steps
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-stone-500">
                      {(activeGoal.milestones || []).filter((m) => m.completed).length} /{' '}
                      {(activeGoal.milestones || []).length} completed
                    </span>
                  </div>

                  {/* Milestones list */}
                  <div className="space-y-2 mb-4">
                    {(activeGoal.milestones || []).length === 0 ? (
                      <p className="text-xs font-lora italic text-stone-500 py-3 text-center">
                        No milestones added yet. Add bite-sized achievements below.
                      </p>
                    ) : (
                      (activeGoal.milestones || []).map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between gap-2 p-2 rounded bg-stone-200/50 hover:bg-stone-200/80 transition-colors"
                        >
                          <button
                            onClick={() => handleToggleMilestone(m)}
                            className="flex items-center gap-2.5 text-left flex-1 cursor-pointer group"
                          >
                            {m.completed ? (
                              <CheckCircle2
                                className="w-4 h-4 shrink-0"
                                style={{ color: themeConfig.primaryBtnBg }}
                              />
                            ) : (
                              <Circle className="w-4 h-4 text-stone-400 group-hover:text-stone-600 shrink-0" />
                            )}
                            <span
                              className={`text-xs font-lora ${
                                m.completed ? 'line-through text-stone-400' : 'text-stone-800'
                              }`}
                            >
                              {m.name}
                            </span>
                          </button>

                          <button
                            onClick={() => onDeleteMilestone(m.id)}
                            className="text-stone-400 hover:text-rose-500 p-1 cursor-pointer"
                            title="Delete Milestone"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Milestone Form or Completed Notice */}
                  {activeGoal.status === 'completed' ? (
                    <div
                      className="flex items-center gap-2 p-2.5 rounded border text-xs font-lora"
                      style={{
                        backgroundColor: `${themeConfig.primaryBtnBg}15`,
                        borderColor: `${themeConfig.primaryBtnBg}44`,
                        color: themeConfig.primaryBtnBg,
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: themeConfig.primaryBtnBg }} />
                      <span>Goal achieved! Milestones are locked while completed. Change status to In Progress to add more milestones.</span>
                    </div>
                  ) : (
                    <form onSubmit={handleAddMilestoneSubmit} className="flex gap-2">
                      <input
                        type="text"
                        value={milestoneName}
                        onChange={(e) => setMilestoneName(e.target.value)}
                        placeholder="Add milestone or key step…"
                        className="flex-1 text-xs font-lora bg-stone-200/60 border border-stone-300 rounded px-2.5 py-1.5 text-stone-900 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!milestoneName.trim()}
                        className="px-3 py-1.5 text-xs font-cinzel rounded disabled:opacity-40 hover:brightness-110 cursor-pointer transition-all shadow-sm"
                        style={{ backgroundColor: themeConfig.primaryBtnBg, color: themeConfig.activeHighlightText }}
                      >
                        Add
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center">
                <p className="text-xs font-lora italic text-stone-500">
                  Select a goal from the left page or create a new pursuit.
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-stone-300/60 text-[11px] font-cinzel text-stone-400 flex items-center justify-between">
              <span>Goal Tracking Engine</span>
              <span>Ledger Page 4</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

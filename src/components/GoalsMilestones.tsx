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
        colors: ['#c5a66a', '#244637', '#dfc187'],
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
      status: 'in_progress',
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

    await onAddMilestone(activeGoal.id, milestoneName.trim());
    setMilestoneName('');
  };

  const handleToggleMilestone = async (m: GoalMilestone) => {
    const nextCompleted = !m.completed;
    if (nextCompleted) {
      triggerConfetti();
    }
    await onToggleMilestone(m.id, nextCompleted);
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
          <SpiralBinding ringCount={22} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[660px]">
            {/* ========================================================= */}
            {/* LEFT PAGE: Goals Index & Progress Overview                */}
            {/* ========================================================= */}
            <div className="paper-surface paper-surface-left p-6 sm:p-8 lg:p-9 lg:pr-12 border-b lg:border-b-0 lg:border-r border-[#d9ceb9] flex flex-col justify-between text-stone-800">
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
                    onClick={() => setIsCreatingNew(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-cinzel bg-[#244637] hover:bg-[#1b362a] text-amber-100 rounded transition-colors cursor-pointer"
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
                      className="text-xs px-3 py-1.5 rounded bg-[#244637] text-amber-100 font-cinzel"
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
                            ? 'bg-stone-200/90 border-[#244637] shadow-sm'
                            : 'bg-stone-200/50 hover:bg-stone-200/70 border-stone-300/70'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="font-cormorant font-semibold text-base text-stone-900 group-hover:text-[#244637] transition-colors">
                            {g.name}
                          </h4>
                          <span
                            className={`text-[10px] uppercase font-cinzel px-2 py-0.5 rounded ${
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

                        {/* Progress Bar */}
                        <div className="w-full bg-stone-300 h-1.5 rounded-full overflow-hidden mt-2">
                          <div
                            className="bg-[#244637] h-full transition-all duration-300"
                            style={{
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
          <div className="paper-surface paper-surface-right p-6 sm:p-8 lg:p-9 lg:pl-12 flex flex-col justify-between text-stone-800">
            {isCreatingNew ? (
              /* Create New Goal View */
              <div className="flex-1 flex flex-col">
                <div className="border-b border-stone-300/80 pb-3 mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-cormorant font-semibold text-stone-900">
                    Inscribe New Goal
                  </h3>
                  <button
                    onClick={() => setIsCreatingNew(false)}
                    className="text-xs text-stone-500 hover:text-stone-800"
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
                      className="w-full text-sm font-serif bg-stone-200/60 border border-stone-300 rounded px-3 py-2 text-stone-900 focus:outline-none focus:border-[#244637]"
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
                      className="w-full text-xs font-serif bg-stone-200/60 border border-stone-300 rounded px-3 py-2 text-stone-900 focus:outline-none focus:border-[#244637]"
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
                        className="w-full text-xs bg-stone-200/60 border border-stone-300 rounded px-2.5 py-1.5 text-stone-800 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs uppercase font-cinzel text-stone-600 mb-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newHasTarget}
                          onChange={(e) => setNewHasTarget(e.target.checked)}
                          className="rounded border-stone-400 text-[#244637]"
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
                          className="w-full text-xs bg-stone-200/60 border border-stone-300 rounded px-2.5 py-1.5 text-stone-800 focus:outline-none"
                        />
                      )}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded bg-[#244637] hover:bg-[#1b362a] text-amber-100 font-cinzel font-medium text-xs tracking-wider transition-colors cursor-pointer"
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
                      className="p-1.5 text-stone-400 hover:text-rose-500 transition-colors"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {activeGoal.description && (
                  <p className="text-xs font-serif italic text-stone-700 leading-relaxed mb-4 bg-stone-200/40 p-3 rounded border border-stone-300/50">
                    "{activeGoal.description}"
                  </p>
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
                      <p className="text-xs font-serif italic text-stone-500 py-3 text-center">
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
                              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-stone-400 group-hover:text-stone-600 shrink-0" />
                            )}
                            <span
                              className={`text-xs font-serif ${
                                m.completed ? 'line-through text-stone-400' : 'text-stone-800'
                              }`}
                            >
                              {m.name}
                            </span>
                          </button>

                          <button
                            onClick={() => onDeleteMilestone(m.id)}
                            className="text-stone-400 hover:text-rose-500 p-1"
                            title="Delete Milestone"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Milestone Form */}
                  <form onSubmit={handleAddMilestoneSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={milestoneName}
                      onChange={(e) => setMilestoneName(e.target.value)}
                      placeholder="Add milestone or key step…"
                      className="flex-1 text-xs font-serif bg-stone-200/60 border border-stone-300 rounded px-2.5 py-1.5 text-stone-900 focus:outline-none focus:border-[#244637]"
                    />
                    <button
                      type="submit"
                      disabled={!milestoneName.trim()}
                      className="px-3 py-1.5 text-xs font-cinzel rounded bg-[#244637] text-amber-100 disabled:opacity-40 cursor-pointer"
                    >
                      Add
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center">
                <p className="text-xs font-serif italic text-stone-500">
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

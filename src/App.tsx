import React, { useState, useEffect, useCallback } from 'react';
import {
  AuthUser,
  getCurrentActiveUser,
  signOutUser,
  fetchProfile,
  updateProfile as updateProfileApi,
  fetchEntries,
  saveJournalEntry,
  deleteJournalEntry,
  fetchGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  addMilestone,
  toggleMilestone,
  deleteMilestone,
  fetchHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  fetchHabitCompletions,
  toggleHabitCompletion,
  fetchWeeklyReview,
  saveWeeklyReview,
  exportUserDataAsJSON,
  deleteUserAccountPermanently,
} from './services/storage';
import {
  Profile,
  JournalEntry,
  Goal,
  Habit,
  HabitCompletion,
  BookSection,
  SaveStatus,
  Mood,
  WeeklyReflectionQuestions,
} from './types/journal';
import { BookCover } from './components/BookCover';
import { BookNavbar } from './components/BookNavbar';
import { DailyJournal } from './components/DailyJournal';
import { CalendarHistory } from './components/CalendarHistory';
import { GoalsMilestones } from './components/GoalsMilestones';
import { HabitsTracker } from './components/HabitsTracker';
import { WeeklyReviewView } from './components/WeeklyReviewView';
import { SettingsPrivacy } from './components/SettingsPrivacy';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<BookSection>('journal');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Core Data State
  const [profile, setProfile] = useState<Profile>({
    id: 'local_guest',
    display_name: 'Journal Keeper',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    week_starts_on: 1,
    theme: 'forest',
    text_size: 'medium',
    line_spacing: 'comfortable',
    reduced_motion: false,
  });

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitCompletions, setHabitCompletions] = useState<HabitCompletion[]>([]);

  // Autosave status
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');

  // Load active session on initial load
  useEffect(() => {
    (async () => {
      const user = await getCurrentActiveUser();
      if (user) {
        setCurrentUser(user);
      }
    })();
  }, []);

  // Reload all records whenever currentUser changes
  const loadAllUserData = useCallback(async (userId: string) => {
    try {
      const [userProfile, userEntries, userGoals, userHabits, userCompletions] = await Promise.all([
        fetchProfile(userId),
        fetchEntries(userId),
        fetchGoals(userId),
        fetchHabits(userId),
        fetchHabitCompletions(userId),
      ]);

      setProfile(userProfile);
      setEntries(userEntries);
      setGoals(userGoals);
      setHabits(userHabits);
      setHabitCompletions(userCompletions);

      // Select today's entry or latest entry
      const todayStr = new Date().toISOString().split('T')[0];
      const todayEntry = userEntries.find((e) => e.journal_date === todayStr);
      if (todayEntry) {
        setCurrentEntry(todayEntry);
      } else if (userEntries.length > 0) {
        setCurrentEntry(userEntries[0]);
      } else {
        setCurrentEntry(null);
      }
    } catch (err) {
      console.error('Failed loading user data:', err);
    }
  }, []);

  useEffect(() => {
    const effectiveUserId = currentUser?.id || 'local_guest';
    loadAllUserData(effectiveUserId);
  }, [currentUser?.id, loadAllUserData]);

  // Auth Handlers
  const handleAuthSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setIsBookOpen(true);
  };

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    setIsBookOpen(false);
  };

  // Profile Updates
  const handleUpdateProfile = async (updates: Partial<Profile>): Promise<Profile> => {
    const effectiveUserId = currentUser?.id || 'local_guest';
    const updated = await updateProfileApi(effectiveUserId, updates);
    setProfile(updated);
    return updated;
  };

  // Journal Entry Save (Autosave & Concurrency protected)
  const handleSaveEntry = async (entryData: {
    id?: string;
    journal_date: string;
    title: string | null;
    body: string;
    mood: Mood | null;
    sections: any;
    expected_revision?: number;
  }) => {
    const effectiveUserId = currentUser?.id || 'local_guest';
    const res = await saveJournalEntry(effectiveUserId, entryData);

    if (res.success && res.entry) {
      setCurrentEntry(res.entry);
      setEntries((prev) => {
        const index = prev.findIndex((e) => e.id === res.entry!.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = res.entry!;
          return next;
        }
        return [res.entry!, ...prev];
      });
    }

    return res;
  };

  const handleDeleteEntry = async (entryId: string): Promise<boolean> => {
    const effectiveUserId = currentUser?.id || 'local_guest';
    const ok = await deleteJournalEntry(effectiveUserId, entryId);
    if (ok) {
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      if (currentEntry?.id === entryId) {
        setCurrentEntry(null);
      }
    }
    return ok;
  };

  // Goals & Milestones Handlers
  const handleCreateGoal = async (goal: {
    name: string;
    description: string | null;
    status: Goal['status'];
    target_date: string | null;
    progress_current: number | null;
    progress_target: number | null;
  }) => {
    const effectiveUserId = currentUser?.id || 'local_guest';
    const newG = await createGoal(effectiveUserId, goal);
    setGoals((prev) => [newG, ...prev]);
    return newG;
  };

  const handleUpdateGoal = async (goalId: string, updates: Partial<Goal>) => {
    const effectiveUserId = currentUser?.id || 'local_guest';
    const updated = await updateGoal(effectiveUserId, goalId, updates);
    if (updated) {
      setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, ...updated } : g)));
    }
    return updated;
  };

  const handleDeleteGoal = async (goalId: string) => {
    const effectiveUserId = currentUser?.id || 'local_guest';
    const ok = await deleteGoal(effectiveUserId, goalId);
    if (ok) {
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    }
    return ok;
  };

  const handleAddMilestone = async (goalId: string, name: string, description?: string) => {
    const effectiveUserId = currentUser?.id || 'local_guest';
    const m = await addMilestone(effectiveUserId, goalId, name, description);
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          return { ...g, milestones: [...(g.milestones || []), m] };
        }
        return g;
      })
    );
    return m;
  };

  const handleToggleMilestone = async (milestoneId: string, completed: boolean) => {
    const effectiveUserId = currentUser?.id || 'local_guest';
    const updated = await toggleMilestone(effectiveUserId, milestoneId, completed);
    if (updated) {
      setGoals((prev) =>
        prev.map((g) => ({
          ...g,
          milestones: (g.milestones || []).map((m) => (m.id === milestoneId ? updated : m)),
        }))
      );
    }
    return updated;
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    const effectiveUserId = currentUser?.id || 'local_guest';
    const ok = await deleteMilestone(effectiveUserId, milestoneId);
    if (ok) {
      setGoals((prev) =>
        prev.map((g) => ({
          ...g,
          milestones: (g.milestones || []).filter((m) => m.id !== milestoneId),
        }))
      );
    }
    return ok;
  };

  // Habits Handlers
  const handleCreateHabit = async (habit: {
    name: string;
    description: string | null;
    goal_id: string | null;
    schedule_type: Habit['schedule_type'];
    schedule_config: any;
  }) => {
    const effectiveUserId = currentUser?.id || 'local_guest';
    const newH = await createHabit(effectiveUserId, habit);
    setHabits((prev) => [...prev, newH]);
    return newH;
  };

  const handleUpdateHabit = async (habitId: string, updates: Partial<Habit>) => {
    const effectiveUserId = currentUser?.id || 'local_guest';
    const updated = await updateHabit(effectiveUserId, habitId, updates);
    if (updated) {
      setHabits((prev) => prev.map((h) => (h.id === habitId ? updated : h)));
    }
    return updated;
  };

  const handleDeleteHabit = async (habitId: string) => {
    const effectiveUserId = currentUser?.id || 'local_guest';
    const ok = await deleteHabit(effectiveUserId, habitId);
    if (ok) {
      setHabits((prev) => prev.filter((h) => h.id !== habitId));
      setHabitCompletions((prev) => prev.filter((c) => c.habit_id !== habitId));
    }
    return ok;
  };

  const handleToggleHabitCompletion = async (habitId: string, dateStr: string) => {
    const effectiveUserId = currentUser?.id || 'local_guest';
    const res = await toggleHabitCompletion(effectiveUserId, habitId, dateStr);

    if (res.completed) {
      setHabitCompletions((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          habit_id: habitId,
          user_id: effectiveUserId,
          completed_on: dateStr,
          created_at: new Date().toISOString(),
        },
      ]);
    } else {
      setHabitCompletions((prev) =>
        prev.filter((c) => !(c.habit_id === habitId && c.completed_on === dateStr))
      );
    }
  };

  // Weekly Review Handlers
  const handleFetchWeeklyReview = async (weekStart: string) => {
    const effectiveUserId = currentUser?.id || 'local_guest';
    return await fetchWeeklyReview(effectiveUserId, weekStart);
  };

  const handleSaveWeeklyReview = async (
    weekStart: string,
    reflection: string,
    questions: WeeklyReflectionQuestions
  ) => {
    const effectiveUserId = currentUser?.id || 'local_guest';
    return await saveWeeklyReview(effectiveUserId, weekStart, reflection, questions);
  };

  // Data Export (PRD Section 14.1)
  const handleExportData = async () => {
    const effectiveUserId = currentUser?.id || 'local_guest';
    const jsonStr = await exportUserDataAsJSON(effectiveUserId);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `The_Journal_Export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Account Deletion (PRD Section 14.2)
  const handleDeleteAccount = async () => {
    const effectiveUserId = currentUser?.id || 'local_guest';
    await deleteUserAccountPermanently(effectiveUserId);
    setCurrentUser(null);
    setIsBookOpen(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#111312] text-stone-100 flex flex-col font-sans selection:bg-[#c5a66a] selection:text-stone-900">
      {!isBookOpen ? (
        /* Front Hardcover Landing Experience */
        <BookCover
          theme={profile.theme}
          onOpenBook={() => setIsBookOpen(true)}
          isAuthenticated={!!currentUser}
          userDisplayName={currentUser?.displayName}
          onOpenAuth={() => setAuthModalOpen(true)}
        />
      ) : (
        /* Interior Book Experience */
        <div className="flex-1 flex flex-col">
          <BookNavbar
            activeSection={activeSection}
            onSelectSection={setActiveSection}
            onCloseBook={() => setIsBookOpen(false)}
            saveStatus={saveStatus}
            onRetrySave={() => {
              if (currentEntry) {
                handleSaveEntry({
                  id: currentEntry.id,
                  journal_date: currentEntry.journal_date,
                  title: currentEntry.title,
                  body: currentEntry.body,
                  mood: currentEntry.mood,
                  sections: currentEntry.sections,
                  expected_revision: currentEntry.revision,
                });
              }
            }}
            isAuthenticated={!!currentUser}
            userEmail={currentUser?.email}
            onOpenAuth={() => setAuthModalOpen(true)}
          />

          <main className="flex-1 flex items-center justify-center p-2 sm:p-4 lg:p-6">
            {activeSection === 'journal' && (
              <DailyJournal
                entries={entries}
                currentEntry={currentEntry}
                onSelectEntry={setCurrentEntry}
                onSaveEntry={handleSaveEntry}
                onDeleteEntry={handleDeleteEntry}
                profile={profile}
                habits={habits}
                habitCompletions={habitCompletions}
                onToggleHabit={handleToggleHabitCompletion}
                saveStatus={saveStatus}
                setSaveStatus={setSaveStatus}
                onNavigateToCalendar={() => setActiveSection('calendar')}
              />
            )}

            {activeSection === 'calendar' && (
              <CalendarHistory
                entries={entries}
                onOpenEntry={(entry) => {
                  setCurrentEntry(entry);
                  setActiveSection('journal');
                }}
                onNewEntryForDate={(dateStr) => {
                  setCurrentEntry(null);
                  setActiveSection('journal');
                }}
                profile={profile}
              />
            )}

            {activeSection === 'goals' && (
              <GoalsMilestones
                goals={goals}
                onCreateGoal={handleCreateGoal}
                onUpdateGoal={handleUpdateGoal}
                onDeleteGoal={handleDeleteGoal}
                onAddMilestone={handleAddMilestone}
                onToggleMilestone={handleToggleMilestone}
                onDeleteMilestone={handleDeleteMilestone}
              />
            )}

            {activeSection === 'habits' && (
              <HabitsTracker
                habits={habits}
                habitCompletions={habitCompletions}
                onCreateHabit={handleCreateHabit}
                onUpdateHabit={handleUpdateHabit}
                onDeleteHabit={handleDeleteHabit}
                onToggleCompletion={handleToggleHabitCompletion}
                profile={profile}
                goals={goals}
              />
            )}

            {activeSection === 'reviews' && (
              <WeeklyReviewView
                entries={entries}
                habits={habits}
                habitCompletions={habitCompletions}
                goals={goals}
                profile={profile}
                onFetchReview={handleFetchWeeklyReview}
                onSaveReview={handleSaveWeeklyReview}
              />
            )}

            {activeSection === 'settings' && (
              <SettingsPrivacy
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
                onExportData={handleExportData}
                onDeleteAccount={handleDeleteAccount}
                onSignOut={handleSignOut}
                userEmail={currentUser?.email}
              />
            )}
          </main>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

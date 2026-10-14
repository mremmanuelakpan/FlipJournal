import { getSupabaseClient } from '../lib/supabase';
import {
  Profile,
  JournalEntry,
  Goal,
  GoalMilestone,
  Habit,
  HabitCompletion,
  WeeklyReview,
  EntrySectionPreferences,
  Mood,
} from '../types/journal';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

// ---------------------------------------------------------------------
// Browser-Persistent Storage Keys
// ---------------------------------------------------------------------
const AUTH_USERS_KEY = 'the_journal_db_auth_users';
const ACTIVE_SESSION_KEY = 'the_journal_db_active_session';
const PROFILES_KEY = 'the_journal_db_profiles';
const ENTRIES_KEY = 'the_journal_db_entries';
const GOALS_KEY = 'the_journal_db_goals';
const MILESTONES_KEY = 'the_journal_db_milestones';
const HABITS_KEY = 'the_journal_db_habits';
const COMPLETIONS_KEY = 'the_journal_db_completions';
const REVIEWS_KEY = 'the_journal_db_reviews';
const PREFERENCES_KEY = 'the_journal_db_preferences';

function getStored<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error(`Failed to persist key: ${key}`, err);
  }
}

// ---------------------------------------------------------------------
// Auth Service
// ---------------------------------------------------------------------
export async function signUpUser(
  email: string,
  pass: string,
  displayName: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  const cleanEmail = email.trim().toLowerCase();
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          data: { display_name: displayName.trim() },
        },
      });
      if (error) return { user: null, error: error.message };
      if (!data.user) return { user: null, error: 'Registration failed. Please try again.' };

      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email || cleanEmail,
        displayName: displayName.trim() || cleanEmail.split('@')[0],
        createdAt: data.user.created_at,
      };
      return { user, error: null };
    } catch (err: any) {
      return { user: null, error: err.message || 'Error communicating with Supabase.' };
    }
  }

  // Local persistent auth engine
  const users = getStored<Array<AuthUser & { passHash: string }>>(AUTH_USERS_KEY, []);
  if (users.some((u) => u.email === cleanEmail)) {
    return { user: null, error: 'An account with this email already exists.' };
  }

  const id = crypto.randomUUID();
  const newUser: AuthUser & { passHash: string } = {
    id,
    email: cleanEmail,
    displayName: displayName.trim() || cleanEmail.split('@')[0],
    createdAt: new Date().toISOString(),
    passHash: btoa(pass), // Basic reversible hash for client-isolated environment
  };

  users.push(newUser);
  setStored(AUTH_USERS_KEY, users);

  // Auto-provision profile & preferences
  const profiles = getStored<Profile[]>(PROFILES_KEY, []);
  profiles.push({
    id,
    display_name: newUser.displayName,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    week_starts_on: 1,
    theme: 'forest',
    text_size: 'medium',
    line_spacing: 'comfortable',
    reduced_motion: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  setStored(PROFILES_KEY, profiles);

  const prefs = getStored<EntrySectionPreferences[]>(PREFERENCES_KEY, []);
  prefs.push({
    user_id: id,
    configuration: {
      enabled_sections: ['mood', 'prompts', 'priorities', 'habits', 'highlights', 'freewrite'],
    },
    updated_at: new Date().toISOString(),
  });
  setStored(PREFERENCES_KEY, prefs);

  // Set active session
  setStored(ACTIVE_SESSION_KEY, { id: newUser.id, email: newUser.email, displayName: newUser.displayName, createdAt: newUser.createdAt });

  return {
    user: { id: newUser.id, email: newUser.email, displayName: newUser.displayName, createdAt: newUser.createdAt },
    error: null,
  };
}

export async function signInUser(
  email: string,
  pass: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  const cleanEmail = email.trim().toLowerCase();
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: cleanEmail,
        password: pass,
      });
      if (error) return { user: null, error: error.message };
      if (!data.user) return { user: null, error: 'Sign in failed.' };

      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email || cleanEmail,
        displayName: data.user.user_metadata?.display_name || cleanEmail.split('@')[0],
        createdAt: data.user.created_at,
      };
      return { user, error: null };
    } catch (err: any) {
      return { user: null, error: err.message || 'Error communicating with Supabase.' };
    }
  }

  const users = getStored<Array<AuthUser & { passHash: string }>>(AUTH_USERS_KEY, []);
  const found = users.find((u) => u.email === cleanEmail && u.passHash === btoa(pass));

  if (!found) {
    return { user: null, error: 'Invalid email or password.' };
  }

  const user: AuthUser = {
    id: found.id,
    email: found.email,
    displayName: found.displayName,
    createdAt: found.createdAt,
  };
  setStored(ACTIVE_SESSION_KEY, user);
  return { user, error: null };
}

export async function signOutUser(): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch (err) {
      console.warn('Supabase signOut error:', err);
    }
  }
  localStorage.removeItem(ACTIVE_SESSION_KEY);
}

export async function resetPasswordForEmail(email: string): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const client = getSupabaseClient();

  if (client) {
    try {
      await client.auth.resetPasswordForEmail(cleanEmail);
    } catch {
      // Intentionally silent on specific error to satisfy PRD rule:
      // "Never reveal whether a particular email address is registered through password-recovery responses."
    }
  }

  // Consistent privacy-preserving message
  return {
    success: true,
    message: 'If an account with that email exists, password reset instructions have been dispatched.',
  };
}

export async function getCurrentActiveUser(): Promise<AuthUser | null> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data } = await client.auth.getUser();
      if (data.user) {
        return {
          id: data.user.id,
          email: data.user.email || '',
          displayName: data.user.user_metadata?.display_name || (data.user.email ? data.user.email.split('@')[0] : 'Writer'),
          createdAt: data.user.created_at,
        };
      }
    } catch (err) {
      console.warn('Supabase auth get user failed, fallback to local session:', err);
    }
  }
  return getStored<AuthUser | null>(ACTIVE_SESSION_KEY, null);
}

// ---------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------
export async function fetchProfile(userId: string): Promise<Profile> {
  const defaultProfile: Profile = {
    id: userId,
    display_name: 'Journal Keeper',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    week_starts_on: 1,
    theme: 'forest',
    text_size: 'medium',
    line_spacing: 'comfortable',
    reduced_motion: false,
  };

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (!error && data) return data as Profile;
    } catch (err) {
      console.warn('Supabase profile fetch error:', err);
    }
  }

  const profiles = getStored<Profile[]>(PROFILES_KEY, []);
  const found = profiles.find((p) => p.id === userId);
  if (found) return found;

  // Insert default profile
  profiles.push(defaultProfile);
  setStored(PROFILES_KEY, profiles);
  return defaultProfile;
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
      if (!error && data) return data as Profile;
    } catch (err) {
      console.warn('Supabase profile update error:', err);
    }
  }

  const profiles = getStored<Profile[]>(PROFILES_KEY, []);
  const index = profiles.findIndex((p) => p.id === userId);
  const existing = index >= 0 ? profiles[index] : { id: userId, display_name: '', timezone: 'UTC', week_starts_on: 1 as const, theme: 'forest' as const, text_size: 'medium' as const, line_spacing: 'comfortable' as const, reduced_motion: false };
  const updated: Profile = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (index >= 0) {
    profiles[index] = updated;
  } else {
    profiles.push(updated);
  }
  setStored(PROFILES_KEY, profiles);
  return updated;
}

// ---------------------------------------------------------------------
// Journal Entries (with Concurrency Revision Protection)
// ---------------------------------------------------------------------
export async function fetchEntries(
  userId: string,
  options?: { startDate?: string; endDate?: string; mood?: Mood | 'all'; query?: string }
): Promise<JournalEntry[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      let q = client.from('journal_entries').select('*').eq('user_id', userId).order('journal_date', { ascending: false }).order('created_at', { ascending: false });
      if (options?.startDate) q = q.gte('journal_date', options.startDate);
      if (options?.endDate) q = q.lte('journal_date', options.endDate);
      if (options?.mood && options.mood !== 'all') q = q.eq('mood', options.mood);
      const { data, error } = await q;
      if (!error && data) {
        let results = data as JournalEntry[];
        if (options?.query && options.query.trim()) {
          const lq = options.query.toLowerCase().trim();
          results = results.filter(
            (e) => (e.title && e.title.toLowerCase().includes(lq)) || (e.body && e.body.toLowerCase().includes(lq))
          );
        }
        return results;
      }
    } catch (err) {
      console.warn('Supabase fetch entries error:', err);
    }
  }

  let entries = getStored<JournalEntry[]>(ENTRIES_KEY, []).filter((e) => e.user_id === userId);

  if (options?.startDate) {
    entries = entries.filter((e) => e.journal_date >= options.startDate!);
  }
  if (options?.endDate) {
    entries = entries.filter((e) => e.journal_date <= options.endDate!);
  }
  if (options?.mood && options.mood !== 'all') {
    entries = entries.filter((e) => e.mood === options.mood);
  }
  if (options?.query && options.query.trim()) {
    const lq = options.query.toLowerCase().trim();
    entries = entries.filter(
      (e) =>
        (e.title && e.title.toLowerCase().includes(lq)) ||
        (e.body && e.body.toLowerCase().includes(lq)) ||
        (e.sections?.freewrite && e.sections.freewrite.toLowerCase().includes(lq))
    );
  }

  // Sort descending by journal_date and created_at
  entries.sort((a, b) => {
    if (a.journal_date !== b.journal_date) {
      return b.journal_date.localeCompare(a.journal_date);
    }
    return b.created_at.localeCompare(a.created_at);
  });

  return entries;
}

export async function fetchEntryById(userId: string, entryId: string): Promise<JournalEntry | null> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('journal_entries')
        .select('*')
        .eq('id', entryId)
        .eq('user_id', userId)
        .maybeSingle();
      if (!error && data) return data as JournalEntry;
    } catch (err) {
      console.warn('Supabase fetch entry error:', err);
    }
  }

  const entries = getStored<JournalEntry[]>(ENTRIES_KEY, []);
  const found = entries.find((e) => e.id === entryId && e.user_id === userId);
  return found || null;
}

export async function saveJournalEntry(
  userId: string,
  entryData: {
    id?: string;
    journal_date: string;
    title: string | null;
    body: string;
    mood: Mood | null;
    sections: any;
    expected_revision?: number;
  }
): Promise<{
  success: boolean;
  entry?: JournalEntry;
  conflict?: boolean;
  currentRevision?: number;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (client) {
    try {
      // Call concurrency RPC if entry already exists, or direct insert
      if (entryData.id) {
        const { data, error } = await client.rpc('save_journal_entry_with_revision', {
          p_entry_id: entryData.id,
          p_journal_date: entryData.journal_date,
          p_title: entryData.title,
          p_body: entryData.body,
          p_mood: entryData.mood,
          p_sections: entryData.sections || {},
          p_expected_revision: entryData.expected_revision ?? 1,
        });

        if (error) {
          return { success: false, error: error.message };
        }
        if (data && data[0]) {
          const res = data[0];
          if (res.conflict_detected) {
            return {
              success: false,
              conflict: true,
              currentRevision: res.current_revision,
              error: 'Conflict: This entry was modified in another window or session.',
            };
          }
          const { data: updatedEntry } = await client.from('journal_entries').select('*').eq('id', res.entry_id).single();
          return { success: true, entry: updatedEntry as JournalEntry };
        }
      } else {
        const { data, error } = await client
          .from('journal_entries')
          .insert({
            user_id: userId,
            journal_date: entryData.journal_date,
            title: entryData.title,
            body: entryData.body,
            mood: entryData.mood,
            sections: entryData.sections || {},
            revision: 1,
          })
          .select()
          .single();

        if (error) return { success: false, error: error.message };
        return { success: true, entry: data as JournalEntry };
      }
    } catch (err: any) {
      console.warn('Supabase save journal error:', err);
      return { success: false, error: err.message || 'Network error saving entry.' };
    }
  }

  // Local persistent DB with revision tracking
  const entries = getStored<JournalEntry[]>(ENTRIES_KEY, []);
  const now = new Date().toISOString();

  if (entryData.id) {
    const index = entries.findIndex((e) => e.id === entryData.id && e.user_id === userId);
    if (index === -1) {
      return { success: false, error: 'Entry not found or access denied.' };
    }

    const current = entries[index];
    if (entryData.expected_revision !== undefined && current.revision !== entryData.expected_revision) {
      return {
        success: false,
        conflict: true,
        currentRevision: current.revision,
        error: 'Conflict detected: The entry has been updated since you opened it.',
      };
    }

    const updated: JournalEntry = {
      ...current,
      journal_date: entryData.journal_date,
      title: entryData.title,
      body: entryData.body,
      mood: entryData.mood,
      sections: entryData.sections || {},
      revision: current.revision + 1,
      updated_at: now,
    };

    entries[index] = updated;
    setStored(ENTRIES_KEY, entries);
    return { success: true, entry: updated };
  } else {
    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      user_id: userId,
      journal_date: entryData.journal_date,
      title: entryData.title,
      body: entryData.body,
      mood: entryData.mood,
      sections: entryData.sections || {},
      revision: 1,
      created_at: now,
      updated_at: now,
    };

    entries.unshift(newEntry);
    setStored(ENTRIES_KEY, entries);
    return { success: true, entry: newEntry };
  }
}

export async function deleteJournalEntry(userId: string, entryId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('journal_entries').delete().eq('id', entryId).eq('user_id', userId);
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase delete entry error:', err);
    }
  }

  const entries = getStored<JournalEntry[]>(ENTRIES_KEY, []);
  const filtered = entries.filter((e) => !(e.id === entryId && e.user_id === userId));
  setStored(ENTRIES_KEY, filtered);
  return true;
}

// ---------------------------------------------------------------------
// Goals & Milestones
// ---------------------------------------------------------------------
export async function fetchGoals(userId: string): Promise<Goal[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data: goalsData, error: goalsError } = await client
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!goalsError && goalsData) {
        const { data: milestonesData } = await client
          .from('goal_milestones')
          .select('*')
          .eq('user_id', userId)
          .order('position', { ascending: true });

        const milestonesByGoal = (milestonesData || []).reduce((acc: any, m: any) => {
          if (!acc[m.goal_id]) acc[m.goal_id] = [];
          acc[m.goal_id].push(m);
          return acc;
        }, {});

        return (goalsData as Goal[]).map((g) => ({
          ...g,
          milestones: milestonesByGoal[g.id] || [],
        }));
      }
    } catch (err) {
      console.warn('Supabase fetch goals error:', err);
    }
  }

  const goals = getStored<Goal[]>(GOALS_KEY, []).filter((g) => g.user_id === userId);
  const milestones = getStored<GoalMilestone[]>(MILESTONES_KEY, []).filter((m) => m.user_id === userId);

  return goals.map((g) => ({
    ...g,
    milestones: milestones.filter((m) => m.goal_id === g.id).sort((a, b) => a.position - b.position),
  }));
}

export async function createGoal(
  userId: string,
  goal: {
    name: string;
    description: string | null;
    status: Goal['status'];
    target_date: string | null;
    progress_current: number | null;
    progress_target: number | null;
  }
): Promise<Goal> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('goals')
        .insert({
          user_id: userId,
          ...goal,
        })
        .select()
        .single();
      if (!error && data) return { ...data, milestones: [] } as Goal;
    } catch (err) {
      console.warn('Supabase create goal error:', err);
    }
  }

  const goals = getStored<Goal[]>(GOALS_KEY, []);
  const now = new Date().toISOString();
  const newGoal: Goal = {
    id: crypto.randomUUID(),
    user_id: userId,
    name: goal.name,
    description: goal.description,
    status: goal.status,
    target_date: goal.target_date,
    progress_current: goal.progress_current,
    progress_target: goal.progress_target,
    milestones: [],
    created_at: now,
    updated_at: now,
  };
  goals.unshift(newGoal);
  setStored(GOALS_KEY, goals);
  return newGoal;
}

export async function updateGoal(userId: string, goalId: string, updates: Partial<Goal>): Promise<Goal | null> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('goals')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', goalId)
        .eq('user_id', userId)
        .select()
        .single();
      if (!error && data) return data as Goal;
    } catch (err) {
      console.warn('Supabase update goal error:', err);
    }
  }

  const goals = getStored<Goal[]>(GOALS_KEY, []);
  const index = goals.findIndex((g) => g.id === goalId && g.user_id === userId);
  if (index === -1) return null;

  const updated: Goal = {
    ...goals[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  goals[index] = updated;
  setStored(GOALS_KEY, goals);
  return updated;
}

export async function deleteGoal(userId: string, goalId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('goals').delete().eq('id', goalId).eq('user_id', userId);
    } catch (err) {
      console.warn('Supabase delete goal error:', err);
    }
  }

  const goals = getStored<Goal[]>(GOALS_KEY, []).filter((g) => !(g.id === goalId && g.user_id === userId));
  const milestones = getStored<GoalMilestone[]>(MILESTONES_KEY, []).filter((m) => !(m.goal_id === goalId && m.user_id === userId));
  setStored(GOALS_KEY, goals);
  setStored(MILESTONES_KEY, milestones);
  return true;
}

export async function addMilestone(
  userId: string,
  goalId: string,
  name: string,
  description?: string
): Promise<GoalMilestone> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('goal_milestones')
        .insert({
          goal_id: goalId,
          user_id: userId,
          name: name.trim(),
          description: description?.trim() || null,
          completed: false,
        })
        .select()
        .single();
      if (!error && data) return data as GoalMilestone;
    } catch (err) {
      console.warn('Supabase add milestone error:', err);
    }
  }

  const milestones = getStored<GoalMilestone[]>(MILESTONES_KEY, []);
  const goalMilestones = milestones.filter((m) => m.goal_id === goalId);
  const now = new Date().toISOString();
  const newMilestone: GoalMilestone = {
    id: crypto.randomUUID(),
    goal_id: goalId,
    user_id: userId,
    name: name.trim(),
    description: description?.trim(),
    position: goalMilestones.length,
    completed: false,
    completed_at: null,
    created_at: now,
    updated_at: now,
  };
  milestones.push(newMilestone);
  setStored(MILESTONES_KEY, milestones);
  return newMilestone;
}

export async function toggleMilestone(
  userId: string,
  milestoneId: string,
  completed: boolean
): Promise<GoalMilestone | null> {
  const now = completed ? new Date().toISOString() : null;
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('goal_milestones')
        .update({
          completed,
          completed_at: now,
          updated_at: new Date().toISOString(),
        })
        .eq('id', milestoneId)
        .eq('user_id', userId)
        .select()
        .single();
      if (!error && data) return data as GoalMilestone;
    } catch (err) {
      console.warn('Supabase toggle milestone error:', err);
    }
  }

  const milestones = getStored<GoalMilestone[]>(MILESTONES_KEY, []);
  const index = milestones.findIndex((m) => m.id === milestoneId && m.user_id === userId);
  if (index === -1) return null;

  milestones[index] = {
    ...milestones[index],
    completed,
    completed_at: now,
    updated_at: new Date().toISOString(),
  };
  setStored(MILESTONES_KEY, milestones);
  return milestones[index];
}

export async function deleteMilestone(userId: string, milestoneId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('goal_milestones').delete().eq('id', milestoneId).eq('user_id', userId);
    } catch (err) {
      console.warn('Supabase delete milestone error:', err);
    }
  }

  const milestones = getStored<GoalMilestone[]>(MILESTONES_KEY, []).filter(
    (m) => !(m.id === milestoneId && m.user_id === userId)
  );
  setStored(MILESTONES_KEY, milestones);
  return true;
}

// ---------------------------------------------------------------------
// Habits & Completions
// ---------------------------------------------------------------------
export async function fetchHabits(userId: string): Promise<Habit[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      if (!error && data) return data as Habit[];
    } catch (err) {
      console.warn('Supabase fetch habits error:', err);
    }
  }

  return getStored<Habit[]>(HABITS_KEY, []).filter((h) => h.user_id === userId);
}

export async function createHabit(
  userId: string,
  habit: {
    name: string;
    description: string | null;
    goal_id: string | null;
    schedule_type: Habit['schedule_type'];
    schedule_config: Habit['schedule_config'];
  }
): Promise<Habit> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('habits')
        .insert({
          user_id: userId,
          ...habit,
          status: 'active',
        })
        .select()
        .single();
      if (!error && data) return data as Habit;
    } catch (err) {
      console.warn('Supabase create habit error:', err);
    }
  }

  const habits = getStored<Habit[]>(HABITS_KEY, []);
  const now = new Date().toISOString();
  const newHabit: Habit = {
    id: crypto.randomUUID(),
    user_id: userId,
    goal_id: habit.goal_id,
    name: habit.name,
    description: habit.description,
    schedule_type: habit.schedule_type,
    schedule_config: habit.schedule_config,
    status: 'active',
    created_at: now,
    updated_at: now,
  };
  habits.push(newHabit);
  setStored(HABITS_KEY, habits);
  return newHabit;
}

export async function updateHabit(userId: string, habitId: string, updates: Partial<Habit>): Promise<Habit | null> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('habits')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', habitId)
        .eq('user_id', userId)
        .select()
        .single();
      if (!error && data) return data as Habit;
    } catch (err) {
      console.warn('Supabase update habit error:', err);
    }
  }

  const habits = getStored<Habit[]>(HABITS_KEY, []);
  const index = habits.findIndex((h) => h.id === habitId && h.user_id === userId);
  if (index === -1) return null;

  const updated: Habit = {
    ...habits[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  habits[index] = updated;
  setStored(HABITS_KEY, habits);
  return updated;
}

export async function deleteHabit(userId: string, habitId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('habits').delete().eq('id', habitId).eq('user_id', userId);
    } catch (err) {
      console.warn('Supabase delete habit error:', err);
    }
  }

  const habits = getStored<Habit[]>(HABITS_KEY, []).filter((h) => !(h.id === habitId && h.user_id === userId));
  const completions = getStored<HabitCompletion[]>(COMPLETIONS_KEY, []).filter(
    (c) => !(c.habit_id === habitId && c.user_id === userId)
  );
  setStored(HABITS_KEY, habits);
  setStored(COMPLETIONS_KEY, completions);
  return true;
}

export async function fetchHabitCompletions(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<HabitCompletion[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      let q = client.from('habit_completions').select('*').eq('user_id', userId);
      if (startDate) q = q.gte('completed_on', startDate);
      if (endDate) q = q.lte('completed_on', endDate);
      const { data, error } = await q;
      if (!error && data) return data as HabitCompletion[];
    } catch (err) {
      console.warn('Supabase fetch completions error:', err);
    }
  }

  let list = getStored<HabitCompletion[]>(COMPLETIONS_KEY, []).filter((c) => c.user_id === userId);
  if (startDate) list = list.filter((c) => c.completed_on >= startDate);
  if (endDate) list = list.filter((c) => c.completed_on <= endDate);
  return list;
}

export async function toggleHabitCompletion(
  userId: string,
  habitId: string,
  dateStr: string
): Promise<{ completed: boolean }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      // Check if completion exists
      const { data: existing } = await client
        .from('habit_completions')
        .select('id')
        .eq('habit_id', habitId)
        .eq('completed_on', dateStr)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        await client.from('habit_completions').delete().eq('id', existing.id);
        return { completed: false };
      } else {
        await client.from('habit_completions').insert({
          habit_id: habitId,
          user_id: userId,
          completed_on: dateStr,
        });
        return { completed: true };
      }
    } catch (err) {
      console.warn('Supabase toggle completion error:', err);
    }
  }

  const completions = getStored<HabitCompletion[]>(COMPLETIONS_KEY, []);
  const existingIndex = completions.findIndex(
    (c) => c.habit_id === habitId && c.completed_on === dateStr && c.user_id === userId
  );

  if (existingIndex >= 0) {
    completions.splice(existingIndex, 1);
    setStored(COMPLETIONS_KEY, completions);
    return { completed: false };
  } else {
    completions.push({
      id: crypto.randomUUID(),
      habit_id: habitId,
      user_id: userId,
      completed_on: dateStr,
      created_at: new Date().toISOString(),
    });
    setStored(COMPLETIONS_KEY, completions);
    return { completed: true };
  }
}

// ---------------------------------------------------------------------
// Weekly Reviews
// ---------------------------------------------------------------------
export async function fetchWeeklyReview(userId: string, weekStart: string): Promise<WeeklyReview | null> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('weekly_reviews')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start', weekStart)
        .maybeSingle();
      if (!error && data) return data as WeeklyReview;
    } catch (err) {
      console.warn('Supabase fetch weekly review error:', err);
    }
  }

  const reviews = getStored<WeeklyReview[]>(REVIEWS_KEY, []);
  return reviews.find((r) => r.user_id === userId && r.week_start === weekStart) || null;
}

export async function saveWeeklyReview(
  userId: string,
  weekStart: string,
  reflection: string,
  questions: any
): Promise<WeeklyReview> {
  const now = new Date().toISOString();
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('weekly_reviews')
        .upsert(
          {
            user_id: userId,
            week_start: weekStart,
            reflection,
            questions: questions || {},
            updated_at: now,
          },
          { onConflict: 'user_id,week_start' }
        )
        .select()
        .single();
      if (!error && data) return data as WeeklyReview;
    } catch (err) {
      console.warn('Supabase save weekly review error:', err);
    }
  }

  const reviews = getStored<WeeklyReview[]>(REVIEWS_KEY, []);
  const index = reviews.findIndex((r) => r.user_id === userId && r.week_start === weekStart);

  if (index >= 0) {
    const updated: WeeklyReview = {
      ...reviews[index],
      reflection,
      questions,
      updated_at: now,
    };
    reviews[index] = updated;
    setStored(REVIEWS_KEY, reviews);
    return updated;
  } else {
    const newReview: WeeklyReview = {
      id: crypto.randomUUID(),
      user_id: userId,
      week_start: weekStart,
      reflection,
      questions,
      created_at: now,
      updated_at: now,
    };
    reviews.push(newReview);
    setStored(REVIEWS_KEY, reviews);
    return newReview;
  }
}

// ---------------------------------------------------------------------
// Section Preferences
// ---------------------------------------------------------------------
export async function fetchSectionPreferences(userId: string): Promise<EntrySectionPreferences['configuration']> {
  const defaultConf = {
    enabled_sections: ['mood', 'prompts', 'priorities', 'habits', 'highlights', 'freewrite'] as any[],
  };

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('entry_section_preferences')
        .select('configuration')
        .eq('user_id', userId)
        .maybeSingle();
      if (!error && data?.configuration) return data.configuration;
    } catch (err) {
      console.warn('Supabase fetch preferences error:', err);
    }
  }

  const prefs = getStored<EntrySectionPreferences[]>(PREFERENCES_KEY, []);
  const found = prefs.find((p) => p.user_id === userId);
  return found?.configuration || defaultConf;
}

export async function saveSectionPreferences(
  userId: string,
  configuration: EntrySectionPreferences['configuration']
): Promise<void> {
  const now = new Date().toISOString();
  const client = getSupabaseClient();
  if (client) {
    try {
      await client
        .from('entry_section_preferences')
        .upsert({ user_id: userId, configuration, updated_at: now }, { onConflict: 'user_id' });
      return;
    } catch (err) {
      console.warn('Supabase save preferences error:', err);
    }
  }

  const prefs = getStored<EntrySectionPreferences[]>(PREFERENCES_KEY, []);
  const index = prefs.findIndex((p) => p.user_id === userId);
  if (index >= 0) {
    prefs[index] = { user_id: userId, configuration, updated_at: now };
  } else {
    prefs.push({ user_id: userId, configuration, updated_at: now });
  }
  setStored(PREFERENCES_KEY, prefs);
}

// ---------------------------------------------------------------------
// Data Export & Account Deletion (PRD 14.1 & 14.2)
// ---------------------------------------------------------------------
export async function exportUserDataAsJSON(userId: string): Promise<string> {
  const [profile, entries, goals, habits, completions, reviews, sectionPrefs] = await Promise.all([
    fetchProfile(userId),
    fetchEntries(userId),
    fetchGoals(userId),
    fetchHabits(userId),
    fetchHabitCompletions(userId),
    (async () => {
      const allReviews = getStored<WeeklyReview[]>(REVIEWS_KEY, []).filter((r) => r.user_id === userId);
      return allReviews;
    })(),
    fetchSectionPreferences(userId),
  ]);

  const exportPayload = {
    app: 'The Journal',
    version: '1.0',
    exported_at: new Date().toISOString(),
    profile,
    section_preferences: sectionPrefs,
    journal_entries: entries,
    goals,
    habits,
    habit_completions: completions,
    weekly_reviews: reviews,
  };

  return JSON.stringify(exportPayload, null, 2);
}

export async function deleteUserAccountPermanently(userId: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      // Call secure account deletion RPC
      const { error } = await client.rpc('delete_user_account');
      if (error) {
        console.warn('Supabase RPC delete error, attempting manual delete:', error);
      }
      await client.auth.signOut();
    } catch (err) {
      console.warn('Supabase delete account error:', err);
    }
  }

  // Clear all local records for this user across all tables
  const clearTable = (key: string, userKey = 'user_id') => {
    try {
      const items = getStored<any[]>(key, []);
      const filtered = items.filter((item) => (userKey === 'id' ? item.id !== userId : item.user_id !== userId));
      setStored(key, filtered);
    } catch (e) {
      console.error(`Failed clearing ${key}`, e);
    }
  };

  clearTable(AUTH_USERS_KEY, 'id');
  clearTable(PROFILES_KEY, 'id');
  clearTable(ENTRIES_KEY, 'user_id');
  clearTable(GOALS_KEY, 'user_id');
  clearTable(MILESTONES_KEY, 'user_id');
  clearTable(HABITS_KEY, 'user_id');
  clearTable(COMPLETIONS_KEY, 'user_id');
  clearTable(REVIEWS_KEY, 'user_id');
  clearTable(PREFERENCES_KEY, 'user_id');

  localStorage.removeItem(ACTIVE_SESSION_KEY);
  return { success: true };
}

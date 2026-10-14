export type Theme = 'forest' | 'burgundy' | 'navy' | 'parchment';
export type TextSize = 'small' | 'medium' | 'large';
export type LineSpacing = 'compact' | 'comfortable' | 'spacious';

export interface Profile {
  id: string;
  display_name: string | null;
  timezone: string;
  week_starts_on: 0 | 1 | 6; // 0: Sunday, 1: Monday, 6: Saturday
  theme: Theme;
  text_size: TextSize;
  line_spacing: LineSpacing;
  reduced_motion: boolean;
  created_at?: string;
  updated_at?: string;
}

export type Mood = 'calm' | 'grateful' | 'focused' | 'reflective' | 'energized' | 'anxious' | 'tired' | 'content';

export interface EntrySectionsData {
  prompts?: { prompt: string; response: string }[];
  priorities?: string[];
  highlights?: string[];
  habit_checkins?: Record<string, boolean>;
  freewrite?: string;
  [key: string]: any;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  journal_date: string; // YYYY-MM-DD
  title: string | null;
  body: string;
  mood: Mood | null;
  sections: EntrySectionsData;
  revision: number;
  created_at: string;
  updated_at: string;
}

export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'paused';

export interface GoalMilestone {
  id: string;
  goal_id: string;
  user_id: string;
  name: string;
  description?: string;
  position: number;
  completed: boolean;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: GoalStatus;
  target_date: string | null;
  progress_current: number | null;
  progress_target: number | null;
  milestones?: GoalMilestone[];
  created_at: string;
  updated_at: string;
}

export type HabitScheduleType = 'daily' | 'selected_weekdays' | 'times_per_week';
export type HabitStatus = 'active' | 'paused' | 'archived';

export interface HabitScheduleConfig {
  weekdays?: number[]; // [1, 2, 3, 4, 5] for Mon-Fri
  times_per_week?: number; // e.g. 3
}

export interface Habit {
  id: string;
  user_id: string;
  goal_id: string | null;
  name: string;
  description: string | null;
  schedule_type: HabitScheduleType;
  schedule_config: HabitScheduleConfig;
  status: HabitStatus;
  created_at: string;
  updated_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_on: string; // YYYY-MM-DD
  created_at: string;
}

export interface WeeklyReflectionQuestions {
  went_well?: string;
  learned?: string;
  approach_differently?: string;
  matters_most_next?: string;
}

export interface WeeklyReview {
  id: string;
  user_id: string;
  week_start: string; // YYYY-MM-DD
  reflection: string;
  questions: WeeklyReflectionQuestions;
  created_at: string;
  updated_at: string;
}

export interface EntrySectionPreferences {
  user_id: string;
  configuration: {
    enabled_sections: ('mood' | 'prompts' | 'priorities' | 'habits' | 'highlights' | 'freewrite')[];
  };
  updated_at: string;
}

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error' | 'conflict';

export type BookSection = 'journal' | 'calendar' | 'goals' | 'habits' | 'reviews' | 'settings';

export interface SupabaseConfigState {
  url: string;
  anonKey: string;
  isConnected: boolean;
  isCustom: boolean;
}

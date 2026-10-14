-- =====================================================================
-- THE JOURNAL: Supabase PostgreSQL Schema, RLS Policies & Concurrency RPC
-- Migration Version: 20261014000000_the_journal_schema.sql
-- =====================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    week_starts_on SMALLINT NOT NULL DEFAULT 1 CHECK (week_starts_on IN (0, 1, 6)),
    theme TEXT NOT NULL DEFAULT 'forest' CHECK (theme IN ('forest', 'burgundy', 'navy', 'parchment')),
    text_size TEXT NOT NULL DEFAULT 'medium' CHECK (text_size IN ('small', 'medium', 'large')),
    line_spacing TEXT NOT NULL DEFAULT 'comfortable' CHECK (line_spacing IN ('compact', 'comfortable', 'spacious')),
    reduced_motion BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. JOURNAL ENTRIES TABLE
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    journal_date DATE NOT NULL,
    title TEXT,
    body TEXT NOT NULL DEFAULT '',
    mood TEXT CHECK (mood IS NULL OR mood IN ('calm', 'grateful', 'focused', 'reflective', 'energized', 'anxious', 'tired', 'content')),
    sections JSONB NOT NULL DEFAULT '{}'::jsonb,
    revision INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date ON public.journal_entries (user_id, journal_date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_search ON public.journal_entries USING GIN (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
);

-- 3. GOALS TABLE
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'paused')),
    target_date DATE,
    progress_current NUMERIC CHECK (progress_current IS NULL OR progress_current >= 0),
    progress_target NUMERIC CHECK (progress_target IS NULL OR progress_target >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals (user_id, status);

-- 4. GOAL MILESTONES TABLE
CREATE TABLE IF NOT EXISTS public.goal_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goal_milestones_goal ON public.goal_milestones (goal_id, position);

-- 5. HABITS TABLE
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    schedule_type TEXT NOT NULL CHECK (schedule_type IN ('daily', 'selected_weekdays', 'times_per_week')),
    schedule_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_habits_user ON public.habits (user_id, status);

-- 6. HABIT COMPLETIONS TABLE
CREATE TABLE IF NOT EXISTS public.habit_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    completed_on DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_habit_date UNIQUE (habit_id, completed_on)
);

CREATE INDEX IF NOT EXISTS idx_habit_completions_user_date ON public.habit_completions (user_id, completed_on DESC);

-- 7. WEEKLY REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.weekly_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    reflection TEXT NOT NULL DEFAULT '',
    questions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_week_start UNIQUE (user_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_weekly_reviews_user ON public.weekly_reviews (user_id, week_start DESC);

-- 8. ENTRY SECTION PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.entry_section_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    configuration JSONB NOT NULL DEFAULT '{"sections": ["mood", "prompts", "priorities", "habits", "highlights", "freewrite"]}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enforce strict database-level data isolation: auth.uid() = user_id
-- =====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_section_preferences ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- 2. Journal Entries Policies
CREATE POLICY "Users can view own journal entries" ON public.journal_entries
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries" ON public.journal_entries
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries" ON public.journal_entries
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries" ON public.journal_entries
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. Goals Policies
CREATE POLICY "Users can view own goals" ON public.goals
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON public.goals
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON public.goals
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON public.goals
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Goal Milestones Policies (Enforcing parent-child ownership integrity)
CREATE POLICY "Users can view own goal milestones" ON public.goal_milestones
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goal milestones" ON public.goal_milestones
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (SELECT 1 FROM public.goals WHERE id = goal_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can update own goal milestones" ON public.goal_milestones
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goal milestones" ON public.goal_milestones
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. Habits Policies
CREATE POLICY "Users can view own habits" ON public.habits
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits" ON public.habits
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = user_id AND
        (goal_id IS NULL OR EXISTS (SELECT 1 FROM public.goals WHERE id = goal_id AND user_id = auth.uid()))
    );

CREATE POLICY "Users can update own habits" ON public.habits
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (
        auth.uid() = user_id AND
        (goal_id IS NULL OR EXISTS (SELECT 1 FROM public.goals WHERE id = goal_id AND user_id = auth.uid()))
    );

CREATE POLICY "Users can delete own habits" ON public.habits
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 6. Habit Completions Policies (Enforcing completion belongs to habit owned by user)
CREATE POLICY "Users can view own habit completions" ON public.habit_completions
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit completions" ON public.habit_completions
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (SELECT 1 FROM public.habits WHERE id = habit_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can delete own habit completions" ON public.habit_completions
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 7. Weekly Reviews Policies
CREATE POLICY "Users can view own weekly reviews" ON public.weekly_reviews
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly reviews" ON public.weekly_reviews
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly reviews" ON public.weekly_reviews
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly reviews" ON public.weekly_reviews
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 8. Entry Section Preferences Policies
CREATE POLICY "Users can view own section preferences" ON public.entry_section_preferences
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert or update own section preferences" ON public.entry_section_preferences
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- DATABASE FUNCTIONS & CONCURRENCY-PROTECTED RPCs
-- =====================================================================

-- Auto-provision profile upon new auth user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

    INSERT INTO public.entry_section_preferences (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users (runs automatically in Supabase)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atomic Revision-Checked Save RPC to prevent lost updates / race conditions
CREATE OR REPLACE FUNCTION public.save_journal_entry_with_revision(
    p_entry_id UUID,
    p_journal_date DATE,
    p_title TEXT,
    p_body TEXT,
    p_mood TEXT,
    p_sections JSONB,
    p_expected_revision INTEGER
)
RETURNS TABLE (
    success BOOLEAN,
    current_revision INTEGER,
    entry_id UUID,
    updated_at TIMESTAMPTZ,
    conflict_detected BOOLEAN
) AS $$
DECLARE
    v_current_rev INTEGER;
    v_updated_at TIMESTAMPTZ;
BEGIN
    -- If updating an existing entry
    IF p_entry_id IS NOT NULL THEN
        SELECT revision, updated_at INTO v_current_rev, v_updated_at
        FROM public.journal_entries
        WHERE id = p_entry_id AND user_id = auth.uid();

        IF NOT FOUND THEN
            -- Entry does not exist or user does not own it
            RETURN QUERY SELECT FALSE, 0, p_entry_id, now(), FALSE;
            RETURN;
        END IF;

        IF v_current_rev <> p_expected_revision THEN
            -- Stale revision detected! Concurrency conflict.
            RETURN QUERY SELECT FALSE, v_current_rev, p_entry_id, v_updated_at, TRUE;
            RETURN;
        END IF;

        -- Atomically update and increment revision
        UPDATE public.journal_entries
        SET title = p_title,
            body = p_body,
            mood = p_mood,
            sections = p_sections,
            journal_date = p_journal_date,
            revision = v_current_rev + 1,
            updated_at = now()
        WHERE id = p_entry_id AND user_id = auth.uid()
        RETURNING revision, updated_at INTO v_current_rev, v_updated_at;

        RETURN QUERY SELECT TRUE, v_current_rev, p_entry_id, v_updated_at, FALSE;
    ELSE
        -- Insert new entry
        INSERT INTO public.journal_entries (
            user_id, journal_date, title, body, mood, sections, revision, created_at, updated_at
        ) VALUES (
            auth.uid(), p_journal_date, p_title, p_body, p_mood, p_sections, 1, now(), now()
        )
        RETURNING id, revision, updated_at INTO p_entry_id, v_current_rev, v_updated_at;

        RETURN QUERY SELECT TRUE, v_current_rev, p_entry_id, v_updated_at, FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Account deletion RPC to cleanly scrub all user data
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS BOOLEAN AS $$
DECLARE
    v_uid UUID := auth.uid();
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Delete all user data (cascades automatically from auth.users, but explicit for safety)
    DELETE FROM public.habit_completions WHERE user_id = v_uid;
    DELETE FROM public.habits WHERE user_id = v_uid;
    DELETE FROM public.goal_milestones WHERE user_id = v_uid;
    DELETE FROM public.goals WHERE user_id = v_uid;
    DELETE FROM public.weekly_reviews WHERE user_id = v_uid;
    DELETE FROM public.journal_entries WHERE user_id = v_uid;
    DELETE FROM public.entry_section_preferences WHERE user_id = v_uid;
    DELETE FROM public.profiles WHERE id = v_uid;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

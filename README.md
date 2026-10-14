# The Journal

A premium, interactive hardcover-style journaling web application built with React, TypeScript, Tailwind CSS, and Supabase.

> **Primary tagline:** A little more intentional, every day.  
> **Supporting statement:** A beautiful place to collect your thoughts, build meaningful habits, and see your progress.

---

## Features

- **Tactile Hardcover Book Experience:**
  - Forest-green hardcover with antique gold foil stamping, 3D spine ridges, layered deckled paper edges, and hanging ribbon bookmark.
  - Authentic two-page spread on desktop ($\ge 1024\text{px}$) and responsive single-page book layout on mobile.
  - Warm ivory paper surfaces (`#F7F2E8`) with subtle grain and configurable lined writing canvas.
  - Typographic pairing: *Cinzel* for gold foil titles, *Cormorant Garamond* for dates and chapter headings, and *Lora* for book prose.

- **Dependable Daily Journaling & Autosave:**
  - Multiple entries per date with instant switching.
  - Debounced autosave (750–850ms) with visible save states (`Saved`, `Saving…`, `Unsaved local draft`, `Retry save`).
  - Optimistic concurrency protection using revision tracking to prevent lost updates or stale overwrites.
  - Optional reflection prompts, state-of-mind mood check-ins, primary intentions, and habit check-ins.

- **Calendar Ledger & Search:**
  - Interactive month calendar with entry indicators and multi-entry badges.
  - Search by title, keywords, and journal body text.
  - Filter by date range and mood.
  - Chronological index with preview excerpts and word counts.

- **Goals & Milestones:**
  - Inscribe personal pursuits with descriptions, target dates, and numerical progress.
  - Add, reorder, check off, and delete milestones.
  - Confetti celebration upon milestone and goal completions.

- **Habit Tracking:**
  - 3 flexible schedules: *Daily*, *Selected Weekdays*, and *Times per Week*.
  - 7-day completion matrix grid with week navigation.
  - Durable completion records preventing duplicate same-day entries.
  - Streak tracking computed from historical records.

- **Weekly Review:**
  - Factual weekly summary computed strictly from actual saved entries, completions, and goals.
  - 4 guided reflection inquiries:
    1. *What went well this week?*
    2. *What did I learn?*
    3. *What would I like to approach differently?*
    4. *What matters most next week?*
  - Freeform weekly narrative synthesis with autosave.

- **Privacy, Security & Data Sovereignty:**
  - Row Level Security (RLS) policies on every user-owned table enforcing `auth.uid() = user_id`.
  - Parent-child ownership integrity constraints on goals, milestones, habits, and completions.
  - Authenticated JSON data export (`the-journal-export-[date].json`).
  - Irreversible account deletion scrub.

---

## Supabase Database Setup & Migrations

The production database schema is fully defined in:
`supabase/migrations/20261014000000_the_journal_schema.sql`

### Tables Created:
1. `profiles`: User preferences (theme, text scale, line spacing, reduced motion, week start).
2. `journal_entries`: Journal records with dates, moods, sections JSON, and concurrency `revision` integer.
3. `goals`: Personal pursuits and targets.
4. `goal_milestones`: Step-by-step milestones owned by parent goals.
5. `habits`: Daily, weekday, or times-per-week habits.
6. `habit_completions`: Durable unique daily completions (`UNIQUE(habit_id, completed_on)`).
7. `weekly_reviews`: Weekly synthesis and 4-prompt reflection (`UNIQUE(user_id, week_start)`).
8. `entry_section_preferences`: Enabled section preferences.

### Applying Migrations:
1. In your Supabase Project Dashboard, navigate to the **SQL Editor**.
2. Paste the contents of `supabase/migrations/20261014000000_the_journal_schema.sql` and run it.
3. All tables, indexes, RLS policies, and the `save_journal_entry_with_revision()` concurrency RPC will be created.

---

## Environment Variables

Copy `.env.example` to `.env`:

```bash
# Supabase Project Credentials (from Project Settings -> API)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
```

*Note: You can also connect or switch your Supabase instance directly in the application's **Settings & Privacy** page.*

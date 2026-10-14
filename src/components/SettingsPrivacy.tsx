import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Download,
  Trash2,
  LogOut,
  Database,
  Type,
  Palette,
  Eye,
  Check,
  Copy,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Profile, Theme, TextSize, LineSpacing } from '../types/journal';
import {
  getCustomSupabaseConfig,
  saveCustomSupabaseConfig,
  clearCustomSupabaseConfig,
  getActiveSupabaseCredentials,
} from '../lib/supabase';

interface SettingsPrivacyProps {
  profile: Profile;
  onUpdateProfile: (updates: Partial<Profile>) => Promise<Profile>;
  onExportData: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  onSignOut: () => Promise<void>;
  userEmail?: string;
}

export const SettingsPrivacy: React.FC<SettingsPrivacyProps> = ({
  profile,
  onUpdateProfile,
  onExportData,
  onDeleteAccount,
  onSignOut,
  userEmail,
}) => {
  const [theme, setTheme] = useState<Theme>(profile.theme);
  const [textSize, setTextSize] = useState<TextSize>(profile.text_size);
  const [lineSpacing, setLineSpacing] = useState<LineSpacing>(profile.line_spacing);
  const [reducedMotion, setReducedMotion] = useState(profile.reduced_motion);
  const [weekStartsOn, setWeekStartsOn] = useState<0 | 1 | 6>(profile.week_starts_on);

  // Supabase connection state
  const activeCreds = getActiveSupabaseCredentials();
  const [sbUrl, setSbUrl] = useState(activeCreds.url || '');
  const [sbKey, setSbKey] = useState(activeCreds.anonKey || '');
  const [sbMessage, setSbMessage] = useState<string | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Delete modal confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSavePreferences = async (updates: Partial<Profile>) => {
    await onUpdateProfile(updates);
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sbUrl.trim() || !sbKey.trim()) {
      clearCustomSupabaseConfig();
      setSbMessage('Reset to local persistent database.');
      setTimeout(() => window.location.reload(), 1000);
      return;
    }
    saveCustomSupabaseConfig(sbUrl.trim(), sbKey.trim());
    setSbMessage('Supabase configuration saved! Refreshing connection…');
    setTimeout(() => window.location.reload(), 1200);
  };

  const sampleMigrationSQL = `-- Run this in your Supabase SQL Editor:
-- Table: profiles, journal_entries, goals, goal_milestones, habits, habit_completions, weekly_reviews, entry_section_preferences
-- All tables protected with Row Level Security (RLS) enforcing auth.uid() = user_id
-- Concurrency optimistic revision checking via save_journal_entry_with_revision() RPC.
-- See /supabase/migrations/20261014000000_the_journal_schema.sql in repository.`;

  const copyMigrationToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sampleMigrationSQL);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDeleteConfirmed = async () => {
    if (deleteInput !== 'DELETE PERMANENTLY') return;
    setIsDeleting(true);
    try {
      await onDeleteAccount();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-4 sm:py-6 px-2 sm:px-4">
      <div className="relative rounded-lg shadow-2xl overflow-hidden border border-[#c5a66a]/40 bg-[#244637] p-2 sm:p-4">
        {/* Book Spine Center Gutter */}
        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 z-20 pointer-events-none bg-gradient-to-r from-black/20 via-black/40 to-black/20 shadow-inner" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-0 min-h-[680px]">
          {/* ========================================================= */}
          {/* LEFT PAGE: Visual Aesthetics & Typographic Settings      */}
          {/* ========================================================= */}
          <div className="paper-surface paper-surface-left p-6 sm:p-8 lg:p-10 rounded-l-md border-r border-[#e0d6c1] flex flex-col justify-between text-stone-800 paper-scroll overflow-y-auto max-h-[82vh]">
            <div>
              <div className="border-b border-stone-300/80 pb-3 mb-6">
                <span className="text-[11px] font-cinzel tracking-[0.25em] uppercase text-stone-500 block">
                  Customization
                </span>
                <h2 className="text-2xl font-cormorant font-semibold text-stone-900">
                  Journal Binding & Typography
                </h2>
              </div>

              {/* Theme Selector */}
              <div className="mb-6">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Palette className="w-4 h-4 text-stone-600" />
                  <span className="text-xs uppercase font-cinzel font-semibold text-stone-700">
                    Hardcover Binding Material
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'forest', label: 'Forest Green', bg: 'bg-[#244637]' },
                    { id: 'burgundy', label: 'Royal Burgundy', bg: 'bg-[#4d1a20]' },
                    { id: 'navy', label: 'Deep Navy', bg: 'bg-[#182e44]' },
                    { id: 'parchment', label: 'Antique Leather', bg: 'bg-[#4a4033]' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id as Theme);
                        handleSavePreferences({ theme: t.id as Theme });
                      }}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-serif transition-all cursor-pointer ${
                        theme === t.id
                          ? 'border-[#c5a66a] bg-stone-200/90 shadow-sm font-semibold'
                          : 'border-stone-300/80 bg-stone-200/50 hover:bg-stone-200/70'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full ${t.bg} border border-amber-300/40`} />
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography Text Size */}
              <div className="mb-6">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Type className="w-4 h-4 text-stone-600" />
                  <span className="text-xs uppercase font-cinzel font-semibold text-stone-700">
                    Text Scale
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'small', label: 'Compact' },
                    { id: 'medium', label: 'Standard' },
                    { id: 'large', label: 'Comfortable' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setTextSize(s.id as TextSize);
                        handleSavePreferences({ text_size: s.id as TextSize });
                      }}
                      className={`py-2 px-3 rounded text-xs font-serif transition-colors cursor-pointer ${
                        textSize === s.id
                          ? 'bg-[#244637] text-amber-100 font-semibold'
                          : 'bg-stone-200/60 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Spacing */}
              <div className="mb-6">
                <span className="text-xs uppercase font-cinzel font-semibold text-stone-700 block mb-2">
                  Line Spacing (Leading)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'compact', label: 'Tight' },
                    { id: 'comfortable', label: 'Normal' },
                    { id: 'spacious', label: 'Spacious' },
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        setLineSpacing(l.id as LineSpacing);
                        handleSavePreferences({ line_spacing: l.id as LineSpacing });
                      }}
                      className={`py-2 px-3 rounded text-xs font-serif transition-colors cursor-pointer ${
                        lineSpacing === l.id
                          ? 'bg-[#244637] text-amber-100 font-semibold'
                          : 'bg-stone-200/60 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Week Starts On */}
              <div className="mb-6">
                <span className="text-xs uppercase font-cinzel font-semibold text-stone-700 block mb-2">
                  First Day of Week
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 1, label: 'Monday (ISO)' },
                    { id: 0, label: 'Sunday' },
                  ].map((w) => (
                    <button
                      key={w.id}
                      onClick={() => {
                        setWeekStartsOn(w.id as 0 | 1);
                        handleSavePreferences({ week_starts_on: w.id as 0 | 1 });
                      }}
                      className={`py-2 px-3 rounded text-xs font-serif transition-colors cursor-pointer ${
                        weekStartsOn === w.id
                          ? 'bg-[#244637] text-amber-100 font-semibold'
                          : 'bg-stone-200/60 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reduced Motion Toggle */}
              <div className="mb-6">
                <label className="flex items-center justify-between p-3 rounded-lg bg-stone-200/50 border border-stone-300/70 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-stone-600" />
                    <div>
                      <span className="text-xs font-semibold text-stone-900 block">
                        Reduced Motion
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Simplify 3D page turns and cover animations
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={reducedMotion}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setReducedMotion(next);
                      handleSavePreferences({ reduced_motion: next });
                    }}
                    className="rounded border-stone-400 text-[#244637] cursor-pointer"
                  />
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-300/60 text-[11px] font-cinzel text-stone-400 flex items-center justify-between">
              <span>Preferences autosaved</span>
              <span>Ledger Page 9</span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT PAGE: Database, Supabase Setup, Export & Deletion   */}
          {/* ========================================================= */}
          <div className="paper-surface paper-surface-right p-6 sm:p-8 lg:p-10 rounded-r-md flex flex-col justify-between text-stone-800 paper-scroll overflow-y-auto max-h-[82vh]">
            <div className="flex-1 flex flex-col">
              <div className="border-b border-stone-300/80 pb-3 mb-4">
                <span className="text-[11px] font-cinzel tracking-[0.25em] uppercase text-stone-500 block">
                  Authoritative Persistence & Privacy
                </span>
                <h3 className="text-2xl font-cormorant font-semibold text-stone-900">
                  Data Governance & Security
                </h3>
              </div>

              {/* Database Storage Engine Status */}
              <div className="mb-6 p-4 rounded-lg bg-stone-200/60 border border-stone-300/80">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-stone-700" />
                    <span className="text-xs font-cinzel font-semibold text-stone-900">
                      Authoritative Storage Engine
                    </span>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-cinzel px-2 py-0.5 rounded font-semibold ${
                      activeCreds.isLive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {activeCreds.isLive ? 'Supabase Live' : 'Resilient Local Storage'}
                  </span>
                </div>

                <p className="text-xs font-serif text-stone-600 mb-3 leading-relaxed">
                  {activeCreds.isLive
                    ? `Connected to Supabase PostgreSQL at ${activeCreds.url}. Row Level Security (RLS) is active.`
                    : 'Currently saving to durable browser persistence with revision concurrency checks. You can connect your live Supabase project anytime.'}
                </p>

                {/* Supabase Connection Form */}
                <form onSubmit={handleSaveSupabaseConfig} className="space-y-2 pt-2 border-t border-stone-300/60">
                  <div className="text-[11px] font-semibold text-stone-700 uppercase font-cinzel">
                    Connect Your Supabase Project
                  </div>
                  <div>
                    <input
                      type="text"
                      value={sbUrl}
                      onChange={(e) => setSbUrl(e.target.value)}
                      placeholder="https://your-project.supabase.co"
                      className="w-full text-xs font-mono bg-stone-100 border border-stone-300 rounded px-2.5 py-1 text-stone-800"
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      value={sbKey}
                      onChange={(e) => setSbKey(e.target.value)}
                      placeholder="Your Supabase Anon / Public Key"
                      className="w-full text-xs font-mono bg-stone-100 border border-stone-300 rounded px-2.5 py-1 text-stone-800"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded text-xs font-cinzel bg-[#244637] text-amber-100 hover:bg-[#1b362a] cursor-pointer"
                    >
                      Save & Connect
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSqlModal(true)}
                      className="text-xs text-stone-600 hover:text-stone-900 underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>View SQL Schema</span>
                    </button>
                  </div>
                  {sbMessage && (
                    <p className="text-xs text-amber-800 font-medium pt-1">{sbMessage}</p>
                  )}
                </form>
              </div>

              {/* Data Export (PRD Section 14.1) */}
              <div className="mb-6 p-4 rounded-lg bg-stone-200/40 border border-stone-300/60 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-cinzel font-semibold text-stone-900 mb-0.5">
                    Export Personal Archives
                  </h4>
                  <p className="text-[11px] text-stone-500 max-w-xs leading-normal">
                    Download a full JSON archive containing all journal entries, milestones, habits, reviews, and preferences.
                  </p>
                </div>
                <button
                  onClick={onExportData}
                  className="flex items-center gap-1.5 px-3 py-2 rounded bg-stone-300 hover:bg-stone-400/80 text-stone-900 text-xs font-cinzel font-medium transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
              </div>

              {/* Account Sign Out and Permanent Deletion */}
              <div className="mt-auto space-y-3 pt-4 border-t border-stone-300/80">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-stone-600">
                    Signed in as: <strong className="text-stone-900">{userEmail || 'Local Guest'}</strong>
                  </div>
                  <button
                    onClick={onSignOut}
                    className="flex items-center gap-1.5 text-xs text-stone-700 hover:text-black underline cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-xs text-rose-700 hover:text-rose-900 flex items-center gap-1.5 font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently delete account and all journal data</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-300/60 text-[11px] font-cinzel text-stone-400 flex items-center justify-between">
              <span>Security & Cryptography</span>
              <span>Ledger Page 10</span>
            </div>
          </div>
        </div>
      </div>

      {/* SQL Migration Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-stone-900 border border-[#c5a66a]/60 rounded-xl max-w-2xl w-full p-6 text-stone-200 shadow-2xl">
            <div className="flex items-center justify-between mb-3 border-b border-stone-700 pb-2">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-cinzel font-bold text-amber-100">
                  Supabase PostgreSQL Schema & RLS Policies
                </h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-stone-400 hover:text-white text-xs"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-stone-300 mb-3">
              This migration script creates all 8 tables, indexes, Row Level Security (RLS) policies, and the optimistic concurrency revision checking RPC.
            </p>
            <div className="bg-black/60 p-3 rounded text-[11px] font-mono text-emerald-300 max-h-60 overflow-y-auto mb-4 border border-stone-800">
              {sampleMigrationSQL}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-stone-400">
                File: <code className="text-amber-200">/supabase/migrations/20261014000000_the_journal_schema.sql</code>
              </span>
              <button
                onClick={copyMigrationToClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#244637] hover:bg-[#1b362a] text-amber-100 text-xs font-cinzel cursor-pointer"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied!' : 'Copy SQL Script'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Confirmation Modal (PRD Section 14.2) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-stone-900 border border-rose-600 rounded-xl max-w-md w-full p-6 text-stone-200 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-400 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-cinzel font-bold text-rose-200">
                Permanent Account Deletion
              </h3>
            </div>
            <p className="text-xs text-stone-300 mb-3 leading-relaxed">
              This will permanently delete all your journal entries, milestones, habits, completions, weekly reviews, and settings. This action is <strong>irreversible</strong>.
            </p>
            <p className="text-xs text-stone-400 mb-3">
              To confirm, type <strong className="text-rose-400">DELETE PERMANENTLY</strong> below:
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="DELETE PERMANENTLY"
              className="w-full text-xs font-mono bg-black/50 border border-stone-700 rounded px-3 py-2 text-stone-100 mb-4 focus:outline-none focus:border-rose-500"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteInput('');
                }}
                className="px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                disabled={deleteInput !== 'DELETE PERMANENTLY' || isDeleting}
                className="px-4 py-1.5 rounded bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                {isDeleting ? 'Deleting…' : 'Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

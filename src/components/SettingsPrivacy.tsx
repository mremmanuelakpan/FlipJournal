import React, { useState } from 'react';
import {
  ShieldCheck,
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
  Lock,
} from 'lucide-react';
import { Profile, Theme, TextSize, LineSpacing } from '../types/journal';
import { SpiralBinding } from './SpiralBinding';
import { getTheme } from '../utils/theme';

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
  const themeConfig = getTheme(profile.theme);
  const [theme, setTheme] = useState<Theme>(profile.theme);
  const [textSize, setTextSize] = useState<TextSize>(profile.text_size);
  const [lineSpacing, setLineSpacing] = useState<LineSpacing>(profile.line_spacing);
  const [reducedMotion, setReducedMotion] = useState(profile.reduced_motion);
  const [weekStartsOn, setWeekStartsOn] = useState<0 | 1 | 6>(profile.week_starts_on);

  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Delete modal confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSavePreferences = async (updates: Partial<Profile>) => {
    await onUpdateProfile(updates);
  };

  const sampleMigrationSQL = `-- Run this in your Supabase SQL Editor:
-- Tables: profiles, journal_entries, goals, goal_milestones, habits, habit_completions, weekly_reviews, entry_section_preferences
-- All tables protected with Row Level Security (RLS) enforcing auth.uid() = user_id
-- Concurrency optimistic revision checking via save_journal_entry_with_revision() RPC.
-- Migration file located in /supabase/migrations/20261014000000_the_journal_schema.sql`;

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
    <div className="w-full max-w-7xl mx-auto py-3 sm:py-5 px-2 sm:px-4">
      <div
        className="relative rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] border-2 border-[#c5a66a]/60 p-3 sm:p-4 lg:p-5 transition-colors duration-500"
        style={themeConfig.bookCoverStyle}
      >
        <div className="absolute inset-1.5 sm:inset-2 rounded-xl border border-[#c5a66a]/30 pointer-events-none" />

        <div className="relative rounded-lg overflow-hidden bg-[#f7f2e8] border border-[#d6c7ab] shadow-[0_2px_4px_rgba(0,0,0,0.08),2px_2px_0px_#ede4d4,4px_4px_0px_#dfd2bc,0_16px_36px_-6px_rgba(0,0,0,0.5)]">
          <SpiralBinding ringCount={22} theme={theme} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[660px]">
            {/* ========================================================= */}
            {/* LEFT PAGE: Visual Aesthetics & Typographic Settings      */}
            {/* ========================================================= */}
            <div
              className="paper-surface paper-surface-left p-6 sm:p-8 lg:p-9 lg:pr-12 flex flex-col justify-between text-stone-800 border-b lg:border-b-0 lg:border-r border-[#d9ceb9]"
              style={{ borderRightColor: themeConfig.navbarBorder }}
            >
              <div>
                <div className="border-b border-stone-300/80 pb-3 mb-5">
                  <span className="text-[11px] font-cinzel tracking-[0.25em] uppercase text-stone-500 block mb-1">
                    Customization
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-cormorant font-semibold text-stone-900">
                    Journal Binding & Typography
                  </h2>
                </div>

                {/* Theme Selector */}
                <div className="mb-5">
                  <div className="flex items-center gap-1.5 mb-2">
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
                            ? 'border-[#c5a66a] bg-stone-200/90 shadow-sm font-semibold ring-1 ring-[#c5a66a]'
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
                <div className="mb-5">
                  <div className="flex items-center gap-1.5 mb-2">
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
                        className={`py-2 px-3 rounded text-xs font-serif transition-all cursor-pointer ${
                          textSize === s.id
                            ? 'font-semibold shadow-sm'
                            : 'bg-stone-200/60 hover:bg-stone-200 text-stone-700'
                        }`}
                        style={textSize === s.id ? { backgroundColor: themeConfig.primaryBtnBg, color: themeConfig.activeHighlightText } : undefined}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Line Spacing */}
                <div className="mb-5">
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
                        className={`py-2 px-3 rounded text-xs font-serif transition-all cursor-pointer ${
                          lineSpacing === l.id
                            ? 'font-semibold shadow-sm'
                            : 'bg-stone-200/60 hover:bg-stone-200 text-stone-700'
                        }`}
                        style={lineSpacing === l.id ? { backgroundColor: themeConfig.primaryBtnBg, color: themeConfig.activeHighlightText } : undefined}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Week Starts On */}
                <div className="mb-5">
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
                        className={`py-2 px-3 rounded text-xs font-serif transition-all cursor-pointer ${
                          weekStartsOn === w.id
                            ? 'font-semibold shadow-sm'
                            : 'bg-stone-200/60 hover:bg-stone-200 text-stone-700'
                        }`}
                        style={weekStartsOn === w.id ? { backgroundColor: themeConfig.primaryBtnBg, color: themeConfig.activeHighlightText } : undefined}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reduced Motion Toggle */}
                <div className="mb-4">
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
                      className="rounded border-stone-400 cursor-pointer"
                      style={{ accentColor: themeConfig.primaryBtnBg }}
                    />
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-300/60 text-[11px] font-cinzel text-stone-400 flex items-center justify-between">
                <span>Preferences autosaved</span>
                <span>Ledger Page 9</span>
              </div>
            </div>

            {/* ========================================================= */}
            {/* RIGHT PAGE: Account, Export, Security & Deletion          */}
            {/* ========================================================= */}
            <div className="paper-surface paper-surface-right p-6 sm:p-8 lg:p-9 lg:pl-12 flex flex-col justify-between text-stone-800">
              <div className="flex-1 flex flex-col">
                <div className="border-b border-stone-300/80 pb-3 mb-5">
                  <span className="text-[11px] font-cinzel tracking-[0.25em] uppercase text-stone-500 block mb-1">
                    Privacy & Storage
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-cormorant font-semibold text-stone-900">
                    Data Governance & Account
                  </h3>
                </div>

                {/* Protected Cloud Database Status (Clean, user-friendly, no confusing raw keys) */}
                <div className="mb-5 p-4 rounded-lg bg-stone-200/60 border border-stone-300/80">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-800" />
                      <span className="text-xs font-cinzel font-semibold text-stone-900">
                        Cloud Database & Row Level Security
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-cinzel px-2 py-0.5 rounded font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300/50">
                      Active & Enforced
                    </span>
                  </div>

                  <p className="text-xs font-serif text-stone-600 mb-2 leading-relaxed">
                    Your entries, habits, and goals are securely isolated by PostgreSQL Row Level Security (RLS). Only your authenticated session can access or modify your private ledger.
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-300/60 text-[11px] text-stone-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Lock className="w-3 h-3 text-stone-400" />
                      Zero cross-user data leakage
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSqlModal(true)}
                      className="text-stone-700 hover:text-black underline font-cinzel cursor-pointer"
                    >
                      Database Policies
                    </button>
                  </div>
                </div>

                {/* Data Export */}
                <div className="mb-5 p-4 rounded-lg bg-stone-200/40 border border-stone-300/60 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-cinzel font-semibold text-stone-900 mb-0.5">
                      Export Complete Archives
                    </h4>
                    <p className="text-[11px] text-stone-500 max-w-xs leading-normal">
                      Download a structured JSON archive containing all entries, habits, milestones, and reviews.
                    </p>
                  </div>
                  <button
                    onClick={onExportData}
                    className="flex items-center gap-1.5 px-3 py-2 rounded text-amber-100 text-xs font-cinzel font-medium transition-all hover:brightness-110 cursor-pointer shadow-sm"
                    style={{ backgroundColor: themeConfig.primaryBtnBg }}
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

              <div className="pt-3 border-t border-stone-300/60 text-[11px] font-cinzel text-stone-400 flex items-center justify-between">
                <span>Security & Cryptography</span>
                <span>Ledger Page 10</span>
              </div>
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
                className="text-stone-400 hover:text-white text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-stone-300 mb-3">
              All 8 database tables have Row Level Security enabled. Optimistic concurrency checking is enforced via <code className="text-amber-300">save_journal_entry_with_revision()</code> RPC.
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-amber-100 text-xs font-cinzel transition-all hover:brightness-110 cursor-pointer shadow-sm"
                style={{ backgroundColor: themeConfig.primaryBtnBg }}
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied!' : 'Copy SQL Script'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Confirmation Modal */}
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
              This will permanently delete all your entries, milestones, habits, completions, weekly reviews, and settings. This action is <strong>irreversible</strong>.
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

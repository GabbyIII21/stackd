// Profile + log model. Data is sourced from the StackdRegistry contract
// (on-chain streak/score state) plus IPFS log payloads (content/image).
// This module holds the shared types, pure helpers, and the chain → Profile
// mappers. No browser storage is used.

import { CATEGORIES, type Category } from "./categories";
import type { LogPayload } from "./ipfs";

export type Log = {
  id: string;
  date: string; // UTC YYYY-MM-DD
  content: string;
  streak: number;
  createdAt: number; // ms epoch
  imageHash?: string;
  category?: Category;
  isFreeze?: boolean;
  cid?: string; // IPFS CID of the payload ("" for freeze entries)
};

export type Profile = {
  address: string;
  logs: Log[];
  currentStreak: number;
  longestStreak: number;
  builderScore: number;
  // Freeze
  freezeAvailable?: boolean;
  freezeEarnedAtStreak?: number; // most recent streak milestone that minted a token
  // Achievements
  hadComeback?: boolean;
  firstLogAt?: number; // ms epoch
  registrationIndex?: number; // 0-based order this wallet first logged; -1 if none
};

// ─── Date helpers ───────────────────────────────────────────────────────────

export function todayUTC(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function dateToUTC(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

// UTC day number (timestamp / 1 day) → YYYY-MM-DD, matching the contract's _today().
export function dayNumberToUTC(day: number): string {
  return dateToUTC(day * 86400000);
}

function daysBetweenUTC(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const ta = Date.UTC(ay, am - 1, ad);
  const tb = Date.UTC(by, bm - 1, bd);
  return Math.round((tb - ta) / 86400000);
}

function normAddr(addr: string): string {
  return addr.toLowerCase();
}

export function emptyProfile(address: string): Profile {
  return {
    address: normAddr(address),
    logs: [],
    currentStreak: 0,
    longestStreak: 0,
    builderScore: 0,
    freezeAvailable: false,
    freezeEarnedAtStreak: 0,
    hadComeback: false,
    registrationIndex: -1,
  };
}

// ─── Chain → model mappers ───────────────────────────────────────────────────

// The raw Log struct as returned by getLogs / getLogsPaged.
export type ChainLog = {
  day: number;
  category: number;
  isFreeze: boolean;
  timestamp: bigint;
  streak: number;
  cid: string;
};

// The tuple returned by getBuilder(address).
export type ChainBuilder = {
  currentStreak: number; // live streak (decay already applied on-chain)
  longestStreak: number;
  totalLogs: number;
  lastDay: number;
  freezeAvailable: boolean;
  exists: boolean;
  firstLogAt: bigint;
  registrationIndex: number;
  score: bigint;
};

function categoryFromIndex(i: number): Category {
  return CATEGORIES[i] ?? "Other";
}

export function mapChainLog(l: ChainLog, payload?: LogPayload): Log {
  const createdAt = Number(l.timestamp) * 1000;
  return {
    id: l.cid || `${l.day}-${l.isFreeze ? "f" : "b"}-${l.timestamp}`,
    date: dayNumberToUTC(l.day),
    content: l.isFreeze ? "Streak Freeze activated" : (payload?.content ?? ""),
    streak: l.streak,
    createdAt,
    imageHash: payload?.imageHash,
    category: categoryFromIndex(l.category),
    isFreeze: l.isFreeze,
    cid: l.cid,
  };
}

// Detect the "Comeback Kid" condition from the on-chain log sequence:
// a streak that reached 7+, broke (reset to 1), then was rebuilt to 7+.
export function computeHadComeback(logs: Log[]): boolean {
  const sorted = [...logs].filter((l) => !l.isFreeze).sort((a, b) => a.createdAt - b.createdAt);
  let peak = 0;
  let brokeAfter7 = false;
  for (const l of sorted) {
    if (l.streak === 1 && peak >= 7) brokeAfter7 = true;
    if (brokeAfter7 && l.streak >= 7) return true;
    peak = Math.max(peak, l.streak);
  }
  return false;
}

// Assemble a Profile from chain reads + hydrated IPFS payloads.
export function buildProfile(
  address: string,
  builder: ChainBuilder | null,
  chainLogs: ChainLog[],
  payloadByCid: Record<string, LogPayload> = {},
): Profile {
  const base = emptyProfile(address);
  const logs = chainLogs.map((l) => mapChainLog(l, l.cid ? payloadByCid[l.cid] : undefined));
  if (!builder || !builder.exists) {
    return { ...base, logs, hadComeback: computeHadComeback(logs) };
  }
  const currentStreak = builder.currentStreak;
  return {
    ...base,
    logs,
    currentStreak,
    longestStreak: builder.longestStreak,
    builderScore: Number(builder.score),
    freezeAvailable: builder.freezeAvailable,
    freezeEarnedAtStreak: Math.floor(currentStreak / 10) * 10,
    firstLogAt: builder.firstLogAt ? Number(builder.firstLogAt) * 1000 : undefined,
    registrationIndex: builder.registrationIndex,
    hadComeback: computeHadComeback(logs),
  };
}

// ─── Pure profile helpers (used across routes/components) ─────────────────────

export function hasLoggedToday(profile: Profile): Log | null {
  const today = todayUTC();
  return profile.logs.find((l) => l.date === today) ?? null;
}

export function canActivateFreeze(p: Profile): boolean {
  if (!p.freezeAvailable) return false;
  const today = todayUTC();
  if (p.logs.some((l) => l.date === today)) return false;
  const sorted = [...p.logs].sort((a, b) => (a.date < b.date ? 1 : -1));
  const last = sorted[0];
  if (!last) return false;
  return daysBetweenUTC(last.date, today) === 1;
}

export function logDateSet(p: Profile): Set<string> {
  return new Set(p.logs.map((l) => l.date));
}

export function logsThisWeek(p: Profile): Log[] {
  // Mon–Sun week containing today
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun
  const diffToMon = (day + 6) % 7;
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMon),
  );
  const mondayStr = dateToUTC(monday.getTime());
  return p.logs.filter((l) => l.date >= mondayStr);
}

export function logsThisYear(p: Profile): Log[] {
  const year = new Date().getUTCFullYear();
  return p.logs.filter((l) => l.date.startsWith(String(year)));
}

export function categoryBreakdown(
  p: Profile,
): { category: Category; count: number; pct: number }[] {
  const filtered = p.logs.filter((l) => !l.isFreeze);
  const total = filtered.length || 1;
  const counts = new Map<Category, number>();
  for (const l of filtered) {
    const cat = (l.category as Category) || "Other";
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count, pct: (count / total) * 100 }))
    .sort((a, b) => b.count - a.count);
}

export function daysUntilNextFreeze(p: Profile): number {
  if (p.freezeAvailable) return 0;
  const nextMilestone = (p.freezeEarnedAtStreak ?? 0) + 10;
  return Math.max(0, nextMilestone - p.currentStreak);
}

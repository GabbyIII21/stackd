// localStorage-backed profile + log + streak logic

import { type Category, isCategory } from "./categories";

export type Log = {
  id: string;
  date: string; // UTC YYYY-MM-DD
  content: string;
  streak: number;
  createdAt: number; // ms epoch
  imageHash?: string;
  category?: Category;
  isFreeze?: boolean;
};

export type Profile = {
  address: string;
  logs: Log[];
  currentStreak: number;
  longestStreak: number;
  builderScore: number;
  // Freeze
  freezeAvailable?: boolean;
  freezeEarnedAtStreak?: number; // most recent streak milestone we minted a token at
  // Achievements
  hadComeback?: boolean;
  firstLogAt?: number;
};

const KEY_PREFIX = "stackd:profile:";
const INDEX_KEY = "stackd:addresses";
const REGISTRATION_INDEX_KEY = "stackd:registrations"; // ordered first-100 wallets

export function todayUTC(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function dateToUTC(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
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

export function getProfile(address: string): Profile {
  if (typeof window === "undefined") return emptyProfile(address);
  const key = KEY_PREFIX + normAddr(address);
  const raw = localStorage.getItem(key);
  if (!raw) return emptyProfile(address);
  try {
    const p = JSON.parse(raw) as Profile;
    return { ...emptyProfile(address), ...p, address: normAddr(address) };
  } catch {
    return emptyProfile(address);
  }
}

function emptyProfile(address: string): Profile {
  return {
    address: normAddr(address),
    logs: [],
    currentStreak: 0,
    longestStreak: 0,
    builderScore: 0,
    freezeAvailable: false,
    freezeEarnedAtStreak: 0,
    hadComeback: false,
  };
}

function saveProfile(profile: Profile) {
  localStorage.setItem(KEY_PREFIX + profile.address, JSON.stringify(profile));
  const idxRaw = localStorage.getItem(INDEX_KEY);
  const idx: string[] = idxRaw ? JSON.parse(idxRaw) : [];
  if (!idx.includes(profile.address)) {
    idx.push(profile.address);
    localStorage.setItem(INDEX_KEY, JSON.stringify(idx));
  }
}

function registerAddress(address: string) {
  const raw = localStorage.getItem(REGISTRATION_INDEX_KEY);
  const arr: string[] = raw ? JSON.parse(raw) : [];
  if (!arr.includes(address)) {
    arr.push(address);
    localStorage.setItem(REGISTRATION_INDEX_KEY, JSON.stringify(arr));
  }
}

export function getRegistrationIndex(address: string): number {
  if (typeof window === "undefined") return -1;
  const raw = localStorage.getItem(REGISTRATION_INDEX_KEY);
  const arr: string[] = raw ? JSON.parse(raw) : [];
  return arr.indexOf(normAddr(address));
}

export function getAllProfiles(): Profile[] {
  if (typeof window === "undefined") return [];
  const idxRaw = localStorage.getItem(INDEX_KEY);
  if (!idxRaw) return [];
  const idx: string[] = JSON.parse(idxRaw);
  return idx.map((a) => getProfile(a)).filter((p) => p.logs.length > 0);
}

export function hasLoggedToday(profile: Profile): Log | null {
  const today = todayUTC();
  return profile.logs.find((l) => l.date === today) ?? null;
}

function computeScore(p: { logs: Log[]; currentStreak: number; longestStreak: number }) {
  return p.logs.length + p.currentStreak * 3 + p.longestStreak * 2;
}

function maybeMintFreeze(p: Profile): Profile {
  // mint one freeze token (max 1) every time streak crosses a new multiple of 10
  const earnedAt = p.freezeEarnedAtStreak ?? 0;
  const milestonesPassed = Math.floor(p.currentStreak / 10);
  if (milestonesPassed * 10 > earnedAt) {
    return { ...p, freezeAvailable: true, freezeEarnedAtStreak: milestonesPassed * 10 };
  }
  return p;
}

export function addLog(
  address: string,
  content: string,
  opts: { imageHash?: string; category?: Category } = {},
): Profile {
  const profile = getProfile(address);
  const today = todayUTC();
  if (profile.logs.some((l) => l.date === today)) return profile;
  registerAddress(profile.address);

  const sorted = [...profile.logs].filter((l) => !l.isFreeze).sort((a, b) => (a.date < b.date ? 1 : -1));
  const last = sorted[0];
  const prevStreak = profile.currentStreak;
  let nextStreak = 1;
  if (last) {
    const gap = daysBetweenUTC(last.date, today);
    nextStreak = gap === 1 ? profile.currentStreak + 1 : 1;
  }

  const log: Log = {
    id: `${today}-${Math.random().toString(36).slice(2, 10)}`,
    date: today,
    content: content.trim(),
    streak: nextStreak,
    createdAt: Date.now(),
    imageHash: opts.imageHash || undefined,
    category: opts.category && isCategory(opts.category) ? opts.category : "Other",
  };

  let updated: Profile = {
    ...profile,
    logs: [...profile.logs, log],
    currentStreak: nextStreak,
    longestStreak: Math.max(profile.longestStreak, nextStreak),
    builderScore: 0,
    firstLogAt: profile.firstLogAt ?? Date.now(),
    hadComeback:
      profile.hadComeback || (prevStreak === 0 && profile.longestStreak >= 1 && nextStreak >= 7)
        ? true
        : profile.hadComeback,
  };
  // Comeback Kid: detected later via longestStreak / break history. Simpler heuristic:
  // if the user previously had a streak that broke (longest>=7 already), and now reaches 7, mark it.
  if (!updated.hadComeback && profile.longestStreak >= 7 && prevStreak === 0 && nextStreak >= 7) {
    updated.hadComeback = true;
  }
  updated.builderScore = computeScore(updated);
  updated = maybeMintFreeze(updated);
  saveProfile(updated);
  return updated;
}

export function activateFreeze(address: string): Profile {
  const p = getProfile(address);
  if (!canActivateFreeze(p)) return p;
  const today = todayUTC();
  const log: Log = {
    id: `${today}-freeze-${Math.random().toString(36).slice(2, 8)}`,
    date: today,
    content: "Streak Freeze activated",
    streak: p.currentStreak,
    createdAt: Date.now(),
    isFreeze: true,
    category: "Other",
  };
  const updated: Profile = {
    ...p,
    logs: [...p.logs, log],
    freezeAvailable: false,
  };
  updated.builderScore = computeScore(updated);
  saveProfile(updated);
  return updated;
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

// Recompute current streak on read (decay if missed days)
export function getLiveProfile(address: string): Profile {
  const p = getProfile(address);
  if (p.logs.length === 0) return p;
  const sorted = [...p.logs].sort((a, b) => (a.date < b.date ? 1 : -1));
  const last = sorted[0];
  const gap = daysBetweenUTC(last.date, todayUTC());
  const liveCurrent = gap <= 1 ? p.currentStreak : 0;
  const liveScore = p.logs.length + liveCurrent * 3 + p.longestStreak * 2;
  return { ...p, currentStreak: liveCurrent, builderScore: liveScore };
}

// ─── Helpers for new features ──────────────────────────────────────────────

export function logDateSet(p: Profile): Set<string> {
  return new Set(p.logs.map((l) => l.date));
}

export function logsThisWeek(p: Profile): Log[] {
  // Mon–Sun week containing today
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun
  const diffToMon = (day + 6) % 7;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMon));
  const mondayStr = dateToUTC(monday.getTime());
  return p.logs.filter((l) => l.date >= mondayStr);
}

export function logsThisYear(p: Profile): Log[] {
  const year = new Date().getUTCFullYear();
  return p.logs.filter((l) => l.date.startsWith(String(year)));
}

export function categoryBreakdown(p: Profile): { category: Category; count: number; pct: number }[] {
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
  const nextMilestone = ((p.freezeEarnedAtStreak ?? 0) + 10);
  return Math.max(0, nextMilestone - p.currentStreak);
}

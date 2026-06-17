// localStorage-backed profile + log + streak logic

export type Log = {
  id: string;
  date: string; // UTC YYYY-MM-DD
  content: string;
  streak: number;
  createdAt: number; // ms epoch
};

export type Profile = {
  address: string;
  logs: Log[];
  currentStreak: number;
  longestStreak: number;
  builderScore: number;
};

const KEY_PREFIX = "stackd:profile:";
const INDEX_KEY = "stackd:addresses";

export function todayUTC(): string {
  const d = new Date();
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

export function addLog(address: string, content: string): Profile {
  const profile = getProfile(address);
  const today = todayUTC();
  if (profile.logs.some((l) => l.date === today)) return profile;

  // streak: based on most-recent prior log
  const sorted = [...profile.logs].sort((a, b) => (a.date < b.date ? 1 : -1));
  const last = sorted[0];
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
  };

  const updated: Profile = {
    ...profile,
    logs: [...profile.logs, log],
    currentStreak: nextStreak,
    longestStreak: Math.max(profile.longestStreak, nextStreak),
    builderScore: 0,
  };
  updated.builderScore = computeScore(updated);
  saveProfile(updated);
  return updated;
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

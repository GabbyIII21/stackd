import { type Profile, type Log, logsThisYear } from "./storage";

export type AchievementCategory = "Consistency" | "Volume" | "Milestones";

export type Achievement = {
  id: string;
  category: AchievementCategory;
  name: string;
  description: string;
  /** Current progress 0..target */
  progress: number;
  target: number;
  earned: boolean;
  earnedAt?: number;
};

function findStreakReachDate(logs: Log[], target: number): number | undefined {
  // logs sorted oldest → newest, non-freeze only? We let freeze keep the streak.
  const sorted = [...logs].sort((a, b) => a.createdAt - b.createdAt);
  for (const l of sorted) {
    if (l.streak >= target) return l.createdAt;
  }
  return undefined;
}

function nthLogDate(logs: Log[], n: number): number | undefined {
  const sorted = [...logs].filter((l) => !l.isFreeze).sort((a, b) => a.createdAt - b.createdAt);
  return sorted[n - 1]?.createdAt;
}

export function computeAchievements(profile: Profile): Achievement[] {
  const logs = profile.logs;
  const totalLogs = logs.filter((l) => !l.isFreeze).length;
  const longest = profile.longestStreak;
  const current = profile.currentStreak;

  // ── Consistency: 7-Day, 30-Day, 100-Day, 365-Day + ongoing 7-day tiers ─
  const consistency: Achievement[] = [];
  const fixedStreakTiers = [7, 30, 100, 365];
  for (const t of fixedStreakTiers) {
    const earned = longest >= t;
    consistency.push({
      id: `streak-${t}`,
      category: "Consistency",
      name: `${t}-Day Builder`,
      description: `Reach a ${t} day streak`,
      progress: Math.min(longest, t),
      target: t,
      earned,
      earnedAt: earned ? findStreakReachDate(logs, t) : undefined,
    });
  }
  // Ongoing 7-day tiers beyond 7 while streak unbroken
  // Show next locked tier above current streak that's a multiple of 7 and > 7
  // We only surface the *next* unlocked-or-in-progress 7-day tier to avoid endless list.
  if (current >= 7) {
    const nextTier = Math.floor(current / 7) * 7 + 7;
    if (!fixedStreakTiers.includes(nextTier)) {
      consistency.push({
        id: `streak-${nextTier}`,
        category: "Consistency",
        name: `${nextTier}-Day Builder`,
        description: `Keep your streak alive for ${nextTier} days in a row`,
        progress: current,
        target: nextTier,
        earned: false,
      });
    }
  }

  // ── Volume ─────────────────────────────────────────────────────────────
  const volumeTiers = [1, 10, 50, 100, 500];
  const volumeNames: Record<number, string> = {
    1: "First Log",
    10: "10 Logs",
    50: "50 Logs",
    100: "100 Logs",
    500: "500 Logs",
  };
  const volume: Achievement[] = volumeTiers.map((t) => {
    const earned = totalLogs >= t;
    return {
      id: `logs-${t}`,
      category: "Volume",
      name: volumeNames[t],
      description: t === 1 ? "Submit your first log" : `Submit ${t} total logs`,
      progress: Math.min(totalLogs, t),
      target: t,
      earned,
      earnedAt: earned ? nthLogDate(logs, t) : undefined,
    };
  });

  // ── Milestones ─────────────────────────────────────────────────────────
  const regIndex = profile.registrationIndex ?? -1;
  const earlyEarned = regIndex >= 0 && regIndex < 100 && totalLogs >= 1;
  const earlyAt = earlyEarned ? profile.firstLogAt : undefined;

  const yearLogs = logsThisYear(profile).filter((l) => !l.isFreeze).length;
  const centuryEarned = yearLogs >= 100;

  const milestones: Achievement[] = [
    {
      id: "early-builder",
      category: "Milestones",
      name: "Early Builder",
      description: "One of the first 100 wallets to log on StackD",
      progress: earlyEarned ? 1 : 0,
      target: 1,
      earned: earlyEarned,
      earnedAt: earlyAt,
    },
    {
      id: "comeback-kid",
      category: "Milestones",
      name: "Comeback Kid",
      description: "Rebuild a streak to 7+ days after losing one",
      progress: profile.hadComeback ? 1 : 0,
      target: 1,
      earned: !!profile.hadComeback,
    },
    {
      id: "century-year",
      category: "Milestones",
      name: "Century Year",
      description: "Log 100 days within a single calendar year",
      progress: Math.min(yearLogs, 100),
      target: 100,
      earned: centuryEarned,
    },
  ];

  return [...consistency, ...volume, ...milestones];
}

export function topEarnedAchievement(profile: Profile): Achievement | undefined {
  const all = computeAchievements(profile).filter((a) => a.earned);
  // Prefer highest streak, then highest volume target.
  const sorted = [...all].sort((a, b) => b.target - a.target);
  return sorted[0];
}

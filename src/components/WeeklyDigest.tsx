import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { type Profile, logsThisWeek, getAllProfiles, getLiveProfile } from "@/lib/storage";

function thisSundayKey(): string | null {
  const now = new Date();
  if (now.getUTCDay() !== 0) return null;
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
}

const DISMISS_PREFIX = "stackd:digest-dismissed:";

export function WeeklyDigest({ profile }: { profile: Profile }) {
  const sundayKey = thisSundayKey();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!sundayKey) return;
    const k = `${DISMISS_PREFIX}${profile.address}:${sundayKey}`;
    setDismissed(localStorage.getItem(k) === "1");
  }, [sundayKey, profile.address]);

  if (!sundayKey) return null;
  if (profile.logs.length === 0) return null;
  if (dismissed) return null;

  const week = logsThisWeek(profile).filter((l) => !l.isFreeze);
  const streakNow = profile.currentStreak;
  // streak at start of week ≈ streakNow - logsThisWeek if all consecutive
  const streakStart = Math.max(0, streakNow - week.length);
  const scoreChange = week.length * 1 + (streakNow - streakStart) * 3;

  // leaderboard rank
  const all = getAllProfiles().map((p) => getLiveProfile(p.address));
  all.sort((a, b) => b.builderScore - a.builderScore);
  const rank = all.findIndex((p) => p.address === profile.address) + 1;

  const onDismiss = () => {
    localStorage.setItem(`${DISMISS_PREFIX}${profile.address}:${sundayKey}`, "1");
    setDismissed(true);
  };

  return (
    <div
      className="relative rounded-md p-5 mb-6 fade-in"
      style={{ background: "#161616", borderLeft: "2px solid #0052FF" }}
    >
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X size={16} />
      </button>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">This Week</div>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <DigestStat label="Logs Mon–Sun" value={String(week.length)} />
        <DigestStat label="Streak" value={`${streakStart} → ${streakNow}`} />
        <DigestStat
          label="Score change"
          value={`${scoreChange >= 0 ? "+" : ""}${scoreChange} points`}
          color="text-[#22c55e]"
        />
        <DigestStat label="Leaderboard" value={rank > 0 ? `#${rank}` : "—"} />
      </div>
    </div>
  );
}

function DigestStat({ label, value, color = "text-foreground" }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className={`font-semibold ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

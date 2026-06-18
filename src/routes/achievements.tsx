import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Nav, Footer } from "@/components/Nav";
import { useMounted } from "@/hooks/use-mounted";
import { getLiveProfile, type Profile } from "@/lib/storage";
import { computeAchievements, type Achievement, type AchievementCategory } from "@/lib/achievements";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/achievements")({
  head: () => ({ meta: [{ title: "Achievements — StackD" }] }),
  component: AchievementsPage,
});

const CATS: AchievementCategory[] = ["Consistency", "Volume", "Milestones"];

function AchievementsPage() {
  const mounted = useMounted();
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!mounted) return;
    if (!isConnected || !address) {
      navigate({ to: "/" });
      return;
    }
    setProfile(getLiveProfile(address));
  }, [mounted, isConnected, address, navigate]);

  if (!mounted || !profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <div className="flex-1" />
        <Footer />
      </div>
    );
  }

  const all = computeAchievements(profile);

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 sm:px-6 py-8 fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Achievements</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Unlock badges by building consistently. Tiers extend as long as your streak holds.
        </p>

        <div className="mt-8 space-y-10">
          {CATS.map((cat) => {
            const items = all.filter((a) => a.category === cat);
            const earnedCount = items.filter((a) => a.earned).length;
            return (
              <section key={cat}>
                <div className="flex items-baseline justify-between mb-3">
                  <h2 className="text-sm font-medium text-foreground uppercase tracking-wider">
                    {cat}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {earnedCount} / {items.length} earned
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((a) => (
                    <AchievementCard key={a.id} a={a} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function AchievementCard({ a }: { a: Achievement }) {
  const pct = Math.min(100, (a.progress / a.target) * 100);
  return (
    <div
      className="bg-surface border border-border rounded-md p-4"
      style={{ opacity: a.earned ? 1 : 0.4 }}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{a.name}</h3>
        {a.earned && (
          <span className="text-[10px] uppercase tracking-wider text-[#22c55e] border border-[#22c55e]/30 rounded-full px-2 py-0.5">
            Earned
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
      <div className="mt-3 h-1.5 rounded-full bg-[#1f1f1f] overflow-hidden">
        <div
          className="h-full"
          style={{ width: `${pct}%`, background: a.earned ? "#22c55e" : "#0052FF" }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {a.progress} / {a.target}
        </span>
        {a.earned && a.earnedAt && <span>{formatDate(a.earnedAt)}</span>}
      </div>
    </div>
  );
}

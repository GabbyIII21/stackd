import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Nav, Footer } from "@/components/Nav";
import {
  categoryBreakdown,
  getLiveProfile,
  logDateSet,
  type Profile,
} from "@/lib/storage";
import { useMounted } from "@/hooks/use-mounted";
import { formatDate, shortAddress } from "@/lib/format";
import { Heatmap } from "@/components/Heatmap";
import { CategoryBreakdownBar, CategoryChip } from "@/components/CategoryUI";
import { LogImage } from "@/components/LogImage";
import { downloadBuilderCard } from "@/lib/builder-card";

export const Route = createFileRoute("/profile/$address")({
  head: ({ params }) => ({
    meta: [{ title: `${shortAddress(params.address)} — StackD` }],
  }),
  component: ProfilePage,
});

const BADGES = [
  { label: "7-Day Builder", min: 7 },
  { label: "30-Day Builder", min: 30 },
  { label: "100-Day Builder", min: 100 },
  { label: "365-Day Builder", min: 365 },
];

function ProfilePage() {
  const { address } = Route.useParams();
  const mounted = useMounted();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!mounted) return;
    setProfile(getLiveProfile(address));
  }, [mounted, address]);

  const empty = mounted && profile && profile.logs.length === 0;
  const logs = profile
    ? [...profile.logs].sort((a, b) => b.createdAt - a.createdAt)
    : [];
  const earned = profile ? BADGES.filter((b) => profile.longestStreak >= b.min) : [];
  const breakdown = profile ? categoryBreakdown(profile) : [];
  const dates = profile ? logDateSet(profile) : new Set<string>();

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 sm:px-6 py-8 fade-in">
        <div className="border-b border-border pb-6">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-mono break-all">
              {shortAddress(address)}
            </h1>
            {profile && profile.logs.length > 0 && (
              <button
                onClick={() => downloadBuilderCard(profile)}
                className="text-sm px-3 py-1.5 rounded-md border border-border hover:border-[#0052FF] hover:text-[#0052FF] text-muted-foreground transition-colors inline-flex items-center gap-2"
              >
                <Download size={14} />
                Download Card
              </button>
            )}
          </div>
          {profile && profile.logs.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <Stat label="Score" value={profile.builderScore} color="text-[#0052FF]" />
              <Divider />
              <Stat label="Streak" value={profile.currentStreak} color="text-[#22c55e]" />
              <Divider />
              <Stat label="Longest" value={profile.longestStreak} />
              <Divider />
              <Stat label="Logs" value={profile.logs.filter((l) => !l.isFreeze).length} />
            </div>
          )}
          {earned.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {earned.map((b) => (
                <span
                  key={b.label}
                  className="text-xs px-2.5 py-1 rounded border border-[#0052FF] text-[#0052FF]"
                >
                  {b.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {profile && profile.logs.length > 0 && (
          <>
            <section className="mt-8">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Category breakdown
              </h2>
              <CategoryBreakdownBar data={breakdown} />
            </section>

            <section className="mt-8">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Activity
              </h2>
              <Heatmap dates={dates} />
            </section>
          </>
        )}

        <section className="mt-8">
          {empty ? (
            <div className="text-center py-20 text-muted-foreground text-sm">
              This builder hasn't started yet.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((l) => (
                <div key={l.id} className="bg-surface border border-border rounded-md p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs text-muted-foreground">{formatDate(l.date)}</span>
                    <div className="flex items-center gap-2">
                      <CategoryChip category={l.category} />
                      {l.isFreeze ? (
                        <span className="text-xs text-[#0052FF] border border-[#0052FF]/40 rounded-full px-2 py-0.5">
                          Freeze
                        </span>
                      ) : (
                        <span className="text-xs text-[#22c55e] border border-[#22c55e]/30 rounded-full px-2 py-0.5">
                          Streak: {l.streak}
                        </span>
                      )}
                    </div>
                  </div>
                  {!l.isFreeze && (
                    <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">{l.content}</p>
                  )}
                  {l.imageHash && <LogImage hash={l.imageHash} />}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Stat({
  label,
  value,
  color = "text-foreground",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`font-bold ${color}`}>{value}</span>
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}

function Divider() {
  return <span className="h-4 w-px bg-border" />;
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Nav, Footer } from "@/components/Nav";
import { useMounted } from "@/hooks/use-mounted";
import { addLog, getLiveProfile, hasLoggedToday, type Profile } from "@/lib/storage";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — StackD" }] }),
  component: Dashboard,
});

function Dashboard() {
  const mounted = useMounted();
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!mounted) return;
    if (!isConnected || !address) {
      navigate({ to: "/" });
      return;
    }
    setProfile(getLiveProfile(address));
  }, [mounted, isConnected, address, navigate]);

  if (!mounted || !profile || !address) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <div className="flex-1" />
        <Footer />
      </div>
    );
  }

  const todayLog = hasLoggedToday(profile);
  const overLimit = text.length > 280;
  const disabled = text.trim().length === 0 || overLimit;

  const onSubmit = () => {
    if (disabled) return;
    const updated = addLog(address, text);
    setProfile(getLiveProfile(updated.address));
    setText("");
  };

  const logs = [...profile.logs].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 sm:px-6 py-8 fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="day streak" value={profile.currentStreak} color="text-[#22c55e]" />
          <StatCard label="longest streak" value={profile.longestStreak} />
          <StatCard label="total logs" value={profile.logs.length} />
          <StatCard label="builder score" value={profile.builderScore} color="text-[#0052FF]" />
        </div>

        <section className="mt-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Today's Log
          </h2>
          {todayLog ? (
            <div className="bg-surface border border-border rounded-md p-5">
              <div className="text-xs text-muted-foreground">
                {formatDate(todayLog.date)} · You've logged today. Come back tomorrow.
              </div>
              <p className="mt-3 text-foreground whitespace-pre-wrap">{todayLog.content}</p>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-md p-5">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                placeholder="What did you build today?"
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none text-base"
              />
              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={onSubmit}
                  disabled={disabled}
                  className="px-4 py-2 rounded-md bg-[#0052FF] text-white text-sm font-medium hover:bg-[#0047d9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Log Today
                </button>
                <span
                  className={`text-xs font-mono ${
                    overLimit
                      ? "text-[#ef4444]"
                      : text.length > 250
                        ? "text-[#ef4444]/70"
                        : "text-muted-foreground"
                  }`}
                >
                  {text.length} / 280
                </span>
              </div>
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Build History
          </h2>
          {logs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Your builder journey starts today.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((l) => (
                <div key={l.id} className="bg-surface border border-border rounded-md p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">{formatDate(l.date)}</span>
                    <span className="text-xs text-[#22c55e] border border-[#22c55e]/30 rounded-full px-2 py-0.5">
                      Streak: {l.streak}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">{l.content}</p>
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

function StatCard({
  label,
  value,
  color = "text-foreground",
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-md p-4">
      <div className={`text-2xl sm:text-3xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

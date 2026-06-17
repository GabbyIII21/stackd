import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Nav, Footer } from "@/components/Nav";
import { getAllProfiles, getLiveProfile, type Profile } from "@/lib/storage";
import { useMounted } from "@/hooks/use-mounted";
import { shortAddress } from "@/lib/format";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — StackD" }] }),
  component: Leaderboard,
});

function Leaderboard() {
  const mounted = useMounted();
  const { address } = useAccount();
  const [rows, setRows] = useState<Profile[]>([]);

  useEffect(() => {
    if (!mounted) return;
    const all = getAllProfiles().map((p) => getLiveProfile(p.address));
    all.sort((a, b) => b.builderScore - a.builderScore);
    setRows(all);
  }, [mounted]);

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 sm:px-6 py-8 fade-in">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Builder Leaderboard
        </h2>
        {mounted && rows.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm">
            No builders on the board yet.
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-md overflow-hidden">
            <div className="grid grid-cols-[60px_1fr_120px_120px_100px] text-xs uppercase tracking-wider text-muted-foreground border-b border-border px-4 py-3">
              <div>Rank</div>
              <div>Builder</div>
              <div className="text-right">Score</div>
              <div className="text-right">Streak</div>
              <div className="text-right">Logs</div>
            </div>
            {rows.map((p, i) => {
              const isMe = address && p.address === address.toLowerCase();
              const rank = i + 1;
              return (
                <div
                  key={p.address}
                  className={`grid grid-cols-[60px_1fr_120px_120px_100px] items-center px-4 py-3 text-sm border-b border-border last:border-0 ${
                    isMe ? "border-l-2 border-l-[#0052FF]" : ""
                  }`}
                >
                  <div
                    className={`${rank <= 3 ? "text-[#0052FF] font-bold" : "text-muted-foreground"}`}
                  >
                    {rank}
                  </div>
                  <Link
                    to="/profile/$address"
                    params={{ address: p.address }}
                    className="font-mono text-[#0052FF] hover:underline"
                  >
                    {shortAddress(p.address)}
                  </Link>
                  <div className="text-right text-foreground font-medium">{p.builderScore}</div>
                  <div className="text-right text-[#22c55e]">{p.currentStreak}</div>
                  <div className="text-right text-muted-foreground">{p.logs.length}</div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Nav, Footer } from "@/components/Nav";
import { FlameIcon } from "@/components/Logo";
import { getAllProfiles, type Log } from "@/lib/storage";
import { useMounted } from "@/hooks/use-mounted";
import { relativeTime, shortAddress } from "@/lib/format";

export const Route = createFileRoute("/explore")({
  head: () => ({ meta: [{ title: "Explore — StackD" }] }),
  component: Explore,
});

type FeedItem = Log & { address: string };

function Explore() {
  const mounted = useMounted();
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    if (!mounted) return;
    const all = getAllProfiles().flatMap((p) =>
      p.logs.map((l) => ({ ...l, address: p.address })),
    );
    all.sort((a, b) => b.createdAt - a.createdAt);
    setItems(all);
  }, [mounted]);

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 sm:px-6 py-8 fade-in">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Builder Feed
        </h2>
        {mounted && items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-sm">No builders yet. Be the first.</p>
            <Link
              to="/dashboard"
              className="inline-block mt-5 px-4 py-2 rounded-md bg-[#0052FF] text-white text-sm font-medium hover:bg-[#0047d9] transition-colors"
            >
              Start building
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((l) => (
              <div key={l.id} className="bg-surface border border-border rounded-md p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <Link
                    to="/profile/$address"
                    params={{ address: l.address }}
                    className="text-[#0052FF] font-mono text-sm hover:underline"
                  >
                    {shortAddress(l.address)}
                  </Link>
                  <span className="text-xs text-muted-foreground">{relativeTime(l.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">{l.content}</p>
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1 text-xs text-[#22c55e] border border-[#22c55e]/30 rounded-full px-2 py-0.5">
                    <FlameIcon />
                    {l.streak} day streak
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

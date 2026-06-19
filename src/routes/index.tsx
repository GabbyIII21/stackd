import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAccount } from "wagmi";
import {
  Flame,
  Trophy,
  Award,
  Database,
  ShieldCheck,
  UserSquare2,
  Wallet,
  PenLine,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Nav, Footer } from "@/components/Nav";
import { ConnectButton } from "@/components/ConnectButton";
import { useMounted } from "@/hooks/use-mounted";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StackD — Build Something. Every Day." },
      {
        name: "description",
        content:
          "Document what you build, maintain your streak, and create a verifiable public builder history on Base.",
      },
    ],
  }),
  component: Landing,
});

// Session-scoped: auto-advance to the dashboard once when a wallet first connects,
// but let users navigate back to this landing (e.g. via the logo) without bouncing.
let hasAutoAdvanced = false;

function Landing() {
  const mounted = useMounted();
  const { isConnected } = useAccount();
  const navigate = useNavigate();

  useEffect(() => {
    if (mounted && isConnected && !hasAutoAdvanced) {
      hasAutoAdvanced = true;
      navigate({ to: "/dashboard" });
    }
  }, [mounted, isConnected, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <main className="flex-1 w-full">
        {/* Hero */}
        <section className="max-w-[1100px] w-full mx-auto px-4 sm:px-6">
          <div className="pt-20 pb-16 sm:pt-28 sm:pb-24 grid lg:grid-cols-2 gap-12 items-center fade-in">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#0052FF] opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0052FF]" />
                </span>
                Live on Base
              </span>

              <h1 className="mt-6 text-5xl sm:text-7xl font-bold tracking-tight text-foreground leading-[1.03]">
                Build Something.
                <br />
                <span className="text-muted-foreground">Every Day.</span>
              </h1>

              <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-[520px] leading-relaxed">
                Document what you build, maintain your streak, and create a verifiable public builder
                history on Base. Your shipping log, owned by you.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                {mounted && isConnected ? (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#0052FF] text-white text-sm font-medium hover:bg-[#0047d9] transition-colors"
                  >
                    Open Dashboard <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <ConnectButton variant="primary" />
                )}
                <Link
                  to="/leaderboard"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-border text-sm text-foreground hover:border-foreground/40 transition-colors"
                >
                  View Leaderboard <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-2">
                {["Track your streak", "Build your history", "Own your progress"].map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Streak card visual */}
            <StreakCard />
          </div>
        </section>

        {/* Stats bar */}
        <section className="max-w-[1100px] w-full mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 py-8 border-y border-border">
            {STATS.map((s) => (
              <div key={s.label} className="pl-3 border-l-2 border-[#0052FF]">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">{s.value}</div>
                <div className="mt-1 text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-[1100px] w-full mx-auto px-4 sm:px-6 py-20 sm:py-24">
          <SectionHeading eyebrow="How it works" title="Three steps to your streak" />
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="relative rounded-lg border border-border bg-surface p-6"
              >
                <div className="absolute -top-3 left-6 h-7 w-7 rounded-md bg-[#0052FF] text-white text-sm font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                <step.icon className="mt-3 h-6 w-6 text-[#0052FF]" />
                <h3 className="mt-4 text-base font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features grid */}
        <section className="max-w-[1100px] w-full mx-auto px-4 sm:px-6 pb-20 sm:pb-24">
          <SectionHeading
            eyebrow="Everything you need"
            title="Built for builders who ship"
          />
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-lg border border-border bg-surface p-6 hover:border-foreground/20 transition-colors"
              >
                <f.icon className="h-6 w-6 text-[#0052FF]" />
                <h3 className="mt-4 text-base font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Leaderboard preview */}
        <section className="max-w-[1100px] w-full mx-auto px-4 sm:px-6 pb-20 sm:pb-24">
          <div className="flex items-end justify-between gap-4">
            <SectionHeading eyebrow="Compete publicly" title="Top builders right now" />
            <Link
              to="/leaderboard"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-[#0052FF] hover:underline whitespace-nowrap"
            >
              Full leaderboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 rounded-lg border border-border bg-surface divide-y divide-border">
            {LEADERS.map((l, i) => (
              <div key={l.address} className="flex items-center gap-4 px-5 py-4">
                <div
                  className={`h-7 w-7 shrink-0 rounded-md flex items-center justify-center text-sm font-bold ${
                    i === 0
                      ? "bg-[#0052FF] text-white"
                      : "bg-background text-muted-foreground border border-border"
                  }`}
                >
                  {i + 1}
                </div>
                <span className="font-mono text-sm text-foreground">{l.address}</span>
                <span className="ml-auto inline-flex items-center gap-1.5 text-sm text-foreground">
                  <Flame className="h-4 w-4 text-[#0052FF]" />
                  {l.streak} days
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-[1100px] w-full mx-auto px-4 sm:px-6 pb-24">
          <div className="rounded-xl border border-border bg-surface px-6 py-14 sm:px-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Start building in public.
            </h2>
            <p className="mt-4 text-muted-foreground max-w-[480px] mx-auto">
              Connect your wallet and log your first build today. No ETH needed to get started.
            </p>
            <div className="mt-8 flex justify-center">
              {mounted && isConnected ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#0052FF] text-white text-sm font-medium hover:bg-[#0047d9] transition-colors"
                >
                  Open Dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <ConnectButton variant="primary" />
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-[#0052FF] font-medium">{eyebrow}</div>
      <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h2>
    </div>
  );
}

function StreakCard() {
  // 7 cols x 5 rows contribution grid, deterministic pattern (no hydration mismatch)
  const cells = Array.from({ length: 35 }, (_, i) => (i * 7 + 3) % 5);
  const intensity = ["bg-border", "bg-[#0052FF]/30", "bg-[#0052FF]/55", "bg-[#0052FF]/80", "bg-[#0052FF]"];

  return (
    <div className="rounded-xl border border-border bg-surface p-6 fade-in">
      <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
        <span>0x71C…3DF</span>
        <span>DAY 28</span>
      </div>

      <div className="mt-6 flex flex-col items-center">
        <div className="relative h-40 w-40">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="44" fill="none" stroke="var(--border)" strokeWidth="6" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#0052FF"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 44}
              strokeDashoffset={2 * Math.PI * 44 * (1 - 0.8)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-foreground">28</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Day Streak
            </span>
          </div>
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-success">
          <Flame className="h-3.5 w-3.5" />
          2× XP multiplier active
        </div>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-1.5">
        {cells.map((lvl, i) => (
          <div key={i} className={`aspect-square rounded-sm ${intensity[lvl]}`} />
        ))}
      </div>
    </div>
  );
}

const STATS = [
  { value: "12,847", label: "Builds logged" },
  { value: "1,924", label: "Active builders" },
  { value: "73%", label: "7-day retention" },
];

const STEPS = [
  {
    icon: Wallet,
    title: "Connect your wallet",
    body: "Sign in with Coinbase Wallet or any injected wallet. No ETH required to start.",
  },
  {
    icon: PenLine,
    title: "Log what you build",
    body: "Drop a daily note on what you shipped — design, contract, frontend, anything.",
  },
  {
    icon: TrendingUp,
    title: "Grow your streak",
    body: "Keep the chain alive, climb the leaderboard, and earn a public builder reputation.",
  },
];

const FEATURES = [
  {
    icon: Flame,
    title: "Streak tracking",
    body: "Daily streaks with XP multipliers that reward consistency over intensity.",
  },
  {
    icon: UserSquare2,
    title: "Public builder profile",
    body: "A shareable page showing your full history, categories, and current streak.",
  },
  {
    icon: Trophy,
    title: "Leaderboard",
    body: "Compete with builders across the ecosystem and prove you show up.",
  },
  {
    icon: Award,
    title: "Achievements",
    body: "Unlock milestone badges as your streak and total builds grow.",
  },
  {
    icon: Database,
    title: "IPFS-stored logs",
    body: "Build entries are pinned to IPFS via Pinata — durable and portable.",
  },
  {
    icon: ShieldCheck,
    title: "Verifiable on Base",
    body: "Your builder history lives onchain on Base. Yours to keep, easy to verify.",
  },
];

const LEADERS = [
  { address: "0x71C…a3DF", streak: 142 },
  { address: "0x4B2…9e10", streak: 119 },
  { address: "0xA09…cc7b", streak: 98 },
];

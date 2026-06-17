import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAccount } from "wagmi";
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

function Landing() {
  const mounted = useMounted();
  const { isConnected } = useAccount();
  const navigate = useNavigate();

  useEffect(() => {
    if (mounted && isConnected) navigate({ to: "/dashboard" });
  }, [mounted, isConnected, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 sm:px-6">
        <section className="pt-24 pb-20 sm:pt-32 sm:pb-28 fade-in">
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-foreground leading-[1.05]">
            Build Something.
            <br />
            <span className="text-muted-foreground">Every Day.</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-[520px] leading-relaxed">
            Document what you build, maintain your streak, and create a verifiable public builder
            history on Base.
          </p>
          <div className="mt-10">
            <ConnectButton variant="primary" />
          </div>
          <div className="mt-12 flex flex-wrap gap-2">
            {["Track your streak", "Build your history", "Own your progress"].map((t) => (
              <span
                key={t}
                className="px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

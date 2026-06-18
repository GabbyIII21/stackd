import { Link } from "@tanstack/react-router";
import { useAccount } from "wagmi";
import { Logo } from "./Logo";
import { ConnectButton } from "./ConnectButton";
import { StreakFlame } from "./StreakFlame";
import { useLiveProfile } from "@/hooks/use-live-profile";

export function Nav() {
  const { isConnected } = useAccount();
  const { profile } = useLiveProfile();
  return (
    <header className="border-b border-border">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link to={isConnected ? "/dashboard" : "/"}>
          <Logo />
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link
            to="/explore"
            className="text-muted-foreground hover:text-foreground transition-colors"
            activeProps={{ className: "text-foreground" }}
          >
            Explore
          </Link>
          <Link
            to="/leaderboard"
            className="text-muted-foreground hover:text-foreground transition-colors"
            activeProps={{ className: "text-foreground" }}
          >
            Leaderboard
          </Link>
          {isConnected && (
            <Link
              to="/achievements"
              className="text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: "text-foreground" }}
            >
              Achievements
            </Link>
          )}
          {isConnected && <StreakFlame streak={profile?.currentStreak ?? 0} />}
          <ConnectButton variant={isConnected ? "secondary" : "primary"} />
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 py-8 text-center text-xs text-muted-foreground">
      StackD · Logs are stored locally on this device.
    </footer>
  );
}

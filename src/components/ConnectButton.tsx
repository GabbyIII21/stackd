import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { shortAddress } from "@/lib/format";
import { Link } from "@tanstack/react-router";

export function ConnectButton({ variant = "primary" }: { variant?: "primary" | "secondary" }) {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <Link
          to="/profile/$address"
          params={{ address }}
          className="text-[#0052FF] text-sm font-mono hover:underline"
        >
          {shortAddress(address)}
        </Link>
        <button
          onClick={() => disconnect()}
          className="text-muted-foreground text-sm hover:text-foreground transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  const base =
    variant === "primary"
      ? "bg-[#0052FF] text-white hover:bg-[#0047d9]"
      : "bg-transparent text-foreground border border-border hover:border-foreground/40";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className={`${base} px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50`}
      >
        {isPending ? "Connecting…" : "Connect Wallet"}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-60 bg-surface border border-border rounded-md z-50 overflow-hidden fade-in">
            <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border">
              Choose a wallet
            </div>
            {connectors.map((c) => (
              <button
                key={c.uid}
                onClick={() => {
                  connect({ connector: c });
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:bg-white/5 transition-colors"
              >
                {c.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

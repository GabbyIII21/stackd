export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden>
        <rect x="3" y="20" width="26" height="6" rx="1.5" fill="#0052FF" />
        <rect x="6" y="12" width="20" height="6" rx="1.5" fill="#f5f5f5" opacity="0.85" />
        <rect x="9" y="4" width="14" height="6" rx="1.5" fill="#f5f5f5" opacity="0.5" />
      </svg>
      <span className="font-bold tracking-tight text-foreground text-lg">
        Stack<span className="text-[#0052FF]">D</span>
      </span>
    </div>
  );
}

export function FlameIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2c1 3 4 4 4 8a4 4 0 0 1-1 2.7c.6-.2 1.2-.7 1.6-1.4.9 1 1.4 2.3 1.4 3.7a6 6 0 1 1-12 0c0-2.6 1.5-4.5 3-6 .8 1 1.2 2 1 3 2-1.5 2-6 2-10z" />
    </svg>
  );
}

import { Link } from "@tanstack/react-router";

export function StreakFlame({ streak }: { streak: number }) {
  const active = streak >= 1;
  const hot = streak >= 7;
  const color = !active ? "#888888" : hot ? "#ef4444" : "#f97316";
  const size = hot ? 18 : 16;
  const opacity = active ? 1 : 0.3;
  return (
    <Link
      to="/dashboard"
      className="inline-flex items-center gap-1 transition-opacity"
      style={{ opacity }}
      aria-label={`Current streak: ${streak} days`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color}
        aria-hidden
      >
        <path d="M12 2c.5 2 2.2 3.2 3.4 4.7C16.6 8.1 17 9.5 17 11c0 .9-.2 1.7-.5 2.4.7-.3 1.3-.8 1.7-1.4.7 1 1.1 2.3 1.1 3.7a7.3 7.3 0 1 1-14.6 0c0-2.5 1.2-4.4 2.7-6 .9 1 1.4 2.1 1.3 3.2 2-1.6 2.4-4.4 2.4-7.4 0-1.3.3-2.5.9-3.5z" />
      </svg>
      <span
        className="text-sm tabular-nums font-medium"
        style={{ color: active ? "#f5f5f5" : "#888888" }}
      >
        {streak}
      </span>
    </Link>
  );
}

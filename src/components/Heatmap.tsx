import { todayUTC } from "@/lib/storage";

type Props = {
  dates: Set<string>; // YYYY-MM-DD strings with a log
  days?: number;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function Heatmap({ dates, days = 364 }: Props) {
  const today = new Date();
  const todayStr = todayUTC();
  // Start = today - days. Align grid so columns are Mon-anchored weeks.
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - days));
  // Back up to the most recent Monday on/before start
  const startDow = (start.getUTCDay() + 6) % 7; // 0=Mon
  start.setUTCDate(start.getUTCDate() - startDow);

  const weeks: { date: string; inRange: boolean }[][] = [];
  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = -1;

  const cursor = new Date(start);
  const todayMs = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  for (let w = 0; w < 53; w++) {
    const col: { date: string; inRange: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const ms = cursor.getTime();
      const dateStr = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}-${String(cursor.getUTCDate()).padStart(2, "0")}`;
      col.push({ date: dateStr, inRange: ms <= todayMs });
      if (d === 0) {
        const m = cursor.getUTCMonth();
        if (m !== lastMonth) {
          monthLabels.push({ col: w, label: MONTHS[m] });
          lastMonth = m;
        }
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    weeks.push(col);
    if (cursor.getTime() > todayMs + 86400000 * 6) break;
  }

  const CELL = 10;
  const GAP = 3;

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: weeks.length * (CELL + GAP) }}>
        <div
          className="relative text-[10px] text-muted-foreground"
          style={{ height: 14, marginLeft: 0 }}
        >
          {monthLabels.map((m, i) => {
            const next = monthLabels[i + 1];
            if (next && next.col - m.col < 3) return null;
            return (
              <span
                key={`${m.label}-${m.col}`}
                style={{ position: "absolute", left: m.col * (CELL + GAP) }}
              >
                {m.label}
              </span>
            );
          })}
        </div>
        <div className="flex" style={{ gap: GAP }}>
          {weeks.map((col, ci) => (
            <div key={ci} className="flex flex-col" style={{ gap: GAP }}>
              {col.map((cell) => {
                const has = dates.has(cell.date);
                const isToday = cell.date === todayStr;
                const bg = !cell.inRange ? "transparent" : has ? "#22c55e" : "#1f1f1f";
                const border = isToday ? "1px solid #0052FF" : "none";
                return (
                  <div
                    key={cell.date}
                    title={`${cell.date}${has ? " · logged" : ""}`}
                    style={{
                      width: CELL,
                      height: CELL,
                      borderRadius: 2,
                      background: bg,
                      border,
                      boxSizing: "border-box",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

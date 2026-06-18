import { CATEGORIES, CATEGORY_SHADES, type Category } from "@/lib/categories";

export function CategoryPills({
  value,
  onChange,
}: {
  value: Category;
  onChange: (c: Category) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {CATEGORIES.map((c) => {
        const active = c === value;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
              active
                ? "bg-[#0052FF] text-white"
                : "bg-[#1f1f1f] text-[#888888] hover:text-foreground"
            }`}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}

export function CategoryChip({ category }: { category?: Category }) {
  if (!category) return null;
  return (
    <span className="text-xs px-2 py-0.5 rounded-full border border-[#0052FF]/50 text-muted-foreground whitespace-nowrap">
      {category}
    </span>
  );
}

export function CategoryBreakdownBar({
  data,
}: {
  data: { category: Category; count: number; pct: number }[];
}) {
  if (data.length === 0) return null;
  return (
    <div>
      <div className="flex h-2 rounded-full overflow-hidden bg-[#1f1f1f]">
        {data.map((d) => (
          <div
            key={d.category}
            title={`${d.category}: ${d.count} (${d.pct.toFixed(0)}%)`}
            style={{ width: `${d.pct}%`, background: CATEGORY_SHADES[d.category] }}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {data.map((d) => (
          <span key={d.category} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-sm"
              style={{ background: CATEGORY_SHADES[d.category] }}
            />
            {d.category} {d.pct.toFixed(0)}%
          </span>
        ))}
      </div>
    </div>
  );
}

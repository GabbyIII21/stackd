import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { Paperclip, X, Snowflake } from "lucide-react";
import { Nav, Footer } from "@/components/Nav";
import { useMounted } from "@/hooks/use-mounted";
import { canActivateFreeze, daysUntilNextFreeze, hasLoggedToday } from "@/lib/storage";
import { useProfile } from "@/hooks/use-registry";
import { submitActivateFreeze, submitLogBuild } from "@/lib/registry-actions";
import { formatDate } from "@/lib/format";
import { type Category } from "@/lib/categories";
import { CategoryChip, CategoryPills } from "@/components/CategoryUI";
import { LogImage } from "@/components/LogImage";
import { WeeklyDigest } from "@/components/WeeklyDigest";
import { useServerFn } from "@tanstack/react-start";
import { pinJsonToPinata, uploadToPinata } from "@/lib/pinata.functions";

function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/User rejected|denied|rejected the request/i.test(msg)) return "Transaction rejected.";
  if (/AlreadyLoggedToday/i.test(msg)) return "You've already logged today.";
  if (/NoFreezeAvailable/i.test(msg)) return "No freeze available.";
  if (/FreezeNotApplicable/i.test(msg)) return "A freeze can't be used right now.";
  if (/insufficient funds/i.test(msg)) return "Insufficient funds for gas on Base.";
  return msg.length > 160 ? msg.slice(0, 160) + "…" : msg;
}

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — StackD" }] }),
  component: Dashboard,
});

const ACCEPTED = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

function Dashboard() {
  const mounted = useMounted();
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const { profile, refetch } = useProfile(mounted && isConnected ? address : undefined);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<Category>("Other");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [freezing, setFreezing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadImage = useServerFn(uploadToPinata);
  const pinJson = useServerFn(pinJsonToPinata);

  useEffect(() => {
    if (!mounted) return;
    if (!isConnected || !address) {
      navigate({ to: "/" });
    }
  }, [mounted, isConnected, address, navigate]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!mounted || !profile || !address) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <div className="flex-1" />
        <Footer />
      </div>
    );
  }

  const todayLog = hasLoggedToday(profile);
  const overLimit = text.length > 280;
  const disabled = text.trim().length === 0 || overLimit || submitting;

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) {
      setError("Image must be JPG, PNG, GIF, or WEBP.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("Image must be 5MB or less.");
      return;
    }
    setFile(f);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async () => {
    if (disabled || !address) return;
    setError(null);
    setSubmitting(true);
    try {
      let imageHash: string | undefined;
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await uploadImage({ data: fd });
        imageHash = res.hash;
      }
      const pin = await pinJson({ data: { content: text.trim(), imageHash, category } });
      await submitLogBuild(pin.hash, category);
      await refetch();
      setText("");
      setCategory("Other");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const onActivateFreeze = async () => {
    if (!canActivateFreeze(profile) || freezing) return;
    setError(null);
    setFreezing(true);
    try {
      await submitActivateFreeze();
      await refetch();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setFreezing(false);
    }
  };

  const logs = [...profile.logs].sort((a, b) => b.createdAt - a.createdAt);
  const freezeReady = canActivateFreeze(profile);
  const freezeCountdown = daysUntilNextFreeze(profile);

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 sm:px-6 py-8 fade-in">
        <WeeklyDigest profile={profile} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="day streak" value={profile.currentStreak} color="text-[#22c55e]" />
          <StatCard label="longest streak" value={profile.longestStreak} />
          <StatCard label="total logs" value={profile.logs.filter((l) => !l.isFreeze).length} />
          <StatCard label="builder score" value={profile.builderScore} color="text-[#0052FF]" />
        </div>

        {/* Streak Freeze */}
        <div
          className="mt-4 rounded-md p-4 flex flex-wrap items-center justify-between gap-3"
          style={{ background: "var(--surface)", border: "1px solid rgba(0,82,255,0.4)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-md flex items-center justify-center"
              style={{ background: "rgba(0,82,255,0.1)", color: "#0052FF" }}
            >
              <Snowflake size={18} />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">Streak Freeze</div>
              <div className="text-xs text-muted-foreground">
                {profile.freezeAvailable
                  ? "1 available"
                  : freezeCountdown === 0
                    ? "0 available — earn one by extending your streak"
                    : `0 available — replenishes in ${freezeCountdown} day${freezeCountdown === 1 ? "" : "s"}`}
              </div>
            </div>
          </div>
          <button
            onClick={onActivateFreeze}
            disabled={!freezeReady || freezing}
            className="text-sm px-3 py-1.5 rounded-md font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#0052FF", color: "white" }}
          >
            {freezing ? "Freezing…" : "Activate Freeze"}
          </button>
        </div>

        <section className="mt-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Today's Log
          </h2>
          {todayLog ? (
            <div className="bg-surface border border-border rounded-md p-5">
              <div className="text-xs text-muted-foreground">
                {formatDate(todayLog.date)} ·{" "}
                {todayLog.isFreeze
                  ? "Streak preserved with a freeze. Come back tomorrow."
                  : "You've logged today. Come back tomorrow."}
              </div>
              {!todayLog.isFreeze && (
                <p className="mt-3 text-foreground whitespace-pre-wrap">{todayLog.content}</p>
              )}
              {todayLog.imageHash && <LogImage hash={todayLog.imageHash} />}
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-md p-5">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                placeholder="What did you build today?"
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none text-base"
              />

              {previewUrl && (
                <div className="mt-3 relative inline-block">
                  <img
                    src={previewUrl}
                    alt=""
                    className="rounded-md"
                    style={{ maxHeight: 200, maxWidth: "100%", objectFit: "cover" }}
                  />
                  <button
                    type="button"
                    onClick={removeFile}
                    aria-label="Remove image"
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(10,10,10,0.85)", color: "#f5f5f5" }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="mt-3">
                <CategoryPills value={category} onChange={setCategory} />
              </div>

              {error && <div className="mt-3 text-xs text-[#ef4444]">{error}</div>}

              <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Attach image"
                    className="w-9 h-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-[#1f1f1f] transition-colors"
                  >
                    <Paperclip size={16} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED.join(",")}
                    onChange={onFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={onSubmit}
                    disabled={disabled}
                    className="px-4 py-2 rounded-md bg-[#0052FF] text-white text-sm font-medium hover:bg-[#0047d9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Logging…" : "Log Today"}
                  </button>
                </div>
                <span
                  className={`text-xs font-mono ${
                    overLimit
                      ? "text-[#ef4444]"
                      : text.length > 250
                        ? "text-[#ef4444]/70"
                        : "text-muted-foreground"
                  }`}
                >
                  {text.length} / 280
                </span>
              </div>
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Build History
          </h2>
          {logs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Your builder journey starts today.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((l) => (
                <div key={l.id} className="bg-surface border border-border rounded-md p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs text-muted-foreground">{formatDate(l.date)}</span>
                    <div className="flex items-center gap-2">
                      <CategoryChip category={l.category} />
                      {l.isFreeze ? (
                        <span className="text-xs text-[#0052FF] border border-[#0052FF]/40 rounded-full px-2 py-0.5 inline-flex items-center gap-1">
                          <Snowflake size={10} /> Freeze
                        </span>
                      ) : (
                        <span className="text-xs text-[#22c55e] border border-[#22c55e]/30 rounded-full px-2 py-0.5">
                          Streak: {l.streak}
                        </span>
                      )}
                    </div>
                  </div>
                  {!l.isFreeze && (
                    <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">{l.content}</p>
                  )}
                  {l.imageHash && <LogImage hash={l.imageHash} />}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

function StatCard({
  label,
  value,
  color = "text-foreground",
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-md p-4">
      <div className={`text-2xl sm:text-3xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

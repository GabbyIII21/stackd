import { type Profile, logDateSet, todayUTC } from "@/lib/storage";
import { topEarnedAchievement } from "@/lib/achievements";

export async function downloadBuilderCard(profile: Profile) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, 1200, 630);

  // Subtle border
  ctx.strokeStyle = "#1f1f1f";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 1198, 628);

  // Wordmark top-left
  ctx.font = "700 36px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#f5f5f5";
  ctx.fillText("Stack", 60, 90);
  const stackW = ctx.measureText("Stack").width;
  ctx.fillStyle = "#0052FF";
  ctx.fillText("D", 60 + stackW, 90);

  // Address
  ctx.font = "500 22px ui-monospace, SFMono-Regular, monospace";
  ctx.fillStyle = "#888888";
  ctx.fillText(profile.address, 60, 140);

  // Streak (large)
  ctx.font = "700 110px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#f97316";
  // simple flame glyph fallback
  ctx.fillText("🔥", 60, 290);
  const flameW = ctx.measureText("🔥").width;
  ctx.fillStyle = "#f5f5f5";
  ctx.fillText(`${profile.currentStreak}`, 80 + flameW, 290);
  ctx.font = "500 22px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#888888";
  ctx.fillText("day streak", 60, 330);

  // Builder Score
  ctx.font = "700 80px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#0052FF";
  ctx.fillText(`${profile.builderScore}`, 60, 450);
  ctx.font = "500 22px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#888888";
  ctx.fillText("builder score", 60, 485);

  // Top achievement
  const top = topEarnedAchievement(profile);
  if (top) {
    ctx.font = "500 18px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#888888";
    ctx.fillText("Top achievement", 60, 545);
    ctx.font = "600 24px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#f5f5f5";
    ctx.fillText(top.name, 60, 575);
  }

  // Simplified 3-month heatmap, right side
  const dates = logDateSet(profile);
  const today = new Date();
  const startDays = 90;
  const start = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - startDays),
  );
  const startDow = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - startDow);

  const CELL = 18;
  const GAP = 5;
  const originX = 700;
  const originY = 120;
  const cursor = new Date(start);
  const todayStr = todayUTC();

  ctx.font = "500 18px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#888888";
  ctx.fillText("Last 90 days", originX, originY - 20);

  for (let w = 0; w < 14; w++) {
    for (let d = 0; d < 7; d++) {
      const dateStr = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}-${String(cursor.getUTCDate()).padStart(2, "0")}`;
      const has = dates.has(dateStr);
      const isToday = dateStr === todayStr;
      ctx.fillStyle = has ? "#22c55e" : "#1f1f1f";
      const x = originX + w * (CELL + GAP);
      const y = originY + d * (CELL + GAP);
      roundRect(ctx, x, y, CELL, CELL, 3);
      ctx.fill();
      if (isToday) {
        ctx.strokeStyle = "#0052FF";
        ctx.lineWidth = 2;
        roundRect(ctx, x, y, CELL, CELL, 3);
        ctx.stroke();
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  // tagline bottom-right
  ctx.font = "500 16px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#888888";
  const tag = "Build Something. Every Day.";
  const tw = ctx.measureText(tag).width;
  ctx.fillText(tag, 1200 - tw - 60, 590);

  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = `stackd-${profile.address.slice(0, 8)}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

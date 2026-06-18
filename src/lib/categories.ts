export const CATEGORIES = [
  "Design",
  "Smart Contract",
  "Frontend",
  "Backend",
  "DevOps",
  "Research",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

// Slightly different shades of #0052FF for the breakdown bar
export const CATEGORY_SHADES: Record<Category, string> = {
  Design: "#0052FF",
  "Smart Contract": "#1a63ff",
  Frontend: "#3375ff",
  Backend: "#4d86ff",
  DevOps: "#6698ff",
  Research: "#80a9ff",
  Other: "#99bbff",
};

export function isCategory(v: unknown): v is Category {
  return typeof v === "string" && (CATEGORIES as readonly string[]).includes(v);
}

export const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

// IPFS log payloads. The chain stores only a CID per log; the human-readable
// content + optional image hash live off-chain in a JSON object on IPFS.

import { IPFS_GATEWAY, type Category } from "./categories";

export type LogPayload = {
  content: string;
  imageHash?: string;
  // category is also stored on-chain (authoritative); kept here only for redundancy.
  category?: Category;
};

export function gatewayUrl(cid: string): string {
  return IPFS_GATEWAY + cid;
}

// Fetch and parse a log payload from the IPFS gateway. Tolerates older/plain-text
// pins by falling back to treating the raw body as the content.
export async function fetchLogPayload(cid: string): Promise<LogPayload> {
  if (!cid) return { content: "" };
  const res = await fetch(gatewayUrl(cid));
  if (!res.ok) throw new Error(`IPFS fetch failed for ${cid}: ${res.status}`);
  const text = await res.text();
  try {
    const json = JSON.parse(text) as LogPayload;
    return {
      content: typeof json.content === "string" ? json.content : "",
      imageHash: json.imageHash || undefined,
      category: json.category,
    };
  } catch {
    return { content: text };
  }
}

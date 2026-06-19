import { createServerFn } from "@tanstack/react-start";

export const uploadToPinata = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error("Expected FormData");
    return data;
  })
  .handler(async ({ data }) => {
    const jwt = process.env.PINATA_JWT;
    if (!jwt) {
      throw new Error("PINATA_JWT is not configured. Add it via project secrets.");
    }
    const file = data.get("file");
    if (!(file instanceof File)) throw new Error("No file provided");
    if (file.size > 5 * 1024 * 1024) throw new Error("File exceeds 5MB limit");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
      body: fd,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Pinata upload failed: ${res.status} ${text.slice(0, 200)}`);
    }
    const json = (await res.json()) as { IpfsHash: string };
    return { hash: json.IpfsHash };
  });

// Pins a JSON log payload ({ content, imageHash, category }) and returns its CID.
// This CID is what gets written on-chain via logBuild(cid, category).
export const pinJsonToPinata = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    if (typeof data !== "object" || data === null) throw new Error("Expected an object payload");
    const p = data as Record<string, unknown>;
    if (typeof p.content !== "string") throw new Error("Payload requires a string `content`");
    if (p.content.length > 280) throw new Error("Content exceeds 280 characters");
    return {
      content: p.content,
      imageHash: typeof p.imageHash === "string" ? p.imageHash : undefined,
      category: typeof p.category === "string" ? p.category : undefined,
    };
  })
  .handler(async ({ data }) => {
    const jwt = process.env.PINATA_JWT;
    if (!jwt) {
      throw new Error("PINATA_JWT is not configured. Add it via project secrets.");
    }
    const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pinataOptions: { cidVersion: 1 },
        pinataContent: data,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Pinata JSON pin failed: ${res.status} ${text.slice(0, 200)}`);
    }
    const json = (await res.json()) as { IpfsHash: string };
    return { hash: json.IpfsHash };
  });

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

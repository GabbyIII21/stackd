import { IPFS_GATEWAY } from "@/lib/categories";

export function LogImage({ hash }: { hash?: string }) {
  if (!hash) return null;
  return (
    <img
      src={`${IPFS_GATEWAY}${hash}`}
      alt=""
      loading="lazy"
      className="mt-3 w-full object-cover"
      style={{ borderRadius: 6, maxHeight: 320 }}
    />
  );
}

// Reactive reads from StackdRegistry + IPFS, assembled into the Profile/Log
// model the UI already understands.

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useReadContract, useReadContracts } from "wagmi";
import { REGISTRY_ADDRESS, REGISTRY_CHAIN, STACKD_REGISTRY_ABI } from "@/lib/contract";
import {
  buildProfile,
  mapChainLog,
  type ChainBuilder,
  type ChainLog,
  type Log,
  type Profile,
} from "@/lib/storage";
import { fetchLogPayload, type LogPayload } from "@/lib/ipfs";

const CONTRACT = {
  address: REGISTRY_ADDRESS,
  abi: STACKD_REGISTRY_ABI,
  chainId: REGISTRY_CHAIN.id,
} as const;

// getBuilder returns a 9-tuple in declaration order.
type BuilderTuple = readonly [
  number,
  number,
  number,
  number,
  boolean,
  boolean,
  bigint,
  number,
  bigint,
];

function toChainBuilder(t: BuilderTuple): ChainBuilder {
  return {
    currentStreak: t[0],
    longestStreak: t[1],
    totalLogs: t[2],
    lastDay: t[3],
    freezeAvailable: t[4],
    exists: t[5],
    firstLogAt: t[6],
    registrationIndex: t[7],
    score: t[8],
  };
}

type RawLog = {
  day: number;
  category: number;
  isFreeze: boolean;
  timestamp: bigint;
  streak: number;
  cid: string;
};

function toChainLog(l: RawLog): ChainLog {
  return {
    day: l.day,
    category: l.category,
    isFreeze: l.isFreeze,
    timestamp: l.timestamp,
    streak: l.streak,
    cid: l.cid,
  };
}

// Fetch all distinct CIDs in parallel into a { cid: payload } map. Payloads are
// immutable, so this is cached indefinitely.
function usePayloads(cids: string[]) {
  const key = [...new Set(cids)].sort();
  return useQuery({
    queryKey: ["log-payloads", key],
    enabled: key.length > 0,
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      const entries = await Promise.all(
        key.map(async (cid) => {
          try {
            return [cid, await fetchLogPayload(cid)] as const;
          } catch {
            return [cid, { content: "" } satisfies LogPayload] as const;
          }
        }),
      );
      return Object.fromEntries(entries) as Record<string, LogPayload>;
    },
  });
}

/** Full Profile for a single address (chain state + hydrated IPFS content). */
export function useProfile(address?: string): {
  profile: Profile | null;
  isLoading: boolean;
  refetch: () => void;
} {
  const enabled = !!address;
  const reads = useReadContract({
    ...CONTRACT,
    functionName: "getBuilder",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled },
  });
  const logsRead = useReadContract({
    ...CONTRACT,
    functionName: "getLogs",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled },
  });

  const chainLogs = useMemo(
    () => ((logsRead.data as RawLog[] | undefined) ?? []).map(toChainLog),
    [logsRead.data],
  );
  const cids = useMemo(
    () => chainLogs.filter((l) => !l.isFreeze && l.cid).map((l) => l.cid),
    [chainLogs],
  );
  const payloads = usePayloads(cids);

  const profile = useMemo(() => {
    if (!address) return null;
    if (!reads.data && reads.isLoading) return null;
    const builder = reads.data ? toChainBuilder(reads.data as BuilderTuple) : null;
    return buildProfile(address, builder, chainLogs, payloads.data ?? {});
  }, [address, reads.data, reads.isLoading, chainLogs, payloads.data]);

  return {
    profile,
    isLoading: reads.isLoading || logsRead.isLoading || payloads.isLoading,
    refetch: () => {
      reads.refetch();
      logsRead.refetch();
      payloads.refetch();
    },
  };
}

/** All registered builder addresses (paginated in one shot). */
function useBuilderAddresses() {
  const countRead = useReadContract({ ...CONTRACT, functionName: "getBuilderCount" });
  const count = Number((countRead.data as bigint | undefined) ?? 0n);
  const listRead = useReadContract({
    ...CONTRACT,
    functionName: "getBuildersPaged",
    args: [0n, BigInt(count)],
    query: { enabled: count > 0 },
  });
  const addresses = ((listRead.data as readonly `0x${string}`[] | undefined) ??
    []) as `0x${string}`[];
  return {
    addresses,
    count,
    isLoading: countRead.isLoading || (count > 0 && listRead.isLoading),
  };
}

export type LeaderRow = {
  address: string;
  builderScore: number;
  currentStreak: number;
  longestStreak: number;
  totalLogs: number;
};

/** Leaderboard rows — score/streak/log counts only, no IPFS needed. */
export function useLeaderboard(): { rows: LeaderRow[]; isLoading: boolean } {
  const { addresses, isLoading } = useBuilderAddresses();
  const buildersRead = useReadContracts({
    allowFailure: false,
    contracts: addresses.map((a) => ({
      ...CONTRACT,
      functionName: "getBuilder" as const,
      args: [a] as const,
    })),
    query: { enabled: addresses.length > 0 },
  });

  const rows = useMemo<LeaderRow[]>(() => {
    const data = buildersRead.data as BuilderTuple[] | undefined;
    if (!data) return [];
    return data
      .map((t, i) => {
        const b = toChainBuilder(t);
        return {
          address: addresses[i].toLowerCase(),
          builderScore: Number(b.score),
          currentStreak: b.currentStreak,
          longestStreak: b.longestStreak,
          totalLogs: b.totalLogs,
        };
      })
      .sort((a, b) => b.builderScore - a.builderScore);
  }, [buildersRead.data, addresses]);

  return { rows, isLoading: isLoading || (addresses.length > 0 && buildersRead.isLoading) };
}

export type FeedItem = Log & { address: string };

const FEED_LIMIT = 50;

/** Global build feed across all builders (most recent builds first). */
export function useExploreFeed(): { items: FeedItem[]; isLoading: boolean } {
  const { addresses, isLoading } = useBuilderAddresses();
  const logsRead = useReadContracts({
    allowFailure: false,
    contracts: addresses.map((a) => ({
      ...CONTRACT,
      functionName: "getLogs" as const,
      args: [a] as const,
    })),
    query: { enabled: addresses.length > 0 },
  });

  // Flatten non-freeze logs across builders, newest first, capped.
  const recent = useMemo(() => {
    const data = logsRead.data as RawLog[][] | undefined;
    if (!data) return [];
    const flat: { address: string; log: ChainLog }[] = [];
    data.forEach((logs, i) => {
      const addr = addresses[i].toLowerCase();
      for (const raw of logs) {
        if (raw.isFreeze) continue;
        flat.push({ address: addr, log: toChainLog(raw) });
      }
    });
    flat.sort((a, b) => Number(b.log.timestamp - a.log.timestamp));
    return flat.slice(0, FEED_LIMIT);
  }, [logsRead.data, addresses]);

  const cids = useMemo(() => recent.map((r) => r.log.cid).filter(Boolean), [recent]);
  const payloads = usePayloads(cids);

  const items = useMemo<FeedItem[]>(
    () =>
      recent.map((r) => ({
        ...mapChainLog(r.log, r.log.cid ? payloads.data?.[r.log.cid] : undefined),
        address: r.address,
      })),
    [recent, payloads.data],
  );

  return {
    items,
    isLoading: isLoading || (addresses.length > 0 && logsRead.isLoading) || payloads.isLoading,
  };
}

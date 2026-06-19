// Imperative StackdRegistry writes. These run a submit sequence (optional chain
// switch → writeContract → wait for receipt) using @wagmi/core actions against
// the shared wagmiConfig, so callers can await a confirmed transaction.

import { getChainId, switchChain, waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { wagmiConfig } from "./wagmi";
import { REGISTRY_ADDRESS, REGISTRY_CHAIN, STACKD_REGISTRY_ABI } from "./contract";
import { CATEGORIES, type Category } from "./categories";

async function ensureChain() {
  if (getChainId(wagmiConfig) !== REGISTRY_CHAIN.id) {
    await switchChain(wagmiConfig, { chainId: REGISTRY_CHAIN.id });
  }
}

export function categoryToIndex(category: Category): number {
  const i = CATEGORIES.indexOf(category);
  return i < 0 ? CATEGORIES.indexOf("Other") : i;
}

export async function submitLogBuild(cid: string, category: Category): Promise<`0x${string}`> {
  await ensureChain();
  const hash = await writeContract(wagmiConfig, {
    address: REGISTRY_ADDRESS,
    abi: STACKD_REGISTRY_ABI,
    functionName: "logBuild",
    args: [cid, categoryToIndex(category)],
    chainId: REGISTRY_CHAIN.id,
  });
  await waitForTransactionReceipt(wagmiConfig, { hash, chainId: REGISTRY_CHAIN.id });
  return hash;
}

export async function submitActivateFreeze(): Promise<`0x${string}`> {
  await ensureChain();
  const hash = await writeContract(wagmiConfig, {
    address: REGISTRY_ADDRESS,
    abi: STACKD_REGISTRY_ABI,
    functionName: "activateFreeze",
    args: [],
    chainId: REGISTRY_CHAIN.id,
  });
  await waitForTransactionReceipt(wagmiConfig, { hash, chainId: REGISTRY_CHAIN.id });
  return hash;
}

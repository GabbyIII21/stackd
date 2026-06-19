import { useAccount } from "wagmi";
import { useMounted } from "@/hooks/use-mounted";
import { useProfile } from "@/hooks/use-registry";

// Live on-chain profile for the connected account.
export function useLiveProfile() {
  const mounted = useMounted();
  const { address } = useAccount();
  const { profile, isLoading, refetch } = useProfile(mounted ? address : undefined);
  return { profile, isLoading, refetch };
}

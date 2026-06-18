import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useMounted } from "@/hooks/use-mounted";
import { getLiveProfile } from "@/lib/storage";

export function useLiveProfile() {
  const mounted = useMounted();
  const { address } = useAccount();
  const [tick, setTick] = useState(0);

  const profile = mounted && address ? getLiveProfile(address) : null;

  useEffect(() => {
    if (!mounted) return;
    const onStorage = () => setTick((t) => t + 1);
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [mounted]);

  return { profile, refresh: () => setTick((t) => t + 1), tick };
}

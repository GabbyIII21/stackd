import { type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { baseSepolia } from "wagmi/chains";
import { wagmiConfig } from "./wagmi";

export function Web3Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <OnchainKitProvider chain={baseSepolia}>{children}</OnchainKitProvider>
    </WagmiProvider>
  );
}

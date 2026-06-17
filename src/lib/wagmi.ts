import { http, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [baseSepolia, base],
  connectors: [
    coinbaseWallet({ appName: "StackD", preference: "all" }),
    injected({ shimDisconnect: true }),
    walletConnect({
      projectId: "3fcc6bba6f1de962d911bb5b5c3dba68",
      showQrModal: true,
    }),
  ],
  ssr: true,
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
});

import { http, createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { injected, metaMask, safe, walletConnect } from "wagmi/connectors";
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient();

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(),
    // walletConnect({ projectId: "0bb6cd65964970ea8ff4496e0700e34f" }),
    metaMask(),
    // safe(),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

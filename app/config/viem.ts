import { createPublicClient, http } from "viem";
import { CHAIN } from "./zerodev";

export const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http("https://sepolia.base.org"),
});

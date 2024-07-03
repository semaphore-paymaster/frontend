import { createPublicClient, http } from "viem";
import { publicActionsL1 } from "viem/zksync";
import { BUNDLER_URL } from "./zerodev";

export const publicClient = createPublicClient({
  transport: http(BUNDLER_URL),
}).extend(publicActionsL1());

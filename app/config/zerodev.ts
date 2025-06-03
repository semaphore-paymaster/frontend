import { sepolia, baseSepolia } from "viem/chains";

// Ensure environment variables are defined, with fallbacks or errors if not present in a real app
const projectId = process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID;
const chainId = process.env.NEXT_PUBLIC_ZERODEV_CHAIN_ID;

if (!projectId) {
  console.warn(
    "NEXT_PUBLIC_ZERODEV_PROJECT_ID is not set. Using default (unsafe) or functionality may be limited."
  );
  // Potentially throw an error in production if this is critical
  // throw new Error("Missing NEXT_PUBLIC_ZERODEV_PROJECT_ID environment variable");
}

if (!chainId) {
  console.warn(
    "NEXT_PUBLIC_ZERODEV_CHAIN_ID is not set. Using default (unsafe) or functionality may be limited."
  );
  // Potentially throw an error in production if this is critical
  // throw new Error("Missing NEXT_PUBLIC_ZERODEV_CHAIN_ID environment variable");
}

export const CHAIN = baseSepolia; // This might also need to be configured via env var if it changes

export const BUNDLER_URL = projectId && chainId
  ? `https://rpc.zerodev.app/api/v3/${projectId}/chain/${chainId}`
  : "https://rpc.zerodev.app/api/v3/DEFAULT_PROJECT_ID_FALLBACK/chain/DEFAULT_CHAIN_ID_FALLBACK"; // Fallback or error

export const PAYMASTER_URL = projectId && chainId
  ? `https://rpc.zerodev.app/api/v3/${projectId}/chain/${chainId}`
  : "https://rpc.zerodev.app/api/v3/DEFAULT_PROJECT_ID_FALLBACK/chain/DEFAULT_CHAIN_ID_FALLBACK"; // Fallback or error

export const PASSKEY_SERVER_URL = projectId
  ? `https://passkeys.zerodev.app/api/v3/${projectId}`
  : "https://passkeys.zerodev.app/api/v3/DEFAULT_PROJECT_ID_FALLBACK"; // Fallback or error
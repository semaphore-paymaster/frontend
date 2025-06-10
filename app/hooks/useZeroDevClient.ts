import { useState, useRef, useCallback } from "react";
import {
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
} from "@zerodev/sdk";
import { toPermissionValidator } from "@zerodev/permissions";
import { toECDSASigner } from "@zerodev/permissions/signers";
import { toSudoPolicy } from "@zerodev/permissions/policies";
import { KERNEL_V3_1 } from "@zerodev/sdk/constants";
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { http } from "viem";
import {
  BUNDLER_URL,
  CHAIN,
  PAYMASTER_URL,
} from "../config/zerodev";
import { publicClient } from "../config/viem";
import type { InferredPasskeyValidator } from "./useSmartAccount";

const sessionPrivateKey = generatePrivateKey();
const sessionKeySigner = privateKeyToAccount(sessionPrivateKey);

export const useZeroDevClient = () => {
  const zeroDevKernelClientRef = useRef<any>(null);
  const zeroDevSessionKeyAccountRef = useRef<any>(null);
  
  const [isZeroDevClientReady, setIsZeroDevClientReady] = useState<boolean>(false);

  const createZeroDevClient = useCallback(async (passkeyValidator: InferredPasskeyValidator) => {
    console.log("[useZeroDevClient] Creating ZeroDev-sponsored kernel client");
    
    try {
    
    const ecdsaSigner = await toECDSASigner({
      signer: sessionKeySigner,
    });

    const sudoPolicy = await toSudoPolicy({});

    const permissionValidator = await toPermissionValidator(publicClient, {
      signer: ecdsaSigner,
      kernelVersion: KERNEL_V3_1,
      policies: [sudoPolicy],
      entryPoint: ENTRYPOINT_ADDRESS_V07,
    });

    zeroDevSessionKeyAccountRef.current = await createKernelAccount(publicClient, {
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      kernelVersion: KERNEL_V3_1,
      plugins: {
        sudo: passkeyValidator,
        regular: permissionValidator,
      },
    });

    const zeroDevPaymaster = createZeroDevPaymasterClient({
      chain: CHAIN,
      transport: http(PAYMASTER_URL),
      entryPoint: ENTRYPOINT_ADDRESS_V07,
    });

    zeroDevKernelClientRef.current = createKernelAccountClient({
      account: zeroDevSessionKeyAccountRef.current,
      chain: CHAIN,
      bundlerTransport: http(BUNDLER_URL),
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      middleware: {
        sponsorUserOperation: zeroDevPaymaster.sponsorUserOperation,
      },
    });
    
    console.log("[useZeroDevClient] Using ZeroDev paymaster directly");

    if (zeroDevKernelClientRef.current && zeroDevSessionKeyAccountRef.current) {
      setIsZeroDevClientReady(true);
      console.log("[useZeroDevClient] ZeroDev kernel client created successfully");
      console.log("[useZeroDevClient] Account address:", zeroDevSessionKeyAccountRef.current.address);
      console.log("[useZeroDevClient] Client middleware:", zeroDevKernelClientRef.current.middleware);
    } else {
      console.error("[useZeroDevClient] Failed to create ZeroDev kernel client");
    }
    
    } catch (error) {
      console.error("[useZeroDevClient] Error creating ZeroDev client:", error);
      setIsZeroDevClientReady(false);
    }
  }, []);

  return {
    zeroDevKernelClientRef,
    zeroDevSessionKeyAccountRef,
    isZeroDevClientReady,
    createZeroDevClient,
  };
};
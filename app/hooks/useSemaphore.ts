import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { bundlerActions, ENTRYPOINT_ADDRESS_V07 } from 'permissionless';
import type { KernelAccountClient } from '@zerodev/sdk';
import { encodeFunctionData, type Address, type Abi } from 'viem';
import { Identity } from "@semaphore-protocol/identity";
import { CHAIN } from "../config/zerodev";
import { SEMAPHORE_PAYMASTER_ABI } from "../config/semaphore";



interface UseSemaphoreProps {
  kernelClientRef: React.RefObject<KernelAccountClient<typeof ENTRYPOINT_ADDRESS_V07> | null>;
  groupId: string | number | bigint;
  semaphorePaymasterAddress: Address;
  buildSuccessMessage: (message: string, opHashLink?: string) => React.ReactNode;
  setUserOpHash?: (hash: string) => void;
  setUserOpCount?: (countUpdater: (prev: number) => number) => void;
}

export const useSemaphore = ({
  kernelClientRef,
  groupId,
  semaphorePaymasterAddress,
  buildSuccessMessage,
  setUserOpHash,
  setUserOpCount,
}: UseSemaphoreProps) => {
  const [isJoiningSemahoreGroup, setIsJoiningSemaphoreGroup] = useState(false);
  const [isSemaphoreGroupAssigned, setIsSemaphoreGroupAssigned] = useState(false);
  const [semaphoreGroupIdentity, setSemaphoreGroupIdentity] = useState<Identity | null>(null);
  const [semaphorePrivateKey, setSemaphorePrivateKey] = useState<string | Uint8Array | Buffer | undefined>();
  const [semaphorePublicKey, setSemaphorePublicKey] = useState<string | Uint8Array | Buffer | undefined>(); 

  const joinSemaphoreGroup = useCallback(async () => {
    const kernelClient = kernelClientRef.current;
    if (!kernelClient || !kernelClient.account) { 
      console.error("[useSemaphore/join] kernelClient or kernelClient.account is UNDEFINED. Cannot proceed.");
      toast.error("Kernel client or account not available for joining group.");
      setIsJoiningSemaphoreGroup(false); 
      return;
    }

    setIsJoiningSemaphoreGroup(true);
    try {
      const identity = new Identity();
      const { privateKey, publicKey, commitment } = identity;

      const sentUserOpHash = await kernelClient.sendUserOperation({
        account: kernelClient.account,
        userOperation: {
          callData: await kernelClient.account.encodeCallData({
            to: semaphorePaymasterAddress,
            value: BigInt(0),
            data: encodeFunctionData({
              abi: SEMAPHORE_PAYMASTER_ABI,
              functionName: "addMember",
              args: [BigInt(groupId), commitment],
            }),
          }),
        },
      } as any);

      setSemaphorePrivateKey(privateKey as string);
      setSemaphorePublicKey(publicKey.toString());
      if (setUserOpHash) setUserOpHash(sentUserOpHash);

      const localJoinBundlerClient = kernelClient.extend(bundlerActions(ENTRYPOINT_ADDRESS_V07)) as any;
      if (!localJoinBundlerClient) {
          console.error("[useSemaphore/join] localJoinBundlerClient is UNDEFINED after attempting init.");
          toast.error("Bundler client not available. Cannot confirm transaction.");
          setIsJoiningSemaphoreGroup(false);
          return;
      }

      if (setUserOpCount) setUserOpCount(prev => prev + 1);

      const networkSlug = CHAIN.name.toLowerCase();
      const opHashLink = `https://jiffyscan.xyz/userOpHash/${sentUserOpHash}?network=${networkSlug}`;
      const successMessageNode = buildSuccessMessage("Transaction submitted! You are joining the group 😎", opHashLink) ;
      toast(successMessageNode);

      console.log("[useSemaphore/join] Waiting for UserOp receipt with hash:", sentUserOpHash);
      try {
        await localJoinBundlerClient.waitForUserOperationReceipt({ 
          hash: sentUserOpHash,
          timeout: 60000,
        });
        console.log("[useSemaphore/join] Transaction confirmed successfully!");
      } catch (receiptError) {
        console.warn("[useSemaphore/join] Receipt timeout, but transaction was submitted:", receiptError);
      }

      setIsSemaphoreGroupAssigned(true);
      setSemaphoreGroupIdentity(identity);
    } catch (error: unknown) {
        console.error("Error during joinSemaphoreGroup (in hook):", error);
        let errorMessage = "Failed to join Semaphore group.";
        if (error instanceof Error) { errorMessage = error.message; }
        toast.error(errorMessage);
        setIsSemaphoreGroupAssigned(false); 
        setSemaphoreGroupIdentity(null);
    } finally {
        setIsJoiningSemaphoreGroup(false);
    }
  }, [
    kernelClientRef, 
    groupId, 
    semaphorePaymasterAddress,
    buildSuccessMessage,
    setUserOpHash,
    setUserOpCount,
  ]);

  return {
    isJoiningSemahoreGroup,
    isSemaphoreGroupAssigned,
    semaphoreGroupIdentity,
    semaphorePrivateKey, 
    semaphorePublicKey,  
    joinSemaphoreGroup,
  };
}; 
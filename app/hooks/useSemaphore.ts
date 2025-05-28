import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { bundlerActions, ENTRYPOINT_ADDRESS_V07 } from 'permissionless';
import type { KernelAccountClient } from '@zerodev/sdk';
import { encodeFunctionData, type Address, type Abi } from 'viem';
import { Identity } from "@semaphore-protocol/identity";
import { CHAIN } from "../config/zerodev";
import { SEMAPHORE_PAYMASTER_ABI } from "../config/semaphore";
import { publicClient } from "../config/viem";



interface UseSemaphoreProps {
  accountAddress: string;
  groupId: string | number | bigint;
  semaphorePaymasterAddress: Address;
}

export const useSemaphore = ({
  accountAddress,
  groupId,
  semaphorePaymasterAddress,
}: UseSemaphoreProps) => {
  const [isCheckingMembership, setIsCheckingMembership] = useState(false);
  const [isMemberOfGroup, setIsMemberOfGroup] = useState<boolean | null>(null);

  const checkGroupMembership = useCallback(async () => {
    if (!accountAddress || !semaphorePaymasterAddress) {
      return;
    }

    setIsCheckingMembership(true);
    try {
      console.log("[useSemaphore] Checking membership for account:", accountAddress);
      
      // Generate the identity commitment for this account address
      // This is deterministic - same address always generates same identity commitment
      // Using the same logic as generate-commitment.js
      const id = new Identity(accountAddress);
      const identityCommitment = id.commitment;
      
      console.log("[useSemaphore] Generated identity commitment:", identityCommitment.toString());
      
      // Check if this identity commitment is a member of the group
      const isMember = await publicClient.readContract({
        address: semaphorePaymasterAddress,
        abi: SEMAPHORE_PAYMASTER_ABI,
        functionName: 'hasMember',
        args: [BigInt(groupId), identityCommitment],
      }) as boolean;

      // Also get group size for informational purposes
      const groupSize = await publicClient.readContract({
        address: semaphorePaymasterAddress,
        abi: SEMAPHORE_PAYMASTER_ABI,
        functionName: 'getMerkleTreeSize',
        args: [BigInt(groupId)],
      }) as bigint;

      console.log("[useSemaphore] Group", groupId, "has", groupSize.toString(), "members");
      console.log("[useSemaphore] Is member:", isMember);
      
      setIsMemberOfGroup(isMember);
      
      if (isMember) {
        toast.success(`✅ You are a member of group ${groupId}!`);
      } else {
        toast.info(`You are not currently a member of group ${groupId}.`);
      }
      
    } catch (error) {
      console.error("[useSemaphore] Error checking membership:", error);
      toast.error("Failed to check group membership");
      setIsMemberOfGroup(null);
    } finally {
      setIsCheckingMembership(false);
    }
  }, [accountAddress, groupId, semaphorePaymasterAddress]);

  return {
    isCheckingMembership,
    isMemberOfGroup,
    checkGroupMembership,
  };
}; 
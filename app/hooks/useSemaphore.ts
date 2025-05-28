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
      console.error("[useSemaphore] Missing required parameters:", {
        accountAddress,
        semaphorePaymasterAddress
      });
      return;
    }

    // Validate paymaster address format
    if (semaphorePaymasterAddress === "0x" || semaphorePaymasterAddress.length !== 42) {
      console.error("[useSemaphore] Invalid paymaster address:", semaphorePaymasterAddress);
      toast.error("Invalid paymaster contract address. Please check environment variables.");
      setIsMemberOfGroup(null);
      return;
    }

    setIsCheckingMembership(true);
    try {
      console.log("[useSemaphore] Starting membership check with params:", {
        accountAddress,
        groupId: groupId.toString(),
        semaphorePaymasterAddress,
        chainId: CHAIN.id
      });
      
      // Generate the identity commitment for this account address
      // This is deterministic - same address always generates same identity commitment
      // Using the same logic as generate-commitment.js
      const id = new Identity(accountAddress);
      const identityCommitment = id.commitment;
      
      console.log("[useSemaphore] Generated identity commitment:", identityCommitment.toString());
      
      // First, check if the group exists by getting its size
      let groupSize: bigint;
      try {
        groupSize = await publicClient.readContract({
          address: semaphorePaymasterAddress,
          abi: SEMAPHORE_PAYMASTER_ABI,
          functionName: 'getMerkleTreeSize',
          args: [BigInt(groupId)],
        }) as bigint;
        console.log("[useSemaphore] Group", groupId, "has", groupSize.toString(), "members");
      } catch (error) {
        console.error("[useSemaphore] Error getting group size:", error);
        throw new Error(`Failed to get group ${groupId} size. Group might not exist.`);
      }

      // Check if group has any members
      if (groupSize === BigInt(0)) {
        console.warn("[useSemaphore] Group", groupId, "has no members");
        setIsMemberOfGroup(false);
        toast.info(`Group ${groupId} exists but has no members yet.`);
        return;
      }

      // Check if this identity commitment is a member of the group
      let isMember: boolean;
      try {
        isMember = await publicClient.readContract({
          address: semaphorePaymasterAddress,
          abi: SEMAPHORE_PAYMASTER_ABI,
          functionName: 'hasMember',
          args: [BigInt(groupId), identityCommitment],
        }) as boolean;
        console.log("[useSemaphore] hasMember result:", isMember);
      } catch (error) {
        console.error("[useSemaphore] Error checking membership:", error);
        throw new Error("Failed to check group membership. Contract call failed.");
      }

      // If not a member, let's also check what members exist in the group
      if (!isMember) {
        try {
          console.log("[useSemaphore] User is not a member. Fetching existing members for debugging...");
          
          // Get all MemberAdded events for this group
          const memberAddedEvents = await publicClient.getLogs({
            address: semaphorePaymasterAddress,
            event: {
              type: 'event',
              name: 'MemberAdded',
              inputs: [
                { name: 'groupId', type: 'uint256', indexed: true },
                { name: 'index', type: 'uint256', indexed: false },
                { name: 'identityCommitment', type: 'uint256', indexed: false },
                { name: 'merkleTreeRoot', type: 'uint256', indexed: false }
              ]
            },
            args: {
              groupId: BigInt(groupId)
            },
            fromBlock: 'earliest',
            toBlock: 'latest'
          });
          
          console.log("[useSemaphore] Found", memberAddedEvents.length, "member events");
          
          const existingMembers = memberAddedEvents.map(event => ({
            index: Number(event.args.index),
            commitment: (event.args.identityCommitment as bigint).toString()
          }));
          
          console.log("[useSemaphore] Existing members:", existingMembers);
          console.log("[useSemaphore] Looking for commitment:", identityCommitment.toString());
          
          // Check if our commitment matches any existing member
          const matchingMember = existingMembers.find(member => 
            member.commitment === identityCommitment.toString()
          );
          
          if (matchingMember) {
            console.warn("[useSemaphore] INCONSISTENCY: Found matching commitment in events but hasMember returned false!");
            console.warn("[useSemaphore] Matching member:", matchingMember);
          }
          
        } catch (eventError) {
          console.error("[useSemaphore] Error fetching member events:", eventError);
        }
      }
      
      setIsMemberOfGroup(isMember);
      
      if (isMember) {
        toast.success(`✅ You are a member of group ${groupId}!`);
      } else {
        toast.info(`❌ You are not currently a member of group ${groupId}.`);
        console.log("[useSemaphore] To add this address to the group, use:");
        console.log(`addMember(${groupId}, ${identityCommitment.toString()})`);
      }
      
    } catch (error) {
      console.error("[useSemaphore] Error checking membership:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to check group membership: ${errorMessage}`);
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
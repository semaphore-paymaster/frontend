"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { encodeFunctionData, encodeAbiParameters } from "viem";
import { bundlerActions, ENTRYPOINT_ADDRESS_V07 } from 'permissionless';
import { toast } from 'react-toastify';
import { publicClient } from "../config/viem";
import { Identity } from "@semaphore-protocol/identity";
import { Group } from "@semaphore-protocol/group";
import { generateProof } from "@semaphore-protocol/proof";
import type { SemaphoreProof } from "@semaphore-protocol/proof";

import { GROUP_ID } from "../utils/constants";
import { SEMAPHORE_PAYMASTER_ABI } from "../config/semaphore";
import { VOTING_CONTRACT_ABI, VOTING_CONTRACT_ADDRESS, VOTE_CHOICES } from "../config/voting";

import Button from "./Button";
import VotingOptions from "./VotingOptions";

interface VotingComponentProps {
  accountAddress: string;
  kernelClientRef: React.MutableRefObject<any>;
  semaphoreProofRef: React.MutableRefObject<SemaphoreProof | null>;
  isMemberOfGroup: boolean | null;
  isKernelClientReady: boolean;
}

export default function VotingComponent({
  accountAddress,
  kernelClientRef,
  semaphoreProofRef,
  isMemberOfGroup,
  isKernelClientReady
}: VotingComponentProps) {
  // Voting state
  const [isVoting, setIsVoting] = useState(false);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [isFirstOptionSelected, setIsFirstOptionSelected] = useState(true);
  const [votingPercentage, setVotingPercentage] = useState(5);
  const [voteCounts, setVoteCounts] = useState({ votesA: BigInt(0), votesB: BigInt(0) });

  const semaphorePaymasterContractAddress = process.env.NEXT_PUBLIC_PAYMASTER_CONTRACT as `0x${string}` | undefined;

  // Fetch current vote counts
  const fetchVoteCounts = useCallback(async () => {
    try {
      const [votesA, votesB] = await Promise.all([
        publicClient.readContract({
          address: VOTING_CONTRACT_ADDRESS,
          abi: VOTING_CONTRACT_ABI,
          functionName: 'votesA',
        }) as Promise<bigint>,
        publicClient.readContract({
          address: VOTING_CONTRACT_ADDRESS,
          abi: VOTING_CONTRACT_ABI,
          functionName: 'votesB',
        }) as Promise<bigint>
      ]);

      setVoteCounts({ votesA, votesB });
      console.log("[VotingComponent] Current votes - A:", votesA.toString(), "B:", votesB.toString());
    } catch (error) {
      console.error("[VotingComponent] Error fetching vote counts:", error);
    }
  }, []);

  // Fetch vote counts when component loads
  useEffect(() => {
    fetchVoteCounts();
  }, [fetchVoteCounts]);

  // Submit vote function
  const submitVote = async () => {
    if (!kernelClientRef.current || !accountAddress || !semaphorePaymasterContractAddress) {
      toast.error("Wallet not connected or paymaster not configured");
      return;
    }

    const kernelClient = kernelClientRef.current;
    setIsVoting(true);
    setVotingPercentage(10);

    try {
      console.log("[VotingComponent] Starting vote submission for choice:", isFirstOptionSelected ? 'A' : 'B');
      
      // Determine vote choice (A = 0, B = 1)
      const choice = isFirstOptionSelected ? VOTE_CHOICES.A : VOTE_CHOICES.B;
      
      // Generate Semaphore proof for voting
      setVotingPercentage(20);
      console.log("[VotingComponent] Generating Semaphore proof for voting...");
      
      // Create identity from account address (same as in useSemaphore)
      const identity = new Identity(accountAddress);
      
      // First, verify membership using the same method as useSemaphore hook
      const isMember = await publicClient.readContract({
        address: semaphorePaymasterContractAddress,
        abi: SEMAPHORE_PAYMASTER_ABI,
        functionName: 'hasMember',
        args: [BigInt(GROUP_ID), identity.commitment],
      }) as boolean;

      if (!isMember) {
        throw new Error("You are not a member of this group. Please ensure you have been added to the group before voting.");
      }

      console.log("[VotingComponent] Identity verified as group member");

      // Get group members by listening to MemberAdded events
      console.log("[VotingComponent] Fetching group members from events...");
      
      const memberAddedEvents = await publicClient.getLogs({
        address: semaphorePaymasterContractAddress,
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
          groupId: BigInt(GROUP_ID)
        },
        fromBlock: 'earliest',
        toBlock: 'latest'
      });
      
      console.log("[VotingComponent] Found", memberAddedEvents.length, "member events");
      
      // Extract identity commitments and sort by index
      const members = memberAddedEvents
        .map(event => ({
          index: Number(event.args.index),
          commitment: event.args.identityCommitment as bigint
        }))
        .sort((a, b) => a.index - b.index)
        .map(member => member.commitment);
      
      console.log("[VotingComponent] Group members:", members.map(m => m.toString()));
      
      // Create group with actual on-chain members (same as in tests)
      const group = new Group(members);
      
      // Generate message (account address as BigInt)
      const message = BigInt(accountAddress);
      
      // Generate the Semaphore proof against the actual on-chain group
      const proof = await generateProof(identity, group, message, Number(GROUP_ID));
      
      console.log("[VotingComponent] Generated Semaphore proof:", proof);
      
      // Set the proof in the ref so the middleware can detect it
      semaphoreProofRef.current = proof;
      
      // Let's verify the proof locally before sending it
      try {
        const isValidProof = await publicClient.readContract({
          address: semaphorePaymasterContractAddress,
          abi: SEMAPHORE_PAYMASTER_ABI,
          functionName: 'verifyProof',
          args: [BigInt(GROUP_ID), {
            merkleTreeDepth: BigInt(proof.merkleTreeDepth),
            merkleTreeRoot: proof.merkleTreeRoot,
            nullifier: proof.nullifier,
            message: proof.message,
            scope: proof.scope,
            points: proof.points
          }],
        }) as boolean;
        
        console.log("[VotingComponent] Local proof verification result:", isValidProof);
        
        if (!isValidProof) {
          throw new Error("Proof verification failed locally. The proof is invalid.");
        }
        
        console.log("[VotingComponent] Proof nullifier:", proof.nullifier.toString());
      } catch (error) {
        console.error("[VotingComponent] Error verifying proof locally:", error);
      }
      
      // Check group balance in paymaster
      const groupBalance = await publicClient.readContract({
        address: semaphorePaymasterContractAddress,
        abi: SEMAPHORE_PAYMASTER_ABI,
        functionName: 'groupDeposits',
        args: [BigInt(GROUP_ID)],
      }) as bigint;
      
      // Check paymaster balance in EntryPoint
      const paymasterBalance = await publicClient.readContract({
        address: semaphorePaymasterContractAddress,
        abi: SEMAPHORE_PAYMASTER_ABI,
        functionName: 'getDeposit',
        args: [],
      }) as bigint;
      
      console.log("[VotingComponent] Group", GROUP_ID, "balance in paymaster:", groupBalance.toString(), "wei");
      console.log("[VotingComponent] Paymaster balance in EntryPoint:", paymasterBalance.toString(), "wei");
      console.log("[VotingComponent] Paymaster balance in ETH:", (Number(paymasterBalance) / 1e18).toFixed(4), "ETH");
      
      // Check if paymaster has sufficient funds for this transaction
      const estimatedGasCost = BigInt(1200000) * BigInt(200000000000); // ~1.2M gas * 200 gwei = rough estimate
      console.log("[VotingComponent] Estimated transaction cost:", estimatedGasCost.toString(), "wei");
      console.log("[VotingComponent] Estimated cost in ETH:", (Number(estimatedGasCost) / 1e18).toFixed(4), "ETH");
      
      // Check if group has sufficient funds
      if (groupBalance === BigInt(0)) {
        throw new Error(`Group ${GROUP_ID} has no funds deposited in the paymaster. Please deposit funds using the depositForGroup function first.`);
      }
      
      // Warn if paymaster balance might be too low for transaction
      if (paymasterBalance < estimatedGasCost) {
        console.warn(`[VotingComponent] WARNING: Paymaster balance (${(Number(paymasterBalance) / 1e18).toFixed(4)} ETH) might be insufficient for estimated cost (${(Number(estimatedGasCost) / 1e18).toFixed(4)} ETH)`);
      }
      
      // Check EntryPoint balance directly (more accurate)
      try {
        const entryPointBalance = await publicClient.readContract({
          address: ENTRYPOINT_ADDRESS_V07,
          abi: [
            {
              inputs: [{ name: "account", type: "address" }],
              name: "balanceOf",
              outputs: [{ name: "", type: "uint256" }],
              stateMutability: "view",
              type: "function"
            }
          ],
          functionName: 'balanceOf',
          args: [semaphorePaymasterContractAddress],
        }) as bigint;
        
        console.log("[VotingComponent] EntryPoint balance for paymaster:", entryPointBalance.toString(), "wei");
        console.log("[VotingComponent] EntryPoint balance in ETH:", (Number(entryPointBalance) / 1e18).toFixed(4), "ETH");
        
        if (entryPointBalance !== paymasterBalance) {
          console.warn("[VotingComponent] DISCREPANCY: getDeposit() and EntryPoint.balanceOf() show different values!");
        }
      } catch (error) {
        console.error("[VotingComponent] Error checking EntryPoint balance:", error);
      }
      
      // Encode the vote function call
      setVotingPercentage(40);
      const callData = encodeFunctionData({
        abi: VOTING_CONTRACT_ABI,
        functionName: 'vote',
        args: [BigInt(choice)]
      });

      console.log("[VotingComponent] Encoded call data:", callData);

      // Send transaction with Semaphore paymaster
      setVotingPercentage(60);
      
      console.log("[VotingComponent] Sending vote transaction with Semaphore paymaster...");
      
      // Send the transaction using kernel client (middleware will handle Semaphore paymaster)
      const userOpHash = await kernelClient.sendUserOperation({
        account: kernelClient.account,
        userOperation: {
          callData: await kernelClient.account.encodeCallData({
            to: VOTING_CONTRACT_ADDRESS,
            value: BigInt(0),
            data: callData,
          }),
        },
      });
      console.log("[VotingComponent] User operation hash:", userOpHash);
      
      // Wait for transaction confirmation using kernel client
      setVotingPercentage(80);
      
      const bundlerClient = kernelClient.extend(bundlerActions(ENTRYPOINT_ADDRESS_V07)) as any;
      const receipt = await bundlerClient.waitForUserOperationReceipt({ 
        hash: userOpHash,
        timeout: 60000,
      });
      
      console.log("[VotingComponent] Transaction receipt:", receipt);

      setVotingPercentage(100);
      
      if (receipt.success) {
        console.log("[VotingComponent] Vote successful:", receipt);
        setUserHasVoted(true);
        await fetchVoteCounts(); // Refresh vote counts
        
        const choiceName = isFirstOptionSelected ? 'A' : 'B';
        toast.success(`✅ Vote for option ${choiceName} submitted successfully!`);
        
        // Build success message with transaction link
        const explorerUrl = `https://sepolia.basescan.org/tx/${receipt.receipt.transactionHash}`;
        toast.success(`Vote confirmed on blockchain! View at: ${explorerUrl}`);
      } else {
        throw new Error("Transaction failed");
      }
      
    } catch (error) {
      console.error("[VotingComponent] Error submitting vote:", error);
      toast.error(`Failed to submit vote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Clear the semaphore proof ref
      semaphoreProofRef.current = null;
      setIsVoting(false);
      setVotingPercentage(0);
    }
  };

  if (!isMemberOfGroup) {
    return null; // Don't render if not a member
  }

  return (
    <div className="space-y-4">
      {!userHasVoted && (
        <div className="space-y-4">
          {/* Current vote counts display */}
          <div className="text-center space-y-2">
            <div className="text-sm text-gray-400 font-medium">Current Results</div>
            <div className="flex justify-center space-x-6">
              <div className="flex flex-col items-center">
                <div className="text-lg font-bold text-blue-400">Option A</div>
                <div className="text-2xl font-bold text-white">{voteCounts.votesA.toString()}</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-lg font-bold text-purple-400">Option B</div>
                <div className="text-2xl font-bold text-white">{voteCounts.votesB.toString()}</div>
              </div>
            </div>
          </div>
          
          <VotingOptions
            setIsFirstOptionSelected={setIsFirstOptionSelected}
            isFirstOptionSelected={isFirstOptionSelected}
          />
          <Button
            label="Vote"
            isLoading={isVoting}
            disabled={!isKernelClientReady || isVoting}
            handleRegister={submitVote}
            color="pink"
          />
          {isVoting && (
            <div className="mt-3">
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300" 
                  style={{width: `${votingPercentage}%`}} 
                />
              </div>
            </div>
          )}
        </div>
      )}

      {userHasVoted && (
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full">
            <span className="text-green-400 font-medium">✓ Thanks for your vote!</span>
          </div>
        </div>
      )}
    </div>
  );
}
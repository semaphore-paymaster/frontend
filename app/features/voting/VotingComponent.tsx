"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { encodeFunctionData } from "viem";
import { bundlerActions, ENTRYPOINT_ADDRESS_V07, type BundlerActions } from 'permissionless';
import { toast } from 'react-toastify';
import { publicClient } from "../../config/viem";
import { Identity } from "@semaphore-protocol/identity";
import { Group } from "@semaphore-protocol/group";
import { generateProof } from "@semaphore-protocol/proof";
import type { SemaphoreProof } from "@semaphore-protocol/proof";
import type { KernelAccountClient } from '@zerodev/sdk';

import { GROUP_ID } from "../../utils/constants";
import { SEMAPHORE_PAYMASTER_ABI } from "../../config/semaphore";
import { VOTING_CONTRACT_ABI, VOTING_CONTRACT_ADDRESS, VOTE_CHOICES } from "../../config/voting";

import Button from "../../components/ui/Button";

interface VotingComponentProps {
  accountAddress: string;
  kernelClientRef: React.MutableRefObject<KernelAccountClient<typeof ENTRYPOINT_ADDRESS_V07> | null>;
  semaphoreProofRef: React.MutableRefObject<SemaphoreProof | null>;
  isMemberOfGroup: boolean | null;
  isKernelClientReady: boolean;
  handleLogout: () => void;
  isCheckingMembership: boolean;
  checkGroupMembership: () => void;
}

export default function VotingComponent({
  accountAddress,
  kernelClientRef,
  semaphoreProofRef,
  isMemberOfGroup,
  isKernelClientReady,
  handleLogout,
  isCheckingMembership,
  checkGroupMembership
}: VotingComponentProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [isFirstOptionSelected, setIsFirstOptionSelected] = useState(true);
  const [votingPercentage, setVotingPercentage] = useState(5);
  const [voteCounts, setVoteCounts] = useState({ votesA: BigInt(0), votesB: BigInt(0) });

  const semaphorePaymasterContractAddress = process.env.NEXT_PUBLIC_PAYMASTER_CONTRACT as `0x${string}` | undefined;

  console.log("[VotingComponent] Paymaster contract address:", semaphorePaymasterContractAddress);

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

  useEffect(() => {
    if (isMemberOfGroup === true) {
      fetchVoteCounts();
    }
  }, [fetchVoteCounts, isMemberOfGroup]);

  console.log("[VotingComponent Render] isCheckingMembership:", isCheckingMembership, "isMemberOfGroup:", isMemberOfGroup);

  if (isCheckingMembership) {
    console.log("[VotingComponent Render] Showing: Verifying (isCheckingMembership is true)");
    return (
      <div className="py-8 px-4 text-center">
        <p className="text-gray-400">
          Verifying group membership status...
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Please wait...
        </p>
      </div>
    );
  }

  if (isMemberOfGroup === null) {
    console.log("[VotingComponent Render] Showing: Retry Button section (isMemberOfGroup is null, isCheckingMembership is false)");
    console.log("[VotingComponent] Membership check failed or returned null. This could be due to:");
    console.log("1. Invalid paymaster contract address");
    console.log("2. Network/RPC issues");
    console.log("3. Group doesn't exist");
    console.log("4. Contract call failed");
    return (
      <div className="py-8 px-4 text-center">
        <p className="text-gray-400">
          Could not determine group membership.
        </p>
        <p className="text-gray-500 text-sm mt-2 mb-4">
          Please wait, or try refreshing via the status light above, or click below.
        </p>
        <Button 
          label="Retry Group Check"
          handleRegister={() => {
            console.log("[VotingComponent] Manual retry group check triggered from NULL state.");
            checkGroupMembership();
          }}
          color="blue"
          isLoading={isCheckingMembership}
          disabled={isCheckingMembership}
        />
      </div>
    );
  }

  if (isMemberOfGroup === false) {
    console.log("[VotingComponent Render] Showing: Access Restricted (isMemberOfGroup is false)");
    const identity = new Identity(accountAddress);
    const commitmentStr = identity.commitment.toString();
    
    return (
      <div className="py-8 px-4 text-center bg-gray-700/20 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-yellow-400 mb-3">Access Restricted</h3>
        <p className="text-gray-300">
          You are not currently a member of the required group to participate in voting.
        </p>
        <p className="text-gray-400 text-sm mt-2 mb-4">
          Please contact the group administrator to add you to the group, then click &quot;Check Again&quot; below.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-4">
          <Button 
            label="Check Again"
            handleRegister={() => {
              console.log("[VotingComponent] Manual retry group check triggered from FALSE state.");
              checkGroupMembership();
            }}
            color="blue"
            isLoading={isCheckingMembership}
            disabled={isCheckingMembership}
          />
        </div>
      </div>
    );
  }

  console.log("[VotingComponent Render] Showing: Voting UI (isMemberOfGroup is true)");
  const renderVoteCountsDisplay = (currentVoteCounts: { votesA: bigint, votesB: bigint }) => (
    <div className="text-center space-y-2 my-4">
      <div className="text-sm text-gray-400 font-medium">Current Results</div>
      <div className="flex justify-center space-x-6">
        <div className="flex flex-col items-center">
          <div className="text-lg font-bold text-blue-400">Option A</div>
          <div className="text-2xl font-bold text-white">{currentVoteCounts.votesA.toString()}</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-lg font-bold text-purple-400">Option B</div>
          <div className="text-2xl font-bold text-white">{currentVoteCounts.votesB.toString()}</div>
        </div>
      </div>
    </div>
  );

  const submitVote = async () => {
    if (!kernelClientRef.current || !accountAddress || !semaphorePaymasterContractAddress) {
      toast.error("Wallet not connected or paymaster not configured");
      return;
    }

    const kernelClient = kernelClientRef.current;
    setIsVoting(true);
    setVotingPercentage(10);

    if (!kernelClient || !kernelClient.account) {
      toast.error("Kernel client or account is not available.");
      setIsVoting(false);
      return;
    }

    try {
      console.log("[VotingComponent] Starting vote submission for choice:", isFirstOptionSelected ? 'A' : 'B');
      
      const choice = isFirstOptionSelected ? VOTE_CHOICES.A : VOTE_CHOICES.B;
      
      setVotingPercentage(20);
      console.log("[VotingComponent] Generating Semaphore proof for voting...");
      
      const identity = new Identity(accountAddress);
      
      console.log("[VotingComponent] User is already verified as group member");

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
      
      const members = memberAddedEvents
        .map(event => ({
          index: Number(event.args.index),
          commitment: event.args.identityCommitment as bigint
        }))
        .sort((a, b) => a.index - b.index)
        .map(member => member.commitment);
      
      console.log("[VotingComponent] Group members:", members.map(m => m.toString()));
      
      const group = new Group(members);
      
      const message = BigInt(accountAddress);
      
      const proof = await generateProof(identity, group, message, Number(GROUP_ID));
      
      console.log("[VotingComponent] Generated Semaphore proof:", proof);
      
      semaphoreProofRef.current = proof;
      
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
      
      const groupBalance = await publicClient.readContract({
        address: semaphorePaymasterContractAddress,
        abi: SEMAPHORE_PAYMASTER_ABI,
        functionName: 'groupDeposits',
        args: [BigInt(GROUP_ID)],
      }) as bigint;
      
      const paymasterBalance = await publicClient.readContract({
        address: semaphorePaymasterContractAddress,
        abi: SEMAPHORE_PAYMASTER_ABI,
        functionName: 'getDeposit',
        args: [],
      }) as bigint;
      
      console.log("[VotingComponent] Group", GROUP_ID, "balance in paymaster:", groupBalance.toString(), "wei");
      console.log("[VotingComponent] Paymaster balance in EntryPoint:", paymasterBalance.toString(), "wei");
      console.log("[VotingComponent] Paymaster balance in ETH:", (Number(paymasterBalance) / 1e18).toFixed(4), "ETH");
      
      const estimatedGasCost = BigInt(1200000) * BigInt(200000000000);
      console.log("[VotingComponent] Estimated transaction cost:", estimatedGasCost.toString(), "wei");
      console.log("[VotingComponent] Estimated cost in ETH:", (Number(estimatedGasCost) / 1e18).toFixed(4), "ETH");
      
      if (groupBalance === BigInt(0)) {
        throw new Error(`Group ${GROUP_ID} has no funds deposited in the paymaster. Please deposit funds using the depositForGroup function first.`);
      }
      
      if (paymasterBalance < estimatedGasCost) {
        console.warn(`[VotingComponent] WARNING: Paymaster balance (${(Number(paymasterBalance) / 1e18).toFixed(4)} ETH) might be insufficient for estimated cost (${(Number(estimatedGasCost) / 1e18).toFixed(4)} ETH)`);
      }
      
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
      
      setVotingPercentage(40);
      const callData = encodeFunctionData({
        abi: VOTING_CONTRACT_ABI,
        functionName: 'vote',
        args: [BigInt(choice)]
      });

      console.log("[VotingComponent] Encoded call data:", callData);

      setVotingPercentage(60);
      
      console.log("[VotingComponent] Sending vote transaction with Semaphore paymaster...");
      
      const userOpHash = await kernelClient.sendUserOperation({
        account: kernelClient.account as any,
        userOperation: {
          callData: await kernelClient.account.encodeCallData({
            to: VOTING_CONTRACT_ADDRESS,
            value: BigInt(0),
            data: callData,
          }),
        },
      });
      console.log("[VotingComponent] User operation hash:", userOpHash);
      
      setVotingPercentage(80);
      
      const bundlerClient = kernelClient.extend((bundlerActions as any)(ENTRYPOINT_ADDRESS_V07)) as any;
      const receipt = await bundlerClient.waitForUserOperationReceipt({ 
        hash: userOpHash,
        timeout: 60000,
      });
      
      console.log("[VotingComponent] Transaction receipt:", receipt);

      setVotingPercentage(100);
      
      if (receipt.success) {
        console.log("[VotingComponent] Vote successful:", receipt);
        setUserHasVoted(true);
        await fetchVoteCounts();
        
        const choiceName = isFirstOptionSelected ? 'A' : 'B';
        toast.success(`✅ Vote for option ${choiceName} submitted successfully!`);
        
        const explorerUrl = `https://sepolia.basescan.org/tx/${receipt.receipt.transactionHash}`;
        toast.success(`Vote confirmed on blockchain! View at: ${explorerUrl}`);
      } else {
        throw new Error("Transaction failed");
      }
      
    } catch (error) {
      console.error("[VotingComponent] Error submitting vote:", error);
      toast.error(`Failed to submit vote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      semaphoreProofRef.current = null;
      setIsVoting(false);
      setVotingPercentage(0);
    }
  };

  const optionButtonBaseClasses = "w-full sm:w-auto flex-1 text-xl sm:text-2xl font-semibold py-6 sm:py-8 px-6 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 hover:shadow-lg";
  const optionAClasses = isFirstOptionSelected 
    ? "bg-blue-500/20 border-blue-500 text-blue-300 focus:ring-blue-500/50 shadow-blue-500/30 shadow-md"
    : "bg-gray-700/30 border-gray-600 hover:border-blue-500/70 text-gray-400 hover:text-blue-400 focus:ring-blue-500/30";
  const optionBClasses = !isFirstOptionSelected
    ? "bg-purple-500/20 border-purple-500 text-purple-300 focus:ring-purple-500/50 shadow-purple-500/30 shadow-md"
    : "bg-gray-700/30 border-gray-600 hover:border-purple-500/70 text-gray-400 hover:text-purple-400 focus:ring-purple-500/30";

  return (
    <div className="space-y-6 py-4">
      {!userHasVoted && (
        <div className="space-y-8">
          
          
          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4 sm:gap-6 px-2 sm:px-0">
            <button
              type="button"
              onClick={() => setIsFirstOptionSelected(true)}
              className={`${optionButtonBaseClasses} ${optionAClasses}`}
            >
              Vote for Option A
            </button>
            <button
              type="button"
              onClick={() => setIsFirstOptionSelected(false)}
              className={`${optionButtonBaseClasses} ${optionBClasses}`}
            >
              Vote for Option B
            </button>
          </div>
          
          
          <div className="flex justify-center pt-4">
            <Button
              label="Cast Your Vote"
              isLoading={isVoting}
              disabled={!isKernelClientReady || isVoting}
              handleRegister={submitVote}
              color="pink"
            />
          </div>

          {isVoting && (
            <div className="mt-4">
              <div className="h-2.5 w-full bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 transition-all duration-300"
                  style={{width: `${votingPercentage}%`}} 
                />
              </div>
            </div>
          )}
        </div>
      )}

      {userHasVoted && (
        <div className="text-center space-y-4">
          <div className="inline-flex items-center px-4 py-2 bg-green-600/30 border border-green-500/50 rounded-full">
            <span className="text-green-300 font-medium">✓ Thanks for your vote!</span>
          </div>
          
          {renderVoteCountsDisplay(voteCounts)}
        </div>
      )}
    </div>
  );
}
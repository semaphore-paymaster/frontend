"use client";

import React, { useState, useRef, useEffect } from "react";

import { parseAbi } from "viem";

import type { SemaphoreProof } from "@semaphore-protocol/proof";

import "react-toastify/dist/ReactToastify.css";

import { GROUP_ID } from "../utils/constants";

import Login from "./Login";
import AddressAvatar from "./AddressAvatar";
import Button from "./Button";
import VotingOptions from "./VotingOptions";

import { useSmartAccount } from "../hooks/useSmartAccount";
import { useWhitelistVerification } from "../hooks/useWhitelistVerification";
import { useSemaphore } from "../hooks/useSemaphore";

import { SEMAPHORE_PAYMASTER_ABI } from "../config/semaphore";


export default function AccountCreationForm() {
  const semaphoreProofRef = useRef<SemaphoreProof | null>(null); 


  const [userOpHash, setUserOpHash] = useState("");
  const [userOpStatus, setUserOpStatus] = useState(""); // Assuming this is still used somewhere or will be for UserOp tracking
  const [userOpCount, setUserOpCount] = useState(0);

  // 2. Call custom hooks
  const {
    accountAddress,
    isKernelClientReady,
    isRegistering,
    isLoggingIn,
    handleRegister,
    handleLogin,
    kernelClientRef,
    passkeyValidatorRef,
  } = useSmartAccount(semaphoreProofRef);

  const {
    isAccountWhitelisted,
  } = useWhitelistVerification({ accountAddress, kernelClientRef });

  const buildSuccessMessage = (message: string, opHashLink = "") => {
    return (
         <div className="flex flex-col">
          <div>{message}</div>
          <div>
            <a
              href={opHashLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-200 hover:text-blue-700"
            >
              Click here to view more details.
            </a>
          </div>
        </div>
    )
  };

  const semaphorePaymasterContractAddress = process.env.NEXT_PUBLIC_PAYMASTER_CONTRACT as `0x${string}` | undefined;

  const {
    isCheckingMembership,
    isMemberOfGroup,
    checkGroupMembership,
  } = useSemaphore({
    accountAddress,
    groupId: GROUP_ID, 
    semaphorePaymasterAddress: semaphorePaymasterContractAddress || "0x", 
  });

  // Check group membership when account is ready
  useEffect(() => {
    if (isKernelClientReady && accountAddress && isMemberOfGroup === null) {
      console.log("[AccountCreationForm] Checking group membership");
      checkGroupMembership();
    }
  }, [isKernelClientReady, accountAddress, isMemberOfGroup, checkGroupMembership]);
  

  // Remaining local state for voting etc.
  const [isVoting, setIsVoting] = useState(false);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [isFirstOptionSelected, setIsFirstOptionSelected] = useState(true);
  const [votingPercentage, setVotingPercentage] = useState(5);
  
  // Main render log 
  console.log(
    "[Render] kernelClient.current:", kernelClientRef.current, 
    "isKernelClientReady:", isKernelClientReady, 
    "accountAddress:", accountAddress, 
    "isAccountWhitelisted from hook:", isAccountWhitelisted,
    "isMemberOfGroup:", isMemberOfGroup 
  );


  const maciVote = async () => {
    console.log("MACI Vote function placeholder called");
    // Original maciVote logic to be restored here
    // The main return (...) JSX was mistakenly placed inside this function previously.
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        {!accountAddress && (
          <div className="space-y-4">
            <Login
              isLoggingIn={isLoggingIn}
              isRegistering={isRegistering}
              handleLogin={handleLogin}
              handleRegister={handleRegister}
            />
          </div>
        )}

        <div className="space-y-4">
          {accountAddress && (
            <div className="text-center">
              <AddressAvatar accountAddress={accountAddress} />
            </div>
          )}

          {/* Group membership status */}
          {accountAddress && (
            <div className="text-center space-y-4">
              {isCheckingMembership && (
                <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full">
                  <span className="text-blue-400 font-medium">Checking group membership...</span>
                </div>
              )}
              
              {isMemberOfGroup === true && (
                <div className="space-y-4">
                  <div className="inline-flex items-center px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full">
                    <span className="text-green-400 font-medium">✓ You are a member of the group</span>
                  </div>
                  <div className="inline-flex items-center px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full">
                    <span className="text-purple-400 font-medium">Continue with voting</span>
                  </div>
                  
                  {!userHasVoted && (
                    <div className="space-y-4">
                      <VotingOptions
                        setIsFirstOptionSelected={setIsFirstOptionSelected}
                        isFirstOptionSelected={isFirstOptionSelected}
                      />
                      <Button
                        label="Vote"
                        isLoading={isVoting}
                        disabled={!isKernelClientReady || isVoting}
                        handleRegister={maciVote}
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
                </div>
              )}
              
              {isMemberOfGroup === false && (
                <div className="inline-flex items-center px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full">
                  <span className="text-red-400 font-medium">You are not part of the group</span>
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
      </div>
    </div>
  );
}

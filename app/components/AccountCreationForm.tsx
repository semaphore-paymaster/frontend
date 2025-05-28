"use client";

import React, { useState, useRef, useEffect } from "react";
import type { SemaphoreProof } from "@semaphore-protocol/proof";
import "react-toastify/dist/ReactToastify.css";

import { GROUP_ID } from "../utils/constants";

import Login from "./Login";
import AddressAvatar from "./AddressAvatar";
import AccountStatus from "./AccountStatus";
import VotingComponent from "./VotingComponent";

import { useSmartAccount } from "../hooks/useSmartAccount";
import { useSemaphore } from "../hooks/useSemaphore";


export default function AccountCreationForm() {
  const semaphoreProofRef = useRef<SemaphoreProof | null>(null); 



  // 2. Call custom hooks
  const {
    accountAddress,
    isKernelClientReady,
    isRegistering,
    isLoggingIn,
    handleRegister,
    handleLogin,
    kernelClientRef,
  } = useSmartAccount(semaphoreProofRef);




  const {
    isCheckingMembership,
    isMemberOfGroup,
    checkGroupMembership,
  } = useSemaphore({
    accountAddress,
    groupId: GROUP_ID, 
    semaphorePaymasterAddress: process.env.NEXT_PUBLIC_PAYMASTER_CONTRACT || "0x", 
  });


  // Check group membership when account is ready
  useEffect(() => {
    if (isKernelClientReady && accountAddress && isMemberOfGroup === null) {
      console.log("[AccountCreationForm] Checking group membership");
      checkGroupMembership();
    }
  }, [isKernelClientReady, accountAddress, isMemberOfGroup, checkGroupMembership]);




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

          {/* Account Status Component */}
          {accountAddress && (
            <AccountStatus
              accountAddress={accountAddress}
              isMemberOfGroup={isMemberOfGroup}
              isCheckingMembership={isCheckingMembership}
              checkGroupMembership={checkGroupMembership}
            />
          )}

          {/* Voting Component */}
          {accountAddress && isMemberOfGroup === true && (
            <VotingComponent
              accountAddress={accountAddress}
              kernelClientRef={kernelClientRef}
              semaphoreProofRef={semaphoreProofRef}
              isMemberOfGroup={isMemberOfGroup}
              isKernelClientReady={isKernelClientReady}
            />
          )}
        </div>
      </div>
    </div>
  );
}

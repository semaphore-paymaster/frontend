"use client";

import React, { useRef, useEffect } from "react";
import type { SemaphoreProof } from "@semaphore-protocol/proof";
import "react-toastify/dist/ReactToastify.css";

import { GROUP_ID } from "../../utils/constants";

import Login from "../../components/auth/Login";
import AddressAvatar from "../../components/ui/AddressAvatar";
import AccountDashboard from "./AccountDashboard";

import { useSmartAccount } from "../../hooks/useSmartAccount";
import { useSemaphore } from "../../hooks/useSemaphore";

interface AccountManagerProps {
  onVotingStateChange: (showAnimation: boolean) => void;
}

export default function AccountManager({ onVotingStateChange }: AccountManagerProps) {
  const semaphoreProofRef = useRef<SemaphoreProof | null>(null); 

  const {
    accountAddress,
    isKernelClientReady,
    isRegistering,
    isLoggingIn,
    handleRegister,
    handleLogin,
    handleLogout,
    kernelClientRef,
  } = useSmartAccount(semaphoreProofRef);

  const {
    isCheckingMembership,
    isMemberOfGroup,
    checkGroupMembership,
  } = useSemaphore({
    accountAddress,
    groupId: GROUP_ID, 
    semaphorePaymasterAddress: process.env.NEXT_PUBLIC_PAYMASTER_CONTRACT as `0x${string}` || "", 
  });

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PAYMASTER_CONTRACT) {
      console.error("[AccountManager] NEXT_PUBLIC_PAYMASTER_CONTRACT environment variable is not set!");
      return;
    }
    
    if (isKernelClientReady && accountAddress && isMemberOfGroup === null) {
      console.log("[AccountManager] Checking group membership, triggered by useEffect.");
      checkGroupMembership();
    }
  }, [isKernelClientReady, accountAddress, isMemberOfGroup, checkGroupMembership]);

  useEffect(() => {
    // If accountAddress is present, user is logged in and sees the dashboard.
    // In this case, we want to hide the animation.
    // So, showCrystalAnimation should be true only if there's NO accountAddress.
    const showAnimation = !accountAddress;
    onVotingStateChange(showAnimation);
  }, [accountAddress, onVotingStateChange]);

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

        <div className="space-y-4 ">

          {accountAddress && (
            <AccountDashboard
              accountAddress={accountAddress}
              isMemberOfGroup={isMemberOfGroup}
              isCheckingMembership={isCheckingMembership}
              checkGroupMembership={checkGroupMembership}
              kernelClientRef={kernelClientRef}
              semaphoreProofRef={semaphoreProofRef}
              isKernelClientReady={isKernelClientReady}
              handleLogout={handleLogout}
            />
          )}
        </div>
      </div>
    </div>
  );
}

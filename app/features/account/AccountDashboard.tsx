"use client";

import type React from "react";
import type { SemaphoreProof } from "@semaphore-protocol/proof";
import type { KernelAccountClient } from "@zerodev/sdk";
import type { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import AccountStatus from "../../components/status/AccountStatus";
import VotingComponent from "../voting/VotingComponent";

interface AccountDashboardProps {
  accountAddress: string;
  isMemberOfGroup: boolean | null;
  isCheckingMembership: boolean;
  checkGroupMembership: () => void;
  kernelClientRef: React.MutableRefObject<KernelAccountClient<typeof ENTRYPOINT_ADDRESS_V07> | null>;
  semaphoreProofRef: React.MutableRefObject<SemaphoreProof | null>;
  isKernelClientReady: boolean;
  handleLogout: () => void;
}

export default function AccountDashboard({
  accountAddress,
  isMemberOfGroup,
  isCheckingMembership,
  checkGroupMembership,
  kernelClientRef,
  semaphoreProofRef,
  isKernelClientReady,
  handleLogout,
}: AccountDashboardProps) {
  return (
    <div className="space-y-6">
      <AccountStatus
        accountAddress={accountAddress}
        isMemberOfGroup={isMemberOfGroup}
        isCheckingMembership={isCheckingMembership}
        checkGroupMembership={checkGroupMembership}
        handleLogout={handleLogout}
        isKernelClientReady={isKernelClientReady}
      />

      {/* Voting Component area - now always rendered if user is logged in */}
      {/* The VotingComponent itself will decide what to show based on membership */}
      <div className="mt-0 rounded-xl bg-slate-800/50 shadow-xl p-6 md:p-8"> 
        <VotingComponent
          accountAddress={accountAddress}
          kernelClientRef={kernelClientRef}
          semaphoreProofRef={semaphoreProofRef}
          isMemberOfGroup={isMemberOfGroup} 
          isKernelClientReady={isKernelClientReady}
          handleLogout={handleLogout}
          isCheckingMembership={isCheckingMembership}
          checkGroupMembership={checkGroupMembership}
        />
      </div>
    </div>
  );
} 
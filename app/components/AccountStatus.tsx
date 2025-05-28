"use client";

import React, { useState, useEffect, useCallback } from "react";
import { publicClient } from "../config/viem";
import Button from "./Button";

interface AccountStatusProps {
  accountAddress: string;
  isMemberOfGroup: boolean | null;
  isCheckingMembership: boolean;
  checkGroupMembership: () => void;
}

export default function AccountStatus({
  accountAddress,
  isMemberOfGroup,
  isCheckingMembership,
  checkGroupMembership
}: AccountStatusProps) {
  const [isAccountDeployed, setIsAccountDeployed] = useState<boolean | null>(null);

  // Check account deployment status
  const checkAccountDeployment = useCallback(async () => {
    if (!accountAddress) {
      setIsAccountDeployed(null);
      return;
    }

    try {
      const accountCode = await publicClient.getBytecode({ address: accountAddress as `0x${string}` });
      const deployed = Boolean(accountCode && accountCode !== '0x' && accountCode.length > 2);
      setIsAccountDeployed(deployed);
      console.log("[AccountStatus] Account deployment status:", deployed);
      return deployed;
    } catch (error) {
      console.error("[AccountStatus] Error checking account deployment:", error);
      setIsAccountDeployed(null);
      return null;
    }
  }, [accountAddress]);

  // Check account deployment when address is available
  useEffect(() => {
    if (accountAddress && isAccountDeployed === null) {
      console.log("[AccountStatus] Checking account deployment");
      checkAccountDeployment();
    }
  }, [accountAddress, isAccountDeployed, checkAccountDeployment]);

  return (
    <div className="space-y-4">
      {/* Account deployment status */}
      <div className="text-center space-y-4">
        {isAccountDeployed === null && (
          <div className="inline-flex items-center px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
            <span className="text-yellow-400 font-medium">Checking account deployment...</span>
          </div>
        )}
        
        {isAccountDeployed === false && (
          <div className="space-y-4">
            <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full">
              <span className="text-blue-400 font-medium">ℹ️ Account will be deployed automatically</span>
            </div>
            <div className="text-center text-gray-400 text-sm">
              <p>Your smart account will be deployed automatically when you vote.</p>
              <p>No additional step needed - just proceed to voting!</p>
            </div>
          </div>
        )}
        
        {isAccountDeployed === true && (
          <div className="inline-flex items-center px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full">
            <span className="text-green-400 font-medium">✓ Account deployed</span>
          </div>
        )}
      </div>

      {/* Group membership status */}
      <div className="text-center space-y-4">
        {isCheckingMembership && (
          <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full">
            <span className="text-blue-400 font-medium">Checking group membership...</span>
          </div>
        )}
        
        {isMemberOfGroup === null && !isCheckingMembership && (
          <div className="space-y-4">
            <div className="inline-flex items-center px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
              <span className="text-yellow-400 font-medium">Unable to check group membership</span>
            </div>
            <Button
              label="Try Again"
              isLoading={isCheckingMembership}
              disabled={isCheckingMembership}
              handleRegister={checkGroupMembership}
              color="blue"
            />
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
          </div>
        )}
        
        {isMemberOfGroup === false && (
          <div className="space-y-4">
            <div className="inline-flex items-center px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full">
              <span className="text-red-400 font-medium">You are not part of the group</span>
            </div>
            <div className="text-center text-gray-400 text-sm">
              <p>Contact the group admin to be added to the group.</p>
              <p>Once added, click the button below to refresh your status.</p>
            </div>
            <Button
              label="Check Membership Again"
              isLoading={isCheckingMembership}
              disabled={isCheckingMembership}
              handleRegister={checkGroupMembership}
              color="blue"
            />
          </div>
        )}
      </div>
    </div>
  );
}
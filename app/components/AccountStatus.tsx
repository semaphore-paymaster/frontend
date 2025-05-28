"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReactNode, FC } from "react";
import { publicClient } from "../config/viem";
import AddressAvatar from "./AddressAvatar";
import RefreshIcon from "./icons/RefreshIcon";

// Helper component for individual dashboard lights
const DashboardLight: FC<{
  status: boolean | null;
  text: string;
  readyText?: string;
  notReadyText?: string;
  checkingText?: string;
  icon?: ReactNode;
  tooltip?: string;
  onIconClick?: () => void;
  isIconDisabled?: boolean;
}> = ({ status, text, readyText, notReadyText, checkingText, icon, tooltip, onIconClick, isIconDisabled }) => {
  let lightColor = "bg-gray-400 dark:bg-gray-600"; // Default: Unknown/Checking
  let statusText = checkingText || "Checking...";

  if (status === true) {
    lightColor = "bg-green-500 dark:bg-green-400";
    statusText = readyText || "Ready";
  } else if (status === false) {
    lightColor = "bg-red-500 dark:bg-red-400";
    statusText = notReadyText || "Not Ready";
  }

  return (
    <div 
      className="flex items-center space-x-2 p-2 pr-1 bg-gray-100 dark:bg-gray-700/50 rounded-md cursor-default group relative"
      title={tooltip}
    >
      {!icon && <span className={`w-3 h-3 rounded-full ${lightColor} transition-colors flex-shrink-0`} />}
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">{text}:</span>
      <span className="text-xs text-gray-600 dark:text-gray-400 truncate" title={statusText}>{statusText}</span>
      {icon && onIconClick && (
        <button 
          type="button"
          onClick={onIconClick} 
          disabled={isIconDisabled}
          className="ml-auto p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label={`Refresh ${text} status`}
        >
          {icon}
        </button>
      )}
    </div>
  );
};

interface AccountStatusProps {
  accountAddress: string;
  isMemberOfGroup: boolean | null;
  isCheckingMembership: boolean;
  checkGroupMembership: () => void;
  handleLogout: () => void;
  isKernelClientReady: boolean;
}

export default function AccountStatus({
  accountAddress,
  isMemberOfGroup,
  isCheckingMembership,
  checkGroupMembership,
  handleLogout,
  isKernelClientReady,
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
      return deployed;
    } catch (error) {
      setIsAccountDeployed(null);
      return null;
    }
  }, [accountAddress]);

  useEffect(() => {
    if (accountAddress && isAccountDeployed === null) {
      checkAccountDeployment();
    }
  }, [accountAddress, isAccountDeployed, checkAccountDeployment]);

  // Tooltip text generation logic
  const getAccountDeploymentTooltip = () => {
    if (isAccountDeployed === null) return "Checking account deployment status...";
    if (isAccountDeployed === false) return "Your smart account will be deployed automatically when you vote. No additional step needed - just proceed to voting!";
    if (isAccountDeployed === true) return "Your smart account is active on the network.";
    return "Account deployment status unknown.";
  };

  const getGroupMembershipTooltip = () => {
    if (isCheckingMembership) return "Verifying your group membership status...";
    if (isMemberOfGroup === null) return "There was an issue verifying your group status. You might want to try checking again if a button is available.";
    if (isMemberOfGroup === true) return "You are a member of the group and can proceed with voting.";
    if (isMemberOfGroup === false) return "You are not currently part of the required group. Contact the group admin to be added. Once added, refresh your status.";
    return "Group membership status unknown.";
  };

  return (
    <div className="w-full rounded-none sm:rounded-xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
      {/* Header with Avatar and Logout Button */}
      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          {accountAddress && (
            <AddressAvatar accountAddress={accountAddress} />
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:underline focus:outline-none transition-colors duration-150"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Dashboard Lights Section */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <DashboardLight 
            status={isKernelClientReady}
            text="Kernel"
            readyText="Initialized"
            notReadyText="Not Active"
            checkingText="Initializing..."
            tooltip={isKernelClientReady === null ? "Checking kernel status..." : isKernelClientReady ? "Kernel client is initialized and ready." : "Kernel client is not active."}
          />
          <DashboardLight 
            status={isAccountDeployed}
            text="Account"
            readyText="Deployed"
            notReadyText="Not Deployed"
            checkingText="Checking..."
            tooltip={getAccountDeploymentTooltip()}
          />
          <DashboardLight 
            status={isCheckingMembership ? null : isMemberOfGroup}
            text="Group"
            readyText="Member"
            notReadyText={isMemberOfGroup === null ? "Error" : "Not Member"}
            checkingText="Verifying..."
            tooltip={getGroupMembershipTooltip()}
            icon={(!isCheckingMembership && isMemberOfGroup === null) ? <RefreshIcon className="w-3.5 h-3.5 text-gray-500 hover:text-blue-500" /> : undefined}
            onIconClick={checkGroupMembership}
            isIconDisabled={isCheckingMembership}
          />
        </div>
      </div>
    </div>
  );
}
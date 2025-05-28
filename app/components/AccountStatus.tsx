"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReactNode, FC } from "react";
import { publicClient } from "../config/viem";
import Button from "./Button";

// --- START SVG Icon Components ---
const LoadingIcon = ({ className }: { className?: string }) => (
  <svg className={`animate-spin h-5 w-5 ${className || 'text-blue-500'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <title>Loading</title>
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const SuccessIcon = ({ className }: { className?: string }) => (
  <svg className={`h-5 w-5 ${className}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <title>Success</title>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const ErrorIcon = ({ className }: { className?: string }) => (
  <svg className={`h-5 w-5 ${className}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <title>Error</title>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
);

const InfoIcon = ({ className }: { className?: string }) => (
  <svg className={`h-5 w-5 ${className}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <title>Information</title>
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);

const WarningIcon = ({ className }: { className?: string }) => (
  <svg className={`h-5 w-5 ${className}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <title>Warning</title>
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.216 3.031-1.742 3.031H4.42c-1.526 0-2.492-1.697-1.742-3.031l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
  </svg>
);
// --- END SVG Icon Components ---

// --- START StatusItem Component ---
interface StatusItemProps {
  iconType: 'loading' | 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: ReactNode;
  actionButton?: ReactNode;
}

const StatusItem: FC<StatusItemProps> = ({ iconType, title, description, actionButton }) => {
  let IconComponent: FC<{ className?: string }> | null = null;
  let iconColorClass = '';
  let borderColorClass = 'border-gray-300 dark:border-gray-600';
  let titleColorClass = 'text-gray-900 dark:text-white';

  switch (iconType) {
    case 'loading':
      IconComponent = LoadingIcon; // Manages its own color and animation
      borderColorClass = 'border-blue-300 dark:border-blue-700';
      titleColorClass = 'text-blue-700 dark:text-blue-400 font-medium';
      break;
    case 'success':
      IconComponent = SuccessIcon;
      iconColorClass = 'text-green-500';
      borderColorClass = 'border-green-300 dark:border-green-700';
      titleColorClass = 'text-green-700 dark:text-green-400 font-medium';
      break;
    case 'error':
      IconComponent = ErrorIcon;
      iconColorClass = 'text-red-500';
      borderColorClass = 'border-red-300 dark:border-red-700';
      titleColorClass = 'text-red-700 dark:text-red-400 font-medium';
      break;
    case 'warning':
      IconComponent = WarningIcon;
      iconColorClass = 'text-yellow-500';
      borderColorClass = 'border-yellow-300 dark:border-yellow-700';
      titleColorClass = 'text-yellow-700 dark:text-yellow-400 font-medium';
      break;
    default:
      IconComponent = InfoIcon;
      iconColorClass = 'text-blue-500';
      borderColorClass = 'border-blue-300 dark:border-blue-700';
      titleColorClass = 'text-blue-700 dark:text-blue-400 font-medium';
      break;
  }

  return (
    <div className={`flex items-start space-x-3 p-4 rounded-lg border bg-white dark:bg-gray-800 ${borderColorClass} shadow-sm`}>
      {IconComponent && (
        <div className="flex-shrink-0 w-5 h-5 mt-0.5">
          <IconComponent className={iconColorClass} />
        </div>
      )}
      <div className="flex-grow">
        <p className={titleColorClass}>{title}</p>
        {description && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {description}
          </div>
        )}
        {actionButton && <div className="mt-3">{actionButton}</div>}
      </div>
    </div>
  );
};
// --- END StatusItem Component ---

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

  // Helper to render Account Deployment Status
  const renderAccountDeploymentStatus = () => {
    if (isAccountDeployed === null) {
      return (
        <StatusItem
          iconType="loading"
          title="Checking account deployment..."
        />
      );
    }
    if (isAccountDeployed === false) {
      return (
        <StatusItem
          iconType="info"
          title="Account Not Deployed Yet"
          description={
            <>
              <p>Your smart account will be deployed automatically when you vote.</p>
              <p>No additional step needed - just proceed to voting!</p>
            </>
          }
        />
      );
    }
    if (isAccountDeployed === true) {
      return (
        <StatusItem
          iconType="success"
          title="Account Deployed"
          description="Your smart account is active on the network."
        />
      );
    }
    return null;
  };

  // Helper to render Group Membership Status
  const renderGroupMembershipStatus = () => {
    if (isCheckingMembership) {
      return (
        <StatusItem
          iconType="loading"
          title="Checking group membership..."
        />
      );
    }
    if (isMemberOfGroup === null && !isCheckingMembership) {
      return (
        <StatusItem
          iconType="warning"
          title="Unable to Check Group Membership"
          description="There was an issue verifying your group status."
          actionButton={
            <Button
              label="Try Again"
              isLoading={false} // isCheckingMembership is false in this branch
              disabled={false}
              handleRegister={checkGroupMembership}
              color="blue" // You might want to use a yellow/warning color for the button
            />
          }
        />
      );
    }
    if (isMemberOfGroup === true) {
      return (
        <StatusItem
          iconType="success"
          title="You are a Member of the Group"
          description="You can now proceed with voting."
        />
      );
    }
    if (isMemberOfGroup === false) {
      return (
        <StatusItem
          iconType="error"
          title="Not a Group Member"
          description={
            <>
              <p>You are not currently part of the required group.</p>
              <p>Contact the group admin to be added. Once added, refresh your status below.</p>
            </>
          }
          actionButton={
            <Button
              label="Check Membership Again"
              isLoading={isCheckingMembership} // Will be false here
              disabled={isCheckingMembership}
              handleRegister={checkGroupMembership}
              color="blue"
            />
          }
        />
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-4 px-0 py-4 sm:px-4 rounded-none sm:rounded-xl bg-gray-50 dark:bg-gray-900/50 shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 px-4 sm:px-0">
        Status Overview
      </h2>
      {renderAccountDeploymentStatus()}
      {renderGroupMembershipStatus()}
    </div>
  );
}
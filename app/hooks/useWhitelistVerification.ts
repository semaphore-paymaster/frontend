import { useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { bundlerActions, ENTRYPOINT_ADDRESS_V07 } from 'permissionless';
import type { KernelAccountClient } from '@zerodev/sdk';
import type { BundlerActions as PermissionlessBundlerActions } from 'permissionless';
import type { Address } from 'viem';

// Define the props the hook will accept
interface UseWhitelistVerificationProps {
  accountAddress: string;
  kernelClientRef: React.RefObject<KernelAccountClient<typeof ENTRYPOINT_ADDRESS_V07> | null>;
  // If bundlerClient is managed by useSmartAccount and passed, use its ref type
  // bundlerClientRef: React.RefObject<KernelAccountClient<typeof ENTRYPOINT_ADDRESS_V07> & BundlerActions<typeof ENTRYPOINT_ADDRESS_V07> | null>; 
}

export const useWhitelistVerification = ({ 
  accountAddress,
  kernelClientRef,
}: UseWhitelistVerificationProps) => {
  const [isAccountWhitelisted, setIsAccountWhitelisted] = useState(false);
  const [isVerifyingAccountWhitelist, setIsVerifyingAccountWhitelist] = useState(false);
  const [accountWhitelistError, setAccountWhitelistError] = useState<string | null>(""); // Keep as string to match AccountCreationForm

  const handleVerifySmartAccountWhitelist = useCallback(async () => {
    console.log("[useWhitelistVerification] handleVerify. kernelClientRef.current:", kernelClientRef.current, "accountAddress:", accountAddress);

    if (!accountAddress) {
      setAccountWhitelistError("Account not available. Please log in.");
      toast.error("Account not available for whitelist verification.");
      return;
    }
    const kernelClient = kernelClientRef.current;
    if (!kernelClient) {
        setAccountWhitelistError("Kernel client not initialized. Please ensure you are logged in or try again.");
        console.error("[useWhitelistVerification] kernelClientRef.current is UNDEFINED here!");
        toast.error("Kernel client not ready for whitelist verification.");
        setIsVerifyingAccountWhitelist(false);
        return;
    }
    
    // This hook will manage its own bundler client instance derived from kernelClient
    const localBundlerClient = (kernelClient as any).extend(bundlerActions(ENTRYPOINT_ADDRESS_V07));
    if (!localBundlerClient) {
        setAccountWhitelistError("Failed to create bundler client for verification.");
        console.error("[useWhitelistVerification] localBundlerClient could not be created.");
        toast.error("Bundler client setup error.");
        setIsVerifyingAccountWhitelist(false);
        return;
    }

    setIsVerifyingAccountWhitelist(true);
    setAccountWhitelistError("");
    // setIsAccountWhitelisted(false); // Reset before verification if not handled by initial state

    if (!process.env.NEXT_PUBLIC_SMART_ACCOUNT_WHITELIST_URL) {
      setAccountWhitelistError("Smart account whitelist URL not configured.");
      toast.error("Whitelist URL not configured.");
      setIsVerifyingAccountWhitelist(false);
      return;
    }

    try {
      // Client-side pre-check (UX enhancement)
      const response = await fetch(process.env.NEXT_PUBLIC_SMART_ACCOUNT_WHITELIST_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch smart account whitelist: ${response.statusText}`);
      }
      const whitelistData = await response.json();
      if (!Array.isArray(whitelistData) || !whitelistData.every(item => typeof item === 'string')) {
        throw new Error("Smart account whitelist data is not in the expected format (array of strings).");
      }

      const lowercasedWhitelist = whitelistData.map(addr => addr.toLowerCase());
      if (!lowercasedWhitelist.includes(accountAddress.toLowerCase())) {
        setAccountWhitelistError("Your smart account address is not in the client-side pre-check whitelist.");
        setIsAccountWhitelisted(false); 
        toast.error("Your smart account address is not whitelisted (client pre-check).");
        setIsVerifyingAccountWhitelist(false);
        return;
      }

      // TEMPORARY: Assume whitelisted after client-side check to unblock UI development
      // TODO: Remove this temporary client-side whitelist enforcement once ZeroDev deployment sponsorship is fixed
      // and re-enable the UserOperation-based verification logic commented out below.
      console.warn("TEMPORARY (in hook): Smart account is being marked as whitelisted based on client-side check ONLY.");
      setIsAccountWhitelisted(true);
      toast.success("TEMPORARY (in hook): Whitelisted (client-side check). UserOp verification skipped.");
      setIsVerifyingAccountWhitelist(false); 
      return; 

      /* --- Temporarily Commented Out UserOperation Sending Logic (Full Secure Flow) ---
      console.log("Client-side whitelist pre-check passed. Sending UserOp for paymaster verification...");
      
      const verificationUserOp = {
        to: accountAddress as `0x${string}`,
        value: BigInt(0),
        callData: '0x' as `0x${string}`,
      };

      console.log("Sending verification UserOperation:", verificationUserOp);
      const userOpHash = await kernelClient.sendUserOperation({ 
        userOperation: verificationUserOp
      });

      // If setUserOpHash is needed from parent component:
      // if (props.setUserOpHash) props.setUserOpHash(userOpHash);
      toast.info("Verification UserOperation sent. Waiting for confirmation...");

      console.log("Waiting for UserOperation receipt, hash:", userOpHash);
      const receipt = await localBundlerClient.waitForUserOperationReceipt({ 
        hash: userOpHash,
        timeout: 60000, 
      });

      console.log("UserOperation receipt:", receipt);

      if (receipt.success) {
        setIsAccountWhitelisted(true);
        toast.success("Smart account successfully verified by Paymaster!");
        setAccountWhitelistError(""); 
      } else {
        setAccountWhitelistError("Paymaster verification failed or UserOperation was not successful on-chain.");
        setIsAccountWhitelisted(false);
        toast.error("Verification UserOperation failed on-chain.");
      }
      --- End of Temporarily Commented Out UserOperation Sending Logic --- */

    } catch (error: unknown) {
      console.error("Error during smart account whitelist verification process (in hook):", error);
      let errorMessage = "Error during smart account whitelist verification.";
      if (error instanceof Error) {
        errorMessage = error.message;
        const unknownError = error as any;
        if (unknownError.cause && typeof unknownError.cause.shortMessage === 'string') {
            errorMessage = unknownError.cause.shortMessage;
        } else if (typeof unknownError.shortMessage === 'string') {
            errorMessage = unknownError.shortMessage;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      if (errorMessage.toLowerCase().includes("rejected by paymaster") || errorMessage.toLowerCase().includes("paymaster validation failed")) {
          errorMessage = "Verification rejected by Paymaster.";
      } else if (errorMessage.toLowerCase().includes("deadline exceeded") || errorMessage.toLowerCase().includes("timeout")) {
        errorMessage = "Verification timed out.";
      }
      setAccountWhitelistError(errorMessage);
      setIsAccountWhitelisted(false);
      toast.error(errorMessage);
    } finally {
      setIsVerifyingAccountWhitelist(false);
    }
  }, [accountAddress, kernelClientRef]); // REMOVED state setters from dependencies

  return {
    isAccountWhitelisted,
    isVerifyingAccountWhitelist,
    accountWhitelistError,
    handleVerifySmartAccountWhitelist,
    setIsAccountWhitelisted,  
    setAccountWhitelistError, 
  };
}; 
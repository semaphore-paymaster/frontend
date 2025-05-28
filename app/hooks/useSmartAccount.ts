import { useState, useRef, useCallback } from "react";
import {
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
} from "@zerodev/sdk";

import {
  WebAuthnMode,
  toPasskeyValidator,
  toWebAuthnKey,
} from "@zerodev/passkey-validator";
import { toPermissionValidator } from "@zerodev/permissions";
import { toECDSASigner } from "@zerodev/permissions/signers";
import { toSudoPolicy } from "@zerodev/permissions/policies";
import { KERNEL_V3_1 } from "@zerodev/sdk/constants";
import {
  bundlerActions,
  ENTRYPOINT_ADDRESS_V07,
  type EstimateUserOperationGasParameters,
} from "permissionless";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  http,
  encodeAbiParameters,
  parseAbiParameters,
} from "viem";
import {
  BUNDLER_URL,
  CHAIN,
  PASSKEY_SERVER_URL,
  PAYMASTER_URL,
} from "../config/zerodev";
import { publicClient } from "../config/viem";
import { type SemaphoreProof, verifyProof } from "@semaphore-protocol/proof";

export type InferredPasskeyValidator = Awaited<ReturnType<typeof toPasskeyValidator>>;

const sessionPrivateKey = generatePrivateKey();
const sessionKeySigner = privateKeyToAccount(sessionPrivateKey);

// Helper function to check if an account is deployed
const isAccountDeployed = async (address: string): Promise<boolean> => {
  try {
    const code = await publicClient.getCode({ address: address as `0x${string}` });
    return code !== undefined && code !== "0x" && code.length > 2;
  } catch (error) {
    console.error("Error checking if account is deployed:", error);
    return false;
  }
};

export const useSmartAccount = (semaphoreProofRef: React.RefObject<SemaphoreProof | null>) => {
  const sessionKeyAccountRef = useRef<any>(null);
  const kernelClientRef = useRef<any>(null);      
  const bundlerClientRef = useRef<any>(null);
  const passkeyValidatorRef = useRef<InferredPasskeyValidator | null>(null);
  const semaphoreKernelClientRef = useRef<any>(null); // Separate client for Semaphore operations

  const [accountAddress, setAccountAddress] = useState<string>("");
  const [isKernelClientReady, setIsKernelClientReady] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("semaphore-paymaster-account");

  const createAccountAndClient = useCallback(async (passkeyValidator: InferredPasskeyValidator) => {
    // Store the passkey validator for potential reuse
    passkeyValidatorRef.current = passkeyValidator;
    const ecdsaSigner = await toECDSASigner({
      signer: sessionKeySigner,
    });

    const sudoPolicy = await toSudoPolicy({});

    const permissionValidator = await toPermissionValidator(publicClient, {
      signer: ecdsaSigner,
      kernelVersion: KERNEL_V3_1,
      policies: [sudoPolicy],
      entryPoint: ENTRYPOINT_ADDRESS_V07,
    });

    sessionKeyAccountRef.current = await createKernelAccount(publicClient, {
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      kernelVersion: KERNEL_V3_1,
      plugins: {
        sudo: passkeyValidator,
        regular: permissionValidator,
      },
    });

    kernelClientRef.current = createKernelAccountClient({
      account: sessionKeyAccountRef.current,
      chain: CHAIN,
      bundlerTransport: http(BUNDLER_URL),
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      middleware: {
        sponsorUserOperation: async ({ userOperation }) => {
          console.log("🔥 MIDDLEWARE LOADED - NEW VERSION V3 🔥");
          
          const currentSemaphoreProof = semaphoreProofRef.current;
          
          console.log("=== PAYMASTER MIDDLEWARE DEBUG ===");
          console.log("CallData:", userOperation.callData);
          console.log("Factory:", userOperation.factory);
          console.log("Sender:", userOperation.sender);
          console.log("To:", userOperation.to);
          console.log("Value:", userOperation.value?.toString());
          console.log("Current Semaphore Proof:", currentSemaphoreProof);
          console.log("=====================================");
          
          const zeroDevPaymaster = createZeroDevPaymasterClient({
            chain: CHAIN,
            transport: http(PAYMASTER_URL),
            entryPoint: ENTRYPOINT_ADDRESS_V07,
          });

          // Check if account is deployed
          const accountDeployed = await isAccountDeployed(userOperation.sender);
          console.log("Paymaster Middleware: Account deployed?", accountDeployed);

          // Check if this is a Semaphore group join operation (addMember)
          const isAddMemberOperation = userOperation.callData?.includes('1783efc3');
          
          // If account is not deployed, this should be handled by the factory logic
          if (!accountDeployed) {
            console.log("Paymaster Middleware: Account not deployed, checking for factory data");
            
            // If no factory data is present, this is an error - the account should have factory data for deployment
            if (!userOperation.factory || userOperation.factory === "0x" || userOperation.factory.length <= 2) {
              console.error("Paymaster Middleware: Account not deployed and no factory data provided");
              throw new Error("Account not deployed and no factory data provided. This should not happen with ZeroDev accounts.");
            }
            
            // If this is also an addMember operation, it's a combined deployment + join operation
            if (isAddMemberOperation) {
              console.log("Paymaster Middleware: Detected combined Factory + addMember UserOp for sender:", userOperation.sender);
              console.log("Paymaster Middleware: CallData contains addMember call, sponsoring via ZeroDev");
            } else {
              console.log("Paymaster Middleware: Detected Factory UserOp (account deployment only) for sender:", userOperation.sender);
            }
            
            return zeroDevPaymaster.sponsorUserOperation({
              userOperation,
              entryPoint: ENTRYPOINT_ADDRESS_V07,
            });
          }

          // Account is deployed, handle other transaction types
          
          // Semaphore Proof UserOperation Logic (e.g., for voting)
          if (!userOperation.factory && currentSemaphoreProof) { 
            console.log("Paymaster Middleware: Detected Semaphore Proof UserOp for sender:", userOperation.sender);
            const {
              merkleTreeDepth,
              merkleTreeRoot,
              nullifier,
              message,
              scope,
              points,
            } = currentSemaphoreProof; 

            const paymasterData = encodeAbiParameters(
              parseAbiParameters(
                "uint256, uint256, uint256, uint256, uint256, uint256[8]"
              ),
              [
                BigInt(merkleTreeDepth),
                merkleTreeRoot,
                nullifier,
                message,
                scope,
                points,
              ]
            );

            console.log("semaphoreProof", currentSemaphoreProof);
            console.log("proof: ", await verifyProof(currentSemaphoreProof));
            console.log("paymasterData", paymasterData);
            console.log("userOperation callData:", userOperation.callData);
            console.log("userOperation sender:", userOperation.sender);

            let bundlerClientForGas = bundlerClientRef.current; 
            if (!bundlerClientForGas && kernelClientRef.current) { 
                bundlerClientRef.current = kernelClientRef.current.extend(bundlerActions(ENTRYPOINT_ADDRESS_V07));
                bundlerClientForGas = bundlerClientRef.current;
            }
            if (!bundlerClientForGas) {
                console.error("Paymaster Middleware: bundlerClientForGas could not be initialized for Semaphore path.");
                throw new Error("Bundler client setup error in paymaster for Semaphore path.");
            }

            const estimateArgs: EstimateUserOperationGasParameters<typeof ENTRYPOINT_ADDRESS_V07> = {
                userOperation: userOperation, 
                entryPoint: ENTRYPOINT_ADDRESS_V07,
            };
            const gasEstimates = await bundlerClientForGas.estimateUserOperationGas(estimateArgs);

            const userOpWithPaymasterAndGas = {
              ...userOperation,
              ...gasEstimates,
              paymaster: process.env.NEXT_PUBLIC_PAYMASTER_CONTRACT, 
              paymasterVerificationGasLimit: BigInt(200000), // Increased from 100000
              paymasterPostOpGasLimit: BigInt(100000), // Increased from 50000
              paymasterData,
            };

            console.log("Paymaster Middleware: Final UserOp for Semaphore created successfully");
            return userOpWithPaymasterAndGas;
          }

          // Semaphore Group Join UserOperation Logic (addMember) - for already deployed accounts
          if (isAddMemberOperation) {
            console.log("Paymaster Middleware: Detected addMember UserOp for joining Semaphore group (deployed account), sender:", userOperation.sender);
            console.log("Paymaster Middleware: CallData:", userOperation.callData);
            console.log("Paymaster Middleware: Using ZeroDev sponsorship for addMember operation");
            return zeroDevPaymaster.sponsorUserOperation({
              userOperation,
              entryPoint: ENTRYPOINT_ADDRESS_V07,
            });
          }
          
          console.warn("Paymaster Middleware: UserOperation did not match any specific sponsorship condition. Sender:", userOperation.sender);
          console.warn("CallData:", userOperation.callData);
          console.warn("Factory:", userOperation.factory);
          throw new Error("Paymaster: UserOperation not eligible for sponsorship by this policy.");
        },
      },
    });

    // Create a separate kernel client for Semaphore operations (no complex middleware)
    semaphoreKernelClientRef.current = createKernelAccountClient({
      account: sessionKeyAccountRef.current,
      chain: CHAIN,
      bundlerTransport: http(BUNDLER_URL),
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      middleware: {
        sponsorUserOperation: async (args) => {
          const paymasterClient = createZeroDevPaymasterClient({
            chain: CHAIN,
            transport: http(PAYMASTER_URL),
            entryPoint: ENTRYPOINT_ADDRESS_V07,
          });
          return await paymasterClient.sponsorUserOperation(args);
        },
      },
    });

    if(sessionKeyAccountRef.current && kernelClientRef.current && semaphoreKernelClientRef.current) {
        setIsKernelClientReady(true);
        setAccountAddress(sessionKeyAccountRef.current.address);
        console.log("[createAccountAndClient] kernelClientRef.current INITIALIZED:", kernelClientRef.current);
        console.log("[createAccountAndClient] semaphoreKernelClientRef.current INITIALIZED:", semaphoreKernelClientRef.current);
    } else {
        console.error("[createAccountAndClient] Failed to initialize sessionKeyAccountRef, kernelClientRef or semaphoreKernelClientRef");
    }
  }, [semaphoreProofRef]);

  const handleRegister = useCallback(async () => {
    setIsRegistering(true);
    
    if (typeof window === 'undefined') {
      console.error("[handleRegister] Not in browser environment");
      return;
    }
    
    if (!window.navigator?.credentials) {
      console.error("[handleRegister] WebAuthn not supported in this browser");
      return;
    }
    
    try {
      console.log("[handleRegister] Creating WebAuthn key for registration");
      const webAuthnKey = await toWebAuthnKey({
        passkeyName: username,
        passkeyServerUrl: PASSKEY_SERVER_URL,
        mode: WebAuthnMode.Register,
      });
      console.log("[handleRegister] WebAuthn key created successfully");
      
      let passkeyValidator: InferredPasskeyValidator;
      try {
        passkeyValidator = await toPasskeyValidator(publicClient, {
          webAuthnKey,
          entryPoint: ENTRYPOINT_ADDRESS_V07,
          kernelVersion: KERNEL_V3_1,
        });
        console.log("[handleRegister] Passkey validator created successfully");
      } catch (validatorError) {
        console.error("[handleRegister] Failed to create passkey validator:", validatorError);
        throw validatorError;
      }
      
      await createAccountAndClient(passkeyValidator);
    } catch (error: unknown) {
      console.error("Error during registration:", error);
      if (error instanceof Error) {
        console.error("Registration Error message:", error.message);
      } else {
        console.error("An unknown registration error occurred.");
      }
    } finally {
      setIsRegistering(false);
    }
  }, [username, createAccountAndClient]);

  const handleLogin = useCallback(async () => {
    setIsLoggingIn(true);
    console.log("[handleLogin] Attempting login...");
    
    if (typeof window === 'undefined') {
      console.error("[handleLogin] Not in browser environment");
      return;
    }
    
    if (!window.navigator?.credentials) {
      console.error("[handleLogin] WebAuthn not supported in this browser");
      return;
    }
    
    try {
      console.log("[handleLogin] Creating WebAuthn key with:", {
        passkeyName: username,
        passkeyServerUrl: PASSKEY_SERVER_URL,
        mode: WebAuthnMode.Login,
      });
      
      const webAuthnKey = await toWebAuthnKey({
        passkeyName: username,
        passkeyServerUrl: PASSKEY_SERVER_URL,
        mode: WebAuthnMode.Login,
      });
      
      console.log("[handleLogin] WebAuthn key created successfully");
      console.log("[handleLogin] Creating passkey validator with publicClient:", publicClient);
      console.log("[handleLogin] WebAuthn key details:", webAuthnKey);
      
      let passkeyValidator: InferredPasskeyValidator;
      try {
        passkeyValidator = await toPasskeyValidator(publicClient, {
          webAuthnKey,
          entryPoint: ENTRYPOINT_ADDRESS_V07,
          kernelVersion: KERNEL_V3_1,
        });
        console.log("[handleLogin] Passkey validator created successfully");
      } catch (validatorError) {
        console.error("[handleLogin] Failed to create passkey validator:", validatorError);
        throw validatorError;
      }
      
      await createAccountAndClient(passkeyValidator);
    } catch (error: unknown) {
      console.error("Error during login:", error);
      if (error instanceof Error) {
        console.error("Login Error message:", error.message);
        console.error("Login Error stack:", error.stack);
      } else {
        console.error("An unknown login error occurred:", error);
      }
    } finally {
      setIsLoggingIn(false);
    }
  }, [username, createAccountAndClient]);

  const handleLogout = useCallback(() => {
    console.log("[handleLogout] Logging out user...");
    
    // Clear all refs
    sessionKeyAccountRef.current = null;
    kernelClientRef.current = null;
    bundlerClientRef.current = null;
    passkeyValidatorRef.current = null;
    semaphoreKernelClientRef.current = null;
    
    // Reset state
    setAccountAddress("");
    setIsKernelClientReady(false);
    setIsRegistering(false);
    setIsLoggingIn(false);
    
    // Note: semaphoreProofRef will be cleared by the parent component
    
    console.log("[handleLogout] Logout complete");
  }, []);

  return {
    accountAddress,
    isKernelClientReady,
    isRegistering,
    isLoggingIn,
    username,
    setUsername,
    handleRegister,
    handleLogin,
    handleLogout,
    kernelClientRef,
    sessionKeyAccountRef,
    bundlerClientRef,
    passkeyValidatorRef
  };
};
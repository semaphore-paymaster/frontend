import { useState, useRef, useCallback } from "react";
import {
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
} from "@zerodev/sdk";
import type {
  KernelSmartAccount,
  KernelAccountClient,
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
  type BundlerActions,
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

export const useSmartAccount = (semaphoreProofRef: React.RefObject<SemaphoreProof | null>) => {
  const sessionKeyAccountRef = useRef<KernelSmartAccount<typeof ENTRYPOINT_ADDRESS_V07> | null>(null);
  const kernelClientRef = useRef<KernelAccountClient<typeof ENTRYPOINT_ADDRESS_V07> | null>(null);      
  const bundlerClientRef = useRef<KernelAccountClient<typeof ENTRYPOINT_ADDRESS_V07> & BundlerActions<typeof ENTRYPOINT_ADDRESS_V07> | null>(null);

  const [accountAddress, setAccountAddress] = useState<string>("");
  const [isKernelClientReady, setIsKernelClientReady] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("semaphore-paymaster-account");

  const createAccountAndClient = useCallback(async (passkeyValidator: InferredPasskeyValidator) => {
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
          console.log("🔥 MIDDLEWARE LOADED - NEW VERSION V2 🔥");
          
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
                bundlerClientRef.current = (kernelClientRef.current as any).extend(bundlerActions(ENTRYPOINT_ADDRESS_V07));
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
            const gasEstimates = await (bundlerClientForGas as any).estimateUserOperationGas(estimateArgs);

            const userOpWithPaymasterAndGas = {
              ...userOperation,
              ...gasEstimates,
              paymaster: process.env.NEXT_PUBLIC_PAYMASTER_CONTRACT, 
              paymasterData,
            };

            console.log("Paymaster Middleware: Final UserOp for Semaphore created successfully");
            return userOpWithPaymasterAndGas;
          }

          // Semaphore Group Join UserOperation Logic (addMember)
          if (userOperation.callData?.includes('1783efc3')) {
            console.log("Paymaster Middleware: Detected addMember UserOp for joining Semaphore group, sender:", userOperation.sender);
            console.log("Paymaster Middleware: CallData:", userOperation.callData);
            return zeroDevPaymaster.sponsorUserOperation({
              userOperation,
              entryPoint: ENTRYPOINT_ADDRESS_V07,
            });
          }

          // Factory Deployment UserOperation Logic (Initial Account Creation)
          if (userOperation.factory && userOperation.factory.length > 2 && userOperation.factory !== "0x") {
            console.log("Paymaster Middleware: Detected Factory UserOp (account deployment) for sender:", userOperation.sender);
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
    }) as any;

    if(sessionKeyAccountRef.current && kernelClientRef.current) {
        setIsKernelClientReady(true);
        setAccountAddress(sessionKeyAccountRef.current.address);
        console.log("[createAccountAndClient] kernelClientRef.current INITIALIZED:", kernelClientRef.current);
    } else {
        console.error("[createAccountAndClient] Failed to initialize sessionKeyAccountRef or kernelClientRef");
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

  return {
    accountAddress,
    isKernelClientReady,
    isRegistering,
    isLoggingIn,
    username,
    setUsername,
    handleRegister,
    handleLogin,
    kernelClientRef,
    sessionKeyAccountRef,
    bundlerClientRef
  };
};
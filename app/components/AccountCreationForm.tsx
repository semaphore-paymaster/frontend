"use client";

import React, { useState, useRef } from "react";

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

import { bundlerActions, ENTRYPOINT_ADDRESS_V07 } from "permissionless";

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { WalletClient } from "viem";
import {
  http,
  encodeFunctionData,
  encodeAbiParameters,
  parseAbiParameters,
  parseEventLogs,
  verifyMessage,
  recoverMessageAddress,
  createPublicClient,
} from "viem";

import { Identity } from "@semaphore-protocol/identity";
import { SemaphoreSubgraph } from "@semaphore-protocol/data";
import { generateProof } from "@semaphore-protocol/proof";
import { Group } from "@semaphore-protocol/group";
import { verifyProof } from "@semaphore-protocol/proof";

import { genRandomSalt } from "maci-crypto";
import { Keypair, PubKey, PCommand } from "maci-domainobjs";

import {  toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  BUNDLER_URL,
  CHAIN,
  PASSKEY_SERVER_URL,
  PAYMASTER_URL,
} from "../config/zerodev";

import { AbiCoder } from "ethers";
import { publicClient } from "../config/viem";
import { GATEKEEPER_ABI } from "../config/gatekeeper";
import { STORAGE_ABI } from "../config/storage";
import { GET_GROUP_DATA } from "../config/apollo";
import { useQuery } from "@apollo/client";
import Login from "./Login";
import AddressAvatar from "./AddressAvatar";
import Button from "./Button";
import VotingOptions from "./VotingOptions";
import { MACI_FACTORY_ABI, MACI_POLL_ABI } from "../config/macyContracts";

export default function AccountCreationForm() {
  // Refs for SDK clients and related mutable values
  const sessionKeyAccountRef = useRef<any>(null); // Replace 'any' with actual type if known
  const kernelClientRef = useRef<any>(null);      // Replace 'any' with KernelAccountClient type
  const bundlerClientRef = useRef<any>(null);     // Replace 'any' with BundlerClient type
  const semaphoreProofRef = useRef<any>(null);    // Replace 'any' with SemaphoreProof type

  // Smart Account Whitelist State - MOVED HERE
  const [isAccountWhitelisted, setIsAccountWhitelisted] = useState(false);
  const [isVerifyingAccountWhitelist, setIsVerifyingAccountWhitelist] = useState(false);
  const [accountWhitelistError, setAccountWhitelistError] = useState("");

  const sessionPrivateKey = generatePrivateKey();
  const sessionKeySigner = privateKeyToAccount(sessionPrivateKey);

  // Moved the main render log to after all state declarations
  // console.log("[Render] kernelClient:", kernelClient, "isKernelClientReady:", isKernelClientReady, "accountAddress:", accountAddress);

  const [username, setUsername] = useState("semaphore-paymaster-account");
  const [accountAddress, setAccountAddress] = useState("");
  const [isKernelClientReady, setIsKernelClientReady] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [isJoiningSemahoreGroup, setIsJoiningSemaphoreGroup] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [isFirstOptionSelected, setIsFirstOptionSelected] = useState(true);
  const [votingPercentage, setVotingPercentage] = useState(5);
  
  const [userOpHash, setUserOpHash] = useState("");
  const [userOpStatus, setUserOpStatus] = useState("");
  const [userOpCount, setUserOpCount] = useState(0);

  const [isSemaphoreGroupAssigned, setIsSemaphoreGroupAssigned] = useState(false);
  const [semaphoreGroupIdentity, setSemaphoreGroupIdentity] = useState<Identity>();

  const [semaphorePrivateKey, setSemaphorePrivateKey] = useState<string | Uint8Array | Buffer | undefined>();
  const [semaphorePublicKey, setSemaphorePublicKey] = useState<
    string | Uint8Array | Buffer | undefined
  >();

  // Main render log - Corrected Placement
  console.log(
    "[Render] kernelClient.current:", kernelClientRef.current, 
    "isKernelClientReady:", isKernelClientReady, 
    "accountAddress:", accountAddress, 
    "isAccountWhitelisted:", isAccountWhitelisted
  );

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
  }
 
  const encodeSemaphoreProof = (proofInput: any) => {
    if (!proofInput) return null; // Or handle error appropriately
    const {
      merkleTreeDepth,
      merkleTreeRoot,
      nullifier,
      message,
      scope,
      points,
    } = proofInput;

    // const encodedData = encodeAbiParameters(
    //   parseAbiParameters(
    //     "uint256, uint256, uint256, uint256, uint256, uint256[8]"
    //   ),
    //   [merkleTreeDepth, merkleTreeRoot, nullifier, message, scope, points]
    // );

    const encodedData = AbiCoder.defaultAbiCoder().encode(
      ["uint256", "uint256", "uint256", "uint256", "uint256", "uint256[8]"],
      [
        merkleTreeDepth,
        merkleTreeRoot,
        nullifier,
        message,
        scope,
        points,
      ]
    );

    return encodedData;
  };

  const createAccountAndClient = async (passkeyValidator: any) => {
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
          // --- TEMPORARY SIMPLIFICATION FOR TESTING ACCOUNT DEPLOYMENT ---
          // The original complex logic is commented out below.
          
          const zeroDevPaymaster = createZeroDevPaymasterClient({
            chain: CHAIN,
            transport: http(PAYMASTER_URL), // Standard ZeroDev PM URL
            entryPoint: ENTRYPOINT_ADDRESS_V07,
          });
          console.log(
            "Paymaster Middleware (SIMPLIFIED FOR TEST): Routing ALL UserOps to ZeroDev Paymaster for sender:", 
            userOperation.sender, 
            "UserOp:", userOperation
          );
          try {
            return await zeroDevPaymaster.sponsorUserOperation({
              userOperation,
              entryPoint: ENTRYPOINT_ADDRESS_V07,
            });
          } catch (error) {
            console.error("Paymaster Middleware (SIMPLIFIED FOR TEST): Error from ZeroDev Paymaster:", error);
            throw error;
          }
          // --- END OF TEMPORARY SIMPLIFICATION ---

          /* --- ORIGINAL COMPLEX MIDDLEWARE LOGIC (Commented out for test) ---
          
          // const zeroDevPaymaster = createZeroDevPaymasterClient({
          //   chain: CHAIN,
          //   transport: http(PAYMASTER_URL), // Standard ZeroDev PM URL
          //   entryPoint: ENTRYPOINT_ADDRESS_V07,
          // });

          // --- Whitelist Verification UserOperation Logic ---
          const isWhitelistVerificationOp =
            userOperation.callData === '0x' &&
            userOperation.to?.toLowerCase() === userOperation.sender.toLowerCase() &&
            (!userOperation.paymasterAndData || userOperation.paymasterAndData === '0x' || userOperation.paymasterAndData.length <= 2);

          if (isWhitelistVerificationOp) {
            console.log("Paymaster Middleware: Detected Whitelist Verification UserOp for sender:", userOperation.sender);
            try {
              if (!process.env.NEXT_PUBLIC_SMART_ACCOUNT_WHITELIST_URL) {
                console.error("Paymaster Middleware: NEXT_PUBLIC_SMART_ACCOUNT_WHITELIST_URL not configured.");
                throw new Error("Whitelist URL not configured in paymaster.");
              }
              const response = await fetch(process.env.NEXT_PUBLIC_SMART_ACCOUNT_WHITELIST_URL);
              if (!response.ok) {
                console.error("Paymaster Middleware: Failed to fetch smart account whitelist, status:", response.statusText);
                throw new Error(`Paymaster Middleware: Failed to fetch SC whitelist: ${response.statusText}`);
              }
              const whitelistData = await response.json();
              if (!Array.isArray(whitelistData) || !whitelistData.every(item => typeof item === 'string')) {
                console.error("Paymaster Middleware: Whitelist data is not in the expected format.");
                throw new Error("Paymaster Middleware: Whitelist data format error.");
              }
              const lowercasedWhitelist = whitelistData.map(addr => addr.toLowerCase());

              if (lowercasedWhitelist.includes(userOperation.sender.toLowerCase())) {
                console.log("Paymaster Middleware: Sender IS whitelisted for verification Op. Sponsoring with ZeroDev paymaster.");
                return zeroDevPaymaster.sponsorUserOperation({
                  userOperation,
                  entryPoint: ENTRYPOINT_ADDRESS_V07,
                });
              } else {
                console.warn("Paymaster Middleware: Sender IS NOT whitelisted for verification Op. Rejecting sponsorship.");
                throw new Error("Paymaster: Account not whitelisted for verification operation.");
              }
            } catch (err) {
              console.error("Paymaster Middleware: Error during whitelist verification sponsorship logic:", err);
              throw err; // Re-throw to ensure UserOp fails if any part of this check fails
            }
          }

          // --- Semaphore Proof UserOperation Logic (e.g., for voting) ---
          if (!userOperation.factory && semaphoreProofRef.current) { 
            console.log("Paymaster Middleware: Detected Semaphore Proof UserOp for sender:", userOperation.sender);
            const {
              merkleTreeDepth,
              merkleTreeRoot,
              nullifier,
              message,
              scope,
              points,
            } = semaphoreProofRef.current; 

            const paymasterData = encodeAbiParameters(
              parseAbiParameters(
                "uint256, uint256, uint256, uint256, uint256, uint256[8]"
              ),
              [
                merkleTreeDepth,
                merkleTreeRoot,
                nullifier,
                message,
                scope,
                points,
              ]
            );

            console.log("semaphoreProof", semaphoreProofRef.current);
            console.log("proof: ", await verifyProof(semaphoreProofRef.current));
            console.log("paymasterData", paymasterData);
            console.log("userOperation", userOperation);

            const userOpWithPaymasterData = {
              ...userOperation,
              paymaster: process.env.NEXT_PUBLIC_PAYMASTER_CONTRACT, 
              paymasterData,
            };

            console.log(
              "userOpWithPaymasterData",
              userOpWithPaymasterData
            );
            
            let bundlerClientForGas = bundlerClientRef.current; 
            if (!bundlerClientForGas && kernelClientRef.current) { 
                bundlerClientForGas = kernelClientRef.current.extend(bundlerActions(ENTRYPOINT_ADDRESS_V07));
                bundlerClientRef.current = bundlerClientForGas;
            } else if (!bundlerClientForGas) { 
                console.warn("Paymaster Middleware: bundlerClient and kernelClient not available for gas estimation in semaphore proof path. Creating temporary public client with bundler actions.");
                const tempPublicClient = createPublicClient({ chain: CHAIN, transport: http(BUNDLER_URL) });
                bundlerClientForGas = tempPublicClient.extend(bundlerActions(ENTRYPOINT_ADDRESS_V07));
            }

            const gas = await bundlerClientForGas.estimateUserOperationGas({
              userOperation: userOpWithPaymasterData,
              entryPoint: ENTRYPOINT_ADDRESS_V07,
            });

            const result = {
              ...userOpWithPaymasterData,
              ...gas,
            };
            console.log("Paymaster Middleware: Results for Semaphore Op (with gas):", result);
            return result;
          }

          // --- Factory Deployment UserOperation Logic (Initial Account Creation) ---
          if (userOperation.factory && userOperation.factory.length > 2 && userOperation.factory !== "0x") {
            console.log("Paymaster Middleware: Detected Factory UserOp (account deployment) for sender:", userOperation.sender);
            return zeroDevPaymaster.sponsorUserOperation({
              userOperation,
              entryPoint: ENTRYPOINT_ADDRESS_V07,
            });
          }
          
          // --- Fallback: If no other condition matched, do not sponsor ---
          console.warn("Paymaster Middleware: UserOperation did not match any specific sponsorship condition. Sender:", userOperation.sender, "UserOp:", userOperation);
          throw new Error("Paymaster: UserOperation not eligible for sponsorship by this policy.");
          --- END OF ORIGINAL COMPLEX MIDDLEWARE LOGIC --- */
        },
      },
    });

    setIsKernelClientReady(true);
    setAccountAddress(sessionKeyAccountRef.current.address);
    setIsLoggingIn(false);
    console.log("[createAccountAndClient] kernelClientRef.current INITIALIZED:", kernelClientRef.current);
  };

  const handleRegister = async () => {
    setIsRegistering(true);

    const webAuthnKey = await toWebAuthnKey({
      passkeyName: username,
      passkeyServerUrl: PASSKEY_SERVER_URL,
      mode: WebAuthnMode.Register,
    });

    const passkeyValidator = await toPasskeyValidator(publicClient, {
      webAuthnKey,
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      kernelVersion: KERNEL_V3_1,
    });

    await createAccountAndClient(passkeyValidator);

    setIsRegistering(false);
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    console.log("[handleLogin] Attempting login...");

    const webAuthnKey = await toWebAuthnKey({
      passkeyName: username,
      passkeyServerUrl: PASSKEY_SERVER_URL,
      mode: WebAuthnMode.Login,
    });

    const passkeyValidator = await toPasskeyValidator(publicClient, {
      webAuthnKey,
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      kernelVersion: KERNEL_V3_1,
    });

    await createAccountAndClient(passkeyValidator);

    setIsLoggingIn(false);
  };

  const handleVerifySmartAccountWhitelist = async () => {
    console.log("[handleVerifySmartAccountWhitelist] Start. kernelClientRef.current:", kernelClientRef.current, "isKernelClientReady:", isKernelClientReady);
    if (!accountAddress) {
      setAccountWhitelistError("Account not available. Please log in.");
      return;
    }
    if (!kernelClientRef.current) {
        setAccountWhitelistError("Kernel client not initialized. Please ensure you are logged in or try again.");
        console.error("[handleVerifySmartAccountWhitelist] kernelClientRef.current is UNDEFINED here!");
        setIsVerifyingAccountWhitelist(false);
        return;
    }
    // Initialize bundlerClient if it hasn't been from another operation yet
    if (!bundlerClientRef.current) {
        bundlerClientRef.current = kernelClientRef.current.extend(bundlerActions(ENTRYPOINT_ADDRESS_V07));
    }

    setIsVerifyingAccountWhitelist(true);
    setAccountWhitelistError("");

    if (!process.env.NEXT_PUBLIC_SMART_ACCOUNT_WHITELIST_URL) {
      setAccountWhitelistError("Smart account whitelist URL not configured.");
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
        setIsVerifyingAccountWhitelist(false);
        toast.error("Your smart account address is not whitelisted (client pre-check).");
        return;
      }

      // TEMPORARY: Assume whitelisted after client-side check to unblock UI development
      // TODO: Remove this temporary client-side whitelist enforcement once ZeroDev deployment sponsorship is fixed
      // and re-enable the UserOperation-based verification logic commented out below.
      console.warn("TEMPORARY: Smart account is being marked as whitelisted based on client-side check ONLY.");
      setIsAccountWhitelisted(true);
      toast.success("TEMPORARY: Whitelisted (client-side check). UserOp verification skipped.");
      setIsVerifyingAccountWhitelist(false); // Ensure loading state is reset
      return; // IMPORTANT: Return here to SKIPT UserOp sending for now

      /* --- Temporarily Commented Out UserOperation Sending Logic ---
      // Client-side check passed. Now, send a specific UserOperation for paymaster verification.
      console.log("Client-side whitelist pre-check passed. Sending UserOp for paymaster verification...");
      
      if (!kernelClientRef.current || !bundlerClientRef.current) { // Check refs here
        setAccountWhitelistError("Kernel client or bundler client not ready.");
        setIsVerifyingAccountWhitelist(false);
        toast.error("Client not ready. Please try again.");
        return;
      }
      
      const verificationUserOp = {
        to: accountAddress as `0x${string}`, 
        value: BigInt(0),   
        callData: '0x' as `0x${string}`,     
      };

      console.log("Sending verification UserOperation:", verificationUserOp);
      const userOpHash = await kernelClientRef.current.sendUserOperation({ 
        userOperation: verificationOp
      });

      toast.info("Verification UserOperation sent. Waiting for confirmation...");
      setUserOpHash(userOpHash); 

      console.log("Waiting for UserOperation receipt, hash:", userOpHash);
      const receipt = await bundlerClientRef.current.waitForUserOperationReceipt({ 
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

    } catch (error: any) {
      // This catch block will now mainly handle errors from the fetch operation (client-side pre-check)
      // or any errors if the UserOperation block were active and failed before its own try/catch.
      console.error("Error during smart account whitelist verification (client-side phase or general error):", error);
      let errorMessage = "Error during smart account whitelist verification.";
      if (error.message) {
        errorMessage = error.message;
      }
      // Specific error parsing for UserOp errors is less relevant here now, but kept for when re-enabled
      if (error.cause && typeof error.cause.shortMessage === 'string') {
          errorMessage = error.cause.shortMessage;
      } else if (typeof error.shortMessage === 'string') {
          errorMessage = error.shortMessage;
      }

      if (errorMessage.toLowerCase().includes("rejected by paymaster") || errorMessage.toLowerCase().includes("paymaster validation failed")) {
          errorMessage = "Verification rejected by Paymaster: Account may not be whitelisted or an internal paymaster error occurred.";
      } else if (errorMessage.toLowerCase().includes("deadline exceeded") || errorMessage.toLowerCase().includes("timeout")) {
        errorMessage = "Verification timed out. The paymaster may not have sponsored the operation, or network is congested.";
      }

      setAccountWhitelistError(errorMessage);
      setIsAccountWhitelisted(false);
      toast.error(errorMessage);
    } finally {
      setIsVerifyingAccountWhitelist(false);
    }
  };

  const joinSemaphoreGroup = async () => {
      console.log("[joinSemaphoreGroup] Start. kernelClientRef.current:", kernelClientRef.current, "isKernelClientReady:", isKernelClientReady);
      if (!kernelClientRef.current) { // Add check for kernelClientRef.current
        console.error("[joinSemaphoreGroup] kernelClientRef.current is UNDEFINED. Cannot proceed.");
        toast.error("Kernel client not available. Please try logging in again.");
        setIsJoiningSemaphoreGroup(false); // Reset loading state if any
        return;
      }
      setIsJoiningSemaphoreGroup(true);
      const identity = new Identity();
      const { privateKey, publicKey, commitment } = identity;

      const callData = await kernelClientRef.current.account.encodeCallData({ // Use kernelClientRef.current
        to: process.env.NEXT_PUBLIC_GATEKEEPER_CONTRACT,
        value: BigInt(0),
        data: encodeFunctionData({
          abi: GATEKEEPER_ABI,
          functionName: "enter",
          args: [0, commitment],
        }),
      });

      const userOpHash = await kernelClientRef.current.sendUserOperation({
        userOperation: {
          callData,
        },
      });

      setSemaphorePrivateKey(privateKey);
      setSemaphorePublicKey(publicKey.toString());

      setUserOpHash(userOpHash);

      // Ensure bundlerClientRef.current is set if not already
      if (!bundlerClientRef.current && kernelClientRef.current) {
          bundlerClientRef.current = kernelClientRef.current.extend(bundlerActions(ENTRYPOINT_ADDRESS_V07));
      }
      if (!bundlerClientRef.current) {
          console.error("[joinSemaphoreGroup] bundlerClientRef.current is UNDEFINED after attempting init. Cannot wait for receipt.");
          toast.error("Bundler client not available. Cannot confirm transaction.");
          setIsJoiningSemaphoreGroup(false);
          return;
      }

      await bundlerClientRef.current.waitForUserOperationReceipt({ // Use bundlerClientRef.current
        hash: userOpHash,
      });

      setUserOpCount(userOpCount + 1);

      const opHashLink = `https://jiffyscan.xyz/userOpHash/${userOpHash}?network=sepolia`;

      const successMessage = buildSuccessMessage("You are now part of the group 😎", opHashLink) ;
      toast(successMessage);

      setIsSemaphoreGroupAssigned(true);
      setSemaphoreGroupIdentity(identity);
      setIsJoiningSemaphoreGroup(false);
  };

  const vote = async () => {
    if (semaphoreGroupIdentity) {
        if (!kernelClientRef.current) { // Add check
            console.error("[vote] kernelClientRef.current is UNDEFINED. Cannot proceed.");
            toast.error("Kernel client not available for voting.");
            return;
        }
        setIsVoting(true);
        const semaphoreSubgraph = new SemaphoreSubgraph(
          "https://api.studio.thegraph.com/query/65978/sesmaphore-paymaster/0.0.1"
        );
        const groupResponse = await semaphoreSubgraph.getGroup(
          process.env.NEXT_PUBLIC_SEMAPHORE_GROUP_ID as string,
          {
            members: true,
          }
        );

        const group = new Group(groupResponse.members);

        const proof = await generateProof(
          semaphoreGroupIdentity,
          group,
          0,
          0
        );

        semaphoreProofRef.current = proof; // Use semaphoreProofRef.current
        const votingValue = isFirstOptionSelected ? 1 : 2;

        const callData = await kernelClientRef.current.account.encodeCallData({ // Use kernelClientRef.current
          to: process.env.NEXT_PUBLIC_STORAGE_CONTRACT,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: STORAGE_ABI,
            functionName: "store",
            args: [votingValue],
          }),
        });

        const userOpHash = await kernelClientRef.current.sendUserOperation({
          userOperation: {
            callData,
          },
        });

      const opHashLink = `https://jiffyscan.xyz/userOpHash/${userOpHash}?network=sepolia`;
      const successMessage = buildSuccessMessage("Vote submitted successfully 🗳️", opHashLink);

      toast(successMessage);
      setIsVoting(false);
      setUserHasVoted(true);
    } 
  };

  const maciVote = async () => {

      if (semaphoreGroupIdentity) {
        if (!kernelClientRef.current) { // Add check
            console.error("[maciVote] kernelClientRef.current is UNDEFINED. Cannot proceed.");
            toast.error("Kernel client not available for MACI vote.");
            return;
        }
        setIsVoting(true);
        const semaphoreSubgraph = new SemaphoreSubgraph(
          "https://api.studio.thegraph.com/query/65978/sesmaphore-paymaster/0.0.1"
        );
        const groupResponse = await semaphoreSubgraph.getGroup(
          process.env.NEXT_PUBLIC_SEMAPHORE_GROUP_ID as string,
          {
            members: true,
          }
        );

        const group = new Group(groupResponse.members);

        console.log("group", group);

        const proof = await generateProof(
          semaphoreGroupIdentity,
          group,
          BigInt(0),
          BigInt(Number.parseInt(process.env.NEXT_PUBLIC_SEMAPHORE_GROUP_ID as string))
        );

        semaphoreProofRef.current = proof; // Use semaphoreProofRef.current

        const registerEncKeypair = new Keypair();

        const registerPubKey = registerEncKeypair.pubKey;
        const registerPrivKey = registerEncKeypair.privKey;

        console.log("semaphoreProof", semaphoreProofRef.current);

        const isValidProof = await verifyProof(semaphoreProofRef.current);

        console.log("isValidProof", isValidProof);

        const signupGatekeeperData = encodeSemaphoreProof(semaphoreProofRef.current); // Use semaphoreProofRef.current
        const DEFAULT_IVCP_DATA =
          "0x0000000000000000000000000000000000000000000000000000000000000000";

        const callData = await kernelClientRef.current.account.encodeCallData({ // Use kernelClientRef.current
          to: process.env.NEXT_PUBLIC_MACI_FACTORY,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: MACI_FACTORY_ABI,
            functionName: "signUp",
            args: [
              (registerPubKey as any).asContractParam(),
              `${signupGatekeeperData}`,
              DEFAULT_IVCP_DATA,
            ],
          }),
        });

        const registerUserOpHash = await kernelClientRef.current.sendUserOperation({
          userOperation: {
            callData,
          },
        });

        console.log("UserOp hash:", registerUserOpHash);
        console.log("Waiting for UserOp to complete...");
        setVotingPercentage(50);

        // Ensure bundlerClientRef.current is set
        let registerBundlerClient = bundlerClientRef.current;
        if (!registerBundlerClient && kernelClientRef.current) {
            registerBundlerClient = kernelClientRef.current.extend(bundlerActions(ENTRYPOINT_ADDRESS_V07));
            bundlerClientRef.current = registerBundlerClient; // Persist to ref
        } else if (!registerBundlerClient) {
            console.error("[maciVote] registerBundlerClient could not be initialized.");
            toast.error("Bundler client error during MACI signup.");
            setIsVoting(false);
            return;
        }
        // const registerBundlerClient = kernelClientRef.current.extend( // Original line
        //   bundlerActions(ENTRYPOINT_ADDRESS_V07)
        // );

        const registerReceipt = await registerBundlerClient.waitForUserOperationReceipt(
          {
            hash: registerUserOpHash,
            timeout: 60000,
          }
        );

        setVotingPercentage(55);

        const numSignUps = await publicClient.readContract({
          address: process.env.NEXT_PUBLIC_MACI_FACTORY as `0x${string}`,
          abi: MACI_FACTORY_ABI,
          functionName: "numSignUps",
        });

        console.log("numSignUps: ", numSignUps);

        console.log(
          `r1: ${registerReceipt.success}, ${registerReceipt.sender}, ${registerReceipt.actualGasUsed}`
        );
        console.log("r2: ", registerReceipt);

        console.log(
          `View completed UserOp here: https://jiffyscan.xyz/userOpHash/${registerUserOpHash}`
        );

        setVotingPercentage(66);
        // ****************************************************
        // VOTING
        // ****************************************************

         const voteOptionIndex = isFirstOptionSelected ? 1 : 2;
         const newVoteWeight = 1;
         const nonce = 1;
         const pollId = 0;
         const userSalt = genRandomSalt();

         const coordinatorPubKey = PubKey.deserialize(
           "macipk.925ba4210043059acb5aebcda6b389b070cffd58e2077e69119db00051550c31"
         );

         const encKeypair = new Keypair();

         const stateIndex = Number.parseInt(numSignUps as string) - 1;

         // create the command object
         const command: PCommand = new PCommand(
           BigInt(stateIndex <= 0 ? 0 : stateIndex - 1),
           registerPubKey,
           BigInt(voteOptionIndex),
           BigInt(newVoteWeight),
           BigInt(nonce),
           BigInt(pollId),
           userSalt
         );

         // sign the command with the user private key
         const signature = command.sign(registerPrivKey);
         // encrypt the command using a shared key between the user and the coordinator
         const message = command.encrypt(
           signature,
           Keypair.genEcdhSharedKey(encKeypair.privKey, coordinatorPubKey)
         );

          setVotingPercentage(76);


        const voteCallData = await kernelClientRef.current.account.encodeCallData({ // Use kernelClientRef.current
          to: process.env.NEXT_PUBLIC_MACI_POLL,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: MACI_POLL_ABI,
            functionName: "publishMessage",
            args: [
              message.asContractParam(),
              encKeypair.pubKey.asContractParam(),
            ],
          }),
        });

        const voteUserOpHash = await kernelClientRef.current.sendUserOperation({
          userOperation: {
            callData: voteCallData,
          },
        });

         setVotingPercentage(95);


        // Ensure bundlerClientRef.current is set for vote
        let voteBundlerClient = bundlerClientRef.current;
        if (!voteBundlerClient && kernelClientRef.current) {
            voteBundlerClient = kernelClientRef.current.extend(bundlerActions(ENTRYPOINT_ADDRESS_V07));
            bundlerClientRef.current = voteBundlerClient; // Persist to ref
        } else if (!voteBundlerClient) {
            console.error("[maciVote] voteBundlerClient could not be initialized.");
            toast.error("Bundler client error during MACI vote publishing.");
            setIsVoting(false);
            return;
        }
        // const voteBundlerClient = kernelClientRef.current.extend( // Original line
        //   bundlerActions(ENTRYPOINT_ADDRESS_V07)
        // );

        const voteReceipt =
          await voteBundlerClient.waitForUserOperationReceipt({
            hash: voteUserOpHash,
            timeout: 60000,
          });


         console.log(
           `r1: ${voteReceipt.success}, ${voteReceipt.sender}, ${voteReceipt.actualGasUsed}`
         );
         console.log(`r2: ${JSON.stringify(voteReceipt.receipt.transactionHash)}`);

         console.log(
           `View completed UserOp here: https://jiffyscan.xyz/userOpHash/${userOpHash}`
         ); 


        setVotingPercentage(100);
        const sucessMessage = buildSuccessMessage("Vote submitted successfully 🗳️", `https://jiffyscan.xyz/userOpHash/${userOpHash}`)
        toast(sucessMessage);
        setIsVoting(false);
        setUserHasVoted(true);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-12">
      <div className="flex flex-col">
        {!accountAddress && (
          <Login
            isLoggingIn={isLoggingIn}
            isRegistering={isRegistering}
            handleLogin={handleLogin}
            handleRegister={handleRegister}
          />
        )}

        <div className="pt-4">
          {accountAddress && <AddressAvatar accountAddress={accountAddress} />}

          {/* Smart Account Whitelist Verification Section */}
          {accountAddress && !isAccountWhitelisted && (
            <div className="my-4 p-4 border rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Account Whitelist Verification</h3>
              <p className="mb-3 text-sm">
                Your smart account address: {accountAddress}<br />
                This address needs to be whitelisted to proceed.
              </p>
              <Button
                label="Verify Whitelist Status"
                isLoading={isVerifyingAccountWhitelist}
                disabled={isVerifyingAccountWhitelist || !accountAddress || !isKernelClientReady}
                handleRegister={handleVerifySmartAccountWhitelist}
                color="blue"
              />
              {accountWhitelistError && (
                <p className="mt-2 text-sm text-red-500">{accountWhitelistError}</p>
              )}
            </div>
          )}
          {accountAddress && isAccountWhitelisted && (
            <div className="my-2 p-3 bg-green-100 text-green-700 rounded-md text-center">
              Smart account successfully verified and whitelisted!
            </div>
          )}

          {/* "Join the group" button: 
              Conditions related to old whitelist/POAP removed. 
              Will be conditional on new smart account whitelist status later.
          */}
          {accountAddress &&
            isAccountWhitelisted &&
            !isSemaphoreGroupAssigned && 
            !semaphoreGroupIdentity && (
              <div className="my-4">
                <Button
                  label="Join the group"
                  isLoading={isJoiningSemahoreGroup}
                  disabled={!isKernelClientReady || isJoiningSemahoreGroup}
                  handleRegister={joinSemaphoreGroup}
                  color="green"
                />
              </div>
            )}

          {/* "Vote" section: 
              Conditions related to old whitelist/POAP removed.
              Will be conditional on new smart account whitelist status later.
          */}
          {accountAddress &&
            isAccountWhitelisted &&
            isSemaphoreGroupAssigned &&
            semaphoreGroupIdentity &&
            !userHasVoted && (
              <div className="mb-2 text-center font-medium">
                <VotingOptions
                  setIsFirstOptionSelected={setIsFirstOptionSelected}
                  isFirstOptionSelected={isFirstOptionSelected}
                />
                <Button
                  label="Vote"
                  isLoading={isVoting}
                  disabled={!isKernelClientReady || isVoting}
                  //handleRegister={vote}
                  handleRegister={maciVote}
                  color="pink"
                />
                {isVoting && (
                  <div className="mt-2 h-1 w-full bg-neutral-200 dark:bg-neutral-600">
                    <div className="h-1 bg-purple-500" style={{width: `${votingPercentage}%`}} />
                  </div>
                )}
              </div>
            )}

          {userHasVoted && (
            <div className="text-center text-xl pt-4">
              Thanks for your vote.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

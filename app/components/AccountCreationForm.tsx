"use client";

import React, { useState } from "react";

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
import { http, encodeFunctionData } from "viem";

import { Identity } from "@semaphore-protocol/identity";
import { SemaphoreSubgraph } from "@semaphore-protocol/data";
import { generateProof } from "@semaphore-protocol/proof";
import { Group } from "@semaphore-protocol/group";


import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


import {
  BUNDLER_URL,
  CHAIN,
  PASSKEY_SERVER_URL,
  PAYMASTER_URL,
} from "../config/zerodev";

import { publicClient } from "../config/viem";
import { GATEKEEPER_ABI } from "../config/gatekeeper";
import { STORAGE_ABI } from "../config/storage";
import { GET_GROUP_DATA } from "../config/apollo";
import { useQuery } from "@apollo/client";
import Login from "./Login";
import AddressAvatar from "./AddressAvatar";
import Button from "./Button";
import VotingOptions from "./VotingOptions";

const sessionPrivateKey = generatePrivateKey();
const sessionKeySigner = privateKeyToAccount(sessionPrivateKey);

let sessionKeyAccount: any;
let kernelClient: any;
let semaphoreProof: any;

export default function AccountCreationForm() {
  const [username, setUsername] = useState("semaphore-paymaster-account");

  const [accountAddress, setAccountAddress] = useState("");
  const [isKernelClientReady, setIsKernelClientReady] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [isJoiningSemahoreGroup, setIsJoiningSemaphoreGroup] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [isFirstOptionSelected, setIsFirstOptionSelected] = useState(true);
  
  const [userOpHash, setUserOpHash] = useState("");
  const [userOpStatus, setUserOpStatus] = useState("");
  const [userOpCount, setUserOpCount] = useState(0);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [isBalanceChecked, setIsBalanceChecked] = useState(false);
  const [poapBalance, setPoapBalance] = useState("0");
  const [isSemaphoreGroupAssigned, setIsSemaphoreGroupAssigned] = useState(false);
  const [semaphoreGroupIdentity, setSemaphoreGroupIdentity] = useState<Identity>();


  const [semaphorePrivateKey, setSemaphorePrivateKey] = useState<string | Uint8Array | Buffer | undefined>();
  const [semaphorePublicKey, setSemaphorePublicKey] = useState<
    string | Uint8Array | Buffer | undefined
  >();


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

    sessionKeyAccount = await createKernelAccount(publicClient, {
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      kernelVersion: KERNEL_V3_1,
      plugins: {
        sudo: passkeyValidator,
        regular: permissionValidator,
      },
    });

    kernelClient = createKernelAccountClient({
      account: sessionKeyAccount,
      chain: CHAIN,
      bundlerTransport: http(BUNDLER_URL),
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      middleware: {
        sponsorUserOperation: async ({ userOperation }) => {
          const zeroDevPaymaster = await createZeroDevPaymasterClient({
            chain: CHAIN,
            transport: http(PAYMASTER_URL),
            entryPoint: ENTRYPOINT_ADDRESS_V07,
          });

          //////////////////////////////////////////////////////////////
          // ** Enable this if you want to use the custom Paymaster **
          ////////////////////////////////////////////////////////////////
          // if (!userOperation.factory && semaphoreProof) {
          //   const {
          //     merkleTreeDepth,
          //     merkleTreeRoot,
          //     nullifier,
          //     message,
          //     scope,
          //     points,
          //   } = semaphoreProof;

          //   const paymasterData = encodeAbiParameters(
          //     parseAbiParameters(
          //       "uint48, uint48, uint256, uint256, uint256, uint256, uint256, uint256[8]"
          //     ),

          //     [
          //       0,
          //       0,
          //       merkleTreeDepth,
          //       merkleTreeRoot,
          //       nullifier,
          //       message,
          //       scope,
          //       points,
          //     ]
          //   );

          //   // console.log("semaphoreProof", semaphoreProof);
          //   // console.log("paymasterData", paymasterData);
          //   // console.log("userOperation", userOperation);

          //   const result = {
          //     ...userOperation,
          //     paymaster: "0x94b8c54a73cba9f2b942d76f2b4ce318330e36d7",
          //     paymasterData,
          //     callGasLimit: 0x7a1200,
          //     paymasterPostOpGasLimit: BigInt(9e18),
          //     paymasterVerificationGasLimit: BigInt(9e18),
          //     verificationGasLimit: 0x927c0,
          //     preVerificationGas: 0x15f90,
          //   };

          //   return result;
          // }

          return zeroDevPaymaster.sponsorUserOperation({
            userOperation,
            entryPoint: ENTRYPOINT_ADDRESS_V07,
          });
        },
      },
    });

    setIsKernelClientReady(true);
    setAccountAddress(sessionKeyAccount.address);
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

  const checkPoapBalance = async (account: `0x${string}`) => {
    setIsCheckingBalance(true);
    const balance = await publicClient.getL1TokenBalance({
      account,
      token: process.env.NEXT_PUBLIC_POAP_CONTRACT as `0x${string}`,
    });

    setPoapBalance(balance.toString());
    setIsCheckingBalance(false);
    setIsBalanceChecked(true);
    toast('You are elegible! 🎉');
  };

  const joinSemaphoreGroup = async () => {
      setIsJoiningSemaphoreGroup(true);
      const identity = new Identity();
      const { privateKey, publicKey, commitment } = identity;

      const callData = await kernelClient.account.encodeCallData({
        to: process.env.NEXT_PUBLIC_GATEKEEPER_CONTRACT,
        value: BigInt(0),
        data: encodeFunctionData({
          abi: GATEKEEPER_ABI,
          functionName: "enter",
          args: [0, commitment],
        }),
      });

      const userOpHash = await kernelClient.sendUserOperation({
        userOperation: {
          callData,
        },
      });

      setSemaphorePrivateKey(privateKey);
      setSemaphorePublicKey(publicKey.toString());

      setUserOpHash(userOpHash);

      const bundlerClient = kernelClient.extend(
        bundlerActions(ENTRYPOINT_ADDRESS_V07)
      );
      await bundlerClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });

      setUserOpCount(userOpCount + 1);

      const opHashLink = `https://jiffyscan.xyz/userOpHash/${userOpHash}?network=sepolia`;
      const successMessage = (
        <div className="flex flex-col">
          <div>You are now part of the group 😎</div>
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
      );

      toast(successMessage);

      setIsSemaphoreGroupAssigned(true);
      setSemaphoreGroupIdentity(identity);
      setIsJoiningSemaphoreGroup(false);
    };


  const vote = async () => {
    if (semaphoreGroupIdentity) {
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

        semaphoreProof = proof;
        const votingValue = isFirstOptionSelected ? 1 : 2;

        const callData = await kernelClient.account.encodeCallData({
          to: process.env.NEXT_PUBLIC_STORAGE_CONTRACT,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: STORAGE_ABI,
            functionName: "store",
            args: [votingValue],
          }),
        });

        const userOpHash = await kernelClient.sendUserOperation({
          userOperation: {
            callData,

          },
        });

       const opHashLink = `https://jiffyscan.xyz/userOpHash/${userOpHash}?network=sepolia`;
       const successMessage = (
         <div className="flex flex-col">
           <div>Vote submitted successfully 🗳️</div>
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
       );

      toast(successMessage);
      setIsVoting(false);
      setUserHasVoted(true);
    } 
  };

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
          {accountAddress && !isBalanceChecked && (
            <Button
              label="Check Eligibility"
              isLoading={isCheckingBalance}
              disabled={isLoggingIn || isRegistering || isCheckingBalance}
              handleRegister={async () =>
                await checkPoapBalance(accountAddress as `0x${string}`)
              }
              color="red"
            />
          )}

          {accountAddress &&
            isBalanceChecked &&
            parseInt(poapBalance) === 0 && (
              <div className="mb-2 text-center font-medium text-red-600">
                You do not have any POAPs. You need at least one to join the
                group.
              </div>
            )}

          {accountAddress &&
            parseInt(poapBalance) > 0 &&
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

          {accountAddress &&
            isSemaphoreGroupAssigned &&
            semaphoreGroupIdentity &&
            !userHasVoted && (
              <div className="mb-2 text-center font-medium">
                <VotingOptions setIsFirstOptionSelected={setIsFirstOptionSelected} isFirstOptionSelected={isFirstOptionSelected} />
                <Button
                  label="Vote"
                  isLoading={isVoting}
                  disabled={!isKernelClientReady || isVoting}
                  handleRegister={vote}
                  color="pink"
                />
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

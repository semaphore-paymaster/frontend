"use client";

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

import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";

import { toPermissionValidator } from "@zerodev/permissions";
import { toECDSASigner } from "@zerodev/permissions/signers";
import { toSudoPolicy } from "@zerodev/permissions/policies";
import {
  bundlerActions,
  ENTRYPOINT_ADDRESS_V07,
  walletClientToSmartAccountSigner,
} from "permissionless";

import React, { useState } from "react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  http,
  encodeFunctionData,
  createPublicClient,
  encodeAbiParameters,
  parseAbiParameters,
  type Address,
} from "viem";

import { Identity } from "@semaphore-protocol/identity";

import { KERNEL_V3_1 } from "@zerodev/sdk/constants";

import { SemaphoreSubgraph } from "@semaphore-protocol/data";
import { generateProof } from "@semaphore-protocol/proof";
import { Group } from "@semaphore-protocol/group";


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
// import { walletClient } from "../config/walletClient";

import { useWalletClient } from "wagmi";
import { WalletOptions } from "./WalletOptions";


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
  const [isSendingUserOp, setIsSendingUserOp] = useState(false);
  const [userOpHash, setUserOpHash] = useState("");
  const [userOpStatus, setUserOpStatus] = useState("");
  const [userOpCount, setUserOpCount] = useState(0);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [isBalanceChecked, setIsBalanceChecked] = useState(false);
  const [poapBalance, setPoapBalance] = useState("0");
  const [isSemaphoreGroupAssigned, setIsSemaphoreGroupAssigned] = useState(false);
  const [semaphoreGroupIdentity, setSemaphoreGroupIdentity] = useState<Identity>();
  // const { loading, error, data } = useQuery(GET_GROUP_DATA); // Data from subgraph, not being used anymore.
  const [semaphorePrivateKey, setSemaphorePrivateKey] = useState<string | Uint8Array | Buffer | undefined>();
  const [semaphorePublicKey, setSemaphorePublicKey] = useState<
    string | Uint8Array | Buffer | undefined
  >();

  const [account, setAccount] = useState<Address>();
  const walletClient = useWalletClient();

  const createAccountAndClient = async () => {

    const smartAccountSigner = walletClientToSmartAccountSigner(walletClient);

    const publicClient = createPublicClient({
      transport: http("https://eth-sepolia.g.alchemy.com/v2/demo"),
    });

    console.log("smartAccountSigner", smartAccountSigner);

    // Pass your `smartAccountSigner` to the validator
    const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
      signer: smartAccountSigner,
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      kernelVersion: KERNEL_V3_1,
    });

    const ecdsaSigner = await toECDSASigner({
      signer: smartAccountSigner,
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
        sudo: ecdsaValidator,
        regular: permissionValidator,
      },
    });

    kernelClient = createKernelAccountClient({
      account: sessionKeyAccount,
      chain: CHAIN,
      bundlerTransport: http(BUNDLER_URL),
      // bundlerTransport: http(
      //   "https://public.stackup.sh/api/v1/node/ethereum-sepolia"
      // ),
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      middleware: {
        sponsorUserOperation: async ({ userOperation }) => {
          const zeroDevPaymaster = await createZeroDevPaymasterClient({
            chain: CHAIN,
            transport: http(PAYMASTER_URL),
            entryPoint: ENTRYPOINT_ADDRESS_V07,
          });

          if (!userOperation.factory && semaphoreProof) {
            const {
              merkleTreeDepth,
              merkleTreeRoot,
              nullifier,
              message,
              scope,
              points,
            } = semaphoreProof;

            const paymasterData = encodeAbiParameters(
              parseAbiParameters(
                "uint48, uint48, uint256, uint256, uint256, uint256, uint256, uint256[8]"
              ),

              [
                0,
                0,
                merkleTreeDepth,
                merkleTreeRoot,
                nullifier,
                message,
                scope,
                points,
              ]
            );

            // console.log("semaphoreProof", semaphoreProof);
            // console.log("paymasterData", paymasterData);
            // console.log("userOperation", userOperation);

            const result = {
              ...userOperation,
              paymaster: "0x94b8c54a73cba9f2b942d76f2b4ce318330e36d7",
              paymasterData,
              callGasLimit: 0x7a1200,
              paymasterPostOpGasLimit: BigInt(9e18),
              paymasterVerificationGasLimit: BigInt(9e18),
              verificationGasLimit: 0x927c0,
              preVerificationGas: 0x15f90,
            };

            return result;
          }

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

    await createAccountAndClient();

    setIsRegistering(false);
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);

    // const webAuthnKey = await toWebAuthnKey({
    //   passkeyName: username,
    //   passkeyServerUrl: PASSKEY_SERVER_URL,
    //   mode: WebAuthnMode.Login,
    // });

    // const passkeyValidator = await toPasskeyValidator(publicClient, {
    //   webAuthnKey,
    //   entryPoint: ENTRYPOINT_ADDRESS_V07,
    //   kernelVersion: KERNEL_V3_1,
    // });

    // await createAccountAndClient(passkeyValidator);

    setIsLoggingIn(false);
  };

  const handleSendUserOp = async () => {
    setIsSendingUserOp(true);
    setUserOpStatus("Joining...");

    const identity = new Identity();
    const {
      privateKey, publicKey, commitment
    } = identity;

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
        callData
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

    const userOpMessage =
      userOpCount === 0
        ? `First UserOp completed. <a href="https://jiffyscan.xyz/userOpHash/${userOpHash}?network=sepolia" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-700">Click here to view.</a> <br> Now try sending another UserOp.`
        : `UserOp completed. <a href="https://jiffyscan.xyz/userOpHash/${userOpHash}?network=sepolia" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-700">Click here to view.</a> <br> Notice how this UserOp costs a lot less gas and requires no prompting.`;

    setUserOpStatus(userOpMessage);
    setIsSendingUserOp(false);  
    setIsSemaphoreGroupAssigned(true);
    setSemaphoreGroupIdentity(identity);
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
  };

  const handleVoting = async () => {
    if (semaphoreGroupIdentity) {
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

        const callData = await kernelClient.account.encodeCallData({
          to: process.env.NEXT_PUBLIC_STORAGE_CONTRACT,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: STORAGE_ABI,
            functionName: "store",
            args: [6],
          }),
        });

        setIsSendingUserOp(true);

        const userOpHash = await kernelClient.sendUserOperation({
          userOperation: {
            callData,

          },
        });


        setIsSendingUserOp(false);

        console.log("userOpHash", userOpHash);
    } 
  };

  return (
    <div className="grid grid-cols-1 gap-12">
      <div className="flex flex-col">
        <div className="grid grid-cols-1 gap-4 mb-4">
         {/* <WalletOptions /> */}
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            {/* <input
                    type="text"
                    placeholder="Your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg w-full mb-4" // Added w-full and mb-4 for full width and margin-bottom
                  /> */}
            <button
              onClick={handleRegister}
              disabled={isRegistering || isLoggingIn}
              className="flex justify-center items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 w-full" // Added w-full for full width
            >
              {isRegistering ? <div className="spinner"></div> : "Register"}
            </button>
          </div>
          <div>
            <div className="h-full flex flex-col justify-end">
              <button
                onClick={handleLogin}
                disabled={isLoggingIn || isRegistering}
                className="flex justify-center items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 w-full" // Matched the classes of the Register button
              >
                {isLoggingIn ? <div className="spinner"></div> : "Login"}
              </button>
            </div>
          </div>
        </div>
        <div className="border-t-2 pt-4">
          {accountAddress && (
            <div className="mb-2 text-center font-medium">
              Account Address:{" "}
              <a
                href={`https://jiffyscan.xyz/account/${accountAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
              >
                {accountAddress}
              </a>
            </div>
          )}
          {accountAddress && parseInt(poapBalance) > 0 && (
            <div className="mb-2 text-center font-medium">
              Can I join the group?:{" "}
              <span>
                {parseInt(poapBalance) > 0
                  ? "Yes!"
                  : "Unfortunately you are not eligible"}
              </span>
            </div>
          )}
          {accountAddress && (
            <button
              onClick={async () =>
                await checkPoapBalance(accountAddress as `0x${string}`)
              }
              disabled={isLoggingIn || isRegistering || isCheckingBalance}
              className={`w-full mb-10 px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 flex justify-center items-center ${
                isKernelClientReady && !isSendingUserOp
                  ? "bg-red-500 hover:bg-red-700 focus:ring-red-500"
                  : "bg-gray-500"
              }`}
            >
              {isCheckingBalance ? (
                <div className="spinner"></div>
              ) : (
                "Check Eligibility"
              )}
            </button>
          )}

          {accountAddress &&
            isBalanceChecked &&
            parseInt(poapBalance) === 0 && (
              <div className="mb-2 text-center font-medium text-red-600">
                You don't have any POAPs. You need at least one to join the
                group.
              </div>
            )}

          {accountAddress && parseInt(poapBalance) > 0 && (
            <>
              <button
                onClick={handleSendUserOp}
                disabled={!isKernelClientReady || isSendingUserOp}
                className={`w-full px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 flex justify-center items-center ${
                  isKernelClientReady && !isSendingUserOp
                    ? "bg-green-500 hover:bg-green-700 focus:ring-green-500"
                    : "bg-gray-500"
                }`}
              >
                {isSendingUserOp ? (
                  <div className="spinner"></div>
                ) : (
                  "Join the group"
                )}
              </button>
              {userOpHash && (
                <>
                  <div
                    className="mt-2 text-center"
                    dangerouslySetInnerHTML={{
                      __html: userOpStatus,
                    }}
                  />

                  <div>
                    <strong>Please keep these values in a safe place.</strong>
                    <div>
                      Private Key: <pre>{semaphorePrivateKey}</pre>
                    </div>
                    <div>
                      Public Key: <pre>{semaphorePublicKey}</pre>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {accountAddress &&
            isSemaphoreGroupAssigned &&
            semaphoreGroupIdentity && (
              <button
                onClick={handleVoting}
                disabled={!isKernelClientReady || isSendingUserOp}
                className={`w-full px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 flex justify-center items-center ${
                  isKernelClientReady && !isSendingUserOp
                    ? "bg-pink-500 hover:bg-pink-700 focus:ring-pink-500"
                    : "bg-gray-500"
                }`}
              >
                {isSendingUserOp ? <div className="spinner"></div> : "Vote"}
              </button>
            )}
        </div>
      </div>
    </div>
  );
}

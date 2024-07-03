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
import { toPermissionValidator } from "@zerodev/permissions";
import { toECDSASigner } from "@zerodev/permissions/signers";
import { toSudoPolicy } from "@zerodev/permissions/policies";
import { bundlerActions, ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import React, { useState } from "react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { http } from "viem";


import {
  BUNDLER_URL,
  CHAIN,
  PASSKEY_SERVER_URL,
  PAYMASTER_URL,
} from "../config/zerodev";

import { publicClient } from "../config/viem";


const sessionPrivateKey = generatePrivateKey();
const sessionKeySigner = privateKeyToAccount(sessionPrivateKey);

let sessionKeyAccount: any;
let kernelClient: any;

export default function AccountCreationForm() {
  const [username, setUsername] = useState("user");
  const [accountAddress, setAccountAddress] = useState("");
  const [isKernelClientReady, setIsKernelClientReady] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSendingUserOp, setIsSendingUserOp] = useState(false);
  const [userOpHash, setUserOpHash] = useState("");
  const [userOpStatus, setUserOpStatus] = useState("");
  const [userOpCount, setUserOpCount] = useState(0);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [poapBalance, setPoapBalance] = useState("0");

  const createAccountAndClient = async (passkeyValidator: any) => {
    const ecdsaSigner = await toECDSASigner({
      signer: sessionKeySigner,
    });

    const sudoPolicy = await toSudoPolicy({});

    const permissionValidator = await toPermissionValidator(publicClient, {
      signer: ecdsaSigner,
      policies: [sudoPolicy],
      entryPoint: ENTRYPOINT_ADDRESS_V07,
    });

    sessionKeyAccount = await createKernelAccount(publicClient, {
      entryPoint: ENTRYPOINT_ADDRESS_V07,
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

  // Function to be called when "Register" is clicked
  const handleRegister = async () => {
    console.log("Registering with username:", username);
    setIsRegistering(true);

    const webAuthnKey = await toWebAuthnKey({
      passkeyName: username,
      passkeyServerUrl: PASSKEY_SERVER_URL,
      mode: WebAuthnMode.Register,
    });

    const passkeyValidator = await toPasskeyValidator(publicClient, {
      webAuthnKey,
      passkeyServerUrl: PASSKEY_SERVER_URL,
      entryPoint: ENTRYPOINT_ADDRESS_V07,
    });

    await createAccountAndClient(passkeyValidator);

    setIsRegistering(false);
    window.alert("Register done.  Try sending UserOps.");
  };

  const handleLogin = async () => {
    console.log("Logging in with username:", username);
    setIsLoggingIn(true);

    const webAuthnKey = await toWebAuthnKey({
      passkeyName: username,
      passkeyServerUrl: PASSKEY_SERVER_URL,
      mode: WebAuthnMode.Login,
    });

    const passkeyValidator = await toPasskeyValidator(publicClient, {
      webAuthnKey,
      passkeyServerUrl: PASSKEY_SERVER_URL,
      entryPoint: ENTRYPOINT_ADDRESS_V07,
    });

    await createAccountAndClient(passkeyValidator);

    setIsLoggingIn(false);
    window.alert("Login done.  Try sending UserOps.");
  };

  const handleSendUserOp = async () => {
    setIsSendingUserOp(true);
    setUserOpStatus("Sending UserOp...");
    console.log("Sending userop with username:", username);

    const userOpHash = await kernelClient.sendUserOperation({
      userOperation: {
        callData: await sessionKeyAccount.encodeCallData({
          to: "0x0000000000000000000000000000000000000000",
          value: BigInt(0),
          data: "0x",
        }),
      },
    });

    setUserOpHash(userOpHash);
    console.log("waiting for userOp:", userOpHash);

    const bundlerClient = kernelClient.extend(
      bundlerActions(ENTRYPOINT_ADDRESS_V07)
    );
    await bundlerClient.waitForUserOperationReceipt({
      hash: userOpHash,
    });

    setUserOpCount(userOpCount + 1);

    // Update the message based on the count of UserOps
    const userOpMessage =
      userOpCount === 0
        ? `First UserOp completed. <a href="https://jiffyscan.xyz/userOpHash/${userOpHash}?network=sepolia" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-700">Click here to view.</a> <br> Now try sending another UserOp.`
        : `UserOp completed. <a href="https://jiffyscan.xyz/userOpHash/${userOpHash}?network=sepolia" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-700">Click here to view.</a> <br> Notice how this UserOp costs a lot less gas and requires no prompting.`;

    setUserOpStatus(userOpMessage);
    setIsSendingUserOp(false);  
  };

  const checkPoapBalance = async (account: `0x${string}`) => {
    setIsCheckingBalance(true);
    const balance = await publicClient.getL1TokenBalance({
      account,
      token: process.env.NEXT_PUBLIC_POAP_CONTRACT as `0x${string}`,
    });

    setPoapBalance(balance.toString());
    setIsCheckingBalance(false);
  };


  return (
    <div className="grid grid-cols-1 gap-12">
      <div className="flex flex-col">
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
              {" "}
              {/* Add flex container to align items at the end */}
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
              Poap Balance: <span>{poapBalance}</span>
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
                "Check Poap Balance"
              )}
            </button>
          )}
          <button
            onClick={handleSendUserOp}
            disabled={!isKernelClientReady || isSendingUserOp}
            className={`w-full px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 flex justify-center items-center ${
              isKernelClientReady && !isSendingUserOp
                ? "bg-green-500 hover:bg-green-700 focus:ring-green-500"
                : "bg-gray-500"
            }`}
          >
            {isSendingUserOp ? <div className="spinner"></div> : "Send UserOp"}
          </button>
          {userOpHash && (
            <div
              className="mt-2 text-center"
              dangerouslySetInnerHTML={{
                __html: userOpStatus,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

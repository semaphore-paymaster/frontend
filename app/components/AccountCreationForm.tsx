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
import {
  http,
  encodeFunctionData,
  encodeAbiParameters,
  parseAbiParameters,
  parseEventLogs,
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

const sessionPrivateKey = generatePrivateKey();
const sessionKeySigner = privateKeyToAccount(sessionPrivateKey);

let sessionKeyAccount: any;
let kernelClient: any;
let semaphoreProof: any;
let bundlerClient: any;

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
  const [votingPercentage, setVotingPercentage] = useState(5);
  
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
 
  const encodeSemaphoreProof = (semaphoreProof: any) => {
    const {
      merkleTreeDepth,
      merkleTreeRoot,
      nullifier,
      message,
      scope,
      points,
    } = semaphoreProof;

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

            console.log("semaphoreProof", semaphoreProof);
            console.log("proof: ", await verifyProof(semaphoreProof));
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

            const gas = await bundlerClient.estimateUserOperationGas({
              userOperation: userOpWithPaymasterData,
              entryPoint: ENTRYPOINT_ADDRESS_V07,
            });

            const result = {
              ...userOpWithPaymasterData,
              ...gas,
            };
            console.log("results: ", result);

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

      bundlerClient = kernelClient.extend(
        bundlerActions(ENTRYPOINT_ADDRESS_V07)
      );
      await bundlerClient.waitForUserOperationReceipt({
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
      const successMessage = buildSuccessMessage("Vote submitted successfully 🗳️", opHashLink);

      toast(successMessage);
      setIsVoting(false);
      setUserHasVoted(true);
    } 
  };

  const maciVote = async () => {

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

        console.log("group", group);

        const proof = await generateProof(
          semaphoreGroupIdentity,
          group,
          BigInt(0),
          BigInt(1)
        );

        semaphoreProof = proof;

        const registerEncKeypair = new Keypair();

        // const nn = PubKey.deserialize(
        //   "macipk.2ffe72cc95f370f710076795c9b30de7f63c51d2fc7f3aed46dc6e08267fc221"
        // );

        const registerPubKey = registerEncKeypair.pubKey;
        const registerPrivKey = registerEncKeypair.privKey;

        console.log("semaphoreProof", semaphoreProof);

        const isValidProof = await verifyProof(semaphoreProof);

        console.log("isValidProof", isValidProof);

        const signupGatekeeperData = encodeSemaphoreProof(semaphoreProof);
        const DEFAULT_IVCP_DATA =
          "0x0000000000000000000000000000000000000000000000000000000000000000";

        const callData = await kernelClient.account.encodeCallData({
          to: "0x6D45D88FbA1632Fe029F0264bE9640EE61c7487f",
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

        const registerUserOpHash = await kernelClient.sendUserOperation({
          userOperation: {
            callData,
          },
        });

        console.log("UserOp hash:", registerUserOpHash);
        console.log("Waiting for UserOp to complete...");
        setVotingPercentage(50);


        const registerBundlerClient = kernelClient.extend(
          bundlerActions(ENTRYPOINT_ADDRESS_V07)
        );

        const registerReceipt = await registerBundlerClient.waitForUserOperationReceipt(
          {
            hash: registerUserOpHash,
            timeout: 60000,
          }
        );

        setVotingPercentage(55);

        const numSignUps = await publicClient.readContract({
          address: "0x6D45D88FbA1632Fe029F0264bE9640EE61c7487f",
          abi: MACI_FACTORY_ABI,
          functionName: "numSignUps",
        });

        console.log("numSignUps: ", numSignUps);

        console.log(
          `r1: ${registerReceipt.success}, ${registerReceipt.sender}, ${registerReceipt.actualGasUsed}`
        );
        console.log("r2: ", registerReceipt);

        console.log(
          "View completed UserOp here: https://jiffyscan.xyz/userOpHash/" +
            registerUserOpHash
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

         const stateIndex = parseInt(numSignUps as string) - 1;

         // create the command object
         const command: PCommand = new PCommand(
           BigInt(stateIndex),
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


        const voteCallData = await kernelClient.account.encodeCallData({
          to: "0x992Ed415cdccF87e9B20F853B0c0BC55Da6B54f2",
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

        const voteUserOpHash = await kernelClient.sendUserOperation({
          userOperation: {
            callData: voteCallData,
          },
        });

         setVotingPercentage(95);


        const voteBundlerClient = kernelClient.extend(
          bundlerActions(ENTRYPOINT_ADDRESS_V07)
        );

        const voteReceipt =
          await voteBundlerClient.waitForUserOperationReceipt({
            hash: voteUserOpHash,
            timeout: 60000,
          });


         console.log(
           `r1: ${voteReceipt.success}, ${voteReceipt.sender}, ${voteReceipt.actualGasUsed}`
         );
         console.log("r2: " + JSON.stringify(voteReceipt.receipt.transactionHash));

         console.log(
           "View completed UserOp here: https://jiffyscan.xyz/userOpHash/" +
             userOpHash
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
                    <div className="h-1 bg-purple-500" style={{width: votingPercentage}}></div>
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

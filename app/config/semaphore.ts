export const SEMAPHORE_PAYMASTER_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_entryPoint",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_verifier",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "LeafAlreadyExists",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "LeafCannotBeZero",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "LeafDoesNotExist",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "LeafGreaterThanSnarkScalarField",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "Semaphore__CallerIsNotTheGroupAdmin",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "Semaphore__CallerIsNotThePendingGroupAdmin",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "Semaphore__GroupDoesNotExist",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "Semaphore__GroupHasNoMembers",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "Semaphore__InvalidProof",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "Semaphore__MerkleTreeDepthIsNotSupported",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "Semaphore__MerkleTreeRootIsExpired",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "Semaphore__MerkleTreeRootIsNotPartOfTheGroup",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "Semaphore__YouAreUsingTheSameNullifierTwice",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "WrongSiblingNodes",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "oldAdmin",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newAdmin",
        "type": "address"
      }
    ],
    "name": "GroupAdminPending",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "oldAdmin",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newAdmin",
        "type": "address"
      }
    ],
    "name": "GroupAdminUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      }
    ],
    "name": "GroupCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "oldMerkleTreeDuration",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newMerkleTreeDuration",
        "type": "uint256"
      }
    ],
    "name": "GroupMerkleTreeDurationUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "identityCommitment",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "merkleTreeRoot",
        "type": "uint256"
      }
    ],
    "name": "MemberAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "identityCommitment",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "merkleTreeRoot",
        "type": "uint256"
      }
    ],
    "name": "MemberRemoved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "identityCommitment",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newIdentityCommitment",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "merkleTreeRoot",
        "type": "uint256"
      }
    ],
    "name": "MemberUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "startIndex",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256[]",
        "name": "identityCommitments",
        "type": "uint256[]"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "merkleTreeRoot",
        "type": "uint256"
      }
    ],
    "name": "MembersAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "merkleTreeDepth",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "merkleTreeRoot",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "nullifier",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "message",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "scope",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256[8]",
        "name": "points",
        "type": "uint256[8]"
      }
    ],
    "name": "ProofValidated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      }
    ],
    "name": "acceptGroupAdmin",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "identityCommitment",
        "type": "uint256"
      }
    ],
    "name": "addMember",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      },
      {
        "internalType": "uint256[]",
        "name": "identityCommitments",
        "type": "uint256[]"
      }
    ],
    "name": "addMembers",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint32",
        "name": "unstakeDelaySec",
        "type": "uint32"
      }
    ],
    "name": "addStake",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "admin",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "merkleTreeDuration",
        "type": "uint256"
      }
    ],
    "name": "createGroup",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "createGroup",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "admin",
        "type": "address"
      }
    ],
    "name": "createGroup",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      }
    ],
    "name": "depositForGroup",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "entryPoint",
    "outputs": [
      {
        "internalType": "contract IEntryPoint",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getDeposit",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      }
    ],
    "name": "getGroupAdmin",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      }
    ],
    "name": "getMerkleTreeDepth",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      }
    ],
    "name": "getMerkleTreeRoot",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      }
    ],
    "name": "getMerkleTreeSize",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "groupCounter",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "groupDeposits",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "groups",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "merkleTreeDuration",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "identityCommitment",
        "type": "uint256"
      }
    ],
    "name": "hasMember",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "identityCommitment",
        "type": "uint256"
      }
    ],
    "name": "indexOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum IPaymaster.PostOpMode",
        "name": "mode",
        "type": "uint8"
      },
      {
        "internalType": "bytes",
        "name": "context",
        "type": "bytes"
      },
      {
        "internalType": "uint256",
        "name": "actualGasCost",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "actualUserOpFeePerGas",
        "type": "uint256"
      }
    ],
    "name": "postOp",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "identityCommitment",
        "type": "uint256"
      },
      {
        "internalType": "uint256[]",
        "name": "merkleProofSiblings",
        "type": "uint256[]"
      }
    ],
    "name": "removeMember",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unlockStake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "newAdmin",
        "type": "address"
      }
    ],
    "name": "updateGroupAdmin",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "newMerkleTreeDuration",
        "type": "uint256"
      }
    ],
    "name": "updateGroupMerkleTreeDuration",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "identityCommitment",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "newIdentityCommitment",
        "type": "uint256"
      },
      {
        "internalType": "uint256[]",
        "name": "merkleProofSiblings",
        "type": "uint256[]"
      }
    ],
    "name": "updateMember",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "sender",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "nonce",
            "type": "uint256"
          },
          {
            "internalType": "bytes",
            "name": "initCode",
            "type": "bytes"
          },
          {
            "internalType": "bytes",
            "name": "callData",
            "type": "bytes"
          },
          {
            "internalType": "bytes32",
            "name": "accountGasLimits",
            "type": "bytes32"
          },
          {
            "internalType": "uint256",
            "name": "preVerificationGas",
            "type": "uint256"
          },
          {
            "internalType": "bytes32",
            "name": "gasFees",
            "type": "bytes32"
          },
          {
            "internalType": "bytes",
            "name": "paymasterAndData",
            "type": "bytes"
          },
          {
            "internalType": "bytes",
            "name": "signature",
            "type": "bytes"
          }
        ],
        "internalType": "struct PackedUserOperation",
        "name": "userOp",
        "type": "tuple"
      },
      {
        "internalType": "bytes32",
        "name": "userOpHash",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "maxCost",
        "type": "uint256"
      }
    ],
    "name": "validatePaymasterUserOp",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "context",
        "type": "bytes"
      },
      {
        "internalType": "uint256",
        "name": "validationData",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "merkleTreeDepth",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "merkleTreeRoot",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "nullifier",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "message",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "scope",
            "type": "uint256"
          },
          {
            "internalType": "uint256[8]",
            "name": "points",
            "type": "uint256[8]"
          }
        ],
        "internalType": "struct ISemaphore.SemaphoreProof",
        "name": "proof",
        "type": "tuple"
      }
    ],
    "name": "validateProof",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "verifier",
    "outputs": [
      {
        "internalType": "contract ISemaphoreVerifier",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "merkleTreeDepth",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "merkleTreeRoot",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "nullifier",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "message",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "scope",
            "type": "uint256"
          },
          {
            "internalType": "uint256[8]",
            "name": "points",
            "type": "uint256[8]"
          }
        ],
        "internalType": "struct ISemaphore.SemaphoreProof",
        "name": "proof",
        "type": "tuple"
      }
    ],
    "name": "verifyProof",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address payable",
        "name": "withdrawAddress",
        "type": "address"
      }
    ],
    "name": "withdrawStake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address payable",
        "name": "withdrawAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "withdrawTo",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
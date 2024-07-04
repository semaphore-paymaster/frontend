export const GATEKEEPER_ABI = [
  {
    inputs: [
      { internalType: "address", name: "__semaphore", type: "address" },
      { internalType: "address", name: "__poap", type: "address" },
      { internalType: "uint256", name: "__eventId", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  { inputs: [], name: "InvalidToken", type: "error" },
  {
    inputs: [],
    name: "_eventId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "_groupId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "_poap",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "_semaphore",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_tokenIndex", type: "uint256" },
      { internalType: "uint256", name: "_identityCommitment", type: "uint256" },
    ],
    name: "enter",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "init",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "uint256", name: "merkleTreeDepth", type: "uint256" },
          { internalType: "uint256", name: "merkleTreeRoot", type: "uint256" },
          { internalType: "uint256", name: "nullifier", type: "uint256" },
          { internalType: "uint256", name: "message", type: "uint256" },
          { internalType: "uint256", name: "scope", type: "uint256" },
          { internalType: "uint256[8]", name: "points", type: "uint256[8]" },
        ],
        internalType: "struct ISemaphore.SemaphoreProof",
        name: "proof",
        type: "tuple",
      },
    ],
    name: "validate",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
];
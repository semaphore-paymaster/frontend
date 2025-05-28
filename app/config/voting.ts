import type { Address } from 'viem';

// Voting contract ABI
export const VOTING_CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "choice", "type": "uint256"}],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "votesA",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "votesB",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Voting contract address on Base Sepolia
export const VOTING_CONTRACT_ADDRESS: Address = "0xB64ad1D84d59290d2C207bc4a66670CCA8431E43";

// Vote choices
export const VOTE_CHOICES = {
  A: 0,
  B: 1
} as const;

export type VoteChoice = typeof VOTE_CHOICES[keyof typeof VOTE_CHOICES]; 
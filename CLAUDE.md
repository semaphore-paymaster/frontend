# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js application that integrates Semaphore Protocol (zero-knowledge identity proofs) with ZeroDev's paymaster system for gasless transactions. The app enables privacy-preserving group membership verification using passkey authentication and smart account abstraction.

**Recent Addition**: Implemented Semaphore paymaster-sponsored A/B voting system that bypasses ZeroDev middleware to use custom Semaphore paymaster for transaction sponsorship.

## Commands

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build the application for production (outputs static files)
- `npm run start` - Start production server
- `npm run lint` - Run Next.js linting

## Architecture

### Core Technologies
- **Semaphore Protocol**: Zero-knowledge identity and group membership proofs
- **ZeroDev**: Account abstraction with passkey validators and paymaster sponsorship
- **Next.js 14.1**: React framework with static export configuration
- **Viem**: Ethereum client library
- **Tailwind CSS**: Styling framework

### Key Components Structure

#### Smart Account System (`app/hooks/useSmartAccount.ts`)
- Uses ZeroDev's Kernel accounts with passkey validation
- Implements permission validators with session keys for delegation
- Custom paymaster middleware handles transaction sponsorship logic:
  - Account deployment transactions (factory operations)
  - Semaphore group joining (addMember function calls)
  - Zero-knowledge proof transactions with custom paymaster data encoding

#### Semaphore Integration (`app/hooks/useSemaphore.ts`)
- Manages Semaphore identity creation and group membership
- Generates zero-knowledge proofs for anonymous actions
- Integrates with smart account system for gasless proof submissions

#### Voting System (`app/config/voting.ts` + `AccountCreationForm.tsx`)
- **Contract**: 0xB64ad1D84d59290d2C207bc4a66670CCA8431E43 on Base Sepolia
- **Functionality**: A/B voting system (A=0, B=1) with vote counting
- **Integration**: Direct implementation in AccountCreationForm with Semaphore proof generation
- **Paymaster**: Uses custom Semaphore paymaster instead of ZeroDev for transaction sponsorship

#### Configuration Layer (`app/config/`)
- `zerodev.ts`: Chain configuration (Base Sepolia) and ZeroDev service URLs
- `semaphore.ts`: Semaphore paymaster contract ABI
- `viem.ts`: Public client configuration for blockchain interactions
- `voting.ts`: Voting contract ABI, address, and vote choice constants

### Data Flow
1. User authenticates via passkey (WebAuthn)
2. Smart account is created/accessed using ZeroDev's account abstraction
3. User joins Semaphore group (gasless via paymaster)
4. User generates zero-knowledge proofs for anonymous actions
5. **New**: User can vote anonymously using Semaphore proofs with custom paymaster sponsorship
6. Transactions are sponsored based on proof validation or specific function calls

### Environment Variables Required
- `NEXT_PUBLIC_ZERODEV_APP_ID`: ZeroDev application identifier
- `NEXT_PUBLIC_PAYMASTER_CONTRACT`: Custom paymaster contract address
- `NEXT_PUBLIC_SEMAPHORE_CONTRACT`: Semaphore protocol contract address
- `NEXT_PUBLIC_SEMAPHORE_GROUP_ID`: Target group ID for membership
- `NEXT_PUBLIC_POAP_CONTRACT`, `NEXT_PUBLIC_GATEKEEPER_CONTRACT`, `NEXT_PUBLIC_STORAGE_CONTRACT`: Additional contract addresses
- `NEXT_PUBLIC_MACI_FACTORY`, `NEXT_PUBLIC_MACI_POLL`: MACI (Minimal Anti-Collusion Infrastructure) contract addresses

### Paymaster Logic
The middleware in `useSmartAccount.ts` implements conditional transaction sponsorship:
- Factory operations (account deployment) are always sponsored
- `addMember` calls (joining Semaphore groups) are sponsored via ZeroDev
- Transactions with valid Semaphore proofs use custom paymaster with encoded proof data
- All other transactions are rejected

### Whitelist Feature
The project includes whitelist verification functionality for controlling access to smart account creation, implemented in `app/hooks/useWhitelistVerification.ts`.

## Recent Implementation: Semaphore Paymaster-Sponsored Voting

### Overview
Successfully implemented an A/B voting system that uses Semaphore zero-knowledge proofs for anonymous voting, with transactions sponsored by a custom Semaphore paymaster rather than ZeroDev's paymaster.

### Technical Achievements

#### 1. Voting Contract Integration
- **Contract Address**: 0xB64ad1D84d59290d2C207bc4a66670CCA8431E43 (Base Sepolia)
- **Functions**: `vote(uint256 choice)`, `votesA()`, `votesB()`
- **Vote Choices**: A = 0, B = 1
- **Real-time vote counting**: Displays current vote counts with automatic refresh

#### 2. Semaphore Proof Generation
- **Group Membership**: Fetches actual on-chain group members using `MemberAdded` events
- **Proof Creation**: Generates proofs against real group structure (not minimal test groups)
- **Verification**: Local proof verification passes before submission
- **Message Format**: Uses account address as BigInt for proof message

#### 3. UserOperation Format Resolution
Overcame multiple UserOperation format compatibility issues:
- **Version Compatibility**: Resolved v0.6 vs v0.7 bundler RPC format differences
- **Field Structure**: Fixed `initCode`, `callData`, and `paymasterAndData` encoding
- **Gas Limits**: Used individual gas limit fields instead of packed format
- **Call Data**: Proper encoding using `encodeFunctionData` for contract interactions

#### 4. Paymaster Integration
- **Direct Bundler RPC**: Bypasses ZeroDev middleware using raw `eth_sendUserOperation` calls
- **PaymasterAndData Format**: Paymaster address + 32-byte offset + encoded PaymasterData struct
- **Proof Encoding**: Proper encoding of Semaphore proof components (merkleTreeRoot, nullifier, etc.)
- **Balance Verification**: Checks paymaster balance before transaction submission

### Current Status
- ✅ Semaphore proof generation working (local verification passes)
- ✅ UserOperation format properly structured for bundler RPC
- ✅ Group membership verification working
- ✅ PaymasterAndData encoding correct
- ✅ Vote counting and UI feedback systems working
- ⚠️ **Current Issue**: AA20 account not deployed error for address 0x1251f1E71BB97437F3e5190d3B80E499A0B8DcB5

### Key Technical Insights

#### UserOperation Structure (v0.6 format)
```typescript
{
  sender: string,
  nonce: string,
  factory?: string,
  factoryData?: string,
  callData: string,
  callGasLimit: string,
  verificationGasLimit: string,
  preVerificationGas: string,
  maxFeePerGas: string,
  maxPriorityFeePerGas: string,
  paymasterAndData: string,
  signature: string
}
```

#### PaymasterAndData Format
```
paymasterAddress (20 bytes) + 
32-byte offset (0x0000...0000) + 
encoded PaymasterData struct
```

#### Semaphore Proof Validation
- Must use actual on-chain group members (fetched via events)
- Proof message must match account address as BigInt
- All proof components (merkleTreeRoot, nullifier, etc.) must be properly encoded

### Next Steps
1. Resolve AA20 account deployment issue
2. Implement proper factory data for undeployed accounts
3. Test end-to-end voting flow with deployed accounts
4. Add error handling for edge cases
5. Optimize gas estimation for voting transactions
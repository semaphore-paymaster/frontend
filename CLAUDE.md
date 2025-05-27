# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js application that integrates Semaphore Protocol (zero-knowledge identity proofs) with ZeroDev's paymaster system for gasless transactions. The app enables privacy-preserving group membership verification using passkey authentication and smart account abstraction.

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

#### Configuration Layer (`app/config/`)
- `zerodev.ts`: Chain configuration (Base Sepolia) and ZeroDev service URLs
- `semaphore.ts`: Semaphore paymaster contract ABI
- `viem.ts`: Public client configuration for blockchain interactions

### Data Flow
1. User authenticates via passkey (WebAuthn)
2. Smart account is created/accessed using ZeroDev's account abstraction
3. User joins Semaphore group (gasless via paymaster)
4. User generates zero-knowledge proofs for anonymous actions
5. Transactions are sponsored based on proof validation or specific function calls

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
# Semaphore Paymaster Frontend

A privacy-preserving web application that enables **anonymous gasless transactions** using zero-knowledge membership proofs. Users can pay for Ethereum transactions without revealing their identity through [Semaphore Protocol](https://semaphore.pse.dev/) integration with [ERC4337 Account Abstraction](https://eips.ethereum.org/EIPS/eip-4337).

## 🔍 What This Does

- **Anonymous Gas Payments**: Pay for transactions using ZK proofs of group membership
- **Privacy-First**: No identity revelation required for transaction sponsorship  
- **Passkey Integration**: Secure authentication without traditional seed phrases
- **Gasless UX**: Users don't need ETH to interact with the blockchain
- **Zero-Knowledge Membership**: Prove you belong to a group without revealing which member you are

## 🏗️ How It Works

```
User → Passkey Auth → ZeroDev Smart Account → Semaphore Paymaster → ZK Proof Verification → Gas Sponsored
```

1. **Authentication**: Users sign in with passkeys (no seed phrases)
2. **Group Membership**: Prove membership in a Semaphore group via zero-knowledge proof
3. **Transaction Submission**: Submit transactions through ERC4337 smart accounts
4. **Gas Sponsorship**: Paymaster covers gas costs based on valid ZK membership proofs
5. **Privacy Preservation**: No linking between transactions or identity revelation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm

### Installation

```bash
# Clone and install
npm install

# Set up environment variables (see below)
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## ⚙️ Environment Variables

Create a `.env.local` file with the following variables:

```bash
# ZeroDev Configuration
NEXT_PUBLIC_ZERODEV_APP_ID=your-zerodev-app-id

# Smart Contract Addresses
NEXT_PUBLIC_POAP_CONTRACT=0x...
NEXT_PUBLIC_PAYMASTER_CONTRACT=0x...
NEXT_PUBLIC_GATEKEEPER_CONTRACT=0x...
NEXT_PUBLIC_SEMAPHORE_CONTRACT=0x...
NEXT_PUBLIC_STORAGE_CONTRACT=0x...
NEXT_PUBLIC_MACI_FACTORY=0x...
NEXT_PUBLIC_MACI_POLL=0x...

# Semaphore Configuration
NEXT_PUBLIC_SEMAPHORE_GROUP_ID=1
```

### Variable Descriptions

- `NEXT_PUBLIC_ZERODEV_APP_ID`: ZeroDev application ID for account abstraction services
- `NEXT_PUBLIC_POAP_CONTRACT`: POAP (Proof of Attendance Protocol) contract address
- `NEXT_PUBLIC_PAYMASTER_CONTRACT`: Semaphore Paymaster contract that sponsors gas
- `NEXT_PUBLIC_GATEKEEPER_CONTRACT`: Access control contract for group management
- `NEXT_PUBLIC_SEMAPHORE_CONTRACT`: Core Semaphore protocol contract
- `NEXT_PUBLIC_SEMAPHORE_GROUP_ID`: ID of the Semaphore group for membership verification
- `NEXT_PUBLIC_STORAGE_CONTRACT`: Contract for storing application data
- `NEXT_PUBLIC_MACI_FACTORY`: MACI (Minimal Anti-Collusion Infrastructure) factory
- `NEXT_PUBLIC_MACI_POLL`: MACI poll contract for voting mechanisms

## 🛠️ Technology Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **ZeroDev SDK**: ERC4337 account abstraction and passkey integration
- **Semaphore Protocol**: Zero-knowledge membership proofs
- **Tailwind CSS**: Responsive styling
- **Ethers.js**: Ethereum blockchain interaction

## 📚 Documentation

For comprehensive documentation about the Semaphore Paymaster system:

- **📖 [Official Documentation](https://github.com/semaphore-paymaster/docs)** - Complete project documentation
- **🚀 [Quick Start Guide](https://github.com/semaphore-paymaster/docs/blob/master/quick-start.md)** - Get started quickly
- **🏛️ [Smart Contracts](https://github.com/semaphore-paymaster/docs/blob/master/contracts.md)** - Contract documentation
- **🔧 [Development Guide](https://github.com/semaphore-paymaster/docs/blob/master/development.md)** - Setup and contributing
- **🔐 [Security](https://github.com/semaphore-paymaster/docs/blob/master/security.md)** - Security considerations

## 🔗 Learn More

### Core Technologies
- [Semaphore Protocol](https://semaphore.pse.dev/) - Zero-knowledge membership proofs
- [ERC4337 Specification](https://eips.ethereum.org/EIPS/eip-4337) - Account abstraction standard
- [ZeroDev Documentation](https://docs.zerodev.app/) - Account abstraction toolkit
- [Next.js Documentation](https://nextjs.org/docs) - React framework

### Privacy & Zero-Knowledge
- [Zero-Knowledge Proofs Explained](https://ethereum.org/en/zero-knowledge-proofs/)
- [Privacy in Ethereum](https://ethereum.org/en/privacy/)

## 🚀 Deploy

Deploy easily on [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/semaphore-paymaster-frontend)

See [deployment documentation](https://nextjs.org/docs/deployment) for other platforms.

## 🤝 Contributing

Contributions are welcome! Please check the [development guide](https://github.com/semaphore-paymaster/docs/blob/master/development.md) for setup instructions and coding standards.

## 📄 License

This project is open source and available under the MIT License.

---

*Building privacy-preserving blockchain interactions with zero-knowledge proofs* 🛡️

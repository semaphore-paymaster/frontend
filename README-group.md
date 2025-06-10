# Semaphore Group Management Script

This script allows you to create identity commitments from user addresses and add them to Semaphore groups using the deployed paymaster on Base Sepolia.

## What it does

1. **Creates a Semaphore Identity**: Takes a user address and generates a Semaphore identity with:
   - Private key (derived from the address)
   - Public key 
   - **Identity Commitment** (the key part - this is what gets stored in the group)

2. **Adds to Group**: Uses the `addMembers()` function to add the identity commitment to the specified group

3. **Verifies**: Confirms the member was successfully added

## Usage

### Basic Usage

```javascript
const { addMemberToGroup } = require('./group.js');

// Add a member to group 0
const result = await addMemberToGroup(0, '0x742d35Cc6634C0532925a3b8D');
```

### Environment Setup

Set your private key as an environment variable:

```bash
export PRIVATE_KEY="0x..."
node group.js
```

Or update the script directly with your private key.

### Example Output

```
🚀 Adding member to Semaphore group...
=====================================
Group ID: 0
User Address: 0x742d35Cc6634C0532925a3b8D
Paymaster: 0xcEDCFF6462F323c1a1353698dE944B0F04c6e8c4

🔑 Creating Semaphore identity...
   Private Key: 0x...
   Public Key: 0x...
   Identity Commitment: 12345678901234567890

🔍 Checking if member already exists...
   ➕ Member not found, proceeding with addition...
   Current group size: 5

🎯 Adding member to group...
   Using account: 0x...
   📝 Transaction hash: 0x...
   ⏳ Waiting for confirmation...
   ✅ Transaction confirmed in block: 12345

🔍 Verifying member addition...
   Member exists: ✅ Yes
   New group size: 6

🎉 Member successfully added to the group!

📋 Summary:
   Identity Commitment: 12345678901234567890
   Status: Member successfully added
   Transaction: 0x...
   Block: 12345
```

## Key Concepts

### Identity Commitment
The **identity commitment** is a cryptographic hash derived from the user's address that serves as their public identifier in the Semaphore group. It's computed as:

```
identityCommitment = poseidon(privateKey)
```

Where the private key is derived from the user's address.

### Group Membership
- Each group can have multiple members
- Members are identified by their identity commitments
- The script uses `addMembers(groupId, [commitment])` to add members
- You can check membership with `hasMember(groupId, commitment)`

## Configuration

The script is configured for:
- **Network**: Base Sepolia
- **Paymaster**: `0xcEDCFF6462F323c1a1353698dE944B0F04c6e8c4`
- **RPC**: `https://sepolia.base.org`

## Functions

### `addMemberToGroup(groupId, userAddress)`
Main function that handles the entire process.

**Parameters:**
- `groupId` (number): The ID of the group to add the member to
- `userAddress` (string): The Ethereum address to create an identity for

**Returns:**
```javascript
{
  success: boolean,
  alreadyExists?: boolean,
  identityCommitment: string,
  identity: Identity,
  transactionHash?: string,
  blockNumber?: string,
  error?: string
}
```

## Error Handling

The script includes comprehensive error handling:
- Checks if member already exists (prevents duplicates)
- Validates transaction success
- Provides detailed error messages
- Returns structured results for programmatic use

## Dependencies

Required packages (already in package.json):
- `viem` - Ethereum client
- `@semaphore-protocol/identity` - Semaphore identity generation

## Security Notes

⚠️ **Important**: 
- Keep your private key secure
- The identity private key is derived from the user address - this is deterministic
- Identity commitments are public but don't reveal the underlying private key
- Only authorized accounts can add members to groups (check group admin permissions) 
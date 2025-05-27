const { createPublicClient, http } = require('viem');
const { baseSepolia } = require('viem/chains');
const { Identity } = require('@semaphore-protocol/identity');

// Configuration
const PAYMASTER_ADDRESS = '0xcEDCFF6462F323c1a1353698dE944B0F04c6e8c4';
const RPC_URL = 'https://sepolia.base.org';

// Create client
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC_URL)
});

// ABI for the functions we need
const ABI = [
  {
    inputs: [{ internalType: "uint256", name: "groupId", type: "uint256" }],
    name: "getGroupAdmin",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "groupId", type: "uint256" },
      { internalType: "uint256", name: "identityCommitment", type: "uint256" }
    ],
    name: "hasMember",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "groupId", type: "uint256" }],
    name: "getMerkleTreeSize",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
];

/**
 * Debug addMember transaction issues
 * @param {number} groupId - The group ID
 * @param {string} userAddress - The user address to create identity for
 * @param {string} callerAddress - The address that will call addMember
 */
async function debugAddMember(groupId, userAddress, callerAddress) {
  console.log('🔍 Debugging addMember Transaction');
  console.log('==================================');
  console.log('');
  console.log('📋 Input Parameters:');
  console.log('   Group ID:', groupId);
  console.log('   User Address:', userAddress);
  console.log('   Caller Address:', callerAddress);
  console.log('   Contract:', PAYMASTER_ADDRESS);
  console.log('');

  try {
    // Generate identity commitment
    const identity = new Identity(userAddress);
    const identityCommitment = identity.commitment.toString();
    
    console.log('🔑 Generated Identity:');
    console.log('   Identity Commitment:', identityCommitment);
    console.log('');

    // Check 1: Group Admin
    console.log('🔍 Check 1: Group Admin Verification');
    const groupAdmin = await publicClient.readContract({
      address: PAYMASTER_ADDRESS,
      abi: ABI,
      functionName: 'getGroupAdmin',
      args: [BigInt(groupId)]
    });
    
    console.log('   Group Admin:', groupAdmin);
    console.log('   Caller Address:', callerAddress);
    console.log('   Is Caller Admin?', groupAdmin.toLowerCase() === callerAddress.toLowerCase() ? '✅ YES' : '❌ NO');
    
    if (groupAdmin.toLowerCase() !== callerAddress.toLowerCase()) {
      console.log('');
      console.log('🚨 ISSUE FOUND: Caller is not the group admin!');
      console.log('   Expected Admin:', groupAdmin);
      console.log('   Actual Caller:', callerAddress);
      console.log('');
      console.log('💡 SOLUTION: Use the correct admin address or transfer admin rights');
      return;
    }
    console.log('');

    // Check 2: Member Already Exists
    console.log('🔍 Check 2: Member Existence');
    const memberExists = await publicClient.readContract({
      address: PAYMASTER_ADDRESS,
      abi: ABI,
      functionName: 'hasMember',
      args: [BigInt(groupId), BigInt(identityCommitment)]
    });
    
    console.log('   Member Already Exists?', memberExists ? '❌ YES (DUPLICATE)' : '✅ NO (GOOD)');
    
    if (memberExists) {
      console.log('');
      console.log('🚨 ISSUE FOUND: Identity commitment already exists in the group!');
      console.log('   Identity Commitment:', identityCommitment);
      console.log('');
      console.log('💡 SOLUTION: This user is already a member of the group');
      return;
    }
    console.log('');

    // Check 3: Group Size
    console.log('🔍 Check 3: Group Information');
    const groupSize = await publicClient.readContract({
      address: PAYMASTER_ADDRESS,
      abi: ABI,
      functionName: 'getMerkleTreeSize',
      args: [BigInt(groupId)]
    });
    
    console.log('   Current Group Size:', groupSize.toString(), 'members');
    console.log('');

    // Check 4: Identity Commitment Validation
    console.log('🔍 Check 4: Identity Commitment Validation');
    const SNARK_SCALAR_FIELD = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');
    const commitmentBigInt = BigInt(identityCommitment);
    
    console.log('   Identity Commitment:', identityCommitment);
    console.log('   Is > 0?', commitmentBigInt > 0n ? '✅ YES' : '❌ NO');
    console.log('   Is < SNARK_SCALAR_FIELD?', commitmentBigInt < SNARK_SCALAR_FIELD ? '✅ YES' : '❌ NO');
    
    if (commitmentBigInt === 0n) {
      console.log('');
      console.log('🚨 ISSUE FOUND: Identity commitment cannot be zero!');
      return;
    }
    
    if (commitmentBigInt >= SNARK_SCALAR_FIELD) {
      console.log('');
      console.log('🚨 ISSUE FOUND: Identity commitment exceeds SNARK scalar field!');
      return;
    }
    console.log('');

    // All checks passed
    console.log('✅ All Checks Passed!');
    console.log('');
    console.log('📋 Transaction should succeed with:');
    console.log('   Function: addMember');
    console.log('   Group ID:', groupId);
    console.log('   Identity Commitment:', identityCommitment);
    console.log('   From Address:', callerAddress);
    console.log('');
    console.log('🎯 If transaction still fails, check:');
    console.log('   1. Gas limit (try increasing)');
    console.log('   2. Network congestion');
    console.log('   3. Contract state changes between checks and transaction');

  } catch (error) {
    console.error('❌ Error during debugging:', error.message);
    
    if (error.message.includes('GroupDoesNotExist')) {
      console.log('');
      console.log('🚨 ISSUE FOUND: Group does not exist!');
      console.log('   Group ID:', groupId);
      console.log('   Make sure the group was created first');
    }
  }
}

// Export for use as module
module.exports = { debugAddMember };

// Run if called directly
if (require.main === module) {
  // Example usage - replace with your actual values
  const groupId = 2;
  const userAddress = '0xf6F5C840D85c02d18F019A70852e7F25b5893cf7';
  const callerAddress = '0x3E259685A7b778dE2a8DbdF836659c4011cCAb9e'; // Your address
  
  debugAddMember(groupId, userAddress, callerAddress);
} 
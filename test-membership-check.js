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
 * Test membership check logic
 * @param {number} groupId - The group ID
 * @param {string} accountAddress - The account address to check
 */
async function testMembershipCheck(groupId, accountAddress) {
  console.log('🧪 Testing Membership Check Logic');
  console.log('=================================');
  console.log('');
  console.log('📋 Input:');
  console.log('   Group ID:', groupId);
  console.log('   Account Address:', accountAddress);
  console.log('');

  try {
    // Generate the identity commitment for this account address
    // This is deterministic - same address always generates same identity commitment
    const identity = new Identity(accountAddress);
    const identityCommitment = identity.commitment;
    
    console.log('🔑 Generated Identity:');
    console.log('   Identity Commitment:', identityCommitment.toString());
    console.log('');
    
    // Check if this identity commitment is a member of the group
    const isMember = await publicClient.readContract({
      address: PAYMASTER_ADDRESS,
      abi: ABI,
      functionName: 'hasMember',
      args: [BigInt(groupId), identityCommitment],
    });

    // Also get group size for informational purposes
    const groupSize = await publicClient.readContract({
      address: PAYMASTER_ADDRESS,
      abi: ABI,
      functionName: 'getMerkleTreeSize',
      args: [BigInt(groupId)],
    });

    console.log('📊 Results:');
    console.log('   Group Size:', groupSize.toString(), 'members');
    console.log('   Is Member:', isMember ? '✅ YES' : '❌ NO');
    console.log('');
    
    if (isMember) {
      console.log('🎉 SUCCESS: Account is a member of the group!');
      console.log('   The UI should show: "✓ You are a member of the group"');
    } else {
      console.log('ℹ️  INFO: Account is not a member of the group');
      console.log('   The UI should show: "You are not part of the group"');
    }
    
    return { isMember, groupSize: groupSize.toString(), identityCommitment: identityCommitment.toString() };
    
  } catch (error) {
    console.error('❌ Error during membership check:', error.message);
    return null;
  }
}

// Test with known addresses
async function runTests() {
  console.log('🚀 Running Membership Check Tests');
  console.log('==================================');
  console.log('');
  
  // Test 1: Address that we know is in the group
  console.log('TEST 1: Known member address');
  await testMembershipCheck(2, '0xf6F5C840D85c02d18F019A70852e7F25b5893cf7');
  
  console.log(`\n${'='.repeat(50)}\n`);
  
  // Test 2: Address that we know is NOT in the group
  console.log('TEST 2: New address (should not be member)');
  await testMembershipCheck(2, '0x742d35Cc6634C0532925a3b8D40b62EE4A9686b0');
  
  console.log(`\n${'='.repeat(50)}\n`);
  
  // Test 3: Your admin address
  console.log('TEST 3: Admin address');
  await testMembershipCheck(2, '0x3E259685A7b778dE2a8DbdF836659c4011cCAb9e');
}

// Export for use as module
module.exports = { testMembershipCheck };

// Run if called directly
if (require.main === module) {
  runTests();
} 
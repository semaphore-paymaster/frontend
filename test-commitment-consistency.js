const { generateIdentityCommitment } = require('./generate-commitment.js');
const { Identity } = require('@semaphore-protocol/identity');

/**
 * Test that both implementations generate the same identity commitment
 */
function testCommitmentConsistency() {
  console.log('🧪 Testing Identity Commitment Consistency');
  console.log('==========================================');
  console.log('');

  const testAddresses = [
    '0xf6F5C840D85c02d18F019A70852e7F25b5893cf7',
    '0x742d35Cc6634C0532925a3b8D40b62EE4A9686b0',
    '0x3E259685A7b778dE2a8DbdF836659c4011cCAb9e'
  ];

  testAddresses.forEach((address, index) => {
    console.log(`Test ${index + 1}: ${address}`);
    console.log('─'.repeat(50));
    
    // Method 1: Using generate-commitment.js logic
    const result1 = generateIdentityCommitment(address);
    const commitment1 = result1.identityCommitment;
    
    // Method 2: Using useSemaphore.ts logic (same as what the hook does)
    const id = new Identity(address);
    const commitment2 = id.commitment.toString();
    
    console.log('generate-commitment.js:', commitment1);
    console.log('useSemaphore.ts logic:', commitment2);
    console.log('Match:', commitment1 === commitment2 ? '✅ YES' : '❌ NO');
    console.log('');
  });
}

/**
 * Test the hasMember function call format
 */
async function testHasMemberCall() {
  console.log('🔍 Testing hasMember Function Call Format');
  console.log('=========================================');
  console.log('');
  
  const testAddress = '0xf6F5C840D85c02d18F019A70852e7F25b5893cf7';
  const groupId = 2;
  
  // Generate commitment
  const id = new Identity(testAddress);
  const identityCommitment = id.commitment;
  
  console.log('📋 Function Call Parameters:');
  console.log('   Function: hasMember');
  console.log('   groupId (uint256):', groupId);
  console.log('   identityCommitment (uint256):', identityCommitment.toString());
  console.log('');
  console.log('📋 Contract Call Format:');
  console.log(`   hasMember(${groupId}, ${identityCommitment.toString()})`);
  console.log('');
  console.log('📋 Viem Call Format:');
  console.log('   args: [BigInt(groupId), identityCommitment]');
  console.log(`   args: [${groupId}n, ${identityCommitment.toString()}n]`);
}

// Run tests
console.log('🚀 Running Commitment Consistency Tests');
console.log('=======================================');
console.log('');

testCommitmentConsistency();
testHasMemberCall(); 
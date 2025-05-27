const { generateIdentityCommitment } = require('./generate-commitment.js');

// Test with a different user address that likely hasn't been added yet
const groupId = 2;
const newUserAddress = '0x742d35Cc6634C0532925a3b8D40b62EE4A9686b0'; // Different address

console.log('🧪 Testing with NEW User Address');
console.log('================================');
console.log('');
console.log('Input:');
console.log('  Group ID:', groupId);
console.log('  User Address:', newUserAddress);
console.log('');

// Generate identity commitment
const identity = generateIdentityCommitment(newUserAddress);

console.log(`🎯 To add this NEW user to group ${groupId}, use:`);
console.log(`   addMember(${groupId}, ${identity.identityCommitment})`);
console.log('');
console.log('📋 FOR BLOCKCHAIN EXPLORER (addMember):');
console.log(`groupId: ${groupId}`);
console.log(`identityCommitment: ${identity.identityCommitment}`);
console.log('');
console.log('💡 This user should NOT be in the group yet, so the transaction should succeed!'); 
const { generateIdentityCommitment } = require('./generate-commitment.js');

// Test the function directly
console.log('🧪 Testing Identity Commitment Generation');
console.log('=========================================');
console.log('');

// Test data
const groupId = 2; // You're admin of group 2
const userAddress = '0xf6F5C840D85c02d18F019A70852e7F25b5893cf7';

console.log('Input:');
console.log('  Group ID:', groupId);
console.log('  User Address:', userAddress);
console.log('');

// Generate identity commitment
const identity = generateIdentityCommitment(userAddress);

console.log(`🎯 To add this user to group ${groupId}, you can use either:`);
console.log(`   addMember(${groupId}, ${identity.identityCommitment})     // Single member`);
console.log(`   addMembers(${groupId}, [${identity.identityCommitment}])  // Multiple members`);
console.log('');
console.log('💡 Copy these values for manual addition:');
console.log('');
console.log('📋 GROUP ID:');
console.log(groupId);
console.log('');
console.log('📋 IDENTITY COMMITMENT:');
console.log(identity.identityCommitment);
console.log('');
console.log('📋 FOR BLOCKCHAIN EXPLORER (addMember):');
console.log(`groupId: ${groupId}`);
console.log(`identityCommitment: ${identity.identityCommitment}`); 
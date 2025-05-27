const { Identity } = require('@semaphore-protocol/identity');
const readline = require('node:readline');

/**
 * Generate identity commitment from a user address
 * @param {string} userAddress - The Ethereum address to create an identity for
 * @returns {object} Object containing the identity details
 */
function generateIdentityCommitment(userAddress) {

  // Create Semaphore identity from user address
  const id = new Identity(userAddress);
  
  const result = {
    userAddress: userAddress,
    identityCommitment: id.commitment.toString()
  };

  return result;
}

/**
 * Validate if the input is a valid Ethereum address
 * @param {string} address - The address to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidEthereumAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Prompt user for input
 * @param {string} question - The question to ask
 * @returns {Promise<string>} The user's input
 */
function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Validate if the input is a valid group ID (non-negative integer)
 * @param {string} groupId - The group ID to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidGroupId(groupId) {
  const num = Number.parseInt(groupId, 10);
  return !Number.isNaN(num) && num >= 0 && num.toString() === groupId;
}

// Main function with interactive input
async function main() {
  console.log('🚀 Semaphore Identity Commitment Generator');
  console.log('==========================================');
  console.log('');

  try {
    // Ask for group ID
    const groupIdInput = await askQuestion('Enter the Group ID (e.g., 0, 1, 2...): ');
    
    // Validate the group ID
    if (!isValidGroupId(groupIdInput)) {
      console.log('❌ Invalid Group ID. Please enter a non-negative integer.');
      console.log('   Example: 0, 1, 2, etc.');
      return;
    }

    const groupId = Number.parseInt(groupIdInput, 10);

    // Ask for user address
    const userAddress = await askQuestion('Enter the Ethereum address: ');
    
    // Validate the address
    if (!isValidEthereumAddress(userAddress)) {
      console.log('❌ Invalid Ethereum address format. Please use format: 0x...');
      console.log('   Example: 0xf6F5C840D85c02d18F019A70852e7F25b5893cf7');
      return;
    }

    console.log('');
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
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Export for use as module
module.exports = { generateIdentityCommitment, main };

// Run if called directly
if (require.main === module) {
  main();
} 
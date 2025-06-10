"use client";

import { useState } from 'react';
import { Identity } from "@semaphore-protocol/identity";

export default function IdentityTest({ accountAddress }: { accountAddress: string }) {
  const [testResults, setTestResults] = useState<string[]>([]);

  const runTest = () => {
    const results: string[] = [];
    
    // Test 1: Generate identity multiple times
    results.push("=== Identity Generation Test ===");
    results.push(`Account Address: ${accountAddress}`);
    
    for (let i = 0; i < 3; i++) {
      const identity = new Identity(accountAddress);
      results.push(`Attempt ${i + 1}: ${identity.commitment.toString()}`);
    }
    
    // Test 2: Check if different strings generate different identities
    results.push("\n=== Different Input Test ===");
    const identity1 = new Identity(accountAddress);
    const identity2 = new Identity(accountAddress.toLowerCase());
    const identity3 = new Identity(accountAddress.toUpperCase());
    
    results.push(`Original: ${identity1.commitment.toString()}`);
    results.push(`Lowercase: ${identity2.commitment.toString()}`);
    results.push(`Uppercase: ${identity3.commitment.toString()}`);
    results.push(`All same? ${identity1.commitment === identity2.commitment && identity2.commitment === identity3.commitment}`);
    
    setTestResults(results);
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg mt-4">
      <h3 className="text-yellow-400 font-semibold mb-2">🔬 Identity Generation Test</h3>
      <button
        type="button"
        onClick={runTest}
        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 mb-4"
      >
        Run Identity Test
      </button>
      {testResults.length > 0 && (
        <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono bg-gray-900 p-2 rounded">
          {testResults.join('\n')}
        </pre>
      )}
    </div>
  );
} 
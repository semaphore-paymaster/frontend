"use client"; // Required for useState and onClick handlers

import { useState } from 'react';
import BlockiesSvg from "blockies-react-svg";
import truncateEthAddress from "../utils/truncateAddress";
import CopyIcon from "./icons/CopyIcon"; // Import the new icon

interface AddressAvatarProps {
    accountAddress: string;
}

export default function AddressAvatar({ accountAddress }: AddressAvatarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(accountAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    }).catch(err => {
      console.error("Failed to copy address: ", err);
      // Optionally, provide user feedback for error here
    });
  };

  return (
    <div className="flex items-center group p-1 rounded-md">
      <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-gray-600 transition-all duration-150">
        <BlockiesSvg address={accountAddress} size={8} scale={4} className="block" />
      </div>
      <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
        {truncateEthAddress(accountAddress)}
      </span>
      <button
        type="button"
        onClick={handleCopyAddress}
        className="ml-2 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none transition-colors duration-150"
        aria-label="Copy address"
      >
        {copied ? (
          <div className="text-xs text-green-500 dark:text-green-400">Copied!</div>
        ) : (
          <CopyIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-150" />
        )}
      </button>
    </div>
  );
}

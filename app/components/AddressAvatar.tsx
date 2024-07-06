import BlockiesSvg from "blockies-react-svg";
import truncateEthAddress from "../utils/truncateAddress";

interface AddressAvatarProps {
    accountAddress: string;
}

export default function AddressAvatar(
    { accountAddress }: AddressAvatarProps
) {
  return (
    <div className="flex flex-col items-center justify-center mb-2 text-center font-medium mb-4">
      <div className="mb-2 rounded-full overflow-hidden border-2 border-white">
        <a
          href={`https://jiffyscan.xyz/account/${accountAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white hover:underline"
        >
          <BlockiesSvg address={accountAddress} />
        </a>
      </div>
      <a
        href={`https://jiffyscan.xyz/account/${accountAddress}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-white hover:underline"
      >
        {accountAddress}
      </a>
    </div>
  );
}

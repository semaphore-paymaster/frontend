import React from "react";
import WagmiProvider from "./wagmiProvider";

const RootProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <WagmiProvider>{children}</WagmiProvider>
    </div>
  );
};

export default RootProvider;

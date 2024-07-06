import type { Metadata } from "next";
import { Inter } from "next/font/google";
import RootProvider from "./providers/rootProvider";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ZeroDev Passkeys + Session Keys Demo",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* <WagmiProvider config={config}>  */}
        <RootProvider> {children}</RootProvider>

        {/* </WagmiProvider> */}
      </body>
    </html>
  );
}

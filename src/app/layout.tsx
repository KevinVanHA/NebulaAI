import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EAC BlockChain Explorer",
  description:
    "Talk to the Blockchain like you're talking to an AI. Powered by Evil Alien Collection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThirdwebProvider>
          <Navigation />
          <main>{children}</main>
          <Footer />
        </ThirdwebProvider>
      </body>
    </html>
  );
}

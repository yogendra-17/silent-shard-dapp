import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Silence x Biconomy AA Wallet Demo",
  description: "Silence x Biconomy AA Wallet Demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="app-container">
          <nav className="w-full z-20 top-0 start-0 border-b border-gray-700 bg-white-primary mb-6">
            <div className="flex w-full flex-wrap items-center justify-between h-[8.88vh]">
              <div className="flex items-center">
                <img src="/slxstackup.svg" alt="logo 1" className="mr-10" />
                <img src="/demoLogo.svg" alt="Demo Logo" />
              </div>
              <div className="flex items-left">
                <a
                  href=""
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Documentation
                </a>
              </div>
            </div>
          </nav>

          <div className="w-full relative" style={{ zIndex: 1 }}>
            <img
              className="bg-pattern-2nd-layer -z-10"
              src="/pattern.png"
              alt=""
            ></img>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}

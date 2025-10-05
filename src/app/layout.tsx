
// src/app/layout.tsx
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ProductProvider } from "./contexts/ProductProvider";
import { CommuterProvider } from "./contexts/CommuterProvider";
import { ShipperProvider } from "./contexts/ShipperProvider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Skydrop",
  description: "Transit-based package delivery using points",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up" afterSignOutUrl="/">
      {/* suppressHydrationWarning prevents extension-injected attrs from causing mismatches */}
      <html lang="en" suppressHydrationWarning>
        <body
          suppressHydrationWarning
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ProductProvider>
          <CommuterProvider>
            <ShipperProvider>
              {children}
              </ShipperProvider>
          </CommuterProvider>
        </ProductProvider>
      </body>
      </html>
    </ClerkProvider>
  );
}

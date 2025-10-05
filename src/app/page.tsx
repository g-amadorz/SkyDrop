"use client";
import { useState, useEffect } from "react";
import { Outfit } from "next/font/google";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import "./globals.css";

import { ProductProvider } from "./contexts/ProductProvider";
import { CommuterProvider } from "./contexts/CommuterProvider";
import { ShipperProvider } from "./contexts/ShipperProvider";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// ✅ Define color classes (no dynamic Tailwind strings)
const colorClasses = {
  blue: {
    bg: "bg-blue-500",
    hover: "hover:bg-blue-600",
    text: "text-blue-600",
    border: "border-blue-500",
    lightBg: "bg-blue-100",
  },
  orange: {
    bg: "bg-orange-500",
    hover: "hover:bg-orange-600",
    text: "text-orange-500",
    border: "border-orange-500",
    lightBg: "bg-orange-100",
  },
  black: {
    bg: "bg-gray-900",
    hover: "hover:bg-black",
    text: "text-gray-900",
    border: "border-gray-900",
    lightBg: "bg-transparent",
  },
};

const roles = [
  {
    id: "shipper",
    title: "Shipper",
    color: "blue",
    emoji: "🚚",
    description:
      "Send your packages faster and smarter with SkyDrop’s optimized delivery system.",
  },
  {
    id: "commuter",
    title: "Commuter",
    color: "black",
    emoji: "🚴",
    description:
      "Earn rewards by delivering items along your daily commute. Flexible, efficient, and rewarding.",
  },
  {
    id: "accesspoint",
    title: "Access Point",
    color: "orange",
    emoji: "🏪",
    description:
      "Host deliveries in your store or location and become a trusted node in the SkyDrop network.",
  },
];

export default function MainPage() {
  const [activeRole, setActiveRole] = useState("shipper");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null; // ✅ Fixes hydration mismatch

  const currentRole = roles.find((r) => r.id === activeRole)!;
  const colors = colorClasses[currentRole.color as keyof typeof colorClasses];


  return (

    <><main className="min-h-screen grid place-items-center p-8">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">Welcome to Skydrop</h1>

        {/* When signed out -> show Sign In */}
        <SignedOut>
          {/* Opens Clerk modal; or use href="/sign-in" if you prefer a page */}
          <SignInButton mode="modal">
            <button className="px-4 py-2 rounded bg-black text-white">Sign in</button>
          </SignInButton>
          <a
            href="/sign-up"
            className="text-sm underline opacity-80 hover:opacity-100"
          >
            Or create an account
          </a>
        </SignedOut>

        {/* When signed in -> show UserButton + link to dashboard */}
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
          <a
            href="/dashboard"
            className="px-4 py-2 rounded bg-white text-black border mt-2"
          >
            Go to dashboard
          </a>
        </SignedIn>
      </div>
    </main><div
      className={`${outfit.className} min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-6 py-10`}
    >
        {/* --- SkyDrop Logo --- */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-6xl font-extrabold text-blue-600 leading-none">
            Sky
            <span className="text-gray-800 transform -rotate-2 inline-block ml-1">
              Drop
            </span>
          </h1>
          <p className="text-gray-900 mt-3 text-xl font-medium">
            Smarter Delivery Starts Here
          </p>
        </div>

        {/* --- Role Tabs --- */}
        <div className="flex items-center gap-3 mb-10 bg-white border border-gray-200 rounded-full p-1 shadow-sm">
          {roles.map((role) => {
            const roleColors = colorClasses[role.color as keyof typeof colorClasses];
            const isActive = activeRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setActiveRole(role.id)}
                className={`px-6 py-2 rounded-full font-semibold transition-all ${isActive
                    ? `${roleColors.bg} text-white shadow-sm`
                    : "text-gray-700 hover:text-gray-900"}`}
              >
                {role.title}
              </button>
            );
          })}
        </div>

        {/* --- Role Content --- */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRole}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-md"
          >
            <div
              className={`flex justify-center items-center text-5xl mb-4 ${colors.text}`}
            >
              {currentRole.emoji}
            </div>

            <h2 className={`text-2xl font-bold mb-2 ${colors.text}`}>
              {currentRole.title}
            </h2>

            <p className="text-gray-700 mb-6">{currentRole.description}</p>

            <div className="flex justify-center gap-4">
              {/* Sign In Button */}
              <Link href="/signin">
                <button onClick={}
                  className={`px-6 py-3 rounded-full font-semibold transition border ${colors.border} ${colors.text} hover:bg-gray-50`}
                >
                  Sign In
                </button>
              </Link>

              {/* Sign Up Button */}
              <Link href="/signup">
                <button
                  className={`px-6 py-3 rounded-full font-semibold text-white transition ${colors.bg} ${colors.hover}`}
                >
                  Sign Up
                </button>
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        <footer className="text-center text-gray-400 text-xs mt-16">
          © 2025 SkyDrop Team
        </footer>
      </div></>
  );
}

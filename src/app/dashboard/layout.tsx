"use client";

import Link from "next/link";
import { Outfit } from "next/font/google";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className={`${outfit.className} min-h-screen bg-white`}>
      {/* --- Fixed Nav Bar --- */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="fixed top-0 left-0 w-full bg-white/70 backdrop-blur-md shadow-sm border-b border-gray-200 z-50"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-baseline gap-1">
            <h1 className="text-2xl font-extrabold text-blue-600">
              Sky
              <span className="text-gray-900 transform -rotate-2 inline-block ml-0.5">
                Drop
              </span>
            </h1>
          </Link>

          {/* Right section (profile placeholder) */}
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/profile"
              className="text-gray-700 hover:text-blue-600 font-medium transition"
            >
              Profile
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* --- Main Content --- */}
      <main className="pt-24 px-6">{children}</main>
    </div>
  );
}

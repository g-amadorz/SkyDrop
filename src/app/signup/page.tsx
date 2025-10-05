"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const roles = [
  {
    id: "shipper",
    title: "Shipper",
    color: "blue",
    emoji: "🚚",
    description:
      "Manage your shipments efficiently and track deliveries in real time.",
  },
  {
    id: "commuter",
    title: "Commuter",
    color: "black",
    emoji: "🚴",
    description:
      "Deliver packages along your routes and earn rewards with SkyDrop.",
  },
  {
    id: "accesspoint",
    title: "Access Point",
    color: "orange",
    emoji: "🏪",
    description:
      "Host deliveries at your location and become part of the SkyDrop network.",
  },
];

export default function Dashboard() {
  const [activeRole, setActiveRole] = useState("shipper");
  const currentRole = roles.find((r) => r.id === activeRole)!;

  return (
    <div className={`${outfit.className} min-h-screen bg-gray-50`}>
      {/* --- Top Nav --- */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center px-6 py-4">
          {/* Logo */}
          <h1 className="text-3xl font-extrabold text-blue-600">
            Sky<span className="text-gray-900">Drop</span>
          </h1>

          {/* Profile (placeholder) */}
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold">
            N
          </div>
        </div>

        {/* --- Role Selector (like Uber Eats/Rides) --- */}
        <div className="flex justify-center bg-white border-t border-gray-100">
          <div className="flex gap-10 py-3">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setActiveRole(role.id)}
                className={`flex flex-col items-center font-semibold transition-all ${
                  activeRole === role.id
                    ? role.color === "black"
                      ? "text-gray-900 border-b-4 border-gray-900"
                      : role.color === "orange"
                      ? "text-orange-500 border-b-4 border-orange-500"
                      : "text-blue-600 border-b-4 border-blue-600"
                    : "text-gray-400 hover:text-gray-600 border-b-4 border-transparent"
                }`}
              >
                <span className="text-2xl mb-1">{role.emoji}</span>
                <span>{role.title}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* --- Role Content --- */}
      <main className="pt-40 pb-20 px-6 max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRole}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <h2
              className={`text-3xl font-bold mb-3 ${
                currentRole.color === "black"
                  ? "text-gray-900"
                  : currentRole.color === "orange"
                  ? "text-orange-500"
                  : "text-blue-600"
              }`}
            >
              {currentRole.title}
            </h2>
            <p className="text-gray-700 mb-6">{currentRole.description}</p>

            <button
              className={`px-8 py-3 rounded-full text-white font-semibold transition ${
                currentRole.color === "black"
                  ? "bg-gray-900 hover:bg-black"
                  : currentRole.color === "orange"
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              Manage
            </button>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

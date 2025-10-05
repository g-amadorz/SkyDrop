"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const roles = [
  { id: "shipper", title: "Shipper", color: "blue", emoji: "🚚" },
  { id: "commuter", title: "Commuter", color: "black", emoji: "🚴" },
  { id: "accesspoint", title: "Access Point", color: "orange", emoji: "🏪" },
];

export default function Dashboard() {
  const [activeRole, setActiveRole] = useState("shipper");
  const [showRoleBar, setShowRoleBar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const currentRole = roles.find((r) => r.id === activeRole)!;

  // Hide/show on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY && currentY > 80) setShowRoleBar(false);
      else setShowRoleBar(true);
      setLastScrollY(currentY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div
      className={`${outfit.className} flex flex-col items-center text-center bg-white min-h-screen`}
    >
      {/* --- Main Navbar --- */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm flex justify-between items-center px-6 py-4 z-30">
        <h1 className="text-2xl font-extrabold text-blue-600">
          Sky<span className="text-gray-900">Drop</span>
        </h1>
        <button className="text-gray-700 font-medium hover:underline">
          Profile
        </button>
      </header>

      {/* --- Roles Nav Bar --- */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: showRoleBar ? 0 : -80 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed top-[64px] left-0 right-0 backdrop-blur-md bg-white/80 border-b border-gray-200/20 flex justify-center gap-12 py-2 z-20"
      >
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => setActiveRole(role.id)}
            className={`relative flex items-center gap-2 pb-2 text-base font-semibold transition-all ${
              activeRole === role.id
                ? role.color === "blue"
                  ? "text-blue-600"
                  : role.color === "orange"
                  ? "text-orange-500"
                  : "text-gray-900"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <span className="text-xl">{role.emoji}</span>
            {role.title}
            {activeRole === role.id && (
              <motion.div
                layoutId="underline"
                className={`absolute bottom-0 left-0 right-0 h-[3px] rounded-full ${
                  role.color === "blue"
                    ? "bg-blue-500"
                    : role.color === "orange"
                    ? "bg-orange-500"
                    : "bg-gray-900"
                }`}
              />
            )}
          </button>
        ))}
      </motion.div>

      {/* --- Main Content --- */}
      <main className="pt-[140px] pb-20 w-full flex flex-col items-center px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRole}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="max-w-md text-center"
          >
            <h2
              className={`text-3xl font-bold mb-4 ${
                currentRole.color === "blue"
                  ? "text-blue-600"
                  : currentRole.color === "orange"
                  ? "text-orange-500"
                  : "text-gray-900"
              }`}
            >
              {currentRole.title}
            </h2>
            <p className="text-gray-700 mb-6">
              {activeRole === "shipper"
                ? "Manage your shipments efficiently and track deliveries in real time."
                : activeRole === "commuter"
                ? "Deliver packages along your daily routes and earn rewards with SkyDrop."
                : "Host deliveries at your location and become part of the SkyDrop network."}
            </p>
            <button
              className={`px-6 py-3 rounded-full font-semibold text-white ${
                currentRole.color === "blue"
                  ? "bg-blue-500 hover:bg-blue-600"
                  : currentRole.color === "orange"
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "bg-gray-900 hover:bg-black"
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

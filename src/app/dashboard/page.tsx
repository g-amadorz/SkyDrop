"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Outfit } from "next/font/google";
import ShipperSection from "./ShipperSection";
import CommuterSection from "./CommuterSection";
// import AccessPointSection from "./AccessPointSection"; // ✅ fixed import

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

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setShowRoleBar(currentY <= lastScrollY || currentY < 80);
      setLastScrollY(currentY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div
      className={`${outfit.className} flex flex-col items-center text-center bg-white min-h-screen`}
    >
      {/* --- Header --- */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm flex justify-between items-center px-6 py-4 z-30">
        <h1 className="text-2xl font-extrabold text-blue-600">
          Sky<span className="text-gray-900">Drop</span>
        </h1>
      </header>

      {/* --- Role Tabs (rounded design) --- */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: showRoleBar ? 0 : -80 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed top-[64px] left-0 right-0 flex justify-center z-20 mt-8"
      >
        <div className="flex items-center justify-center gap-8 bg-white border border-gray-200 rounded-full px-10 py-3 shadow-sm backdrop-blur-md">
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
                  className={`absolute bottom-0 left-0 right-0 h-[3px] ${
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
        </div>
      </motion.div>

      {/* --- Page Content --- */}
      <main className="pt-[110px] pb-20 w-full flex justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRole}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="w-full flex justify-center"
          >
            {activeRole === "shipper" ? (
              <ShipperSection />
            ) : activeRole === "commuter" ? (
              <CommuterSection />
            ) : (
              <AccessPointSection />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

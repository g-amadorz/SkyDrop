"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Outfit } from "next/font/google";
import { Button, TextField } from "@mui/material";
import { CreditCard, Settings, LogOut } from "lucide-react";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function ProfilePage() {
  const [userPoints, setUserPoints] = useState<number>(1200);
  const [chargeAmount, setChargeAmount] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // 💰 Conversion rate: 10 pts = $1.00
  const dollarValue = (userPoints * 0.1).toFixed(2);

  const handleCharge = () => {
    if (!chargeAmount || chargeAmount <= 0) {
      setMessage("⚠️ Please enter a valid amount.");
      return;
    }
    setUserPoints((prev) => prev + chargeAmount);
    setMessage(`✅ Successfully charged ${chargeAmount} pts!`);
    setChargeAmount(null);
  };

  const handleLogout = () => {
    setMessage("👋 Logged out");
  };

  // ⏱ Message disappears automatically after 3s
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`${outfit.className} flex flex-col items-center text-center px-6 py-12 bg-white w-full`}
    >
      {/* Header */}
      <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-2">
        Your <span className="text-blue-600">SkyDrop</span> Profile
      </h1>
      <p className="text-gray-600 mb-10 max-w-md">
        Check your balance, manage your account, and adjust settings.
      </p>

      {/* --- Points Display --- */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl shadow-sm p-6 mb-10 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">💰 Current Points</h2>

        <motion.p
          key={userPoints} // animate whenever userPoints changes
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-4xl font-extrabold text-blue-600 mb-2"
        >
          {userPoints} pts
        </motion.p>

        <p className="text-gray-700 text-lg font-semibold mb-3">
          ≈ ${dollarValue} USD
        </p>
        <p className="text-gray-500 text-sm italic">(💡 10 pts = $1.00)</p>
      </div>

      {/* --- Charge Points Section --- */}
      <div className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-2xl shadow-sm p-6 mb-10">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Add Points</h3>
        <div className="flex items-center gap-3 mb-4">
          <TextField
            label="Enter amount"
            type="number"
            value={chargeAmount ?? ""}
            onChange={(e) => setChargeAmount(Number(e.target.value))}
            className="flex-1"
          />
          <Button
            variant="contained"
            onClick={handleCharge}
            sx={{
              backgroundColor: "#2563eb",
              textTransform: "none",
              "&:hover": { backgroundColor: "#1e40af" },
              fontWeight: 600,
            }}
          >
            Charge
          </Button>
        </div>

        {message && (
          <p
            className={`text-sm font-medium transition ${
              message.startsWith("✅")
                ? "text-green-600"
                : message.startsWith("⚠️")
                ? "text-yellow-600"
                : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}
      </div>

      {/* --- Settings --- */}
      <div className="w-full max-w-md space-y-3 text-left">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Settings</h3>

        <button className="w-full flex items-center justify-between border border-gray-200 p-4 rounded-xl hover:bg-gray-50 transition">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-gray-600" />
            <span>Payment Methods</span>
          </div>
          <span className="text-gray-400">›</span>
        </button>

        <button className="w-full flex items-center justify-between border border-gray-200 p-4 rounded-xl hover:bg-gray-50 transition">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-gray-600" />
            <span>Account Preferences</span>
          </div>
          <span className="text-gray-400">›</span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between border border-gray-200 p-4 rounded-xl hover:bg-red-50 transition"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5 text-red-500" />
            <span className="text-red-600 font-medium">Log Out</span>
          </div>
          <span className="text-gray-400">›</span>
        </button>
      </div>
    </motion.div>
  );
}

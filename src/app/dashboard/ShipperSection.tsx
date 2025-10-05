"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function ShipperSection() {
  const [hops, setHops] = useState(1);
  const [price, setPrice] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");

  // Box size info
  const boxSizes = [
    { id: "T", name: "T — Minimum Mail", size: "140 × 90 × 0.18 mm", multiplier: 1.0 },
    { id: "S", name: "S — Postcard", size: "235 × 120 mm", multiplier: 1.2 },
    { id: "V", name: "V — Standard Mail", size: "245 × 150 × 5 mm", multiplier: 1.5 },
    { id: "X", name: "X — Standard (L)", size: "≤ 5 mm", multiplier: 1.8},
    { id: "W", name: "W — Oversize", size: "380 × 270 × 20 mm", multiplier: 2.5 },
    { id: "Y", name: "Y — Oversize Thick", size: "≤ 20 mm", multiplier: 3.0 },
  
   
  ];

  const calculatePrice = () => {
    if (!selectedSize) return;
    const sizeData = boxSizes.find((s) => s.id === selectedSize)!;
    const totalPrice = 10 * hops * sizeData.multiplier;
    setPrice(totalPrice);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`${outfit.className} flex flex-col items-center text-center px-6 py-12 bg-white w-full`}
    >
      {/* --- Header & Slogan --- */}
      <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-2">
        Calculate your{" "}
        <span className="text-blue-600">SkyDrop Delivery</span>
      </h1>
      <p className="text-gray-600 mb-10 max-w-md">
        Check available box sizes and estimate <br/> your delivery cost by hops
      </p>

      {/* --- Box Size Grid --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mb-10">
        {boxSizes.map((box) => (
          <button
            key={box.id}
            onClick={() => setSelectedSize(box.id)}
            className={`p-5 rounded-xl border transition-all ${
              selectedSize === box.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-300"
            }`}
          >
            <h3 className="text-lg font-semibold text-gray-800">{box.name}</h3>
            <p className="text-sm text-gray-600">{box.size}</p>
          </button>
        ))}
      </div>

        {/* --- Pricing Formula --- */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm mb-6 max-w-md text-left">
        <p className="text-gray-800 font-semibold mb-2">📦 Pricing Formula</p>
        <p className="text-gray-600 text-sm leading-relaxed">
          <span className="font-medium text-blue-600">Total Price</span> = 10 pts ×{" "}
          <span className="font-medium text-gray-900">Hops</span> ×{" "}
          <span className="font-medium text-gray-900">Size</span>
        </p>
      </div>

      {/* --- Size Selection Dropdown --- */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm mb-6 max-w-md w-full">
        <label className="block text-left text-gray-600 text-sm mb-2 font-medium">
          Select Package Size
        </label>
        <select
          value={selectedSize}
          onChange={(e) => setSelectedSize(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded-lg p-3 font-medium text-gray-800 focus:ring-2 focus:ring-blue-400 outline-none"
        >
          <option value="">Select a size</option>
          {boxSizes.map((box) => (
            <option key={box.id} value={box.id}>
              {box.name} ({box.size})
            </option>
          ))}
        </select>
      </div>

      {/* --- Hops Input --- */}
      <div className="bg-gray-100 rounded-xl px-4 py-3 shadow-sm w-full max-w-md">
        <label className="block text-left text-gray-600 text-sm mb-2 font-medium">
          Number of Hops
        </label>
        <input
          type="number"
          min="1"
          value={hops}
          onChange={(e) => setHops(Number(e.target.value))}
          className="w-full bg-white border border-gray-300 rounded-lg p-3 font-medium text-gray-800 focus:ring-2 focus:ring-blue-400 outline-none"
        />
      </div>

       {/* --- Result --- */}
      {price !== null && (
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm w-full max-w-md">
          <p className="text-lg font-semibold text-gray-800">
            Total Price:{" "}
            <span className="text-blue-600">{price.toFixed(1)} pts</span>
          </p>
        </div>
      )}

      {/* --- Buttons --- */}
      <div className="flex flex-col w-full max-w-md gap-3 mt-6">
        <button
          onClick={calculatePrice}
          disabled={!selectedSize}
          className={`py-4 rounded-full font-semibold text-white shadow-md transition-all ${
            selectedSize
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Calculate Delivery Price
        </button>

        <button
          disabled={price === null}
          className="py-4 rounded-full font-semibold text-gray-900 border border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Delivery
        </button>
      </div>

    </motion.div>
  );
}

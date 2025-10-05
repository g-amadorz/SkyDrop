"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Outfit } from "next/font/google";
import { TextField, Autocomplete } from "@mui/material";
import { bfsShortestPath, skytrainGraph } from "@/app/compute/CalcHops";
import { useAccesspoint } from "@/app/contexts/AccesspointContext";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function ShipperSection() {
  const [price, setPrice] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [hops, setHops] = useState<number | null>(null);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  // 💰 temporary mock user points
  const [userPoints, setUserPoints] = useState(200); // you can fetch from backend later

  const { accessPoints } = useAccesspoint();

  // --- Box size info ---
  const boxSizes = [
    { id: "T", name: "T — Minimum Mail", size: "140 × 90 × 0.18 mm", multiplier: 1.0 },
    { id: "S", name: "S — Postcard", size: "235 × 120 mm", multiplier: 1.2 },
    { id: "V", name: "V — Standard Mail", size: "245 × 150 × 5 mm", multiplier: 1.5 },
    { id: "X", name: "X — Standard (L)", size: "≤ 5 mm", multiplier: 1.8 },
    { id: "W", name: "W — Oversize", size: "380 × 270 × 20 mm", multiplier: 2.5 },
    { id: "Y", name: "Y — Oversize Thick", size: "≤ 20 mm", multiplier: 3.0 },
  ];

  // --- Combine Access Points + Stations ---
  const accessPointOptions =
    accessPoints?.map((ap: any) => ({
      label: `${ap.name} (Access Point)`,
      value: ap.name,
      nearestStation: ap.nearestStation,
    })) || [];

  const stationOptions = Object.keys(skytrainGraph).map((station) => ({
    label: `${station} (Station)`,
    value: station,
  }));

  const allOptions = [...accessPointOptions, ...stationOptions];

  // --- Helper to resolve Access Point → Station ---
  const resolveToStation = (value: string) => {
    const ap = accessPoints.find((ap: any) => ap.name === value);
    return ap?.nearestStation || value;
  };

  // --- Calculate hops automatically ---
  const calculateHops = () => {
    if (!origin || !destination) return null;
    const start = resolveToStation(origin);
    const end = resolveToStation(destination);
    const { hops } = bfsShortestPath(skytrainGraph, start, end);
    setHops(hops);
    return hops;
  };

  // --- Calculate price based on hops ---
  const calculatePrice = () => {
    if (!selectedSize) return;
    const sizeData = boxSizes.find((s) => s.id === selectedSize);
    if (!sizeData) return;

    const hopCount = typeof hops === "number" && hops > 0 ? hops : 1;
    const total = 10 * hopCount * sizeData.multiplier;
    setPrice(Number(total.toFixed(1)));
    setMessage(null); // reset message if re-calculated
  };

  // --- Request delivery ---
  const requestDelivery = () => {
    if (price === null) return;
    if (userPoints < price) {
      setMessage("❌ Not enough points! You need to recharge on your page.");
      return;
    }

    const newPoints = userPoints - price;
    setUserPoints(newPoints);
    setMessage(
      `✅ The delivery has been requested. Your current point is ${newPoints.toFixed(
        1
      )} pts.`
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      // ↓ Reduced vertical padding (was py-12)
      className={`${outfit.className} flex flex-col items-center text-center px-6 pt-6 pb-10 bg-white w-full`}
    >
      {/* Header */}
      <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-2">
        Start your <span className="text-blue-600">SkyDrop Delivery</span>
      </h1>
      <p className="text-gray-600 mb-10 max-w-md">
        Select your route and package size <br /> to estimate your delivery cost
      </p>

      {/* Origin & Destination */}
      <div className="w-full max-w-md mb-8 flex flex-col gap-4">
        <Autocomplete
          options={allOptions}
          getOptionLabel={(option) => option.label}
          onChange={(_, newValue) => setOrigin(newValue?.value || "")}
          renderInput={(params) => (
            <TextField {...params} label="Origin (Access Point or Station)" required />
          )}
        />

        <Autocomplete
          options={allOptions}
          getOptionLabel={(option) => option.label}
          onChange={(_, newValue) => setDestination(newValue?.value || "")}
          renderInput={(params) => (
            <TextField {...params} label="Destination (Access Point or Station)" required />
          )}
        />

        <button
          onClick={calculateHops}
          className="mt-3 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-md transition"
        >
          Calculate Hops
        </button>

        {hops !== null && (
          <p className="text-gray-800 font-semibold mt-2">
            📍 Hops between locations: <span className="text-blue-600">{hops}</span>
          </p>
        )}
      </div>

      {/* Box Sizes */}
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

      {/* Pricing Formula */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm mb-6 max-w-md text-left">
        <p className="text-gray-800 font-semibold mb-2">📦 Pricing Formula</p>
        <p className="text-gray-600 text-sm leading-relaxed">
          <span className="font-medium text-blue-600">Total Price</span> = 10 pts ×{" "}
          <span className="font-medium text-gray-900">Hops</span> ×{" "}
          <span className="font-medium text-gray-900">Size</span>
        </p>
      </div>

      {/* Result */}
      {price !== null && (
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm w-full max-w-md">
          <p className="text-lg font-semibold text-gray-800">
            Total Price: <span className="text-blue-600">{price.toFixed(1)} pts</span>
          </p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col w-full max-w-md gap-3 mt-6">
        <button
          type="button"
          onClick={calculatePrice}
          disabled={!selectedSize}
          className={`py-4 rounded-full font-semibold text-white shadow-md transition-all ${
            selectedSize ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Calculate Delivery Price
        </button>

        <button
          type="button"
          onClick={requestDelivery}
          disabled={price === null}
          className="py-4 rounded-full font-semibold text-gray-900 border border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Request Delivery
        </button>
      </div>

      {/* Message */}
      {message && (
        <p
          className={`mt-6 text-sm font-medium ${
            message.startsWith("✅") ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </motion.div>
  );
}

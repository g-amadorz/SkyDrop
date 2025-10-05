"use client";
import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Outfit } from "next/font/google";
import Link from "next/link";
import { TextField, Button, Box, Autocomplete, Alert, Typography } from "@mui/material";
import { useProduct } from '../contexts/ProductContext';
import { useAccesspoint } from '../contexts/AccesspointContext';
import { bfsShortestPath, skytrainGraph } from '../compute/CalcHops';

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Basic product creation form
const Page = () => {
  const { user } = useUser();
  const [form, setForm] = useState({
    currApId: "",
    destApId: "",
    name: ""
  });

  const { create } = useProduct();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };


  // Helper to resolve to station if access point
  const resolveToStation = (optionId: string) => {
    // Try to find in accessPoints by ID
    const ap = accessPoints.find((ap: any) => ap.id === optionId || ap._id === optionId);
    if (ap && ap.nearestStation) return ap.nearestStation;
    // Otherwise, assume it's a station name/id
    return optionId;
  };

  // Calculate hops (price) using BFS
  const calculateCost = () => {
    if (!form.currApId || !form.destApId) return { hops: 0, path: [] };
    const origin = resolveToStation(form.currApId);
    const dest = resolveToStation(form.destApId);
    return bfsShortestPath(skytrainGraph, origin, dest);
  };

  const [showApproval, setShowApproval] = useState(false);
  const [calculatedCost, setCalculatedCost] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Calculate cost and show approval dialog
    const { hops } = calculateCost();
    setCalculatedCost(hops);
    setShowApproval(true);
  };

  const handleApprove = () => {
    const productId = "mock-product-id";
    const shipperId = user?.id;
    if (!shipperId) {
      alert("You must be signed in to create a delivery.");
      return;
    }
    const { hops } = calculateCost();
    
    create({
      productId,
      shipperId,
      currApId: form.currApId,
      destApId: form.destApId,
      price: hops,
      name: form.name
    });
    setShowApproval(false);
  };

  const handleCancel = () => {
    setShowApproval(false);
  };


  //Todo:
  //Commuter page should also be showing before commuter accepts a job


  // Get access points and stations
  const { accessPoints } = useAccesspoint();
  
  // Map access points to option objects
  const accessPointOptions = accessPoints.map((ap: any, index: number) => ({
    label: `${ap.name} (Access Point)`,
    value: ap.name,
    type: 'accessPoint',
    id: ap._id || ap.id,
    uniqueKey: `ap-${ap._id || ap.id || index}`, // Unique key for React rendering
    lat: ap.lat,
    lng: ap.lng,
    stationId: ap.stationId || ap.nearestStation,
  }));
  
  // NOTE: Stations are not included because deliveries require physical access points
  // where packages can be picked up and dropped off. Stations are used for routing only.
  
  // Only use access points for deliveries
  const allOptions = [...accessPointOptions];

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
          <Link href="/dashboard" className="flex items-baseline gap-1">
            <h1 className="text-2xl font-extrabold text-blue-600">
              Sky
              <span className="text-gray-900 transform -rotate-2 inline-block ml-0.5">
                Drop
              </span>
            </h1>
          </Link>
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
      <main className="pt-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center text-center max-w-2xl mx-auto"
        >
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            Send a <span className="text-blue-600">Package</span>
          </h1>
          <p className="text-gray-600 mb-10 max-w-md">
            Create a new delivery request and let commuters bring it to your destination.
          </p>

          {!user && (
            <Alert severity="info" className="mb-6 w-full">
              Please sign in to create a delivery
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField
              label="Product Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              fullWidth
            />
            <Autocomplete
              options={allOptions}
              getOptionLabel={option => option.label}
              getOptionKey={option => option.uniqueKey}
              value={allOptions.find(opt => opt.id === form.currApId) || null}
              onChange={(_, newValue) => setForm(f => ({ ...f, currApId: newValue ? newValue.id : "" }))}
              renderInput={(params) => (
                <TextField {...params} label="Origin Access Point" required />
              )}
            />
            <Autocomplete
              options={allOptions}
              getOptionLabel={option => option.label}
              getOptionKey={option => option.uniqueKey}
              value={allOptions.find(opt => opt.id === form.destApId) || null}
              onChange={(_, newValue) => setForm(f => ({ ...f, destApId: newValue ? newValue.id : "" }))}
              renderInput={(params) => (
                <TextField {...params} label="Destination Access Point" required />
              )}
            />
            <button
              type="submit"
              className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-md transition"
            >
              Calculate & Preview
            </button>
          </Box>
          
          {showApproval && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 p-6 border-2 border-blue-500 rounded-2xl bg-blue-50 w-full"
            >
              <Typography variant="h6" className="text-gray-900 font-bold mb-4">
                Delivery Preview
              </Typography>
              <div className="text-left space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Product:</span>
                  <span className="font-semibold">{form.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance:</span>
                  <span className="font-semibold">{calculatedCost} hops</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Cost:</span>
                  <span className="font-semibold text-blue-600">1.65 points</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleApprove}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition"
                >
                  Confirm & Send
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 py-2 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-full transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Page;
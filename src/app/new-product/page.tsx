"use client";
import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { TextField, Button, Box, Autocomplete } from "@mui/material";
import { useProduct } from '../contexts/ProductContext';
import { useAccesspoint } from '../contexts/AccesspointContext';
import { bfsShortestPath, skytrainGraph } from '../compute/CalcHops';

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


  // Get access points and stations, access points first
  const { accessPoints } = useAccesspoint();
  // Map access points to option objects
  const accessPointOptions = accessPoints.map((ap: any) => ({
    label: `${ap.name} (Access Point) [${ap.lat?.toFixed?.(4) ?? ''}, ${ap.lng?.toFixed?.(4) ?? ''}]`,
    value: ap.name,
    type: 'accessPoint',
    id: ap._id || ap.id, // Use MongoDB _id if available, fallback to id
    lat: ap.lat,
    lng: ap.lng,
  }));
  // Map stations to option objects - REMOVED, only use access points for deliveries
  // const stationOptions = Object.keys(skytrainGraph).sort().map(station => ({
  //   label: station + ' (Station)',
  //   value: station,
  //   type: 'station',
  //   id: station,
  // }));
  // Combine, access points first - ONLY use access points now
  const allOptions = [...accessPointOptions];

  return (
    <>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label="Product Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <Autocomplete
          options={allOptions}
          getOptionLabel={option => option.label}
          value={allOptions.find(opt => opt.id === form.currApId) || null}
          onChange={(_, newValue) => setForm(f => ({ ...f, currApId: newValue ? newValue.id : "" }))}
          renderInput={(params) => (
            <TextField {...params} label="Origin (Access Point or Station)" required />
          )}
        />
        <Autocomplete
          options={allOptions}
          getOptionLabel={option => option.label}
          value={allOptions.find(opt => opt.id === form.destApId) || null}
          onChange={(_, newValue) => setForm(f => ({ ...f, destApId: newValue ? newValue.id : "" }))}
          renderInput={(params) => (
            <TextField {...params} label="Destination (Access Point or Station)" required />
          )}
        />
        <Button type="submit" variant="contained">
          Calculate & Approve
        </Button>
      </Box>
      {showApproval && (
        <Box sx={{ mt: 2, p: 2, border: '1px solid #ccc', borderRadius: 2, background: '#fafafa' }}>
          <div>Number of Hops (Cost): <b>{calculatedCost}</b></div>
          <div style={{ marginTop: 8 }}>
            <Button onClick={handleApprove} variant="contained" color="success" sx={{ mr: 1 }}>Approve</Button>
            <Button onClick={handleCancel} variant="outlined" color="error">Cancel</Button>
          </div>
        </Box>
      )}
    </>
  );
};

export default Page;
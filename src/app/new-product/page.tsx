"use client";
import React, { useState } from "react";
import { TextField, Button, Box, Autocomplete } from "@mui/material";
import { useProduct } from '../contexts/ProductContext';
import { bfsShortestPath, skytrainGraph } from '../compute/CalcHops';

// Basic product creation form
const Page = () => {
  const [form, setForm] = useState({
    currApId: "",
    destApId: "",
  });

  const { create, accessPoints } = useProduct();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };


  // Helper to resolve to station if access point
  const resolveToStation = (optionValue: string) => {
    // Try to find in accessPoints
    const ap = accessPoints.find((ap: any) => ap.name === optionValue);
    if (ap && ap.nearestStation) return ap.nearestStation;
    // Otherwise, assume it's a station name
    return optionValue;
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
    // currApId = origin, destApId = destination, price = hops
    const { hops } = calculateCost();
    create(form.currApId, form.destApId, hops);
    setShowApproval(false);
  };

  const handleCancel = () => {
    setShowApproval(false);
  };


  //Todo:
  //Commuter page should also be showing before commuter accepts a job


  // Get access points and stations, access points first (from ProductProvider)
  const accessPointOptions = accessPoints.map((ap: any) => ({
    label: `${ap.name} (Access Point) [${ap.lat?.toFixed?.(4) ?? ''}, ${ap.lng?.toFixed?.(4) ?? ''}]`,
    value: ap.name,
    type: 'accessPoint',
    id: ap.id,
    lat: ap.lat,
    lng: ap.lng,
  }));
  // Map stations to option objects
  const stationOptions = Object.keys(skytrainGraph).sort().map(station => ({
    label: station + ' (Station)',
    value: station,
    type: 'station',
    id: station,
  }));
  // Combine, access points first
  const allOptions = [...accessPointOptions, ...stationOptions];

  return (
    <>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Autocomplete
          options={allOptions}
          getOptionLabel={option => option.label}
          value={allOptions.find(opt => opt.value === form.currApId) || null}
          onChange={(_, newValue) => setForm(f => ({ ...f, currApId: newValue ? newValue.value : "" }))}
          renderInput={(params) => (
            <TextField {...params} label="Origin (Access Point or Station)" required />
          )}
        />
        <Autocomplete
          options={allOptions}
          getOptionLabel={option => option.label}
          value={allOptions.find(opt => opt.value === form.destApId) || null}
          onChange={(_, newValue) => setForm(f => ({ ...f, destApId: newValue ? newValue.value : "" }))}
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
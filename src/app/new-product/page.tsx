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

  const { create } = useProduct();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };


  // Calculate hops (price) using BFS
  const calculateCost = () => {
    if (!form.currApId || !form.destApId) return 0;
    return bfsShortestPath(skytrainGraph, form.currApId, form.destApId);
  };

  const [showApproval, setShowApproval] = useState(false);
  const [calculatedCost, setCalculatedCost] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Calculate cost and show approval dialog
    const cost = calculateCost();
    setCalculatedCost(cost);
    setShowApproval(true);
  };

  const handleApprove = () => {
    // currApId = origin, destApId = destination, price = hops
    const hops = calculateCost();
    create(form.currApId, form.destApId, hops);
    setShowApproval(false);
  };

  const handleCancel = () => {
    setShowApproval(false);
  };


  //Todo:
  //Commuter page should also be showing before commuter accepts a job

  // Get all unique station names from the graph
  const stationNames = Object.keys(skytrainGraph).sort();

  return (
    <>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Autocomplete
          options={stationNames}
          value={form.currApId}
          onChange={(_, newValue) => setForm(f => ({ ...f, currApId: newValue || "" }))}
          renderInput={(params) => (
            <TextField {...params} label="Origin Station (currApId)" required />
          )}
        />
        <Autocomplete
          options={stationNames}
          value={form.destApId}
          onChange={(_, newValue) => setForm(f => ({ ...f, destApId: newValue || "" }))}
          renderInput={(params) => (
            <TextField {...params} label="Destination Station (destApId)" required />
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
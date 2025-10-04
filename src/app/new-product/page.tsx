"use client";
import React, { useState } from "react";
import { TextField, Button, Box, InputAdornment } from "@mui/material";
import { useProduct } from '../contexts/ProductContext';

// Basic product creation form
const Page = () => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
  });

  const { create } = useProduct();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "price") {
      // Allow any input, but trim to two decimals if needed
      const match = value.match(/^(\d*\.?\d{0,2})/);
      setForm({ ...form, [name]: match ? match[1] : "" });
    } 
    else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    const fieldValues = Object.values(form);
    create(fieldValues[0], fieldValues[1], fieldValues[2])
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <TextField
        label="Name"
        name="name"
        value={form.name}
        onChange={handleChange}
        required
      />
      <TextField
        label="Description"
        name="description"
        value={form.description}
        onChange={handleChange}
        required
      />
      <TextField
        label="Price"
        name="price"
        value={form.price}
        onChange={handleChange}
        type="number"       //Allow for 2 decimal places and require 2 decimal places
        required
        InputProps={{
          startAdornment: <InputAdornment position="start">$</InputAdornment>,
        }}
      />
      <Button type="submit" variant="contained">
        Create Product
      </Button>
    </Box>
  );
};

export default Page;
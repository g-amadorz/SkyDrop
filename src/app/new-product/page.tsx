"use client";
import React, { useState } from "react";
import { TextField, Button, Box } from "@mui/material";

// Basic product creation form
const Page = () => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: handle product creation logic
    console.log(form);
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
        type="number"
        required
      />
      <Button type="submit" variant="contained">
        Create Product
      </Button>
    </Box>
  );
};

export default Page;
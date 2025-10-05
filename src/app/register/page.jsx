"use client";
import React, { useState } from "react";
import { TextField, Button, Box, Typography } from "@mui/material";
import { useCommuter } from '../contexts/CommuterContext';
import { useShipper } from '../contexts/ShipperContext';

// Registration page for both commuter and shipper
const RegisterPage = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    pn: "",
    address: "",
    productId: "",
  });
  const [role, setRole] = useState("");
  const [registered, setRegistered] = useState(false);
  const [user, setUser] = useState(null);
  const { commuters, create: createCommuter } = useCommuter();
  const { shippers, create: createShipper } = useShipper();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (e) => {
    setRole(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let commuter = null;
    let shipper = null;
    if (role === "commuter" || role === "both") {
      commuter = {
        id: commuters.length === 0 ? 0 : Math.max(...commuters.map(c => c.id ?? 0)) + 1,
        productId: form.productId,
        firstName: form.firstName,
        lastName: form.lastName,
      };
      createCommuter(commuter.productId, commuter.firstName, commuter.lastName);
    }
    if (role === "shipper" || role === "both") {
      shipper = {
        id: shippers.length === 0 ? 0 : Math.max(...shippers.map(s => s.id ?? 0)) + 1,
        productId: form.productId,
        name: form.firstName + ' ' + form.lastName,
        email: form.email,
        pn: form.pn,
      };
      createShipper(shipper.productId, shipper.name, shipper.email, shipper.pn);
    }
    setUser({ commuter, shipper });
    setRegistered(true);
  };

  if (registered) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5">Registration Successful!</Typography>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 400, mx: "auto", mt: 4 }}>
      <Typography variant="h5">User Registration</Typography>
      <TextField label="First Name" name="firstName" value={form.firstName} onChange={handleChange} required />
      <TextField label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} required />
      <TextField label="Email" name="email" value={form.email} onChange={handleChange} required type="email" />
      <TextField label="Phone Number" name="pn" value={form.pn} onChange={handleChange} required />
      <TextField label="Address" name="address" value={form.address} onChange={handleChange} required />
      <TextField
        select
        label="Role"
        name="role"
        value={role}
        onChange={handleRoleChange}
        SelectProps={{ native: true }}
        required
      >
        <option value="">Select role</option>
        <option value="commuter">Commuter</option>
        <option value="shipper">Shipper</option>
        <option value="both">Both</option>
      </TextField>
      <Button type="submit" variant="contained">Register</Button>
    </Box>
  );
};

export default RegisterPage;

"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Alert
} from "@mui/material";
import { useProduct } from "../contexts/ProductContext";
import dynamic from "next/dynamic";

import "leaflet/dist/leaflet.css";

// Dynamically import Leaflet components (no SSR)
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then(mod => mod.Polyline), { ssr: false });

import { stationCoords } from "../compute/CalcHops";

const NewJob = () => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then(L => {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "/marker-icon-2x.png",
          iconUrl: "/marker-icon.png",
          shadowUrl: "/marker-shadow.png",
        });
      });
    }
  }, []);

  const { products, setCommuter } = useProduct();
  const [phone, setPhone] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [snack, setSnack] = useState(false);

  // Only show products with no commuterPN
  const availableProducts = products.filter(p => !p.commuterPN);

  // Basic phone validation (10 digits)
  const isValidPhone = /^\d{10}$/.test(phone);

  const handleClaim = (productId) => {
    if (isValidPhone) {
      setCommuter(productId, phone);
      setSelectedProduct(productId);
      setSnack(true);
    }
  };

  // Memoize station markers to prevent rerender flicker
  const markers = useMemo(
    () =>
      Object.entries(stationCoords).map(([name, [lat, lng]]) => (
        <Marker key={name} position={[lat, lng]} />
      )),
    []
  );

  // Coordinates for selected route
  const selectedJob = availableProducts.find(p => p.id === selectedProduct);
  const fromCoords = selectedJob ? stationCoords[selectedJob.currApId] : null;
  const toCoords = selectedJob ? stationCoords[selectedJob.destApId] : null;

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Available Jobs
      </Typography>

      <TextField
        label="Your Phone Number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        sx={{ mb: 2 }}
        fullWidth
        placeholder="e.g. 6041234567"
        error={phone.length > 0 && !isValidPhone}
        helperText={!isValidPhone && phone.length > 0 ? "Enter a valid 10-digit phone number" : ""}
      />

      <List sx={{ mb: 4 }}>
        {availableProducts.map((product) => (
          <ListItem key={product.id} divider>
            <ListItemText
              primary={`From: ${product.currApId} → ${product.destApId} | Hops: ${product.price}`}
              secondary={selectedProduct === product.id ? "Claimed!" : null}
            />
            <Button
              variant="contained"
              color="primary"
              disabled={selectedProduct === product.id || !isValidPhone}
              onClick={() => handleClaim(product.id)}
            >
              {selectedProduct === product.id ? "Claimed" : "Claim"}
            </Button>
          </ListItem>
        ))}
      </List>

      {/* Stable non-reloading map */}
      <Box
        sx={{
          height: 400,
          width: "100%",
          mb: 2,
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: 2
        }}
      >
        <MapContainer
          center={[49.25, -123.1]}
          zoom={11}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {markers}

          {/* Draw line between job points if claimed */}
          {fromCoords && toCoords && (
            <Polyline positions={[fromCoords, toCoords]} pathOptions={{ color: "blue", weight: 4 }} />
          )}
        </MapContainer>
      </Box>

      <Snackbar open={snack} autoHideDuration={3000} onClose={() => setSnack(false)}>
        <Alert severity="success" sx={{ width: "100%" }}>
          Job claimed successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NewJob;

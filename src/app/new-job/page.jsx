"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Outfit } from "next/font/google";
import { TextField, Autocomplete, Snackbar, Alert, Typography, Card, CardContent, CardActions, Button } from "@mui/material";
import { useUser } from "@clerk/nextjs";
import { useAccesspoint } from "../contexts/AccesspointContext";
import "leaflet/dist/leaflet.css";

import { stationCoords, bfsShortestPath, skytrainGraph } from "../compute/CalcHops";

// Leaflet dynamic imports
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then(mod => mod.Polyline), { ssr: false });

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function NewJob() {
  const { user } = useUser();
  const { accessPoints } = useAccesspoint();

  const [deliveries, setDeliveries] = useState([]);
  const [phone, setPhone] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [snack, setSnack] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [snackSeverity, setSnackSeverity] = useState("success");
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);

  // Leaflet icons setup
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

  // Fetch available deliveries
  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const res = await fetch('/api/deliveries?status=awaiting-pickup');
        const data = await res.json();
        if (data.success && data.data?.deliveries) {
          setDeliveries(data.data.deliveries);
        }
      } catch (error) {
        console.error('Error fetching deliveries:', error);
      }
    };

    fetchDeliveries();
    // Poll for new deliveries every 10 seconds
    const interval = setInterval(fetchDeliveries, 10000);
    return () => clearInterval(interval);
  }, []);

  // Combine Access Points + Stations for autocomplete
  const accessPointOptions =
    accessPoints?.map((ap) => ({
      label: `${ap.name} (Access Point)`,
      value: ap._id || ap.id,
      name: ap.name,
      nearestStation: ap.stationId || ap.nearestStation,
    })) || [];

  const stationOptions = Object.keys(skytrainGraph).map((station) => ({
    label: `${station} (Station)`,
    value: station,
    name: station,
  }));

  const allOptions = [...accessPointOptions, ...stationOptions];

  const isValidPhone = /^\d{10}$/.test(phone);

  // Helper to get access point by ID
  const getAccessPointById = (id) => {
    return accessPoints?.find(ap => ap._id === id || ap.id === id);
  };

  // Helper: AccessPoint ID → Station
  const resolveToStation = (accessPointId) => {
    const ap = getAccessPointById(accessPointId);
    return ap?.stationId || ap?.nearestStation || accessPointId;
  };

  // Filter deliveries based on origin/destination selection
  const handleFilterJobs = () => {
    if (!origin || !destination) {
      setSnackMessage("Please select both origin and destination");
      setSnackSeverity("warning");
      setSnack(true);
      return;
    }

    const filtered = deliveries.filter((delivery) => {
      const deliveryOrigin = resolveToStation(delivery.originAccessPoint);
      const deliveryDest = resolveToStation(delivery.destinationAccessPoint);
      const selectedOrigin = origin.includes('(Station)') ? origin.split(' (')[0] : resolveToStation(origin);
      const selectedDest = destination.includes('(Station)') ? destination.split(' (')[0] : resolveToStation(destination);

      return deliveryOrigin === selectedOrigin && deliveryDest === selectedDest;
    });

    setFilteredDeliveries(filtered);
    if (filtered.length === 0) {
      setSnackMessage("No jobs found for this route");
      setSnackSeverity("info");
      setSnack(true);
    } else {
      setSnackMessage(`Found ${filtered.length} job(s) for this route!`);
      setSnackSeverity("success");
      setSnack(true);
    }
  };

  const handleClaim = async (deliveryId) => {
    if (!isValidPhone || !user) {
      setSnackMessage("Please sign in and enter a valid phone number");
      setSnackSeverity("warning");
      setSnack(true);
      return;
    }

    setLoading(true);
    try {
      // First, ensure user exists in MongoDB
      await fetch('/api/users/create-from-clerk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.emailAddresses?.[0]?.emailAddress,
          name: user.fullName || user.firstName || 'User',
          role: 'rider'
        }),
      });

      // Claim the package
      const res = await fetch('/api/deliveries/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commuterId: user.id,
          deliveryId,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setSelectedDelivery(deliveryId);
        setSnackMessage('Job claimed successfully! 🎉');
        setSnackSeverity('success');
        setSnack(true);
        
        // Remove claimed delivery from lists
        setDeliveries(prev => prev.filter(d => d._id !== deliveryId));
        setFilteredDeliveries(prev => prev.filter(d => d._id !== deliveryId));
      } else {
        setSnackMessage(data.error || 'Failed to claim job');
        setSnackSeverity('error');
        setSnack(true);
      }
    } catch (error) {
      console.error('Error claiming delivery:', error);
      setSnackMessage('Failed to claim job');
      setSnackSeverity('error');
      setSnack(true);
    } finally {
      setLoading(false);
    }
  };

  // Calculate Route (hops + path)
  const calculateRoute = (originId, destId) => {
    const start = resolveToStation(originId);
    const end = resolveToStation(destId);
    return bfsShortestPath(skytrainGraph, start, end);
  };

  // Animated Markers for Selected Delivery
  const markers = useMemo(() => {
    if (!selectedDelivery) return [];
    
    const delivery = filteredDeliveries.find(d => d._id === selectedDelivery);
    if (!delivery) return [];

    const { path } = calculateRoute(delivery.originAccessPoint, delivery.destinationAccessPoint);
    const L = typeof window !== "undefined" ? require("leaflet") : null;
    if (!L) return [];

    return path.map((stationId, idx) => {
      const pos = stationCoords[stationId];
      if (!pos) return null;

      return (
        <Marker
          key={`marker-${idx}`}
          position={pos}
          icon={L.divIcon({
            className: "",
            html: `<div style="width:14px;height:14px;background:${
              idx === 0 ? "#3B82F6" : idx === path.length - 1 ? "#EF4444" : "#555"
            };border-radius:50%;border:2px solid white;"></div>`,
          })}
        />
      );
    }).filter(Boolean);
  }, [selectedDelivery, filteredDeliveries]);

  // Polyline for Selected Delivery
  const renderPath = () => {
    if (!selectedDelivery) return null;
    
    const delivery = filteredDeliveries.find(d => d._id === selectedDelivery);
    if (!delivery) return null;

    const { path } = calculateRoute(delivery.originAccessPoint, delivery.destinationAccessPoint);
    const pathCoords = path.map(stationId => stationCoords[stationId]).filter(Boolean);

    if (pathCoords.length < 2) return null;

    return (
      <Polyline
        positions={pathCoords}
        pathOptions={{ color: "#3B82F6", weight: 4 }}
      />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`${outfit.className} flex flex-col items-center text-center px-6 pt-6 pb-10 bg-white min-h-screen`}
    >
      {/* Header */}
      <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
        Become a <span className="text-gray-900">Commuter</span>
      </h1>
      <p className="text-gray-600 mb-10 max-w-md">
        Select your route to view available delivery jobs and earn rewards for each trip.
      </p>

      {!user && (
        <Alert severity="info" className="mb-6 max-w-md">
          Please sign in to claim jobs
        </Alert>
      )}

      {/* Phone Number Input */}
      <div className="w-full max-w-md mb-6">
        <TextField
          label="Your Phone Number"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          fullWidth
          placeholder="e.g. 6041234567"
          error={phone.length > 0 && !isValidPhone}
          helperText={!isValidPhone && phone.length > 0 ? "Enter a valid 10-digit phone number" : ""}
        />
      </div>

      {/* Origin / Destination Selection */}
      <div className="w-full max-w-md mb-8 flex flex-col gap-4">
        <Autocomplete
          options={allOptions}
          getOptionLabel={(option) => option.label}
          onChange={(_, newValue) => setOrigin(newValue?.value || "")}
          renderInput={(params) => <TextField {...params} label="Origin (Access Point or Station)" required />}
        />

        <Autocomplete
          options={allOptions}
          getOptionLabel={(option) => option.label}
          onChange={(_, newValue) => setDestination(newValue?.value || "")}
          renderInput={(params) => <TextField {...params} label="Destination (Access Point or Station)" required />}
        />

        <button
          onClick={handleFilterJobs}
          className="mt-3 py-3 bg-gray-900 hover:bg-black text-white font-semibold rounded-full shadow-md transition"
        >
          Find Jobs
        </button>
      </div>

      {/* Available Jobs */}
      {filteredDeliveries.length > 0 && (
        <div className="w-full max-w-3xl mb-10">
          <p className="text-lg font-semibold text-gray-800 mb-4">
            Available Jobs for this route:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredDeliveries.map((delivery) => {
              const originAP = getAccessPointById(delivery.originAccessPoint);
              const destAP = getAccessPointById(delivery.destinationAccessPoint);
              const { hops } = calculateRoute(delivery.originAccessPoint, delivery.destinationAccessPoint);

              return (
                <Card
                  key={delivery._id}
                  onClick={() => setSelectedDelivery(delivery._id)}
                  className={`cursor-pointer transition-all ${
                    selectedDelivery === delivery._id
                      ? "border-2 border-gray-900 bg-gray-50"
                      : "border border-gray-200 hover:border-gray-400"
                  }`}
                  sx={{ borderRadius: 4 }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {originAP?.name || 'Origin'} → {destAP?.name || 'Destination'}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Hops: <span className="font-semibold">{hops}</span>
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Reward:{" "}
                      <span className="font-semibold text-gray-900">
                        {delivery.totalCost} pts
                      </span>
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClaim(delivery._id);
                      }}
                      disabled={loading || !isValidPhone || !user}
                      sx={{
                        bgcolor: '#111',
                        '&:hover': { bgcolor: '#000' }
                      }}
                    >
                      {loading ? "Claiming..." : "Claim Job"}
                    </Button>
                  </CardActions>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Map Visualization */}
      {selectedDelivery && (
        <div className="w-full max-w-3xl rounded-xl overflow-hidden border border-gray-200 shadow-md">
          <MapContainer
            center={[49.25, -123.1]}
            zoom={11}
            scrollWheelZoom={false}
            style={{ height: "420px", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {markers}
            {renderPath()}
          </MapContainer>
        </div>
      )}

      {/* Snackbar Notification */}
      <Snackbar open={snack} autoHideDuration={3000} onClose={() => setSnack(false)}>
        <Alert severity={snackSeverity} sx={{ width: "100%" }}>
          {snackMessage}
        </Alert>
      </Snackbar>
    </motion.div>
  );
}

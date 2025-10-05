"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
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
  const [filterMode, setFilterMode] = useState("exact"); // "exact" or "along-route"
  const [isFiltering, setIsFiltering] = useState(false); // Track if user has applied a filter
  const [mounted, setMounted] = useState(false);

  // Prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

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
    accessPoints?.map((ap, index) => ({
      label: `${ap.name} (Access Point)`,
      value: ap._id || ap.id,
      name: ap.name,
      nearestStation: ap.stationId || ap.nearestStation,
      id: `ap-${ap._id || ap.id || index}`, // Unique ID for each option
    })) || [];

  const stationOptions = Object.keys(skytrainGraph).map((station) => ({
    label: `${station} (Station)`,
    value: station,
    name: station,
    id: `station-${station}`, // Unique ID for each option
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

    setIsFiltering(true); // Mark that we're now filtering

    const selectedOrigin = origin.includes('(Station)') ? origin.split(' (')[0] : resolveToStation(origin);
    const selectedDest = destination.includes('(Station)') ? destination.split(' (')[0] : resolveToStation(destination);
    
    // Calculate user's route
    const userRoute = bfsShortestPath(skytrainGraph, selectedOrigin, selectedDest);
    const userPath = userRoute.path || [];

    const filtered = deliveries.filter((delivery) => {
      const deliveryOrigin = resolveToStation(delivery.originAccessPoint);
      const deliveryDest = resolveToStation(delivery.destinationAccessPoint);

      if (filterMode === "exact") {
        // Exact match: delivery must have same origin and destination
        return deliveryOrigin === selectedOrigin && deliveryDest === selectedDest;
      } else {
        // Along route: delivery's origin and destination must both be on user's path
        return userPath.includes(deliveryOrigin) && userPath.includes(deliveryDest) &&
               userPath.indexOf(deliveryOrigin) < userPath.indexOf(deliveryDest);
      }
    });

    setFilteredDeliveries(filtered);
    if (filtered.length === 0) {
      setSnackMessage(`No jobs found ${filterMode === "exact" ? "for this exact route" : "along your route"}`);
      setSnackSeverity("info");
      setSnack(true);
    } else {
      setSnackMessage(`Found ${filtered.length} job(s) ${filterMode === "exact" ? "for this route" : "along your route"}!`);
      setSnackSeverity("success");
      setSnack(true);
    }
  };

  // Clear filter function
  const handleClearFilter = () => {
    setIsFiltering(false);
    setFilteredDeliveries([]);
    setOrigin("");
    setDestination("");
    setSnackMessage("Showing all available jobs");
    setSnackSeverity("info");
    setSnack(true);
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

  // Show all deliveries on map (or filtered ones if filtering is active)
  const deliveriesToShow = isFiltering && filteredDeliveries.length >= 0 ? filteredDeliveries : deliveries;

  // Markers for all deliveries
  const allMarkers = useMemo(() => {
    const L = typeof window !== "undefined" ? require("leaflet") : null;
    if (!L || deliveriesToShow.length === 0) return [];

    const markers = [];
    deliveriesToShow.forEach((delivery, deliveryIdx) => {
      const originAP = getAccessPointById(delivery.originAccessPoint);
      const destAP = getAccessPointById(delivery.destinationAccessPoint);
      
      const originStation = resolveToStation(delivery.originAccessPoint);
      const destStation = resolveToStation(delivery.destinationAccessPoint);
      
      const originPos = stationCoords[originStation];
      const destPos = stationCoords[destStation];

      const isSelected = selectedDelivery === delivery._id;
      const color = isSelected ? "#3B82F6" : "#9CA3AF";

      if (originPos) {
        markers.push(
          <Marker
            key={`origin-${delivery._id}`}
            position={originPos}
            icon={L.divIcon({
              className: "",
              html: `<div style="width:${isSelected ? 16 : 12}px;height:${isSelected ? 16 : 12}px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.2);"></div>`,
            })}
          />
        );
      }

      if (destPos) {
        markers.push(
          <Marker
            key={`dest-${delivery._id}`}
            position={destPos}
            icon={L.divIcon({
              className: "",
              html: `<div style="width:${isSelected ? 16 : 12}px;height:${isSelected ? 16 : 12}px;background:#EF4444;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.2);"></div>`,
            })}
          />
        );
      }
    });

    return markers;
  }, [deliveriesToShow, selectedDelivery]);

  // Polylines for all deliveries
  const allPaths = useMemo(() => {
    if (deliveriesToShow.length === 0) return [];

    return deliveriesToShow.map((delivery) => {
      const { path } = calculateRoute(delivery.originAccessPoint, delivery.destinationAccessPoint);
      const pathCoords = path.map(stationId => stationCoords[stationId]).filter(Boolean);

      if (pathCoords.length < 2) return null;

      const isSelected = selectedDelivery === delivery._id;
      const color = isSelected ? "#3B82F6" : "#D1D5DB";
      const weight = isSelected ? 4 : 2;

      return (
        <Polyline
          key={`path-${delivery._id}`}
          positions={pathCoords}
          pathOptions={{ color, weight, opacity: isSelected ? 1 : 0.5 }}
        />
      );
    }).filter(Boolean);
  }, [deliveriesToShow, selectedDelivery]);

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
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="pt-24 flex flex-col items-center text-center px-6 pb-10"
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
      {mounted && (
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
      )}

      {/* Origin / Destination Selection */}
      {mounted && (
        <div className="w-full max-w-md mb-8 flex flex-col gap-4">
        <Autocomplete
          options={allOptions}
          getOptionLabel={(option) => option.label}
          getOptionKey={(option) => option.id}
          onChange={(_, newValue) => setOrigin(newValue?.value || "")}
          renderInput={(params) => <TextField {...params} label="Origin (Access Point or Station)" required />}
        />

        <Autocomplete
          options={allOptions}
          getOptionLabel={(option) => option.label}
          getOptionKey={(option) => option.id}
          onChange={(_, newValue) => setDestination(newValue?.value || "")}
          renderInput={(params) => <TextField {...params} label="Destination (Access Point or Station)" required />}
        />

        {/* Filter Mode Toggle */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-full">
          <button
            type="button"
            onClick={() => setFilterMode("exact")}
            className={`flex-1 py-2 px-4 rounded-full font-medium transition ${
              filterMode === "exact"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Exact Route
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("along-route")}
            className={`flex-1 py-2 px-4 rounded-full font-medium transition ${
              filterMode === "along-route"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Along Route
          </button>
        </div>

        <button
          onClick={handleFilterJobs}
          className="mt-3 py-3 bg-gray-900 hover:bg-black text-white font-semibold rounded-full shadow-md transition"
        >
          Find Jobs
        </button>
        
        {isFiltering && (
          <button
            onClick={handleClearFilter}
            className="py-2 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-full transition"
          >
            Clear Filter & Show All
          </button>
        )}
      </div>
      )}

      {/* Map Visualization - Always Visible */}
      <div className="w-full max-w-5xl mb-10 rounded-xl overflow-hidden border border-gray-200 shadow-md">
        <MapContainer
          center={[49.25, -123.1]}
          zoom={11}
          scrollWheelZoom={false}
          style={{ height: "500px", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {allPaths}
          {allMarkers}
        </MapContainer>
      </div>

      {/* Available Jobs */}
      {deliveriesToShow.length > 0 && (
        <div className="w-full max-w-5xl mb-10">
          <p className="text-lg font-semibold text-gray-800 mb-4">
            {isFiltering 
              ? `Filtered Jobs ${filterMode === "exact" ? "for this route" : "along your route"} (${deliveriesToShow.length})`
              : `All Available Jobs (${deliveriesToShow.length})`
            }
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deliveriesToShow.map((delivery) => {
              const originAP = getAccessPointById(delivery.originAccessPoint);
              const destAP = getAccessPointById(delivery.destinationAccessPoint);
              const { hops } = calculateRoute(delivery.originAccessPoint, delivery.destinationAccessPoint);

              return (
                <Card
                  key={delivery._id}
                  onClick={() => setSelectedDelivery(delivery._id)}
                  className={`cursor-pointer transition-all ${
                    selectedDelivery === delivery._id
                      ? "border-2 border-blue-600 bg-blue-50"
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
                      <span className="font-semibold text-blue-600">
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

      {/* Snackbar Notification */}
      <Snackbar open={snack} autoHideDuration={3000} onClose={() => setSnack(false)}>
        <Alert severity={snackSeverity} sx={{ width: "100%" }}>
          {snackMessage}
        </Alert>
      </Snackbar>
      </motion.main>
    </div>
  );
}

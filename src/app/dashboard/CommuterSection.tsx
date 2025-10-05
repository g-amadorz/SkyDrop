"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Outfit } from "next/font/google";
import { TextField, Autocomplete, Snackbar, Alert, Typography } from "@mui/material";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { bfsShortestPath, stationCoords, skytrainGraph } from "@/app/compute/CalcHops";
import { useAccesspoint } from "@/app/contexts/AccesspointContext";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then((m) => m.Polyline), { ssr: false });

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function CommuterSection() {
  const { accessPoints } = useAccesspoint();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [snack, setSnack] = useState(false);

  // Combine Access Points + Stations
  const accessPointOptions =
    accessPoints?.map((ap: any) => ({
      label: `${ap.name} (Access Point)`,
      value: ap.name,
      nearestStation: ap.nearestStation,
    })) || [];

  const stationOptions = Object.keys(skytrainGraph).map((station) => ({
    label: `${station} (Station)`,
    value: station,
  }));

  const allOptions = [...accessPointOptions, ...stationOptions];

  // Helper: AccessPoint → Station
  const resolveToStation = (name: string) => {
    const ap = accessPoints.find((ap: any) => ap.name === name);
    return ap?.nearestStation || name;
  };

  // Calculate Route (hops + path)
  const calculateRoute = (origin: string, destination: string) => {
    const start = resolveToStation(origin);
    const end = resolveToStation(destination);
    return bfsShortestPath(skytrainGraph, start, end);
  };

  // Fake job data
  const allJobs = [
    { id: 1, origin: "Burrard (Station)", destination: "Commercial–Broadway (Station)", reward: 80 },
    { id: 2, origin: "Main Street–Science World (Station)", destination: "Joyce–Collingwood (Station)", reward: 100 },
    { id: 3, origin: "Waterfront (Station)", destination: "Metrotown (Station)", reward: 120 },
  ];

  const handleClaim = () => {
    if (!origin || !destination) return;
    const start = resolveToStation(origin);
    const end = resolveToStation(destination);

    // Filter matching jobs
    const jobs = allJobs.filter(
      (j) =>
        resolveToStation(j.origin) === start &&
        resolveToStation(j.destination) === end
    );

    setAvailableJobs(jobs);
    setSnack(true);
  };

  const handleSelectJob = (job: any) => {
    setSelectedJob(job);
  };

  // Animated Markers for Selected Job
  const markers = useMemo(() => {
    if (!selectedJob) return [];
    const { path } = calculateRoute(selectedJob.origin, selectedJob.destination);

    return path.map((node, idx) => {
      const pos = stationCoords[node];
      if (!pos) return null;

      return (
        <motion.div
          key={idx}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: idx * 0.1 }}
        >
          <Marker
            position={pos}
            icon={L.divIcon({
              className: "",
              html: `<div style="width:14px;height:14px;background:${
                idx === 0 ? "#3B82F6" : idx === path.length - 1 ? "#EF4444" : "#555"
              };border-radius:50%;border:2px solid white;"></div>`,
            })}
          />
        </motion.div>
      );
    });
  }, [selectedJob]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`${outfit.className} flex flex-col items-center text-center px-6 pt-6 pb-10 bg-white min-h-screen`}
    >
      {/* Header */}
      <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
        Become a <span className="text-blue-600">Commuter</span>
      </h1>
      <p className="text-gray-600 mb-10 max-w-md">
        Select your route to view available delivery jobs and earn rewards for each trip.
      </p>

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
          onClick={handleClaim}
          className="mt-3 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-md transition"
        >
          Claim Jobs
        </button>
      </div>

      {/* Available Jobs */}
      {availableJobs.length > 0 && (
        <div className="w-full max-w-3xl mb-10">
          <p className="text-lg font-semibold text-gray-800 mb-4">
            Available Jobs for this route:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => handleSelectJob(job)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  selectedJob?.id === job.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {job.origin} → {job.destination}
                </Typography>
                <Typography color="text.secondary">
                  Reward:{" "}
                  <span className="font-semibold text-blue-600">
                    {job.reward} pts
                  </span>
                </Typography>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Map Visualization */}
      {selectedJob && (
        <div className="w-full max-w-3xl rounded-xl overflow-hidden border border-gray-200 shadow-md">
          <MapContainer
            center={[49.25, -123.1]}
            zoom={11}
            scrollWheelZoom={false}
            style={{ height: "420px", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {markers}
            <Polyline
              positions={calculateRoute(selectedJob.origin, selectedJob.destination).path.map(
                (n) => stationCoords[n]
              )}
              pathOptions={{ color: "#3B82F6", weight: 4 }}
            />
          </MapContainer>
        </div>
      )}

      {/* Snackbar Notification */}
      <Snackbar open={snack} autoHideDuration={3000} onClose={() => setSnack(false)}>
        <Alert severity="success" sx={{ width: "100%" }}>
          🎉 Jobs loaded successfully!
        </Alert>
      </Snackbar>
    </motion.div>
  );
}

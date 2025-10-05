"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Outfit } from "next/font/google";
import {
  Typography,
  Card,
  CardContent,
  CardActions,
  Snackbar,
  Alert,
} from "@mui/material";
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

  // Fake example delivery
  const testDelivery = {
    id: "demo1",
    origin: "Burrard (Station)",
    destination: "Commercial–Broadway (Station)",
    reward: 80,
  };

  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [snack, setSnack] = useState(false);

  const resolveToStation = (name: string) => {
    const ap = accessPoints.find((ap: any) => ap.name === name);
    return ap?.nearestStation || name;
  };

  const calculateRoute = (origin: string, destination: string) => {
    const start = resolveToStation(origin);
    const end = resolveToStation(destination);
    return bfsShortestPath(skytrainGraph, start, end);
  };

  const handleClaim = (delivery: any) => {
    setSelectedDelivery(delivery);
    setSnack(true);
  };

  // Animated markers
  const markers = useMemo(() => {
    if (!selectedDelivery) return [];
    const { path } = calculateRoute(selectedDelivery.origin, selectedDelivery.destination);

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
  }, [selectedDelivery]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${outfit.className} flex flex-col items-center justify-start px-6 py-10 bg-white min-h-screen`}
    >
      {/* Header */}
      <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
        Become a <span className="text-blue-600">Commuter</span>
      </h1>
      <p className="text-gray-600 mb-8 max-w-md text-center">
        Accept a delivery request and earn rewards for every route you complete.
      </p>

      {/* Example Task */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        <Card className="shadow-sm border border-gray-200 hover:shadow-lg transition-all rounded-2xl">
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {testDelivery.origin} → {testDelivery.destination}
            </Typography>
            <Typography color="text.secondary">
              Reward:{" "}
              <span className="font-semibold text-blue-600">
                {testDelivery.reward} pts
              </span>
            </Typography>
          </CardContent>
          <CardActions>
            <button
              onClick={() => handleClaim(testDelivery)}
              className="w-full py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md transition-all"
            >
              Claim Job
            </button>
          </CardActions>
        </Card>
      </div>

      {/* Map */}
      {selectedDelivery && (
        <div className="mt-10 w-full max-w-3xl rounded-xl overflow-hidden border border-gray-200 shadow-md">
          <MapContainer
            center={[49.25, -123.1]}
            zoom={11}
            scrollWheelZoom={false}
            style={{ height: "420px", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {markers}
            <Polyline
              positions={calculateRoute(selectedDelivery.origin, selectedDelivery.destination).path.map(
                (n) => stationCoords[n]
              )}
              pathOptions={{ color: "#3B82F6", weight: 4 }}
            />
          </MapContainer>
        </div>
      )}

      <Snackbar open={snack} autoHideDuration={3000} onClose={() => setSnack(false)}>
        <Alert severity="success" sx={{ width: "100%" }}>
          🎉 Job successfully claimed!
        </Alert>
      </Snackbar>
    </motion.div>
  );
}

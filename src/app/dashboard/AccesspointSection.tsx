"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Outfit } from "next/font/google";
import dynamic from "next/dynamic";
import { TextField, Button, Snackbar, Alert } from "@mui/material";
import { useAccesspoint } from "@/app/contexts/AccesspointContext";
import { stationCoords } from "@/app/compute/CalcHops";
import "leaflet/dist/leaflet.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Circle = dynamic(() => import("react-leaflet").then((mod) => mod.Circle), { ssr: false });

const DEFAULT_RADIUS = 500;

function haversine([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]) {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function AccessPointSection() {
  const { create } = useAccesspoint();
  const [mounted, setMounted] = useState(false);
  const [pin, setPin] = useState<[number, number] | null>(null);
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [snack, setSnack] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      import("leaflet").then((L) => {
        // @ts-ignore
        delete L.Icon.Default.prototype._getIconUrl;
        // @ts-ignore
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "/marker-icon-2x.png",
          iconUrl: "/marker-icon.png",
          shadowUrl: "/marker-shadow.png",
        });
      });
    }
  }, []);

  const stations = useMemo(() => Object.entries(stationCoords) as [string, [number, number]][], []);
  const nearest = useMemo(() => {
    if (!pin) return null;
    let min = Infinity;
    let found: { name: string; coords: [number, number]; dist: number } | null = null;
    for (const [sName, coords] of stations) {
      const d = haversine(coords, pin);
      if (d < min) {
        min = d;
        found = { name: sName, coords, dist: d };
      }
    }
    return found;
  }, [pin, stations]);

  const canPlace = !!nearest && nearest.dist <= DEFAULT_RADIUS;

  const handleCircleClick = (e: any) => {
    const coords: [number, number] = [e.latlng.lat, e.latlng.lng];
    setPin(coords);
    setName("");
    setNameTouched(false);
    setError("");
  };

  const handleCreate = async () => {
    if (!canPlace || !name || name.length < 2 || !pin) {
      setError("Please enter a valid name and choose a valid location.");
      return;
    }
    try {
      await create({
        name,
        lat: pin[0],
        lng: pin[1],
        nearestStation: nearest?.name || "",
        nearestStationDist: nearest?.dist || 0,
        numProducts: 0,
      });
      setSnack(true);
      setPin(null);
      setName("");
      setNameTouched(false);
      setError("");
    } catch {
      setError("Failed to create access point.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`${outfit.className} flex flex-col items-center text-center px-6 pt-10 pb-16 bg-white w-full`}
    >
      {/* --- Title & Slogan --- */}
      <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-2">
        Become an <span className="text-orange-500">Access Point</span>
      </h1>
      <p className="text-gray-600 mb-10 max-w-md">
        Be the bridge between <span className="text-gray-800 font-medium">senders</span> and{" "}
        <span className="text-gray-800 font-medium">commuters</span> — <br />
        host deliveries and help SkyDrop connect every corner.
      </p>

      {/* --- Map --- */}
      <div className="w-full max-w-3xl h-[400px] mb-8 rounded-2xl overflow-hidden shadow-md border border-gray-100">
        {mounted && (
          <MapContainer
            center={[49.25, -123.1]}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap contributors"
            />
            {stations.map(([sName, coords]) => (
              <Circle
                key={sName}
                center={coords}
                radius={DEFAULT_RADIUS}
                pathOptions={{ color: "#ff7a00", fillOpacity: 0.08, weight: 1.2 }}
                eventHandlers={{ click: handleCircleClick }}
              />
            ))}
            {pin && <Marker position={pin} />}
          </MapContainer>
        )}
      </div>

      {/* --- Input Card --- */}
      <div className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-3">📍 New Access Point</h3>

        {pin ? (
          <div className="text-sm text-gray-700 mb-3">
            <p>
              <b>Lat:</b> {pin[0].toFixed(5)}, <b>Lng:</b> {pin[1].toFixed(5)}
            </p>
            <p>
              Nearest Station:{" "}
              <span className="font-semibold text-gray-900">
                {nearest?.name} ({nearest?.dist?.toFixed(0)}m)
              </span>
            </p>
          </div>
        ) : (
          <p className="text-gray-500 mb-3">Click on a circle to choose a location.</p>
        )}

        <TextField
          label="Access Point Name"
          size="small"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setNameTouched(true)}
          error={nameTouched && (!name || name.length < 2)}
          helperText={
            nameTouched && (!name || name.length < 2)
              ? "Name must be at least 2 characters"
              : ""
          }
          sx={{ mb: 2 }}
        />

        {pin && (
          <p
            className={`text-sm mb-4 ${
              canPlace ? "text-green-600" : "text-red-600"
            }`}
          >
            {canPlace
              ? "✅ Within allowed radius"
              : `❌ Must be within ${DEFAULT_RADIUS}m of a station`}
          </p>
        )}

        <div className="flex justify-between gap-3">
          <Button
            variant="outlined"
            fullWidth
            onClick={() => setPin(null)}
            sx={{
              borderColor: "#ccc",
              color: "#555",
              textTransform: "none",
              "&:hover": { borderColor: "#aaa" },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            fullWidth
            disableElevation
            onClick={handleCreate}
            disabled={!canPlace || !name || name.length < 2}
            sx={{
              backgroundColor: "#ff7a00",
              "&:hover": { backgroundColor: "#e86d00" },
              textTransform: "none",
            }}
          >
            Confirm
          </Button>
        </div>
      </div>

      {/* --- Snackbar & Alerts --- */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
      <Snackbar
        open={snack}
        autoHideDuration={3000}
        onClose={() => setSnack(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ width: "100%", borderRadius: 2 }}>
          ✅ Access point created successfully
        </Alert>
      </Snackbar>
    </motion.div>
  );
}

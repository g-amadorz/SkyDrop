"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Box, Button, Typography, Snackbar, Alert } from "@mui/material";
import dynamic from "next/dynamic";
import { useAccesspoint } from "../contexts/AccesspointContext";
import { stationCoords } from "../compute/CalcHops";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Circle = dynamic(() => import("react-leaflet").then(mod => mod.Circle), { ssr: false });

const DEFAULT_RADIUS = 500; // meters

function haversine([lat1, lon1], [lat2, lon2]) {
  const R = 6371000;
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const NewAccessPointPage = ({ radius = DEFAULT_RADIUS }) => {
  const { accessPoints } = useAccesspoint();
  const [pin, setPin] = useState(null); // [lat, lng]
  const [snack, setSnack] = useState(false);
  const [error, setError] = useState("");

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

  const stations = useMemo(() => Object.entries(stationCoords), []);

  const nearest = useMemo(() => {
    if (!pin) return null;
    let minDist = Infinity;
    let nearestStation = null;
    for (const [name, coords] of stations) {
      const d = haversine(coords, pin);
      if (d < minDist) {
        minDist = d;
        nearestStation = name;
      }
    }
    return { name: nearestStation, dist: minDist };
  }, [pin, stations]);

  const canPlace = nearest && nearest.dist <= radius;

  const handleMapClick = e => {
    setPin([e.latlng.lat, e.latlng.lng]);
    setError("");
  };

  const handleCreate = () => {
    if (!canPlace) {
      setError("Pin must be within radius of a station.");
      return;
    }
    setSnack(true);
    setPin(null);
  };

  return (
    <Box sx={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column" }}>
      <Typography variant="h5" sx={{ m: 2 }}>Create New Access Point</Typography>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <MapContainer
          center={[49.25, -123.1]}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
          whenCreated={map => map.on("click", handleMapClick)}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {stations.map(([name, coords]) => (
            <React.Fragment key={name}>
              <Marker position={coords} />
              <Circle
                center={coords}
                radius={radius}
                pathOptions={{ color: "#1976d2", fillOpacity: 0.08, weight: 1 }}
              />
            </React.Fragment>
          ))}

          {pin && <Marker position={pin} />}
        </MapContainer>
      </Box>

      <Box sx={{ p: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {pin && (
          <>
            <Typography variant="body2" color={canPlace ? "success.main" : "error"}>
              {canPlace
                ? `Nearest station: ${nearest.name} (${nearest.dist.toFixed(0)}m)`
                : `Pin must be within ${radius}m of a station. Nearest: ${nearest.name} (${nearest.dist.toFixed(0)}m)`}
            </Typography>
            <Button variant="contained" sx={{ mt: 1 }} onClick={handleCreate} disabled={!canPlace}>
              Create Access Point
            </Button>
          </>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        <Snackbar open={snack} autoHideDuration={3000} onClose={() => setSnack(false)}>
          <Alert severity="success" sx={{ width: "100%" }}>Access point created!</Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default NewAccessPointPage;

"use client";
import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Button,
  Typography,
  Snackbar,
  Alert,
  TextField,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import dynamic from "next/dynamic";
import { useAccesspoint } from "../contexts/AccesspointContext";
import { stationCoords } from "../compute/CalcHops";
import "leaflet/dist/leaflet.css";
import { useMap } from "react-leaflet";

const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Circle = dynamic(() => import("react-leaflet").then(mod => mod.Circle), { ssr: false });


// Overlay card beside pin using map projection
function PinOverlayCard({
  pin,
  nearest,
  canPlace,
  name,
  setName,
  nameTouched,
  setNameTouched,
  setPin,
  setError,
  handleCreate,
  radius
}) {
  const map = useMap();
  if (!pin) return null;
  // Convert lat/lng to container pixel coordinates
  const point = map.latLngToContainerPoint(pin);
  // Offset the card to the right and slightly up from the pin
  const style = {
    position: 'absolute',
    left: point.x + 20,
    top: point.y - 40,
    zIndex: 1000,
    minWidth: 220,
    maxWidth: 260,
    padding: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    borderRadius: 8,
    background: 'white',
  };
  return (
    <div style={style}>
      <Card sx={{ boxShadow: 'none', minWidth: 0, maxWidth: 260, p: 1 }}>
        <CardContent sx={{ p: 1 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>New Access Point</Typography>
          <Typography variant="caption">Lat: {pin[0].toFixed(5)}, Lng: {pin[1].toFixed(5)}</Typography><br />
          <Typography variant="caption">
            Nearest: {nearest?.name} ({nearest?.dist?.toFixed(0)}m)
          </Typography>
          <TextField
            label="Name"
            value={name}
            size="small"
            onChange={e => setName(e.target.value)}
            onBlur={() => setNameTouched(true)}
            error={nameTouched && (!name || name.length < 2)}
            helperText={nameTouched && (!name || name.length < 2) ? "Name required (min 2 chars)" : ""}
            sx={{ mt: 1, mb: 1 }}
            fullWidth
          />
          <Typography variant="caption" color={canPlace ? "success.main" : "error"}>
            {canPlace
              ? "Within allowed radius."
              : `Must be within ${radius}m of a station.`}
          </Typography>
        </CardContent>
        <CardActions sx={{ p: 1, pt: 0 }}>
          <Button size="small" onClick={() => { setPin(null); setName(""); setNameTouched(false); setError(""); }}>Cancel</Button>
          <Button size="small" variant="contained" onClick={handleCreate} disabled={!canPlace || !name || name.length < 2}>
            Confirm
          </Button>
        </CardActions>
      </Card>
    </div>
  );
}


const DEFAULT_RADIUS = 500; // meters

function haversine([lat1, lon1], [lat2, lon2]) {
  const R = 6371000;
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}


const NewAccessPointPage = ({ radius = DEFAULT_RADIUS }) => {
  const { accessPoints, create } = useAccesspoint();
  const [pin, setPin] = useState(null); // [lat, lng]
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
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

  // Prepare stations array from stationCoords
  const stations = useMemo(() => Object.entries(stationCoords), []);


  // Only allow pin placement by clicking a station's circle
  const handleCircleClick = (e) => {
    const clickCoords = [e.latlng.lat, e.latlng.lng];
    setPin(clickCoords);
    setName("");
    setNameTouched(false);
    setError("");
  };

  // Compute nearest station and distance to pin
  const nearest = useMemo(() => {
    if (!pin) return null;
    let minDist = Infinity;
    let nearestStation = null;
    for (const [name, coords] of stations) {
      const dist = haversine(coords, pin);
      if (dist < minDist) {
        minDist = dist;
        nearestStation = { name, coords, dist };
      }
    }
    return nearestStation;
  }, [pin, stations]);

  // Can place if within radius of any station
  const canPlace = nearest && nearest.dist <= radius;

  // Handle creating the access point
  const handleCreate = async () => {
    if (!canPlace || !name || name.length < 2) {
      setError("Please enter a valid name and select a valid location.");
      return;
    }
    try {
      await create({ name, coords: pin });
      setSnack(true);
      setPin(null);
      setName("");
      setNameTouched(false);
      setError("");
    } catch (e) {
      setError("Failed to create access point.");
    }
  };

  return (
    <Box sx={{ height: "100vh", width: "100vw", position: 'relative', display: "flex", flexDirection: "column" }}>
      <Typography variant="h5" sx={{ m: 2 }}>Create New Access Point</Typography>
      <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <MapContainer
          center={[49.25, -123.1]}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {/* Draw station circles */}
          {stations.map(([name, coords]) => (
            <React.Fragment key={name}>
              <Circle
                center={coords}
                radius={radius}
                pathOptions={{ color: "#1976d2", fillOpacity: 0.08, weight: 1 }}
                eventHandlers={{ click: handleCircleClick }}
              />
            </React.Fragment>
          ))}

          {/* Place marker where user clicked */}
          {pin && <Marker position={pin} />}

          {/* Overlay card beside the pin */}
          {pin && (
            <PinOverlayCard
              pin={pin}
              nearest={nearest}
              canPlace={canPlace}
              name={name}
              setName={setName}
              nameTouched={nameTouched}
              setNameTouched={setNameTouched}
              setPin={setPin}
              setError={setError}
              handleCreate={handleCreate}
              radius={radius}
            />
          )}
        </MapContainer>
      </Box>

      <Box sx={{ p: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        <Snackbar open={snack} autoHideDuration={3000} onClose={() => setSnack(false)}>
          <Alert severity="success" sx={{ width: "100%" }}>Access point created!</Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default NewAccessPointPage;


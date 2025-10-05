"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Alert,
  Card,
  CardContent,
  CardActions,
  Select,
  MenuItem
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { useProduct } from "../contexts/ProductContext";
import dynamic from "next/dynamic";
import useMediaQuery from "@mui/material/useMediaQuery";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then(mod => mod.Polyline), { ssr: false });

import { stationCoords, bfsShortestPath, skytrainGraph } from "../compute/CalcHops";
import { useAccesspoint } from "../contexts/AccesspointContext";

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dropOffSelections, setDropOffSelections] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia("(max-width:900px)").matches);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const availableProducts = products.filter(p => !p.commuterPN);
  const { accessPoints } = useAccesspoint ? useAccesspoint() : { accessPoints: [] };

  // Helper: if currApId is an access point, use its nearestStation
  const resolveToStation = (name) => {
    const ap = accessPoints.find(ap => ap.name === name);
    if (ap && ap.nearestStation) return ap.nearestStation;
    return name;
  };

  const getOriginLatLng = (name) => {
    const ap = accessPoints.find(ap => ap.name === name);
    if (ap && ap.lat && ap.lng) return [ap.lat, ap.lng];
    if (stationCoords[name]) return stationCoords[name];
    if (ap && ap.nearestStation && stationCoords[ap.nearestStation]) return stationCoords[ap.nearestStation];
    return null;
  };

  const isValidPhone = /^\d{10}$/.test(phone);

  const handleClaim = (productId) => {
    if (isValidPhone) {
      setCommuter(productId, phone);
      setSelectedProduct(productId);
      setSnack(true);
    }
  };

  const [openJobId, setOpenJobId] = useState(null);
  const openJob = openJobId ? availableProducts.find(j => j.id === openJobId) : null;

  // Compute path correctly using nearest stations
  let openPath = [];
  let startAccessPoint = null;
  let endAccessPoint = null;

  if (openJob) {
    const startStation = resolveToStation(openJob.currApId);
    const endStation = resolveToStation(openJob.destApId);
    const { path } = bfsShortestPath(skytrainGraph, startStation, endStation);
    const selectedDrop = dropOffSelections[openJob.id] || path[path.length - 1];
    const dropIdx = path.indexOf(selectedDrop);
    openPath = dropIdx > 0 ? path.slice(0, dropIdx + 1) : path;

    // Keep reference if starting/ending point was an access point
    startAccessPoint = accessPoints.find(ap => ap.name === openJob.currApId);
    endAccessPoint = accessPoints.find(ap => ap.name === openJob.destApId);
  }

  const markers = useMemo(() => {
    // Path mode: show pins for APs, dots for nearest stations
    if (openPath.length > 1) {
      const markersArr = [];
      // Start
      if (startAccessPoint) {
        markersArr.push(
          <Marker
            key={"start-ap"}
            position={[startAccessPoint.lat, startAccessPoint.lng]}
            icon={L.icon({ iconUrl: '/marker-icon.png', iconSize: [25, 41], iconAnchor: [12.5, 41] })}
          />
        );
        if (stationCoords[startAccessPoint.nearestStation]) {
          markersArr.push(
            <Marker
              key={"start-dot"}
              position={stationCoords[startAccessPoint.nearestStation]}
              icon={L.divIcon({ className: '', html: '<div style="width:10px;height:10px;background:#555;border-radius:50%;border:2px solid white;"></div>' })}
              interactive={false}
            />
          );
        }
      } else if (stationCoords[openPath[0]]) {
        markersArr.push(
          <Marker
            key={"start-station"}
            position={stationCoords[openPath[0]]}
            icon={L.icon({ iconUrl: '/marker-icon.png', iconSize: [25, 41], iconAnchor: [12.5, 41] })}
          />
        );
      }
      // End
      if (endAccessPoint) {
        markersArr.push(
          <Marker
            key={"end-ap"}
            position={[endAccessPoint.lat, endAccessPoint.lng]}
            icon={L.icon({ iconUrl: '/red-pin.png', iconSize: [25, 41], iconAnchor: [12.5, 41] })}
          />
        );
        if (stationCoords[endAccessPoint.nearestStation]) {
          markersArr.push(
            <Marker
              key={"end-dot"}
              position={stationCoords[endAccessPoint.nearestStation]}
              icon={L.divIcon({ className: '', html: '<div style="width:10px;height:10px;background:#555;border-radius:50%;border:2px solid white;"></div>' })}
              interactive={false}
            />
          );
        }
      } else if (stationCoords[openPath[openPath.length - 1]]) {
        markersArr.push(
          <Marker
            key={"end-station"}
            position={stationCoords[openPath[openPath.length - 1]]}
            icon={L.icon({ iconUrl: '/red-pin.png', iconSize: [25, 41], iconAnchor: [12.5, 41] })}
          />
        );
      }
      return markersArr;
    }

    // Otherwise, show all pickup markers as before
    const pickupStations = Array.from(new Set(availableProducts.map(p => p.currApId)));
    return pickupStations.map(name => {
      const pos = getOriginLatLng(name);
      if (!pos) return null;
      const relatedJobs = availableProducts.filter(p => p.currApId === name);
      return (
        <Marker key={name} position={pos}>
          <Popup onOpen={() => setOpenJobId(null)}>
            <Typography variant="subtitle1" fontWeight="bold">{name}</Typography>
            <Box sx={{ maxHeight: 300, overflowY: 'auto', width: 250 }}>
              {relatedJobs.map(job => {
                const { path } = bfsShortestPath(
                  skytrainGraph,
                  resolveToStation(job.currApId),
                  resolveToStation(job.destApId)
                );
                const selectedDrop = dropOffSelections[job.id] || path[path.length - 1];
                return (
                  <Card key={job.id} sx={{ my: 1 }}>
                    <CardContent sx={{ p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', mb: 0.5, fontSize: '0.9rem' }}>
                        <Typography variant="body2" component="span" sx={{ mr: 0.5 }}>
                          From <b>{job.currApId}</b> →
                        </Typography>
                        <Select
                          size="small"
                          value={selectedDrop}
                          onChange={e => setDropOffSelections(s => ({ ...s, [job.id]: e.target.value }))}
                          sx={{ mx: 1, minWidth: 120, background: 'white' }}
                        >
                          {path.slice(1).map(station => (
                            <MenuItem key={station} value={station}>{station}</MenuItem>
                          ))}
                        </Select>
                      </Box>
                      <Typography variant="body2" sx={{ m: 0, mt: 1 }}>
                        Hops: {bfsShortestPath(skytrainGraph, resolveToStation(job.currApId), selectedDrop).hops}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleClaim(job.id)}
                        disabled={selectedProduct === job.id || !isValidPhone}
                      >
                        {selectedProduct === job.id ? "Claimed" : "Claim"}
                      </Button>
                      {openJobId === job.id ? (
                        <Button size="small" variant="outlined" color="secondary" onClick={() => setOpenJobId(null)}>
                          Hide Path
                        </Button>
                      ) : (
                        <Button size="small" variant="outlined" onClick={() => setOpenJobId(job.id)}>
                          Show Path
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                );
              })}
            </Box>
          </Popup>
        </Marker>
      );
    });
  }, [availableProducts, selectedProduct, phone, openJobId, openPath, startAccessPoint, endAccessPoint]);

  const JobList = (
    <Box sx={{ width: 280, p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Available Jobs</Typography>
      <TextField
        label="Your Phone Number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        fullWidth
        placeholder="e.g. 6041234567"
        error={phone.length > 0 && !isValidPhone}
        helperText={!isValidPhone && phone.length > 0 ? "Enter a valid 10-digit phone number" : ""}
        sx={{ mb: 2 }}
      />
      <List>
        {availableProducts.length === 0 ? (
          <ListItem><ListItemText primary="No jobs available" /></ListItem>
        ) : (
          availableProducts.map((product) => {
            const hops = bfsShortestPath(
              skytrainGraph,
              resolveToStation(product.currApId),
              resolveToStation(product.destApId)
            ).hops;
            return (
              <ListItem key={product.id} divider alignItems="flex-start">
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body1">
                      From: {product.currApId} → {product.destApId}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Hops: {hops}</Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleClaim(product.id)}
                    disabled={selectedProduct === product.id || !isValidPhone}
                  >
                    {selectedProduct === product.id ? "Claimed" : "Claim"}
                  </Button>
                </Box>
              </ListItem>
            );
          })
        )}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: isMobile ? "column" : "row", height: "100vh" }}>
      {isMobile ? (
        <>
          <IconButton onClick={() => setDrawerOpen(true)} sx={{ position: "absolute", top: 10, right: 10, zIndex: 1000, bgcolor: "white" }}>
            <MenuIcon />
          </IconButton>
          <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
            {JobList}
          </Drawer>
        </>
      ) : (
        <Box sx={{ flexShrink: 0, width: 300, borderRight: "1px solid #ddd", height: "100%", overflowY: "auto", bgcolor: "#fafafa" }}>
          {JobList}
        </Box>
      )}

      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <MapContainer center={[49.25, -123.1]} zoom={11} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          {markers}

          {/* Draw path for open job */}
          {openPath.length > 1 && (
            <>
              {/* Polyline for stations */}
              <Polyline
                positions={openPath.map(node => {
                  const ap = accessPoints.find(ap => ap.name === node);
                  if (ap && ap.lat && ap.lng) return [ap.lat, ap.lng];
                  if (stationCoords[node]) return stationCoords[node];
                  return null;
                }).filter(Boolean)}
                pathOptions={{ color: 'blue', weight: 4 }}
              />

              {/* Show line from AP → nearest station (start & end if needed) */}
              {startAccessPoint && startAccessPoint.nearestStation && stationCoords[startAccessPoint.nearestStation] && (
                <Polyline
                  positions={[
                    [startAccessPoint.lat, startAccessPoint.lng],
                    stationCoords[startAccessPoint.nearestStation]
                  ]}
                  pathOptions={{ color: 'gray', dashArray: '4', weight: 2 }}
                />
              )}
              {endAccessPoint && endAccessPoint.nearestStation && stationCoords[endAccessPoint.nearestStation] && (
                <Polyline
                  positions={[
                    [endAccessPoint.lat, endAccessPoint.lng],
                    stationCoords[endAccessPoint.nearestStation]
                  ]}
                  pathOptions={{ color: 'gray', dashArray: '4', weight: 2 }}
                />
              )}

              {/* Markers */}
              {openPath.map((node, idx) => {
                const ap = accessPoints.find(ap => ap.name === node);
                const pos = ap ? [ap.lat, ap.lng] : stationCoords[node];
                if (!pos) return null;

                let icon;
                if (idx === 0) {
                  icon = L.icon({
                    iconUrl: '/marker-icon.png',
                    iconSize: [25, 41],
                    iconAnchor: [12.5, 41],
                  });
                } else if (idx === openPath.length - 1) {
                  icon = L.icon({
                    iconUrl: '/red-pin.png',
                    iconSize: [25, 41],
                    iconAnchor: [12.5, 41],
                  });
                } else {
                  icon = L.divIcon({
                    className: '',
                    html: '<div style="width:10px;height:10px;background:#555;border-radius:50%;border:2px solid white;"></div>',
                  });
                }
                return <Marker key={node + idx} position={pos} icon={icon} interactive={false} />;
              })}
            </>
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

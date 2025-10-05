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
import { useAccesspoint } from "../contexts/AccesspointContext";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Dynamically import Leaflet components
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then(mod => mod.Polyline), { ssr: false });

import { stationCoords, bfsShortestPath, skytrainGraph } from "../compute/CalcHops";

const NewJob = () => {
  const { products, setCommuter } = useProduct();
  const { accessPoints } = useAccesspoint(); // Correctly call hook

  const [phone, setPhone] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [snack, setSnack] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dropOffSelections, setDropOffSelections] = useState({});
  const [openJobId, setOpenJobId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia("(max-width:900px)").matches);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Leaflet icon fix
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then(L => {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "/marker-icon-2x.png",
          iconUrl: "/marker-icon.png",
          shadowUrl: "/marker-shadow.png"
        });
      });
    }
  }, []);

  const availableProducts = products.filter(p => !p.commuterPN);
  const isValidPhone = /^\d{10}$/.test(phone);

  const handleClaim = (productId) => {
    if (isValidPhone) {
      setCommuter(productId, phone);
      setSelectedProduct(productId);
      setSnack(true);
    }
  };

  // Resolve to station only for pathfinding
  const resolveToStation = (name) => {
    const ap = accessPoints.find(ap => ap.name === name);
    return ap?.nearestStation || name;
  };

  // MARKERS
  const markers = useMemo(() => {
    const pickupNames = Array.from(new Set(availableProducts.map(p => p.currApId)));
    let pathEndStation = null;

    if (openJobId) {
      const openJob = availableProducts.find(j => j.id === openJobId);
      if (openJob) {
        const { path } = bfsShortestPath(
          skytrainGraph,
          resolveToStation(openJob.currApId),
          resolveToStation(openJob.destApId)
        );
        if (path.length > 1) pathEndStation = path[path.length - 1];
      }
    }

    return pickupNames.map(name => {
      if (name === pathEndStation) return null;
      const ap = accessPoints.find(ap => ap.name === name);
      const coords = ap ? [ap.lat, ap.lng] : stationCoords[name];
      if (!coords) return null;

      const relatedJobs = availableProducts.filter(p => p.currApId === name);
      return (
        <Marker key={name} position={coords}>
          <Popup onOpen={() => setOpenJobId(null)}>
            <Typography variant="subtitle1" fontWeight="bold">{name}</Typography>
            <Box sx={{ maxHeight: 300, overflowY: 'auto', width: 250 }}>
              {relatedJobs.map(job => {
                const { path } = bfsShortestPath(
                  skytrainGraph,
                  resolveToStation(job.currApId),
                  resolveToStation(job.destApId)
                );

                const destAP = accessPoints.find(ap => ap.name === job.destApId);
                const endStation = resolveToStation(job.destApId);

                // Build dropdown options: include AP name if destination is an AP
                const dropdownOptions = destAP ? [destAP.name, ...path.slice(1)] : path.slice(1);

                // Selected drop-off (default last in dropdown)
                const selectedDrop = dropOffSelections[job.id] || dropdownOptions[dropdownOptions.length - 1];

                return (
                  <Card key={job.id} sx={{ my: 1 }}>
                    <CardContent sx={{ p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
                        <Typography variant="body2" component="span" sx={{ mr: 0.5 }}>
                          From <b>{job.currApId}</b> →
                        </Typography>
                        <Select
                          size="small"
                          value={selectedDrop}
                          onChange={e => setDropOffSelections(s => ({ ...s, [job.id]: e.target.value }))}
                          sx={{ mx: 1, minWidth: 120, background: 'white' }}
                          MenuProps={{ PaperProps: { sx: { fontSize: '0.9rem' } } }}
                        >
                          {dropdownOptions.map(opt => (
                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                          ))}
                        </Select>
                      </Box>
                      <Typography variant="body2">
                        Hops: {bfsShortestPath(skytrainGraph, resolveToStation(job.currApId), resolveToStation(selectedDrop)).hops}
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
                        <Button
                          size="small"
                          variant="outlined"
                          color="secondary"
                          onClick={() => setOpenJobId(null)}
                        >
                          Hide Path
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setOpenJobId(job.id)}
                        >
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
  }, [availableProducts, selectedProduct, phone, openJobId, accessPoints, dropOffSelections]);

  // OPEN JOB PATH
  const openJob = openJobId ? availableProducts.find(j => j.id === openJobId) : null;
  let openPath = [];
  if (openJob) {
    const { path } = bfsShortestPath(
      skytrainGraph,
      resolveToStation(openJob.currApId),
      resolveToStation(openJob.destApId)
    );
    const destAP = accessPoints.find(ap => ap.name === openJob.destApId);
    const dropdownOptions = destAP ? [destAP.name, ...path.slice(1)] : path.slice(1);
    const selectedDrop = dropOffSelections[openJob.id] || dropdownOptions[dropdownOptions.length - 1];
    const dropIdx = path.indexOf(resolveToStation(selectedDrop));
    openPath = dropIdx >= 0 ? path.slice(0, dropIdx + 1) : path;
  }

  const L = typeof window !== "undefined" ? require("leaflet") : null;

  const renderPath = () => {
    if (!openJob || openPath.length < 2 || !L) return null;

    const startAP = accessPoints.find(ap => ap.name === openJob.currApId);
    const endAP = accessPoints.find(ap => ap.name === (dropOffSelections[openJob.id] || openJob.destApId));

    const startCoords = startAP ? [startAP.lat, startAP.lng] : stationCoords[openJob.currApId];
    const endCoords = endAP ? [endAP.lat, endAP.lng] : stationCoords[resolveToStation(openJob.destApId)];

    const polylineCoords = [
      startCoords,
      ...openPath.slice(1, -1).map(s => stationCoords[s]),
      endCoords
    ];

    const markers = [
      <Marker key="start-pin" position={startCoords} icon={L.icon({ iconUrl: '/marker-icon.png', iconSize: [25, 41], iconAnchor: [12.5, 41] })} interactive={false} />,
      <Marker key="end-pin" position={endCoords} icon={L.icon({ iconUrl: '/red-pin.png', iconSize: [25, 41], iconAnchor: [12.5, 41] })} interactive={false} />
    ];

    // Intermediate dots
    for (let i = 1; i < openPath.length - 1; i++) {
      const s = openPath[i];
      markers.push(
        <Marker key={"dot-" + s + i} position={stationCoords[s]} icon={L.divIcon({ className: '', html: '<div style="width:12px;height:12px;background:#888;border-radius:50%;border:2px solid #fff;"></div>' })} interactive={false} />
      );
    }

    return <>
      <Polyline positions={polylineCoords} pathOptions={{ color: 'blue', weight: 4, dashArray: '5,5' }} />
      {markers}
    </>;
  };

  // JOB LIST COMPONENT
  const JobList = (
    <Box sx={{ width: 280, p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Available Jobs</Typography>
      <TextField
        label="Your Phone Number"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        fullWidth
        placeholder="e.g. 6041234567"
        error={phone.length > 0 && !isValidPhone}
        helperText={!isValidPhone && phone.length > 0 ? "Enter a valid 10-digit phone number" : ""}
        sx={{ mb: 2 }}
      />
      <List>
        {availableProducts.length === 0 ? (
          <ListItem><ListItemText primary="No jobs available" /></ListItem>
        ) : availableProducts.map(product => (
          <ListItem key={product.id} divider alignItems="flex-start">
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography>From: {product.currApId} → {product.destApId}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Hops: {bfsShortestPath(skytrainGraph, resolveToStation(product.currApId), resolveToStation(product.destApId)).hops}
                </Typography>
              </Box>
              <Button size="small" variant="contained" onClick={() => handleClaim(product.id)} disabled={selectedProduct === product.id || !isValidPhone}>
                {selectedProduct === product.id ? "Claimed" : "Claim"}
              </Button>
            </Box>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: isMobile ? "column" : "row", height: "100vh" }}>
      {/* Sidebar / Hamburger */}
      {isMobile ? (
        <>
          <IconButton
            onClick={() => setDrawerOpen(true)}
            sx={{ position: "absolute", top: 10, right: 10, zIndex: 1000, bgcolor: "white" }}
          ><MenuIcon /></IconButton>
          <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
            {JobList}
          </Drawer>
        </>
      ) : (
        <Box sx={{ flexShrink: 0, width: 300, borderRight: "1px solid #ddd", height: "100%", overflowY: "auto", bgcolor: "#fafafa" }}>
          {JobList}
        </Box>
      )}

      {/* Map */}
      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <MapContainer center={[49.25, -123.1]} zoom={11} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          {markers}
          {renderPath()}
        </MapContainer>
      </Box>

      {/* Snackbar */}
      <Snackbar open={snack} autoHideDuration={3000} onClose={() => setSnack(false)}>
        <Alert severity="success" sx={{ width: "100%" }}>Job claimed successfully!</Alert>
      </Snackbar>
    </Box>
  );
};

export default NewJob;


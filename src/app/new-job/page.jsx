"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  Box, TextField, Button, Typography, Drawer, IconButton, List,
  ListItem, ListItemText, Snackbar, Alert, Card, CardContent, CardActions,
  Select, MenuItem
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import dynamic from "next/dynamic";
import { useProduct } from "../contexts/ProductContext";
import { useAccesspoint } from "../contexts/AccesspointContext";
import "leaflet/dist/leaflet.css";

import { stationCoords, bfsShortestPath, skytrainGraph } from "../compute/CalcHops";

// Leaflet dynamic imports
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then(mod => mod.Polyline), { ssr: false });

const NewJob = () => {
  const { products, setCommuter } = useProduct();
  const { accessPoints } = useAccesspoint ? useAccesspoint() : { accessPoints: [] };

  const [phone, setPhone] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [snack, setSnack] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dropOffSelections, setDropOffSelections] = useState({});
  const [openJobId, setOpenJobId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showAllMarkers, setShowAllMarkers] = useState(true);

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

  // Mobile media query
  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia("(max-width:900px)").matches);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const availableProducts = products.filter(p => !p.commuterPN);
  const isValidPhone = /^\d{10}$/.test(phone);

  const handleClaim = (productId) => {
    if (!isValidPhone) return;
    setCommuter(productId, phone);
    setSelectedProduct(productId);
    setSnack(true);

    // Refresh markers to show remaining points
    setShowAllMarkers(false);
    setTimeout(() => setShowAllMarkers(true), 0);
  };

  const resolveToStation = (name) => {
    const ap = accessPoints.find(ap => ap.name === name);
    return ap?.nearestStation || name;
  };

  // Reset open path if claim is removed
  useEffect(() => {
    if (!selectedProduct && openJobId) {
      setOpenJobId(null);
    }
  }, [selectedProduct]);

  // MARKERS
  const markers = useMemo(() => {
    const showAll = showAllMarkers || !openJobId || selectedProduct !== openJobId;
    const pickupNames = showAll
      ? Array.from(new Set(availableProducts.map(p => p.currApId)))
      : [availableProducts.find(p => p.id === openJobId)?.currApId].filter(Boolean);

    return pickupNames.map(name => {
      if (!name) return null;

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
                const startStation = resolveToStation(job.currApId);
                const endName = dropOffSelections[job.id] || job.destApId;
                const endAP = accessPoints.find(ap => ap.name === endName);
                const endStation = resolveToStation(endName);
                const { path } = bfsShortestPath(skytrainGraph, startStation, endStation);

                const pathForDropdown = [...path];
                if (endAP && !pathForDropdown.includes(endName)) pathForDropdown.push(endName);

                return (
                  <Card key={job.id} sx={{ my: 1 }}>
                    <CardContent sx={{ p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', mb: 0.5, fontSize: '0.9rem' }}>
                        <Typography variant="body2" component="span" sx={{ mr: 0.5 }}>
                          From <b>{job.currApId}</b> →
                        </Typography>
                        <Select
                          size="small"
                          value={dropOffSelections[job.id] || endName}
                          onChange={e => setDropOffSelections(s => ({ ...s, [job.id]: e.target.value }))}
                          sx={{ mx: 1, minWidth: 120, background: 'white' }}
                        >
                          {pathForDropdown.slice(1).map(name => (
                            <MenuItem key={name} value={name}>{name}</MenuItem>
                          ))}
                        </Select>
                      </Box>
                      <Typography variant="body2" sx={{ marginTop: 1 }}>
                        Hops: {bfsShortestPath(skytrainGraph, startStation, resolveToStation(dropOffSelections[job.id] || endName)).hops}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" variant="contained" onClick={() => handleClaim(job.id)} disabled={selectedProduct === job.id || !isValidPhone}>
                        {selectedProduct === job.id ? "Claimed" : "Claim"}
                      </Button>
                      <Button size="small" variant="outlined" onClick={() => setOpenJobId(openJobId === job.id ? null : job.id)}>
                        {openJobId === job.id ? "Hide Path" : "Show Path"}
                      </Button>
                    </CardActions>
                  </Card>
                );
              })}
            </Box>
          </Popup>
        </Marker>
      );
    });
  }, [availableProducts, selectedProduct, openJobId, dropOffSelections, accessPoints, showAllMarkers]);

  // RENDER PATH
  const renderPath = () => {
    if (!openJobId) return null;
    const L = typeof window !== "undefined" ? require("leaflet") : null;
    if (!L) return null;

    const openJob = availableProducts.find(j => j.id === openJobId);
    if (!openJob) return null;

    const startAP = accessPoints.find(ap => ap.name === openJob.currApId);
    const endName = dropOffSelections[openJob.id] || openJob.destApId;
    const endAP = accessPoints.find(ap => ap.name === endName);

    const startStation = resolveToStation(openJob.currApId);
    const endStation = resolveToStation(endName);
    const { path } = bfsShortestPath(skytrainGraph, startStation, endStation);

    const polylineCoords = [];
    if (startAP) polylineCoords.push([startAP.lat, startAP.lng]);
    polylineCoords.push(stationCoords[startStation]);
    for (let i = 1; i < path.length - 1; i++) polylineCoords.push(stationCoords[path[i]]);
    polylineCoords.push(stationCoords[endStation]);
    if (endAP) polylineCoords.push([endAP.lat, endAP.lng]);

    const markersArr = [];
    if (startAP) markersArr.push(<Marker key="startAP" position={[startAP.lat, startAP.lng]} icon={L.icon({ iconUrl: '/marker-icon.png', iconSize: [25, 41], iconAnchor: [12.5, 41] })} interactive={false} />);
    else markersArr.push(<Marker key="startStation" position={stationCoords[startStation]} icon={L.icon({ iconUrl: '/marker-icon.png', iconSize: [25, 41], iconAnchor: [12.5, 41] })} interactive={false} />);

    if (endAP) markersArr.push(<Marker key="endAP" position={[endAP.lat, endAP.lng]} icon={L.icon({ iconUrl: '/red-pin.png', iconSize: [25, 41], iconAnchor: [12.5, 41] })} interactive={false} />);
    else markersArr.push(<Marker key="endStation" position={stationCoords[endStation]} icon={L.icon({ iconUrl: '/red-pin.png', iconSize: [25, 41], iconAnchor: [12.5, 41] })} interactive={false} />);

    for (let i = 0; i < path.length; i++) {
      const station = path[i];
      markersArr.push(
        <Marker
          key={"dot-" + station + i}
          position={stationCoords[station]}
          icon={L.divIcon({ className: "", html: '<div style="width:12px;height:12px;background:#888;border-radius:50%;border:2px solid #fff;"></div>' })}
          interactive={false}
        />
      );
    }

    return <>
      <Polyline positions={polylineCoords} pathOptions={{ color: 'blue', weight: 4 }} />
      {markersArr}
    </>;
  };

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
        {availableProducts.length === 0 ? <ListItem><ListItemText primary="No jobs available" /></ListItem> :
          availableProducts.map(p => (
            <ListItem key={p.id} divider alignItems="flex-start">
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: "center" }}>
                <Box>
                  <Typography variant="body1">From: {p.currApId} → {p.destApId}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hops: {bfsShortestPath(skytrainGraph, resolveToStation(p.currApId), resolveToStation(p.destApId)).hops}
                  </Typography>
                </Box>
                <Button size="small" sx={{height: "50%"}} variant="contained" onClick={() => handleClaim(p.id)} disabled={selectedProduct === p.id || !isValidPhone}>
                  {selectedProduct === p.id ? "Claimed" : "Claim"}
                </Button>
              </Box>
            </ListItem>
          ))
        }
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: isMobile ? "column" : "row", height: "100vh" }}>
      {isMobile ? <>
        <IconButton onClick={() => setDrawerOpen(true)} sx={{ position: "absolute", top: 10, right: 10, zIndex: 1000, bgcolor: "white" }}><MenuIcon /></IconButton>
        <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>{JobList}</Drawer>
      </> : <Box sx={{ flexShrink: 0, width: 300, borderRight: "1px solid #ddd", height: "100%", overflowY: "auto", bgcolor: "#fafafa" }}>{JobList}</Box>}

      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <MapContainer center={[49.25, -123.1]} zoom={11} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          {markers}
          {renderPath()}
        </MapContainer>
      </Box>

      <Snackbar open={snack} autoHideDuration={3000} onClose={() => setSnack(false)}>
        <Alert severity="success" sx={{ width: "100%" }}>Job claimed successfully!</Alert>
      </Snackbar>
    </Box>
  );
};

export default NewJob;

"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  Box, TextField, Button, Typography, Drawer, IconButton, List,
  ListItem, ListItemText, Snackbar, Alert, Card, CardContent, CardActions,
  Select, MenuItem
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import { useAccesspoint } from "../contexts/AccesspointContext";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";

import { stationCoords, bfsShortestPath, skytrainGraph } from "../compute/CalcHops";

// Leaflet dynamic imports
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then(mod => mod.Polyline), { ssr: false });

const NewJob = () => {
  const { user } = useUser();
  const { accessPoints } = useAccesspoint ? useAccesspoint() : { accessPoints: [] };
  const router = useRouter();

  const [deliveries, setDeliveries] = useState([]);
  const [phone, setPhone] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [snack, setSnack] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [snackSeverity, setSnackSeverity] = useState("success");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dropOffSelections, setDropOffSelections] = useState({});
  const [openJobId, setOpenJobId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showAllMarkers, setShowAllMarkers] = useState(true);
  const [loading, setLoading] = useState(false);

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
    // Poll for new deliveries every 5 seconds
    const interval = setInterval(fetchDeliveries, 5000);
    return () => clearInterval(interval);
  }, []);

  const availableDeliveries = deliveries;
  const isValidPhone = /^\d{10}$/.test(phone);

  const handleClaim = async (deliveryId) => {
    if (!isValidPhone || !user) return;

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
          packageIds: [deliveryId], // Required by API schema
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setSelectedDelivery(deliveryId);
        setSnackMessage('Job claimed successfully!');
        setSnackSeverity('success');
        setSnack(true);
        
        // Remove claimed delivery from list
        setDeliveries(prev => prev.filter(d => d._id !== deliveryId));
        
        // Refresh markers
        setShowAllMarkers(false);
        setTimeout(() => setShowAllMarkers(true), 0);
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

  // Reset open path if claim is removed
  useEffect(() => {
    if (!selectedDelivery && openJobId) {
      setOpenJobId(null);
    }
  }, [selectedDelivery]);

  // Helper to get access point by ID
  const getAccessPointById = (id) => {
    return accessPoints.find(ap => ap._id === id || ap.id === id);
  };

  // MARKERS
  const markers = useMemo(() => {
    const showAll = showAllMarkers || !openJobId || selectedDelivery !== openJobId;
    
    // Group deliveries by origin access point
    const pickupPoints = showAll
      ? Array.from(new Set(availableDeliveries.map(d => d.originAccessPoint)))
      : [availableDeliveries.find(d => d._id === openJobId)?.originAccessPoint].filter(Boolean);

    return pickupPoints.map(apId => {
      if (!apId) return null;

      const ap = getAccessPointById(apId);
      if (!ap) return null;

      const coords = [ap.lat, ap.lng];
      if (!coords[0] || !coords[1]) return null;

      const relatedJobs = availableDeliveries.filter(d => d.originAccessPoint === apId);
      
      return (
        <Marker key={apId} position={coords}>
          <Popup onOpen={() => setOpenJobId(null)}>
            <Typography variant="subtitle1" fontWeight="bold">{ap.name}</Typography>
            <Box sx={{ maxHeight: 300, overflowY: 'auto', width: 250 }}>
              {relatedJobs.map(job => {
                const originAP = getAccessPointById(job.originAccessPoint);
                const destAP = getAccessPointById(job.destinationAccessPoint);
                const dropoffAP = dropOffSelections[job._id] 
                  ? getAccessPointById(dropOffSelections[job._id]) 
                  : destAP;

                if (!originAP || !destAP) return null;

                const startStation = originAP.stationId || originAP.nearestStation;
                const endStation = dropoffAP?.stationId || dropoffAP?.nearestStation || destAP.stationId || destAP.nearestStation;
                
                if (!startStation || !endStation) return null;

                const { path } = bfsShortestPath(skytrainGraph, startStation, endStation);

                // Build dropdown path
                const finalDestStation = destAP.stationId || destAP.nearestStation;
                const { path: fullPath } = bfsShortestPath(skytrainGraph, startStation, finalDestStation);
                
                return (
                  <Card key={job._id} sx={{ my: 1 }}>
                    <CardContent sx={{ p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', mb: 0.5, fontSize: '0.9rem' }}>
                        <Typography variant="body2" component="span" sx={{ mr: 0.5 }}>
                          From <b>{originAP.name}</b> →
                        </Typography>
                        <Select
                          size="small"
                          value={dropOffSelections[job._id] || job.destinationAccessPoint}
                          onChange={e => setDropOffSelections(s => ({ ...s, [job._id]: e.target.value }))}
                          sx={{ mx: 1, minWidth: 120, background: 'white' }}
                        >
                          {fullPath.slice(1).map(stationId => (
                            <MenuItem key={stationId} value={stationId}>{stationId}</MenuItem>
                          ))}
                          <MenuItem value={job.destinationAccessPoint}>{destAP.name} (Final)</MenuItem>
                        </Select>
                      </Box>
                      <Typography variant="body2" sx={{ marginTop: 1 }}>
                        Hops: {path.length - 1}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Cost: {job.totalCost} points
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={() => handleClaim(job._id)} 
                        disabled={selectedDelivery === job._id || !isValidPhone || loading || !user}
                      >
                        {selectedDelivery === job._id ? "Claimed" : "Claim"}
                      </Button>
                      <Button size="small" variant="outlined" onClick={() => setOpenJobId(openJobId === job._id ? null : job._id)}>
                        {openJobId === job._id ? "Hide Path" : "Show Path"}
                      </Button>
                    </CardActions>
                  </Card>
                );
              })}
            </Box>
          </Popup>
        </Marker>
      );
    }).filter(Boolean);
  }, [availableDeliveries, selectedDelivery, openJobId, dropOffSelections, accessPoints, showAllMarkers, isValidPhone, loading, user]);

  // RENDER PATH
  const renderPath = () => {
    if (!openJobId) return null;
    const L = typeof window !== "undefined" ? require("leaflet") : null;
    if (!L) return null;

    const openJob = availableDeliveries.find(j => j._id === openJobId);
    if (!openJob) return null;

    const startAP = getAccessPointById(openJob.originAccessPoint);
    const destAP = getAccessPointById(openJob.destinationAccessPoint);
    const dropoffAP = dropOffSelections[openJob._id] 
      ? getAccessPointById(dropOffSelections[openJob._id])
      : destAP;

    if (!startAP || !dropoffAP) return null;

    const startStation = startAP.stationId || startAP.nearestStation;
    const endStation = dropoffAP.stationId || dropoffAP.nearestStation;

    if (!startStation || !endStation) return null;

    const { path } = bfsShortestPath(skytrainGraph, startStation, endStation);

    const polylineCoords = [];
    
    // Add start access point
    if (startAP.lat && startAP.lng) {
      polylineCoords.push([startAP.lat, startAP.lng]);
    }
    
    // Add start station
    if (stationCoords[startStation]) {
      polylineCoords.push(stationCoords[startStation]);
    }
    
    // Add intermediate stations
    for (let i = 1; i < path.length - 1; i++) {
      if (stationCoords[path[i]]) {
        polylineCoords.push(stationCoords[path[i]]);
      }
    }
    
    // Add end station
    if (stationCoords[endStation]) {
      polylineCoords.push(stationCoords[endStation]);
    }
    
    // Add dropoff access point
    if (dropoffAP.lat && dropoffAP.lng) {
      polylineCoords.push([dropoffAP.lat, dropoffAP.lng]);
    }

    // Only render if we have at least 2 coordinates
    if (polylineCoords.length < 2) return null;

    const markersArr = [];
    markersArr.push(<Marker key="startAP" position={[startAP.lat, startAP.lng]} icon={L.icon({ iconUrl: '/marker-icon.png', iconSize: [25, 41], iconAnchor: [12.5, 41] })} interactive={false} />);
    markersArr.push(<Marker key="endAP" position={[dropoffAP.lat, dropoffAP.lng]} icon={L.icon({ iconUrl: '/red-pin.png', iconSize: [25, 41], iconAnchor: [12.5, 41] })} interactive={false} />);

    for (let i = 0; i < path.length; i++) {
      const station = path[i];
      if (stationCoords[station]) {
        markersArr.push(
          <Marker
            key={"dot-" + station + i}
            position={stationCoords[station]}
            icon={L.divIcon({ className: "", html: '<div style="width:12px;height:12px;background:#888;border-radius:50%;border:2px solid #fff;"></div>' })}
            interactive={false}
          />
        );
      }
    }

    return <>
      <Polyline positions={polylineCoords} pathOptions={{ color: 'blue', weight: 4 }} />
      {markersArr}
    </>;
  };

  const JobList = (
    <Box sx={{ width: 280, p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Available Jobs</Typography>
      {!user && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Please sign in to claim jobs
        </Alert>
      )}
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
        {availableDeliveries.length === 0 ? (
          <ListItem><ListItemText primary="No jobs available" /></ListItem>
        ) : (
          availableDeliveries.map(delivery => {
            const originAP = getAccessPointById(delivery.originAccessPoint);
            const destAP = getAccessPointById(delivery.destinationAccessPoint);
            
            if (!originAP || !destAP) return null;

            const startStation = originAP.stationId || originAP.nearestStation;
            const endStation = destAP.stationId || destAP.nearestStation;

            if (!startStation || !endStation) return null;

            const hops = bfsShortestPath(skytrainGraph, startStation, endStation).hops;

            return (
              <ListItem key={delivery._id} divider alignItems="flex-start">
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: "center" }}>
                  <Box>
                    <Typography variant="body1">
                      From: {originAP.name} → {destAP.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Hops: {hops}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pay: {delivery.totalCost} points
                    </Typography>
                  </Box>
                  <Button 
                    size="small" 
                    sx={{ height: "50%" }} 
                    variant="contained" 
                    onClick={() => handleClaim(delivery._id)} 
                    disabled={selectedDelivery === delivery._id || !isValidPhone || loading || !user}
                  >
                    {selectedDelivery === delivery._id ? "Claimed" : "Claim"}
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
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1100,
          bgcolor: "white",
          borderBottom: "1px solid #e0e0e0",
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton
            onClick={() => router.push("/dashboard")}
            sx={{
              bgcolor: "rgba(59, 130, 246, 0.1)",
              color: "#3b82f6",
              "&:hover": {
                bgcolor: "rgba(59, 130, 246, 0.2)"
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#1f2937" }}>
            Available Jobs
          </Typography>
        </Box>
        {isMobile && (
          <IconButton
            onClick={() => setDrawerOpen(true)}
            sx={{
              bgcolor: "white",
              border: "1px solid #e0e0e0",
              "&:hover": {
                bgcolor: "#f9f9f9"
              }
            }}
          >
            <MenuIcon />
          </IconButton>
        )}
      </Box>

      {/* Main Content */}
      <Box sx={{ display: "flex", flexDirection: isMobile ? "column" : "row", height: "calc(100vh - 70px)" }}>
        {isMobile ? (
          <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
            {JobList}
          </Drawer>
        ) : (
          <Box sx={{ flexShrink: 0, width: 300, borderRight: "1px solid #ddd", height: "100%", overflowY: "auto", bgcolor: "#fafafa" }}>
            {JobList}
          </Box>
        )}

        <Box sx={{ flexGrow: 1, position: 'relative' }}>
          <MapContainer center={[49.25, -123.1]} zoom={11} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
            {markers}
            {renderPath()}
          </MapContainer>
        </Box>
      </Box>

      <Snackbar open={snack} autoHideDuration={3000} onClose={() => setSnack(false)}>
        <Alert severity={snackSeverity} sx={{ width: "100%" }}>{snackMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default NewJob;

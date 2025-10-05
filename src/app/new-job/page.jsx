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
import useMediaQuery from "@mui/material/useMediaQuery";
import "leaflet/dist/leaflet.css";

// Dynamically import Leaflet (no SSR)
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then(mod => mod.Polyline), { ssr: false });

import { stationCoords, bfsShortestPath, skytrainGraph } from "../compute/CalcHops";

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
  const { accessPoints } = useAccesspoint ? useAccesspoint() : { accessPoints: [] };
  const [phone, setPhone] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [snack, setSnack] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Track selected drop-off station for each job
  const [dropOffSelections, setDropOffSelections] = useState({});

  // SSR-safe media query
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia("(max-width:900px)").matches);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Only show products with no commuterPN
  const availableProducts = products.filter(p => !p.commuterPN);

  // Basic phone validation (10 digits)
  const isValidPhone = /^\d{10}$/.test(phone);

  const handleClaim = (productId) => {
    if (isValidPhone) {
      setCommuter(productId, phone);
      setSelectedProduct(productId);
      setSnack(true);
    }
  };

  // Track which job popup is open
  const [openJobId, setOpenJobId] = useState(null);

  // Only show pickup (origin) markers for currApId (stations and access points)
  // Helper to resolve to station if access point
  const resolveToStation = (name) => {
    const ap = accessPoints.find(ap => ap.name === name);
    if (ap && ap.nearestStation) return ap.nearestStation;
    return name;
  };

  const markers = useMemo(() => {
    // Collect all unique currApId values
    const pickupNames = Array.from(new Set(availableProducts.map(p => p.currApId)));
    // If a path is being shown, get its end station
    let pathEndStation = null;
    if (openJobId) {
      const openJob = availableProducts.find(j => j.id === openJobId);
      if (openJob) {
        const { path } = bfsShortestPath(skytrainGraph, resolveToStation(openJob.currApId), resolveToStation(openJob.destApId));
        if (path && path.length > 1) pathEndStation = path[path.length - 1];
      }
    }
    return pickupNames.map(name => {
      // Suppress blue marker if this is the end of the shown path
      if (name === pathEndStation) return null;
      // Check if this is an access point
      const ap = accessPoints.find(ap => ap.name === name);
      let coords;
      if (ap && ap.lat && ap.lng) {
        coords = [ap.lat, ap.lng];
      } else {
        coords = stationCoords[name];
      }
      if (!coords) return null;
      const [lat, lng] = coords;
      const relatedJobs = availableProducts.filter(p => p.currApId === name);
      return (
        <Marker key={name} position={[lat, lng]}>
          <Popup
            onOpen={() => setOpenJobId(null)}
          >
            <Typography variant="subtitle1" fontWeight="bold">{name}</Typography>
            <Box sx={{ maxHeight: 300, overflowY: 'auto', width: 250 }}>
              {relatedJobs.map(job => {
                // Get path for this job
                const { path } = bfsShortestPath(skytrainGraph, resolveToStation(job.currApId), resolveToStation(job.destApId));
                // Default drop-off is the last station
                const selectedDrop = dropOffSelections[job.id] || path[path.length - 1];
                return (
                  <Card key={job.id} sx={{ my: 1 }}>
                    <CardContent sx={{ p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', mb: 0.5, fontSize: '0.9rem' }}>
                        <Typography variant="body2" component="span" sx={{ mr: 0.5, fontSize: '0.9rem' }}>
                          From <b>{job.currApId}</b> →
                        </Typography>
                        <Select
                          size="small"
                          value={selectedDrop}
                          onChange={e => setDropOffSelections(s => ({ ...s, [job.id]: e.target.value }))}
                          sx={{ mx: 1, minWidth: 120, background: 'white', fontSize: '0.9rem' }}
                          MenuProps={{ PaperProps: { sx: { fontSize: '0.9rem' } } }}
                        >
                          {path.slice(1).map(station => (
                            <MenuItem key={station} value={station} sx={{ fontSize: '0.9rem' }}>{station}</MenuItem>
                          ))}
                        </Select>
                      </Box>
                      <Typography variant="body2" sx={{ m: 0 }} style={{margin: "8px 0 0 0"}}>
                        Hops: {bfsShortestPath(skytrainGraph, resolveToStation(job.currApId), selectedDrop).hops}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => { handleClaim(job.id); }}
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
  }, [availableProducts, selectedProduct, phone, openJobId, accessPoints]);

  // Get the path for the open job (if any)
  const openJob = openJobId ? availableProducts.find(j => j.id === openJobId) : null;
  // Use selected drop-off for open job if set
  let openPath = [];
  if (openJob) {
    const { path } = bfsShortestPath(
      skytrainGraph,
      resolveToStation(openJob.currApId),
      resolveToStation(openJob.destApId)
    );
    const selectedDrop = dropOffSelections[openJob.id] || path[path.length - 1];
    const dropIdx = path.indexOf(selectedDrop);
    openPath = dropIdx > 0 ? path.slice(0, dropIdx + 1) : path;
  }

  // Job list component for desktop
  const JobList = (
    <Box sx={{ width: 280, p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Available Jobs
      </Typography>
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
          <ListItem>
            <ListItemText primary="No jobs available" />
          </ListItem>
        ) : (
          availableProducts.map((product) => (
            <ListItem key={product.id} divider alignItems="flex-start">
              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body1">
                    From: {product.currApId} → {product.destApId}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hops: {bfsShortestPath(skytrainGraph, resolveToStation(product.currApId), resolveToStation(product.destApId)).hops}
                  </Typography>
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
          ))
        )}
      </List>
    </Box>
  );

  // Job list component for mobile with close button inline with title
  const JobListMobile = (
    <Box sx={{ width: 280, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 0 }}>
          Available Jobs
        </Typography>
        <IconButton
          onClick={() => setDrawerOpen(false)}
          sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' }, m: 0, p: 1 }}
          aria-label="Close menu"
        >
          <CloseIcon fontSize="large" />
        </IconButton>
      </Box>
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
          <ListItem>
            <ListItemText primary="No jobs available" />
          </ListItem>
        ) : (
          availableProducts.map((product) => (
            <ListItem key={product.id} divider alignItems="flex-start">
              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body1">
                    From: {product.currApId} → {product.destApId}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hops: {bfsShortestPath(skytrainGraph, product.currApId, product.destApId).hops}
                  </Typography>
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
          ))
        )}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: isMobile ? "column" : "row", height: "100vh" }}>
      {/* Sidebar or Hamburger */}
      {isMobile ? (
        <>
          <IconButton
            onClick={() => setDrawerOpen(true)}
            sx={{ position: "absolute", top: 10, right: 10, zIndex: 1000, bgcolor: "white" }}
          >
            <MenuIcon />
          </IconButton>
          <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
            {JobListMobile}
          </Drawer>
        </>
      ) : (
        <Box
          sx={{
            flexShrink: 0,
            width: 300,
            borderRight: "1px solid #ddd",
            height: "100%",
            overflowY: "auto",
            bgcolor: "#fafafa"
          }}
        >
          {JobList}
        </Box>
      )}

      {/* Map Section */}
      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <MapContainer
          center={[49.25, -123.1]}
          zoom={11}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {markers}
          {/* Draw path for open job */}
          {openPath.length > 1 && (
            <>
              {/* Polyline for the path */}
              <Polyline
                positions={openPath.map(station => stationCoords[station])}
                pathOptions={{ color: 'blue', weight: 4 }}
              />
              {/* Only show red pin for the selected drop-off, dots for intermediate */}
              {openPath.map((station, idx) => {
                if (idx === 0) return null; // skip start marker
                const [lat, lng] = stationCoords[station];
                let icon = undefined;
                if (idx === openPath.length - 1) {
                  icon = L.icon({
                    iconUrl: '/red-pin.png',
                    iconSize: [25, 41],
                    iconAnchor: [12.5, 41]
                  });
                } else {
                  icon = L.divIcon({ className: '', html: '<div style="width:12px;height:12px;background:#888;border-radius:50%;border:2px solid #fff;"></div>' });
                }
                return (
                  <Marker key={station + idx} position={[lat, lng]} icon={icon} interactive={false} />
                );
              })}
            </>
          )}
        </MapContainer>
      </Box>

      {/* Snackbar */}
      <Snackbar open={snack} autoHideDuration={3000} onClose={() => setSnack(false)}>
        <Alert severity="success" sx={{ width: "100%" }}>
          Job claimed successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NewJob;
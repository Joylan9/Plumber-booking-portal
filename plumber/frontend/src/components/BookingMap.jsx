import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for clear differentiation
const plumberIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// OSRM profile names
const OSRM_PROFILES = { car: 'car', bike: 'bike', foot: 'foot' };
const MODE_LABELS = { car: '🚗 Car', bike: '🏍️ Bike', foot: '🚶 Walk' };

// Format seconds to human readable
const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h} hr ${m} min`;
  if (h > 0) return `${h} hr`;
  return `${m} min`;
};

// Fit map bounds to both markers
const MapBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(L.latLngBounds(positions), { padding: [60, 60] });
    } else if (positions.length === 1) {
      map.setView(positions[0], 13);
    }
  }, [map, positions]);
  return null;
};

// Force Leaflet to recalculate tile positions after mount
const InvalidateSize = () => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 300);
  }, [map]);
  return null;
};

// Route cache
const routeCache = new Map();

const BookingMap = ({ customerAddress, plumberAddress }) => {
  const [customerLoc, setCustomerLoc] = useState(null);
  const [plumberLoc, setPlumberLoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [transportMode, setTransportMode] = useState('car');
  const [routeData, setRouteData] = useState(null);
  const [routingError, setRoutingError] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Geocoding
  useEffect(() => {
    const tryFetch = async (query) => {
      if (!query) return null;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
          { headers: { 'User-Agent': 'PlumberBookingApp/1.0' } }
        );
        const data = await res.json();
        if (data && data.length > 0) {
          return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
        return null;
      } catch (err) {
        console.error("Geocoding failed for", query, err);
        return null;
      }
    };

    const cleanQuery = (q) =>
      q.replace(/\b(dist|district|tq|taluk|post|road|rd|street|st|cross|main)\b/gi, '')
       .trim().replace(/\s+/g, ' ');

    const geocode = async (address) => {
      if (!address) return null;

      let result = await tryFetch(address);
      if (result) return result;

      result = await tryFetch(cleanQuery(address));
      if (result) return result;

      const parts = address.split(',').map(p => p.trim()).filter(Boolean);

      if (parts.length > 1) {
        result = await tryFetch(cleanQuery(parts.slice(-2).join(', ')));
        if (result) return result;
      }

      if (parts.length > 0) {
        result = await tryFetch(cleanQuery(parts[parts.length - 1]));
        if (result) return result;
      }

      if (parts.length > 1) {
        result = await tryFetch(cleanQuery(parts[0]));
        if (result) return result;
      }

      return null;
    };

    const fetchLocations = async () => {
      setLoading(true);
      setError(null);
      const [cLoc, pLoc] = await Promise.all([
        geocode(customerAddress),
        geocode(plumberAddress)
      ]);
      if (!cLoc && !pLoc) {
        setError('Unable to locate addresses on the map.');
      } else {
        setCustomerLoc(cLoc);
        setPlumberLoc(pLoc);
      }
      setLoading(false);
    };

    fetchLocations();
  }, [customerAddress, plumberAddress]);

  // Fetch OSRM Route
  useEffect(() => {
    if (!customerLoc || !plumberLoc) return;

    const profile = OSRM_PROFILES[transportMode] || 'car';
    const [pLat, pLon] = plumberLoc;
    const [cLat, cLon] = customerLoc;
    const cacheKey = `${profile}|${pLon},${pLat}|${cLon},${cLat}`;

    if (routeCache.has(cacheKey)) {
      setRouteData(routeCache.get(cacheKey));
      setRoutingError(null);
      return;
    }

    const getRoute = async () => {
      setRouteLoading(true);
      setRoutingError(null);
      try {
        const url = `https://router.project-osrm.org/route/v1/${profile}/${pLon},${pLat};${cLon},${cLat}?overview=full&geometries=geojson&steps=true`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const path = route.geometry.coordinates.map(c => [c[1], c[0]]);
          const result = {
            path,
            distance: (route.distance / 1000).toFixed(1),
            duration: route.duration
          };
          routeCache.set(cacheKey, result);
          setRouteData(result);
        } else {
          setRoutingError('No route found for this mode.');
          setRouteData(null);
        }
      } catch (err) {
        console.error("OSRM routing error:", err);
        setRoutingError('Failed to calculate route.');
        setRouteData(null);
      } finally {
        setRouteLoading(false);
      }
    };

    const timer = setTimeout(getRoute, 250);
    return () => clearTimeout(timer);
  }, [customerLoc, plumberLoc, transportMode]);

  // --- Render ---

  if (loading) {
    return (
      <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa', borderRadius: '12px', color: '#888', fontSize: '14px' }}>
        Locating addresses…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa', borderRadius: '12px', color: '#666', fontSize: '14px' }}>
        {error}
      </div>
    );
  }

  const positions = [];
  if (customerLoc) positions.push(customerLoc);
  if (plumberLoc) positions.push(plumberLoc);
  const center = positions.length > 0 ? positions[0] : [20.5937, 78.9629];

  return (
    <div>
      {/* Transport mode buttons */}
      {customerLoc && plumberLoc && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
          {Object.entries(MODE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTransportMode(key)}
              style={{
                border: transportMode === key ? '2px solid #0A2540' : '1px solid #ddd',
                background: transportMode === key ? '#0A2540' : '#fff',
                color: transportMode === key ? '#fff' : '#0A2540',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Route info */}
      {routeData && !routingError && (
        <div style={{
          background: '#f0f6ff', border: '1px solid #c7dcf5', borderRadius: '10px',
          padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '10px'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#666', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>Est. Travel Time</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0A2540' }}>{formatDuration(routeData.duration)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#666', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>Road Distance</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0A2540' }}>{routeData.distance} km</div>
          </div>
        </div>
      )}

      {routeLoading && !routeData && (
        <div style={{ background: '#f0f6ff', border: '1px solid #c7dcf5', borderRadius: '10px', padding: '12px 16px', textAlign: 'center', color: '#666', fontSize: '13px', marginBottom: '10px' }}>
          Calculating route…
        </div>
      )}

      {routingError && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', marginBottom: '10px' }}>
          {routingError}
        </div>
      )}

      {/* Map */}
      <div style={{ height: '300px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', touchAction: 'pan-y' }}>
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom={false}
          dragging={false}
          touchZoom={false}
          doubleClickZoom={false}
          zoomControl={true}
          style={{ height: '300px', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <InvalidateSize />

          {customerLoc && (
            <Marker position={customerLoc} icon={customerIcon}>
              <Popup>
                <strong>📍 Customer Location</strong><br />
                {customerAddress}
              </Popup>
            </Marker>
          )}

          {plumberLoc && (
            <Marker position={plumberLoc} icon={plumberIcon}>
              <Popup>
                <strong>🔧 Plumber Location</strong><br />
                {plumberAddress}
              </Popup>
            </Marker>
          )}

          {routeData && (
            <Polyline
              positions={routeData.path}
              color="#2563eb"
              weight={5}
              opacity={0.85}
              lineCap="round"
              lineJoin="round"
            />
          )}

          <MapBounds positions={positions} />
        </MapContainer>
      </div>
    </div>
  );
};

export default BookingMap;

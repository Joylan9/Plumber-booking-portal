import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Distance calculation using Haversine formula
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

// Component to dynamically adjust map bounds
const MapBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, positions]);
  return null;
};

const BookingMap = ({ customerAddress, plumberAddress }) => {
  const [customerLoc, setCustomerLoc] = useState(null);
  const [plumberLoc, setPlumberLoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const geocode = async (address) => {
      if (!address) return null;
      
      const tryFetch = async (query) => {
        if (!query) return null;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`, {
            headers: {
              'User-Agent': 'PlumberBookingApp/1.0'
            }
          });
          const data = await response.json();
          if (data && data.length > 0) {
            return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          }
          return null;
        } catch (err) {
          console.error("Geocoding failed for", query, err);
          return null;
        }
      };

      // Helper to strip out common address suffixes that confuse the API
      const cleanQuery = (q) => q.replace(/\b(dist|district|tq|taluk|post|road|rd|street|st|cross|main)\b/gi, '').trim().replace(/\s+/g, ' ');

      // 1. Try full address exactly as is
      let result = await tryFetch(address);
      if (result) return result;

      // 2. Try cleaned full address
      result = await tryFetch(cleanQuery(address));
      if (result) return result;

      const parts = address.split(',').map(p => p.trim()).filter(Boolean);
      
      // 3. Try last 2 parts cleaned (usually city, state)
      if (parts.length > 1) {
        result = await tryFetch(cleanQuery(parts.slice(-2).join(', ')));
        if (result) return result;
      }
      
      // 4. Try ultimate fallback (just the very last part - usually District/State)
      if (parts.length > 0) {
        result = await tryFetch(cleanQuery(parts[parts.length - 1]));
        if (result) return result;
      }
      
      // 5. Try just the very first part cleaned (often a landmark or village)
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
        setError('Unable to pinpoint locations on the map.');
      } else {
        setCustomerLoc(cLoc);
        setPlumberLoc(pLoc);
      }
      setLoading(false);
    };

    fetchLocations();
  }, [customerAddress, plumberAddress]);

  if (loading) {
    return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa', borderRadius: '12px' }}>Loading map data...</div>;
  }

  if (error) {
    return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa', borderRadius: '12px', color: '#666' }}>{error}</div>;
  }

  // Determine positions to show
  const positions = [];
  if (customerLoc) positions.push(customerLoc);
  if (plumberLoc) positions.push(plumberLoc);
  
  // Default to USA or center of the two if missing one
  const center = positions.length > 0 ? positions[0] : [39.8283, -98.5795];

  return (
    <div style={{ height: '350px', width: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {customerLoc && (
          <Marker position={customerLoc}>
            <Popup>
              <strong>Service Location</strong><br/>
              {customerAddress}
            </Popup>
          </Marker>
        )}
        
        {plumberLoc && (
          <Marker position={plumberLoc}>
            <Popup>
              <strong>Plumber Location</strong><br/>
              {plumberAddress}
            </Popup>
          </Marker>
        )}

        {customerLoc && plumberLoc && (
          <>
            <Polyline 
              positions={[plumberLoc, customerLoc]} 
              color="#0A2540" 
              weight={4} 
              dashArray="10, 10" 
              opacity={0.8}
            />
            <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, background: 'white', padding: '8px 12px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', fontSize: '14px', fontWeight: 'bold', color: '#0A2540' }}>
              Route Distance: {getDistance(plumberLoc[0], plumberLoc[1], customerLoc[0], customerLoc[1])} km
            </div>
          </>
        )}
        
        <MapBounds positions={positions} />
      </MapContainer>
    </div>
  );
};

export default BookingMap;

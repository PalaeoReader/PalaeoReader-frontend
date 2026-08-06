import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';
import { useArtifactMapData } from '../../hooks/useArtifactMapData';

// Colors match the legend in the header.
const TYPE_COLOR = {
  discovery: '#c9a050',
  current: '#7eb0e8',
};

function makeIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -7],
  });
}

const ICONS = {
  discovery: makeIcon(TYPE_COLOR.discovery),
  current: makeIcon(TYPE_COLOR.current),
};

// Moves the map to fit all markers once they load.
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    map.fitBounds(points, { padding: [80, 80] });
  }, [points, map]);
  return null;
}

// Stashes the map instance so the side list can fly to a location.
function MapRefSetter({ mapRef }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

function MapPage() {
  const { artifacts, locationsById, loading } = useArtifactMapData();
  const [showRoutes, setShowRoutes] = useState(true);
  const [search, setSearch] = useState('');
  const mapRef = useRef(null);

  const filteredArtifacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return artifacts;
    return artifacts.filter(a =>
      [a.label, a.script].some(field => field && field.toLowerCase().includes(q))
    );
  }, [artifacts, search]);

  // One marker per (artifact, location role) pair.
  const markers = useMemo(() => {
    return artifacts.flatMap(a => {
      const points = [];
      const disc = a.discovery_location_id && locationsById[a.discovery_location_id];
      const curr = a.current_location_id && locationsById[a.current_location_id];
      if (disc) points.push({ artifact: a, location: disc, type: 'discovery' });
      if (curr) points.push({ artifact: a, location: curr, type: 'current' });
      return points;
    });
  }, [artifacts, locationsById]);

  // One line per artifact, connecting discovery to current location.
  // Skipped if either location is missing or they are the same spot.
  const routes = useMemo(() => {
    return artifacts
      .map(a => {
        const disc = a.discovery_location_id && locationsById[a.discovery_location_id];
        const curr = a.current_location_id && locationsById[a.current_location_id];
        if (!disc || !curr) return null;
        if (disc.lat === curr.lat && disc.lon === curr.lon) return null;
        return { artifact: a, from: disc, to: curr };
      })
      .filter(Boolean);
  }, [artifacts, locationsById]);

  const boundsPoints = markers.map(m => [m.location.lat, m.location.lon]);

  function flyToArtifact(a) {
    const loc = locationsById[a.current_location_id] || locationsById[a.discovery_location_id];
    if (loc && mapRef.current) {
      mapRef.current.flyTo([loc.lat, loc.lon], 6);
    }
  }

  if (loading) {
    return <div className="map-page"><div className="map-header-sub" style={{ margin: 'auto' }}>Loading map data...</div></div>;
  }

  return (
    <div className="map-page">
      <div className="map-header">
        <div>
          <h2>Geographic Map</h2>
          <div className="map-header-sub">Discovery and current locations of artifacts in the collection</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.78rem' }}>
          <span style={{ color: TYPE_COLOR.discovery, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 10, height: 10, background: TYPE_COLOR.discovery, display: 'inline-block', borderRadius: '50%' }} />
            Discovery site
          </span>
          <span style={{ color: TYPE_COLOR.current, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 10, height: 10, background: TYPE_COLOR.current, display: 'inline-block', borderRadius: '50%' }} />
            Current location
          </span>
          <label style={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={showRoutes} onChange={e => setShowRoutes(e.target.checked)} />
            Show routes
          </label>
        </div>
      </div>

      <div className="map-body">
        <div className="map-sidebar">
          <input
            type="text"
            className="sidebar-input map-sidebar-search"
            placeholder="Search artifacts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {filteredArtifacts.length === 0 && (
            <div className="map-sidebar-meta" style={{ padding: '0.7rem 1rem' }}>No artifacts match.</div>
          )}
          {filteredArtifacts.map(a => (
            <div key={a.id} className="map-sidebar-item" onClick={() => flyToArtifact(a)}>
              <div className="map-sidebar-name">{a.label}</div>
              <div className="map-sidebar-meta">{a.script}</div>
            </div>
          ))}
        </div>

        <div className="map-container">
          <MapContainer center={[47, 90]} zoom={4} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
            />

            <FitBounds points={boundsPoints} />
            <MapRefSetter mapRef={mapRef} />

            {showRoutes && routes.map(r => (
              <Polyline
                key={`route-${r.artifact.id}`}
                positions={[[r.from.lat, r.from.lon], [r.to.lat, r.to.lon]]}
                pathOptions={{ color: '#9CA3AF', weight: 1.5, dashArray: '4 6', opacity: 0.7 }}
              />
            ))}

            <MarkerClusterGroup chunkedLoading maxClusterRadius={40}>
              {markers.map(m => (
                <Marker
                  key={`${m.type}-${m.artifact.id}`}
                  position={[m.location.lat, m.location.lon]}
                  icon={ICONS[m.type]}
                >
                  <Popup>
                    <div className="map-popup-title">{m.artifact.label}</div>
                    <div className="map-popup-meta">
                      {[m.artifact.script, m.type === 'discovery' ? m.artifact.discovery_date : m.artifact.origin_date]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                    <div className="map-popup-meta">
                      {m.type === 'discovery' ? 'Discovered at' : 'Currently held at'} {m.location.name}
                    </div>
                    <a className="map-popup-link" href={`/artifact/${m.artifact.shortname}`}>
                      Open artifact →
                    </a>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export default MapPage;

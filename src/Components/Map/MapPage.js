import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// All known artifact locations from the database
const LOCATIONS = [
  {
    id: 1,
    name: 'Mogao Caves',
    lat: 40.0403, lon: 94.8094,
    type: 'discovery',
    artifact: { label: 'Irq Bitig (Book of Omens)', shortname: 'irq-bitig', date: '9th century', script: 'Old Turkic runiform' },
    description: 'Discovery location of the Irq Bitig manuscript'
  },
  {
    id: 2,
    name: 'British Library, London',
    lat: 51.5252, lon: -0.1277,
    type: 'current',
    artifact: { label: 'Irq Bitig (Book of Omens)', shortname: 'irq-bitig', date: '9th century', script: 'Old Turkic runiform' },
    description: 'Current location of the Irq Bitig'
  },
  {
    id: 3,
    name: 'Orkhon Valley, Mongolia',
    lat: 47.5605, lon: 102.8410,
    type: 'discovery',
    artifact: { label: 'Kül Tigin Memorial', shortname: 'kül-tigin', date: '732 CE', script: 'Old Turkic runiform' },
    description: 'Original site of the Kül Tigin inscription'
  },
  {
    id: 4,
    name: 'Orkhon Museum, Kharkhorin',
    lat: 47.1952, lon: 102.8390,
    type: 'current',
    artifact: { label: 'Kül Tigin Memorial', shortname: 'kül-tigin', date: '732 CE', script: 'Old Turkic runiform' },
    description: 'Current museum location of the inscription'
  },
];

const TYPE_COLOR = {
  discovery: '#c9a050',
  current:   '#1c4fa0',
};

function FitBounds({ locations }) {
  const map = useMap();
  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(l => [l.lat, l.lon]));
      map.fitBounds(bounds, { padding: [80, 80] });
    }
  }, [map, locations]);
  return null;
}

function MapPage() {
  return (
    <div className="map-page">
      <div className="map-header">
        <div>
          <h2>Geographic Map</h2>
          <div className="map-header-sub">Discovery and current locations of artifacts in the collection</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1.5rem', fontSize: '0.78rem' }}>
          <span style={{ color: '#c9a050', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 10, height: 10, background: '#c9a050', display: 'inline-block', borderRadius: '50%' }} />
            Discovery site
          </span>
          <span style={{ color: '#7eb0e8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 10, height: 10, background: '#7eb0e8', display: 'inline-block', borderRadius: '50%' }} />
            Current location
          </span>
        </div>
      </div>

      <div className="map-container" style={{ flex: 1, minHeight: 0 }}>
        <MapContainer
          center={[47, 90]}
          zoom={4}
          style={{ height: 'calc(100vh - 110px)', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
          />
          <FitBounds locations={LOCATIONS} />
          {LOCATIONS.map(loc => {
            const icon = L.divIcon({
              html: `<div style="
                width:14px; height:14px;
                background:${TYPE_COLOR[loc.type]};
                border:2px solid #fff;
                border-radius:50%;
                box-shadow:0 2px 6px rgba(0,0,0,0.4);
              "></div>`,
              className: '',
              iconSize: [14, 14],
              iconAnchor: [7, 7],
            });

            return (
              <Marker key={loc.id} position={[loc.lat, loc.lon]} icon={icon}>
                <Popup>
                  <div className="map-popup-title">{loc.name}</div>
                  <div className="map-popup-meta">
                    {loc.type === 'discovery' ? 'Discovery site' : 'Current location'} of{' '}
                    <em>{loc.artifact.label}</em>
                  </div>
                  <div className="map-popup-meta">{loc.artifact.script}, {loc.artifact.date}</div>
                  <a className="map-popup-link" href={`/artifact/${loc.artifact.shortname}`}>
                    Open artifact →
                  </a>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}

export default MapPage;

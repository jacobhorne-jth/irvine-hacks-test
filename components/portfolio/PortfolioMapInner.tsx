'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import L from 'leaflet';
import type { PortfolioEntry } from './SaveToPortfolioButton';
import { scoreToLevel } from '@/lib/utils';

const RISK_COLORS: Record<string, string> = {
  low:      '#22C55E',
  medium:   '#F59E0B',
  high:     '#F97316',
  critical: '#EF4444',
};

function createRiskIcon(score: number) {
  const level = scoreToLevel(score);
  const color = RISK_COLORS[level];
  return L.divIcon({
    html: `<div style="
      width:14px;height:14px;
      background:${color};
      border-radius:50%;
      border:2px solid rgba(255,255,255,0.9);
      box-shadow:0 0 8px ${color}80,0 2px 4px rgba(0,0,0,0.5);
    "></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -12],
  });
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 13);
    } else {
      map.fitBounds(L.latLngBounds(positions), { padding: [50, 50] });
    }
  }, [map, positions]);
  return null;
}

export default function PortfolioMapInner({ entries }: { entries: PortfolioEntry[] }) {
  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  }, []);

  const mapped = entries.filter((e) => e.latitude != null && e.longitude != null);
  const positions: [number, number][] = mapped.map((e) => [e.latitude!, e.longitude!]);

  const center: [number, number] =
    positions.length > 0
      ? [
          positions.reduce((s, p) => s + p[0], 0) / positions.length,
          positions.reduce((s, p) => s + p[1], 0) / positions.length,
        ]
      : [33.68, -117.77]; // Default: Orange County, CA

  return (
    <div className="h-full min-h-[300px] rounded-xl overflow-hidden border border-line">
      <MapContainer
        center={center}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {positions.length > 0 && <FitBounds positions={positions} />}
        {mapped.map((entry) => (
          <Marker
            key={entry.id}
            position={[entry.latitude!, entry.longitude!]}
            icon={createRiskIcon(entry.overallScore)}
          >
            <Popup>
              <div style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, minWidth: 160 }}>
                <strong style={{ display: 'block', marginBottom: 4 }}>{entry.address}</strong>
                <span>Risk Score: <strong>{entry.overallScore}</strong></span>
                {entry.recommendation && (
                  <span style={{ display: 'block', textTransform: 'capitalize', marginTop: 2 }}>
                    {entry.recommendation}
                  </span>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

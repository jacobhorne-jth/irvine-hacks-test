'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  address: string;
}

// Dynamically import the map to avoid SSR issues with Leaflet
const MapInner = dynamic(() => import('./PropertyMapInner'), { ssr: false, loading: () => (
  <div className="h-64 rounded-xl bg-muted flex items-center justify-center text-sm text-muted-foreground">
    Loading map...
  </div>
) });

export function PropertyMap(props: PropertyMapProps) {
  return <MapInner {...props} />;
}

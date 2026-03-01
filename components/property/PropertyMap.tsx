'use client';

import dynamic from 'next/dynamic';

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  address: string;
}

// Dynamically import the map to avoid SSR issues with Leaflet
const MapInner = dynamic(() => import('./PropertyMapInner'), { ssr: false, loading: () => (
  <div className="h-full min-h-[220px] rounded-xl bg-muted flex items-center justify-center text-sm text-muted-foreground">
    Loading map...
  </div>
) });

export function PropertyMap(props: PropertyMapProps) {
  return <MapInner {...props} />;
}

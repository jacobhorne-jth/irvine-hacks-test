import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { RiskLevel } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  });
}

export function tenureLabel(months: number | null | undefined): string {
  if (months == null) return 'Current owner';
  if (months < 1) return 'Less than 1 month';
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} year${years === 1 ? '' : 's'}`;
  return `${years}y ${rem}m`;
}

export function addressToSlug(address: string): string {
  return address
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function slugToAddress(slug: string): string {
  return decodeURIComponent(slug).replace(/-/g, ' ');
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'low':
      return '#22c55e';
    case 'medium':
      return '#eab308';
    case 'high':
      return '#f97316';
    case 'critical':
      return '#ef4444';
  }
}

export function getRiskBgClass(level: RiskLevel): string {
  switch (level) {
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200';
  }
}

export function getRiskLabel(level: RiskLevel): string {
  switch (level) {
    case 'low':
      return 'Low Risk';
    case 'medium':
      return 'Moderate Risk';
    case 'high':
      return 'High Risk';
    case 'critical':
      return 'Critical Risk';
  }
}

/** Reverse-geocode lat/lng → county name (e.g. "Orange County").
 *  Requires Geocoding API enabled on the same Google key. */
export async function getCountyFromLatLng(
  lat: number,
  lng: number
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;
  try {
    const url =
      `https://maps.googleapis.com/maps/api/geocode/json` +
      `?latlng=${lat},${lng}&result_type=administrative_area_level_2&key=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== 'OK') return null;
    const components: { types: string[]; long_name: string }[] =
      json.results?.[0]?.address_components ?? [];
    return (
      components.find((c) => c.types.includes('administrative_area_level_2'))
        ?.long_name ?? null
    );
  } catch {
    return null;
  }
}

export function scoreToLevel(score: number): RiskLevel {
  if (score <= 25) return 'low';
  if (score <= 50) return 'medium';
  if (score <= 75) return 'high';
  return 'critical';
}

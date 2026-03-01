import { Bed, Bath, Ruler, Calendar, TrendingUp, ExternalLink } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { PropertyDetails } from '@/lib/types';

interface PropertyOverviewCardProps {
  property: PropertyDetails;
}

export function PropertyOverviewCard({ property }: PropertyOverviewCardProps) {
  const { address, beds, baths, sqft, yearBuilt, zestimate, lastSalePrice, lastSaleDate, propertyType } = property;

  return (
    <div className="border border-[#1A2035] bg-[#0B0F1C] rounded-lg overflow-hidden reveal">
      {/* Header */}
      <div className="px-6 pt-6 pb-5 border-b border-[#1A2035]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="text-[10px] font-data text-[#F5A11C] tracking-[0.2em] uppercase block mb-2">
              {propertyType.replace('-', ' ')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight truncate">
              {address.street}
            </h1>
            <p className="text-[#C8D6E2] font-data text-sm mt-1">
              {address.city}, {address.state} {address.zip}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] font-data text-[#AABFCF] tracking-[0.15em] uppercase mb-1">AVM Estimate</p>
            <p className="text-2xl font-bold font-data text-white">
              {zestimate > 0 ? formatCurrency(zestimate) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 divide-x divide-[#1A2035]">
        <Stat icon={<Bed className="h-3.5 w-3.5" />} label="Beds"  value={beds > 0 ? String(beds) : '—'} />
        <Stat icon={<Bath className="h-3.5 w-3.5" />} label="Baths" value={baths > 0 ? String(baths) : '—'} />
        <Stat icon={<Ruler className="h-3.5 w-3.5" />} label="Sq Ft" value={sqft > 0 ? sqft.toLocaleString() : '—'} />
        <Stat icon={<Calendar className="h-3.5 w-3.5" />} label="Built" value={yearBuilt > 0 ? String(yearBuilt) : '—'} />
      </div>

      {/* Sale info */}
      <div className="px-6 py-3 flex items-center justify-between gap-2 border-t border-[#1A2035]">
        <div className="flex items-center gap-2 text-xs font-data text-[#C8D6E2]">
          <TrendingUp className="h-3.5 w-3.5 text-[#22C55E]" />
          {lastSalePrice > 0 ? (
            <>Last sold {formatDate(lastSaleDate)} for{' '}
              <span className="text-white font-semibold">{formatCurrency(lastSalePrice)}</span>
            </>
          ) : (
            <>Last sold {formatDate(lastSaleDate)} — <span className="text-white font-semibold">price undisclosed</span></>
          )}
        </div>
        {property.redfinUrl && (
          <a
            href={property.redfinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-data text-[#60A5FA] hover:text-[#93C5FD] transition-colors"
          >
            Redfin <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-4 px-2">
      <div className="text-[#AABFCF] mb-0.5">{icon}</div>
      <p className="text-lg font-bold font-data text-white leading-none">{value}</p>
      <p className="text-[10px] font-data text-[#AABFCF] tracking-wider uppercase">{label}</p>
    </div>
  );
}

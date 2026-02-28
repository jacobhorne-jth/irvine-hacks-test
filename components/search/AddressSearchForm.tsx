'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';

const SAMPLE_ADDRESSES = [
  '14 Clearview, Irvine, CA 92612',
  '2201 W Ball Rd, Anaheim, CA 92804',
  '891 Iris Ave, Newport Beach, CA 92625',
];

export function AddressSearchForm() {
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;
    setLoading(true);
    router.push(`/property/${encodeURIComponent(address.trim())}`);
  }

  return (
    <div className="w-full max-w-2xl space-y-4">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="flex border border-[#1A2035] bg-[#0B0F1C] rounded-lg overflow-hidden focus-within:border-[#F5A11C]/50 transition-colors">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, Chicago, IL 60601"
            className="flex-1 px-4 py-4 bg-transparent text-white placeholder:text-[#3B4A65] text-sm font-data focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !address.trim()}
            className="flex items-center gap-2 px-5 py-4 bg-[#F5A11C] text-[#080B14] text-sm font-bold tracking-wide hover:bg-[#F5A11C]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
            style={{ fontFamily: 'var(--font-syne)' }}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {loading ? 'ANALYZING' : 'ANALYZE'}
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-data text-[#3B4A65] tracking-[0.15em] uppercase">
          Sample addresses:
        </p>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_ADDRESSES.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => setAddress(sample)}
              className="text-xs font-data px-3 py-1.5 border border-[#1A2035] text-[#64748B] hover:border-[#F5A11C]/40 hover:text-[#F5A11C] transition-colors rounded"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

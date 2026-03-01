'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();

  const isSearch    = pathname === '/' || pathname.startsWith('/property');
  const isPortfolio = pathname === '/portfolio';

  return (
    <nav className="sticky top-0 z-50 border-b border-[#1A2035] bg-[#080B14]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">

        {/* Left — logo + tabs */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-7 h-7 rounded bg-[#F5A11C] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L13 5V13H1V5L7 1Z" fill="#080B14" strokeWidth="0"/>
                <rect x="4" y="8" width="2" height="5" fill="#F5A11C"/>
                <rect x="8" y="8" width="2" height="5" fill="#F5A11C"/>
              </svg>
            </div>
            <span
              className="font-bold text-base tracking-tight text-white"
              style={{ fontFamily: 'var(--font-syne)' }}
            >
              PROP.INTEL
            </span>
          </Link>

          {/* Tab nav */}
          <div className="flex items-stretch h-16">
            <Link
              href="/"
              className={`relative flex items-center px-4 text-sm font-medium transition-colors ${
                isSearch ? 'text-white' : 'text-[#3B4A65] hover:text-[#9BA8BC]'
              }`}
            >
              Search Properties
              {isSearch && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F5A11C] rounded-full" />
              )}
            </Link>
            <Link
              href="/portfolio"
              className={`relative flex items-center px-4 text-sm font-medium transition-colors ${
                isPortfolio ? 'text-white' : 'text-[#3B4A65] hover:text-[#9BA8BC]'
              }`}
            >
              Portfolio
              {isPortfolio && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F5A11C] rounded-full" />
              )}
            </Link>
          </div>
        </div>

        {/* Right — how it works */}
        <a
          href="/#how-it-works"
          className="text-sm font-medium text-[#3B4A65] hover:text-white transition-colors"
        >
          How it works
        </a>

      </div>
    </nav>
  );
}

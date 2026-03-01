import type { Metadata } from 'next';
import { Bricolage_Grotesque, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const syne = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '500', '600', '700', '800'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Property Risk Intel',
  description: 'ML-powered property risk analysis — title, disaster, and market risk for any US address',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${syne.variable} ${jetbrainsMono.variable} bg-[#080B14] text-[#D8DDE8] antialiased`}>

        {/* Nav */}
        <nav className="sticky top-0 z-50 border-b border-[#1A2035] bg-[#080B14]/90 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <div className="w-7 h-7 rounded bg-[#F5A11C] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L13 5V13H1V5L7 1Z" fill="#080B14" strokeWidth="0"/>
                  <rect x="4" y="8" width="2" height="5" fill="#F5A11C"/>
                  <rect x="8" y="8" width="2" height="5" fill="#F5A11C"/>
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-base tracking-tight text-white" style={{ fontFamily: 'var(--font-syne)' }}>
                  PROP.INTEL
                </span>
                <span className="hidden sm:block text-[10px] font-data text-[#F5A11C] tracking-widest uppercase opacity-80">
                  Risk Analysis
                </span>
              </div>
            </a>
            <div className="flex items-center gap-5">
              <a
                href="/portfolio"
                className="text-[11px] font-data text-[#3B4A65] hover:text-[#F5A11C] tracking-wider uppercase transition-colors"
              >
                Portfolio
              </a>
              <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-data text-[#3B4A65] tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                Live · ATTOM
              </span>
            </div>
          </div>
        </nav>

        <main className="min-h-[calc(100vh-56px)]">{children}</main>

        {/* Footer */}
        <footer className="border-t border-[#1A2035] py-8 mt-8">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs font-data text-[#3B4A65] tracking-wider">
              PROP.INTEL — FOR INFORMATIONAL USE ONLY. NOT LEGAL OR FINANCIAL ADVICE.
            </span>
            <span className="text-xs font-data text-[#3B4A65] tracking-wider">
              ATTOM DATA · OPENSTREETMAP
            </span>
          </div>
        </footer>

      </body>
    </html>
  );
}

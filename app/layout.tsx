import type { Metadata } from 'next';
import { Bricolage_Grotesque, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/nav/Navbar';

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

        <Navbar />

        <main className="min-h-[calc(100vh-64px)]">{children}</main>

        {/* Footer */}
        <footer className="border-t border-[#1A2035] py-8 mt-8">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs font-data text-[#AABFCF] tracking-wider">
              PROP.INTEL — FOR INFORMATIONAL USE ONLY. NOT LEGAL OR FINANCIAL ADVICE.
            </span>
            <span className="text-xs font-data text-[#AABFCF] tracking-wider">
              ATTOM DATA · OPENSTREETMAP
            </span>
          </div>
        </footer>

      </body>
    </html>
  );
}

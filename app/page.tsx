import { Shield, GitBranch, Bot, Brain, FileText, Flame, Sparkles, BarChart3, Briefcase } from 'lucide-react';
import { AddressSearchForm } from '@/components/search/AddressSearchForm';

export default function HomePage() {
  return (
    <div className="flex flex-col">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#080B14] dot-grid min-h-screen flex items-center justify-center">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#F5A11C]/5 blur-[120px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 py-24 w-full flex flex-col items-center text-center">

          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center gap-2 border border-[#F5A11C]/30 bg-[#F5A11C]/8 rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F5A11C] animate-pulse" />
              <span className="text-[11px] font-data text-[#F5A11C] tracking-[0.15em] uppercase">
                AI-Powered · Any US Address
              </span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl font-extrabold text-white leading-[0.95] tracking-tight mb-6">
            Property Risk
            <br />
            <span className="text-[#F5A11C]">Intelligence.</span>
          </h1>

          <p className="text-lg text-[#C8D6E2] max-w-2xl mb-12 leading-relaxed">
            Ownership history, title risk, AI-assessed disaster risk, and portfolio
            management, for any US address, in seconds.
          </p>

          {/* Search */}
          <div className="w-full flex justify-center">
            <AddressSearchForm centered />
          </div>

          {/* Feature pills */}
          <div className="mt-14 pt-10 border-t border-[#1A2035] flex flex-wrap gap-6 justify-center w-full">
            {[
              { icon: FileText, label: 'Title Risk' },
              { icon: Flame,    label: 'ML-Driven Hazard Risk' },
              { icon: Sparkles, label: 'AI Insights' },
              { icon: BarChart3, label: 'Portfolio'  },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-[#AABFCF]">
                <Icon className="h-4 w-4" />
                <span className="text-sm font-data tracking-wide">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6 bg-[#060810] border-t border-[#1A2035]">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] font-data text-[#AABFCF] tracking-[0.2em] uppercase mb-4 text-center">
            Features
          </p>
          <h2 className="text-3xl font-bold text-white mb-12 text-center">What you get</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-[#1A2035]">
            <Feature
              icon={<GitBranch className="h-5 w-5 text-[#60A5FA]" />}
              title="Ownership Timeline"
              description="Every owner, purchase price, tenure, and foreclosure in a complete chain of title"
              accent="#60A5FA"
            />
            <Feature
              icon={<Shield className="h-5 w-5 text-[#A78BFA]" />}
              title="Title Risk Score"
              description="0–100 quantified title risk calculations from flips and rapid transfers"
              accent="#A78BFA"
            />
            <Feature
              icon={<Brain className="h-5 w-5 text-[#F5A11C]" />}
              title="ML-Powered Disaster Risk"
              description="Ridge regression on custom model for disaster risk calculations"
              accent="#F5A11C"
            />
            <Feature
              icon={<Briefcase className="h-5 w-5 text-[#38BDF8]" />}
              title="Portfolio Analytics"
              description="Aggregate hazard exposure and annual loss estimates across multiple properties"
              accent="#38BDF8"
            />
            <Feature
              icon={<Bot className="h-5 w-5 text-[#22C55E]" />}
              title="AI Insights Report"
              description="GPT-4o synthesizes all signals into a clear Proceed / Caution / Avoid recommendation"
              accent="#22C55E"
            />
          </div>
        </div>
      </section>

    </div>
  );
}

function Feature({
  icon,
  title,
  description,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <div className="bg-[#060810] p-6 space-y-4 group hover:bg-[#0B0F1C] transition-colors">
      <div
        className="w-9 h-9 rounded flex items-center justify-center"
        style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}
      >
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-white text-sm mb-2">{title}</h3>
        <p className="text-xs text-[#C8D6E2] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

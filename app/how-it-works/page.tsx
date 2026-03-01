export default function HowItWorksPage() {
  return (
    <div className="py-20 px-6 bg-[#080B14] min-h-screen">
      <div className="max-w-4xl mx-auto">
        <p className="text-[11px] font-data text-[#AABFCF] tracking-[0.2em] uppercase mb-4 text-center">
          Process
        </p>
        <h2 className="text-3xl font-bold text-white mb-12 text-center">How it works</h2>

        <div className="space-y-0 border border-[#1A2035] divide-y divide-[#1A2035]">
          {[
            {
              n: '01',
              title: 'Enter a US property address',
              desc: 'Residential or multi-family. Works nationwide — not just one county.',
            },
            {
              n: '02',
              title: 'We pull your property data',
              desc: 'Ownership history, sales, foreclosures from county assessor data.',
            },
            {
              n: '03',
              title: 'Toggle between title and disaster risk',
              desc: 'temp',
            },
            {
              n: '04',
              title: 'A custom hazard risk model calculates economic damages',
              desc: "We retrained a Ridge Regression model, reweighting FEMA's score to reflect only structural property damage",
            },
            {
              n: '05',
              title: 'AI-powered insights',
              desc: 'AI insights based on address relative contexts.',
            },
          ].map(({ n, title, desc }) => (
            <div key={n} className="flex gap-6 p-6 group hover:bg-[#0D1120] transition-colors">
              <span className="font-data text-[#F5A11C] text-sm font-bold shrink-0 mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                {n}
              </span>
              <div>
                <p className="font-semibold text-white mb-1">{title}</p>
                <p className="text-sm text-[#C8D6E2] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

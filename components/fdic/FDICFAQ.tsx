import type { StateMeta } from '@/lib/fdic/types';

export function FDICFAQ({ stateMeta, bankCount, hqCount }: {
  stateMeta: StateMeta;
  bankCount: number;
  hqCount: number;
}) {
  const items = [
    {
      q: `How many FDIC-insured banks are in ${stateMeta.fullName}?`,
      a: `This directory lists ${bankCount} FDIC-insured institutions associated with ${stateMeta.fullName}, including ${hqCount} with headquarters in the state. Lists may include out-of-state banks that operate branches or serve customers in ${stateMeta.fullName}.`,
    },
    {
      q: 'What does FDIC insurance mean for depositors?',
      a: 'FDIC insurance protects eligible deposits up to $250,000 per depositor, per insured bank, for each ownership category. Coverage applies when an FDIC-insured institution fails.',
    },
    {
      q: 'How do I verify a bank on the official FDIC website?',
      a: 'Each listing includes an FDIC certificate number. Click the certificate link or visit banks.data.fdic.gov/bankfind-suite/bankfind and search by that number for official records.',
    },
    {
      q: 'Does LenderTrustHub accept paid bank placements?',
      a: 'No. This directory is free and transparent. Institutions are listed based on official FDIC data — not advertising fees or sponsorships.',
    },
    {
      q: `Can I find mortgage lenders in ${stateMeta.fullName} too?`,
      a: `Yes. After reviewing FDIC-insured banks, explore our verified mortgage lender directory and calculators for ${stateMeta.fullName} to compare lending options.`,
    },
  ];

  return (
    <section aria-labelledby="fdic-faq-heading" className="mt-12">
      <h2 id="fdic-faq-heading" className="mb-6 text-2xl font-bold text-[#0A2540]">
        Frequently Asked Questions
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <details
            key={item.q}
            className="group rounded-2xl border border-zinc-200 bg-white p-5 open:border-[#00A3A1]/30"
          >
            <summary className="cursor-pointer list-none font-semibold text-[#0A2540] marker:content-none [&::-webkit-details-marker]:hidden">
              {item.q}
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
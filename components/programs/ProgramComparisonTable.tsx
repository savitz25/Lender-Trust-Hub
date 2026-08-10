import Link from 'next/link';
import { getAllPrograms } from '@/lib/programs';

/** Plain-language comparison of major program themes — educational only. */
export function ProgramComparisonTable() {
  const programs = getAllPrograms().filter((p) => p.id !== 'down-payment-assistance');
  const dpa = getAllPrograms().find((p) => p.id === 'down-payment-assistance');

  return (
    <section aria-labelledby="program-compare-heading" className="mt-12">
      <h2 id="program-compare-heading" className="text-xl font-bold text-[#0A2540]">
        Side-by-side themes (plain language)
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-zinc-600">
        High-level research framing only. Exact terms depend on the product year, property, full
        file, and lender overlays—not this table.
      </p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-[40rem] w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <th scope="col" className="px-3 py-3 sm:px-4">
                Theme
              </th>
              {programs.map((p) => (
                <th key={p.id} scope="col" className="px-3 py-3 sm:px-4">
                  <Link
                    href={`/programs/${p.slug}`}
                    className="text-[#0A2540] hover:text-[#059669] hover:underline"
                  >
                    {p.shortName}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-zinc-700">
            <tr>
              <th scope="row" className="px-3 py-3 align-top font-medium text-zinc-800 sm:px-4">
                Down payment
              </th>
              {programs.map((p) => (
                <td key={p.id} className="px-3 py-3 align-top sm:px-4">
                  {p.comparisonRow.downPayment}
                </td>
              ))}
            </tr>
            <tr className="bg-zinc-50/50">
              <th scope="row" className="px-3 py-3 align-top font-medium text-zinc-800 sm:px-4">
                Mortgage insurance
              </th>
              {programs.map((p) => (
                <td key={p.id} className="px-3 py-3 align-top sm:px-4">
                  {p.comparisonRow.mortgageInsurance}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="px-3 py-3 align-top font-medium text-zinc-800 sm:px-4">
                Eligibility themes
              </th>
              {programs.map((p) => (
                <td key={p.id} className="px-3 py-3 align-top sm:px-4">
                  {p.comparisonRow.eligibilityTheme}
                </td>
              ))}
            </tr>
            <tr className="bg-zinc-50/50">
              <th scope="row" className="px-3 py-3 align-top font-medium text-zinc-800 sm:px-4">
                Common use cases
              </th>
              {programs.map((p) => (
                <td key={p.id} className="px-3 py-3 align-top sm:px-4">
                  {p.comparisonRow.commonUse}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {dpa ? (
        <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-4 text-sm text-zinc-700">
          <p className="font-semibold text-[#0A2540]">
            Down-payment assistance is a separate layer
          </p>
          <p className="mt-1">
            {dpa.comparisonRow.commonUse}. It usually stacks on a first mortgage (often FHA or
            conventional) and does not replace mortgage insurance on that first loan.{' '}
            <Link
              href="/programs/down-payment-assistance"
              className="font-medium text-[#059669] hover:underline"
            >
              Read the DPA overview
            </Link>
            .
          </p>
        </div>
      ) : null}
    </section>
  );
}

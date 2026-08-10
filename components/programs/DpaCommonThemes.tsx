/**
 * Shared educational DPA themes — national framing for the DPA page.
 * Complements state panels; not eligibility guidance.
 */
export function DpaCommonThemes() {
  return (
    <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-xl font-bold text-[#0A2540]">Common DPA themes (anywhere)</h2>
      <p className="mt-2 text-sm text-zinc-600">
        Patterns people research—not a promise that any given city or state offers them.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          {
            t: 'First-time buyer focus',
            d: 'Many programs prioritize first-time buyers or “first-time in several years.” Definitions differ.',
          },
          {
            t: 'Income & price limits',
            d: 'Area median income and purchase-price caps are common. Limits can vary by county.',
          },
          {
            t: 'Education requirements',
            d: 'Homebuyer education or HUD-approved counseling certificates are frequently required.',
          },
          {
            t: 'Layering with a first mortgage',
            d: 'Assistance usually sits on top of FHA or conventional (or another first loan)—not instead of underwriting.',
          },
          {
            t: 'Structure varies',
            d: 'Grants, forgivable seconds, deferred loans, and other designs each have different repayment rules.',
          },
          {
            t: 'Funding runs out',
            d: 'Allocations can pause mid-year. Always check whether a published program is currently funded.',
          },
        ].map((item) => (
          <li
            key={item.t}
            className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3 text-sm"
          >
            <p className="font-semibold text-[#0A2540]">{item.t}</p>
            <p className="mt-1 text-zinc-600">{item.d}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

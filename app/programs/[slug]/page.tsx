import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { getAllPrograms, getProgramBySlug } from '@/lib/programs';
import { PROGRAM_LOCATION_NOTES } from '@/lib/programs/location-notes';
import { ProgramDisclaimer } from '@/components/programs/ProgramDisclaimer';
import { ProgramLocationPanel } from '@/components/programs/ProgramLocationPanel';
import { DpaCommonThemes } from '@/components/programs/DpaCommonThemes';
import { JsonLd } from '@/components/directory/JsonLd';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllPrograms().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const program = getProgramBySlug(slug);
  if (!program) return { title: 'Program not found' };
  return {
    title: `${program.name} — Educational Overview | Lender Trust Hub`,
    description: program.tagline,
    alternates: { canonical: `https://www.lendertrusthub.com/programs/${program.slug}` },
  };
}

export default async function ProgramGuidePage({ params }: Props) {
  const { slug } = await params;
  const program = getProgramBySlug(slug);
  if (!program) notFound();

  const isDpa = program.id === 'down-payment-assistance';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: program.name,
    description: program.tagline,
    url: `https://www.lendertrusthub.com/programs/${program.slug}`,
  };

  return (
    <>
      <JsonLd data={schema} />
      <section className="border-b border-zinc-200 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
        <div className="container mx-auto max-w-3xl px-4 py-10 md:py-12">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-zinc-500">
            <ol className="flex flex-wrap items-center gap-1">
              <li>
                <Link href="/" className="hover:text-[#059669]">
                  Home
                </Link>
              </li>
              <ChevronRight className="h-4 w-4" aria-hidden />
              <li>
                <Link href="/programs" className="hover:text-[#059669]">
                  Programs
                </Link>
              </li>
              <ChevronRight className="h-4 w-4" aria-hidden />
              <li>
                <span className="text-[#0A2540]">{program.shortName}</span>
              </li>
            </ol>
          </nav>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Educational program overview · You decide
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#0A2540] md:text-4xl">
            {program.name}
          </h1>
          <p className="mt-3 text-lg text-zinc-600">{program.tagline}</p>
        </div>
      </section>

      <article className="container mx-auto max-w-3xl px-4 py-10">
        <ProgramDisclaimer className="mb-8" />

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[#0A2540]">What it is</h2>
          <p className="text-base leading-relaxed text-zinc-700">{program.summary}</p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-[#0A2540]">Who commonly researches it</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-700">{program.whoCommonlyFor}</p>
        </section>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Typical down-payment themes
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-zinc-700">
              {program.typicalDownPayment}
            </dd>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Mortgage insurance concepts
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-zinc-700">
              {program.mortgageInsuranceTheme}
            </dd>
          </div>
        </dl>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <section>
            <h2 className="text-lg font-bold text-emerald-900">Key advantages (research themes)</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
              {program.advantages.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-bold text-amber-950">Trade-offs &amp; caveats</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
              {program.tradeoffs.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-[#0A2540]">Eligibility themes (not a checklist)</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
            {program.eligibilityThemes.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-[#0A2540]">Commonly researched when…</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
            {program.commonlyUsedWhen.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-[#0A2540]">Comparison framing</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
            {program.comparisonBullets.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
            {program.notAGuarantee}
          </p>
          <p className="mt-3 text-sm">
            <Link href="/programs" className="font-medium text-[#059669] hover:underline">
              See all programs side by side
            </Link>
          </p>
        </section>

        {isDpa ? (
          <>
            <DpaCommonThemes />

            <section className="mt-10 space-y-6" aria-labelledby="dpa-location-heading">
              <div>
                <h2 id="dpa-location-heading" className="text-xl font-bold text-[#0A2540]">
                  State-aware guidance: where to research officially
                </h2>
                <p className="mt-2 text-sm text-zinc-600">
                  High-quality starting points for expanded markets (deeper FL/TX modules plus Tier 1
                  and Tier 2 states). Jump to a state, use the official portals listed, and treat
                  city/county programs as a separate research track. We do not inventory every local
                  DPA or decide eligibility.
                </p>
                <ul className="mt-3 flex flex-wrap gap-2 text-sm">
                  {PROGRAM_LOCATION_NOTES.map((n) => (
                    <li key={n.stateSlug}>
                      <a
                        href={`#${n.stateSlug}`}
                        className="inline-flex min-h-10 items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 font-semibold text-sky-950 hover:bg-sky-100"
                      >
                        {n.stateName}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              {PROGRAM_LOCATION_NOTES.map((n) => (
                <ProgramLocationPanel key={n.stateSlug} note={n} showFullDetail />
              ))}
              <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                <strong className="text-zinc-800">Intentionally deferred:</strong> a complete
                nationwide city/county DPA database, live open/closed funding status, eligibility
                determination, and application matching. A high-quality “where to research
                officially” layer for priority states is safer than fake completeness.
              </p>
            </section>
          </>
        ) : null}

        <section className="mt-8">
          <h2 className="text-xl font-bold text-[#0A2540]">Related research tools</h2>
          <ul className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {program.relatedToolHrefs.map((t) => (
              <li key={t.href}>
                <Link
                  href={t.href}
                  className="inline-flex min-h-11 items-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-[#0A2540] hover:border-emerald-400"
                >
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 border-t border-zinc-200 pt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500">Sources</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {program.sources.map((s) => (
              <li key={s.href}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-[#3B82F6] underline-offset-2 hover:underline"
                >
                  {s.label}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </section>

        <ProgramDisclaimer className="mt-10" />
      </article>
    </>
  );
}

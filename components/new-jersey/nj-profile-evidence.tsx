import Link from 'next/link';
import { attachNjProfileEvidence } from '@/lib/new-jersey-intelligence/profile-attachment';

export function NewJerseyProfileEvidence({
  nmlsInstitutionId,
  fdicCert,
}: {
  nmlsInstitutionId?: string | null;
  fdicCert?: string | null;
}) {
  const decision = attachNjProfileEvidence({
    nmlsInstitutionId,
    fdicCert,
    isIndividual: false,
  });
  if (decision.status === 'NONE' || decision.status === 'WITHHELD') return null;
  return (
    <section
      aria-labelledby="nj-evidence-heading"
      className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 sm:px-5">
        <h2 id="nj-evidence-heading" className="text-lg font-semibold text-[#0A2540] sm:text-xl">
          New Jersey regulatory evidence
        </h2>
      </div>
      <div className="space-y-2 px-4 py-4 text-sm leading-relaxed text-slate-700 sm:px-5">
        <p>
          Exact {decision.identifierType.replace(/_/g, ' ')} {decision.identifierValue} is present in the
          acquired NJDOBI enforcement identity ledger.
        </p>
        <p>
          Order-level documents stay on the state corpus. Unresolved names, review-required aliases, and
          individual-only actions are not copied onto this company profile.
        </p>
        <p>
          <Link href="/new-jersey" className="font-medium text-[#047857] underline underline-offset-2">
            Open New Jersey lending intelligence
          </Link>
        </p>
      </div>
    </section>
  );
}

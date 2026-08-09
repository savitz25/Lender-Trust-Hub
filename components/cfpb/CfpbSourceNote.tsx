import { CFPB_SOURCE_LABEL, CFPB_SOURCE_NOTE } from '@/lib/cfpb';

export function CfpbSourceNote({ dataAsOf }: { dataAsOf: string }) {
  const asOf = dataAsOf.slice(0, 10);
  return (
    <p className="text-xs leading-relaxed text-zinc-500">
      <span className="font-medium text-zinc-600">Data as of {asOf}.</span>{' '}
      {CFPB_SOURCE_NOTE}{' '}
      <a
        href="https://www.consumerfinance.gov/data-research/consumer-complaints/"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-[#3B82F6] hover:underline"
      >
        {CFPB_SOURCE_LABEL}
      </a>
      . We show the public record. You decide.
    </p>
  );
}

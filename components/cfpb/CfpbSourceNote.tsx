import { CFPB_SOURCE_LABEL, CFPB_SOURCE_NOTE } from '@/lib/cfpb';
import { PublicRecordTagline } from '@/components/research/public-record-tagline';

export function CfpbSourceNote({ dataAsOf }: { dataAsOf: string }) {
  const asOf = dataAsOf.slice(0, 10);
  return (
    <div className="space-y-1.5">
      <p className="text-xs leading-relaxed text-zinc-500">
        <span className="font-medium text-zinc-600">Data as of {asOf}.</span>{' '}
        {CFPB_SOURCE_NOTE}{' '}
        <a
          href="https://www.consumerfinance.gov/data-research/consumer-complaints/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#3B82F6] underline-offset-2 hover:underline"
        >
          {CFPB_SOURCE_LABEL}
        </a>
        .
      </p>
      <PublicRecordTagline />
    </div>
  );
}

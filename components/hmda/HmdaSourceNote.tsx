import { HMDA_SOURCE_LABEL, HMDA_SOURCE_NOTE } from '@/lib/hmda';
import { PublicRecordTagline } from '@/components/research/public-record-tagline';

export function HmdaSourceNote({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <p className="text-xs leading-relaxed text-zinc-500">
        <span className="font-medium text-zinc-600">Data as of {HMDA_SOURCE_LABEL}.</span>{' '}
        {HMDA_SOURCE_NOTE}{' '}
        <a
          href="https://ffiec.cfpb.gov/data-browser/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#3B82F6] underline-offset-2 hover:underline"
        >
          CFPB/FFIEC HMDA Data Browser
        </a>
        .
      </p>
      <PublicRecordTagline />
    </div>
  );
}


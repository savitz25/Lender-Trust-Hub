'use client';

import { useCallback, useState } from 'react';
import { Copy, Check, Printer, Mail } from 'lucide-react';
import { TrustMark } from '@/components/network/trust-mark';
import {
  LENDER_CALL_QUESTIONS,
  SOFT_NEXT_STEPS_FOOTER,
  SOFT_NEXT_STEPS_TITLE,
} from '@/lib/research/soft-next-steps';

export type BeforeYouReachOutProps = {
  summaryLines?: string[];
  mailtoSubject?: string;
  showPrint?: boolean;
  showCopy?: boolean;
  showMailto?: boolean;
  className?: string;
  questions?: readonly string[];
  title?: string;
};

function cn(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(' ');
}

export function BeforeYouReachOut({
  summaryLines = [],
  mailtoSubject = 'My Lender Trust Hub research notes',
  showPrint = true,
  showCopy = true,
  showMailto = true,
  className,
  questions = LENDER_CALL_QUESTIONS,
  title = SOFT_NEXT_STEPS_TITLE,
}: BeforeYouReachOutProps) {
  const [copied, setCopied] = useState(false);

  const buildPlainText = useCallback(() => {
    const parts: string[] = [title, ''];
    if (summaryLines.length) {
      parts.push('Profile summary:', ...summaryLines.map((l) => `• ${l}`), '');
    }
    parts.push('Questions to ask:', ...questions.map((q, i) => `${i + 1}. ${q}`), '');
    parts.push(SOFT_NEXT_STEPS_FOOTER);
    parts.push('Standard: https://www.asktrusthub.com/methodology');
    return parts.join('\n');
  }, [title, summaryLines, questions]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildPlainText());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const mailtoHref = `mailto:?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(buildPlainText())}`;

  return (
    <aside
      className={cn(
        'rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-5 sm:px-6 print:bg-white',
        className
      )}
      aria-labelledby="soft-next-steps-heading"
    >
      <h2
        id="soft-next-steps-heading"
        className="text-base font-semibold tracking-tight text-[#0A2540] sm:text-lg"
      >
        {title}
      </h2>
      <p className="mt-1.5 text-sm text-zinc-600">
        Questions to ask the lender — not guarantees. Re-check NMLS Consumer Access before you
        apply.
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-zinc-800">
        {questions.map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ol>
      <div className="mt-5 flex flex-wrap gap-2 print:hidden">
        {showCopy ? (
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-[#0A2540] hover:bg-zinc-50"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" aria-hidden />
            ) : (
              <Copy className="h-4 w-4" aria-hidden />
            )}
            {copied ? 'Copied' : 'Copy summary'}
          </button>
        ) : null}
        {showPrint ? (
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-[#0A2540] hover:bg-zinc-50"
          >
            <Printer className="h-4 w-4" aria-hidden />
            Print
          </button>
        ) : null}
        {showMailto ? (
          <a
            href={mailtoHref}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-[#0A2540] hover:bg-zinc-50"
          >
            <Mail className="h-4 w-4" aria-hidden />
            Email me this
          </a>
        ) : null}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-zinc-500">{SOFT_NEXT_STEPS_FOOTER}</p>
      <div className="mt-2">
        <TrustMark />
      </div>
    </aside>
  );
}

import {
  ASK_TRUST_HUB,
  LENDER_CONTACT_EMAIL,
  NETWORK_HUBS,
} from '@/lib/network/ask-trust-hub';
import { ASK_NETWORK_OWNERSHIP_SHORT } from '@/lib/network/standard-version';
import { TrustMark } from '@/components/network/trust-mark';

/**
 * Footer network seal — common ownership + separated research (not unaffiliated).
 */
export function AskNetworkSeal() {
  return (
    <div className="mx-auto max-w-3xl px-4 text-center text-zinc-400">
      <p className="text-sm font-semibold tracking-tight text-white">
        Part of the{' '}
        <a
          href={ASK_TRUST_HUB.url}
          className="underline underline-offset-2 hover:text-white/90"
          rel="noopener noreferrer"
        >
          Ask Trust Hub network
        </a>
      </p>
      <p className="mt-1.5 text-xs font-medium leading-relaxed text-zinc-600">
        {ASK_NETWORK_OWNERSHIP_SHORT}
      </p>
      <p className="mt-1 text-xs leading-relaxed">
        <a
          href={ASK_TRUST_HUB.promiseUrl}
          className="underline underline-offset-2 hover:text-zinc-600"
          rel="noopener noreferrer"
        >
          Independence policy
        </a>
        {' · '}
        <a
          href={ASK_TRUST_HUB.revenueUrl}
          className="underline underline-offset-2 hover:text-zinc-600"
          rel="noopener noreferrer"
        >
          How we make money
        </a>
        {' · '}
        <a href="/methodology" className="underline underline-offset-2 hover:text-zinc-600">
          Hub methodology
        </a>
      </p>
      <p className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <TrustMark className="border-white/25 bg-white/10 text-white/85 hover:border-white/40 hover:text-white" />
      </p>
      <p className="mt-2 text-xs">
        <a
          href={`mailto:${LENDER_CONTACT_EMAIL}`}
          className="underline underline-offset-2 hover:text-zinc-600"
        >
          {LENDER_CONTACT_EMAIL}
        </a>
      </p>
      <ul
        className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-zinc-500"
        aria-label="Ask Trust Hub network sites"
      >
        <li>
          <a
            href={ASK_TRUST_HUB.url}
            className="underline-offset-2 hover:underline hover:text-zinc-600"
            rel="noopener noreferrer"
          >
            Ask Trust Hub
          </a>
          <span className="ml-1 opacity-70">(parent)</span>
        </li>
        {NETWORK_HUBS.map((hub) => (
          <li key={hub.id} className="flex items-center gap-1">
            <span className="opacity-40" aria-hidden>
              ·
            </span>
            {hub.id === 'lender' ? (
              <span className="text-zinc-600">
                {hub.proseName}
                <span className="ml-1 opacity-70">(you are here)</span>
              </span>
            ) : (
              <a
                href={hub.url}
                className="underline-offset-2 hover:underline hover:text-zinc-600"
                rel="noopener noreferrer"
              >
                {hub.proseName}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

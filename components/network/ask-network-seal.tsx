import {
  ASK_TRUST_HUB,
  LENDER_CONTACT_EMAIL,
  NETWORK_HUBS,
} from '@/lib/network/ask-trust-hub';

/**
 * Footer network seal — Ask parent + hubs (you are here on Lender).
 */
export function AskNetworkSeal() {
  return (
    <div className="mx-auto max-w-3xl px-4 text-center text-zinc-400">
      <p className="text-sm font-semibold tracking-tight text-white">
        Part of the{' '}
        <a
          href={ASK_TRUST_HUB.promiseUrl}
          className="underline underline-offset-2 hover:text-white/90"
          rel="noopener noreferrer"
        >
          Ask Trust Hub network
        </a>
      </p>
      <p className="mt-1 text-xs leading-relaxed">
        Independently operated · No paid placements
        {' · '}
        <a
          href={ASK_TRUST_HUB.promiseUrl}
          className="underline underline-offset-2 hover:text-zinc-300"
          rel="noopener noreferrer"
        >
          Independence policy
        </a>
        {' · '}
        <a
          href={ASK_TRUST_HUB.revenueUrl}
          className="underline underline-offset-2 hover:text-zinc-300"
          rel="noopener noreferrer"
        >
          How we make money
        </a>
        {' · '}
        <a href="/methodology" className="underline underline-offset-2 hover:text-zinc-300">
          Methodology
        </a>
        {' · '}
        <a
          href={ASK_TRUST_HUB.methodologyUrl}
          className="underline underline-offset-2 hover:text-zinc-300"
          rel="noopener noreferrer"
        >
          Ask Standard
        </a>
      </p>
      <p className="mt-2 text-xs">
        <a
          href={`mailto:${LENDER_CONTACT_EMAIL}`}
          className="underline underline-offset-2 hover:text-zinc-300"
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
            className="underline-offset-2 hover:underline hover:text-zinc-300"
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
              <span className="text-zinc-300">
                {hub.proseName}
                <span className="ml-1 opacity-70">(you are here)</span>
              </span>
            ) : (
              <a
                href={hub.url}
                className="underline-offset-2 hover:underline hover:text-zinc-300"
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

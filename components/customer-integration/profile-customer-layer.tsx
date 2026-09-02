import type {
  PublicBusinessProfile,
  PublicBusinessReplies,
} from "@/lib/customer-integration/public";
import { safeBusinessWebsite } from "@/lib/customer-integration/security";
import Link from "next/link";
export function ProfileCustomerLayer({
  slug,
  enabled,
  profile,
  replies,
}: {
  slug: string;
  enabled: boolean;
  profile: PublicBusinessProfile | null;
  replies: PublicBusinessReplies | null;
}) {
  const businessWebsite = safeBusinessWebsite(profile?.fields.website);
  return (
    <div className="mt-6 space-y-4">
      {profile ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Managed profile
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[#0A2540]">
            Business-supplied information
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Control verified, not endorsement. Official lender evidence remains
            independently sourced.
          </p>
          {profile.fields.description ? (
            <p className="mt-4 whitespace-pre-wrap text-sm">
              {profile.fields.description}
            </p>
          ) : null}
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            {businessWebsite ? (
              <div>
                <dt className="text-zinc-500">Business website</dt>
                <dd>
                  <a
                    className="underline"
                    href={businessWebsite}
                    rel="nofollow noopener noreferrer"
                    target="_blank"
                  >
                    Visit website
                  </a>
                </dd>
              </div>
            ) : null}
            {profile.fields.public_phone ? (
              <div>
                <dt className="text-zinc-500">Business-supplied phone</dt>
                <dd>{profile.fields.public_phone}</dd>
              </div>
            ) : null}
            {profile.fields.public_email ? (
              <div>
                <dt className="text-zinc-500">Business-supplied email</dt>
                <dd>{profile.fields.public_email}</dd>
              </div>
            ) : null}
            {profile.fields.contact_context ? (
              <div>
                <dt className="text-zinc-500">Contact context</dt>
                <dd>{profile.fields.contact_context}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}
      {replies?.replies.length ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Provided by the business
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[#0A2540]">
            Response from the business
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            HMDA, NMLS, CFPB, and other official evidence above remains
            unchanged.
          </p>
          {replies.replies.map((r) => (
            <article className="mt-4 rounded-xl border p-4" key={r.id}>
              <p className="whitespace-pre-wrap text-sm">{r.body}</p>
            </article>
          ))}
        </section>
      ) : null}
      <aside className="rounded-2xl border border-zinc-200 bg-white p-5">
        <p className="font-semibold text-[#0A2540]">
          {profile ? "Managed by the business" : "Is this your institution?"}
        </p>
        {enabled ? (
          <a
            className="mt-3 inline-flex min-h-11 items-center rounded-xl border border-[#059669] px-4 text-sm font-semibold text-[#0A2540]"
            href={
              profile
                ? "https://www.asktrusthub.com/manage"
                : `/api/claim/handoff/${encodeURIComponent(slug)}`
            }
          >
            {profile ? "Manage on AskTrustHub" : "Claim this profile"}
          </a>
        ) : null}
        <p className="mt-2 text-sm text-zinc-600">
          {enabled
            ? "Manage business-supplied information through AskTrustHub."
            : "Profile management is not currently available. Continue researching this institution or search by institution NMLS."}
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link className="underline" href="/lender">
            Find an institution
          </Link>
          <a className="underline" href="https://www.asktrusthub.com/contact">
            Contact support
          </a>
        </div>
      </aside>
    </div>
  );
}

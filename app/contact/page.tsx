import type { Metadata } from 'next';
import { Mail } from 'lucide-react';
import { LENDER_BRAND, LENDER_INDEPENDENCE_LINE, LENDER_RADIUS, LENDER_SHADOW } from '@/lib/design/lender-design-system';
import { SITE_URL } from '@/lib/directory/categories';
import { LENDER_CONTACT_EMAIL } from '@/lib/network/ask-trust-hub';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contact Lender Trust Hub for listing corrections, data inquiries, partnerships, or press requests.',
  alternates: { canonical: `${SITE_URL}/contact` },
};

const CONTACT_EMAIL = LENDER_CONTACT_EMAIL;

export default function ContactPage() {
  return (
    <div className="lth-section-pad max-w-3xl">
      <h1
        className="text-3xl font-bold tracking-tight md:text-4xl"
        style={{ color: LENDER_BRAND.ink }}
      >
        Contact Lender Trust Hub
      </h1>
      <p className="mt-3 leading-relaxed" style={{ color: LENDER_BRAND.ink }}>
        Questions about NMLS verification, lender listings, or directory data? Reach out — we
        respond within 2–3 business days.
      </p>

      <div
        className="mt-10 border bg-white p-6"
        style={{
          borderColor: LENDER_BRAND.border,
          borderRadius: LENDER_RADIUS.cardLg,
          boxShadow: LENDER_SHADOW.card,
        }}
      >
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 h-5 w-5" style={{ color: LENDER_BRAND.teal }} aria-hidden />
          <div>
            <p className="text-sm font-semibold" style={{ color: LENDER_BRAND.navy }}>
              Email
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-1 inline-block font-medium hover:underline"
              style={{ color: LENDER_BRAND.teal }}
            >
              {CONTACT_EMAIL}
            </a>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: LENDER_BRAND.ink }}>
              {LENDER_INDEPENDENCE_LINE} We do not originate loans or sell leads.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

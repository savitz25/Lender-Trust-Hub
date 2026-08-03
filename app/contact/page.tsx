import type { Metadata } from 'next';
import { Mail } from 'lucide-react';
import { SITE_URL } from '@/lib/directory/categories';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contact Lender Trust Hub for listing corrections, data inquiries, partnerships, or press requests.',
  alternates: { canonical: `${SITE_URL}/contact` },
};

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || 'hello@lendertrusthub.com';

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 md:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-[#0A2540] md:text-4xl">
        Contact Lender Trust Hub
      </h1>
      <p className="mt-3 text-zinc-600 leading-relaxed">
        Questions about NMLS verification, lender listings, or directory data? Reach out — we
        respond within 2–3 business days.
      </p>

      <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 h-5 w-5 text-[#3B82F6]" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-[#0A2540]">Email</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-1 inline-block text-[#3B82F6] hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            <p className="mt-3 text-sm text-zinc-500">
              Lender Trust Hub is an independent research directory — not a lender or broker. We
              do not originate loans or sell leads.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

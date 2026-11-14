import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/directory/categories';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Privacy policy for Lender Trust Hub — how we collect, use, and protect your information.',
  alternates: { canonical: `${SITE_URL}/privacy` },
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 md:py-14 prose prose-zinc">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-zinc-500">Effective date: June 1, 2026</p>
      <p>
        Lender Trust Hub (&quot;we&quot;, &quot;us&quot;) operates{' '}
        <a href={SITE_URL}>www.lendertrusthub.com</a>. This policy describes how we handle
        information when you use our directory, calculators, and resources.
      </p>
      <h2>Information we collect</h2>
      <ul>
        <li>Usage data (pages viewed, device type) via analytics tools when configured</li>
        <li>Optional contact details you submit by email</li>
        <li>Technical logs needed to operate and secure the site</li>
      </ul>
      <h2>How we use information</h2>
      <ul>
        <li>To operate and improve the directory and calculators</li>
        <li>To respond to inquiries you send us</li>
        <li>To monitor abuse and protect the service</li>
      </ul>
      <h2>What we do not do</h2>
      <ul>
        <li>We do not sell personal information</li>
        <li>We do not accept paid placements that change rankings</li>
        <li>We are not a lender or mortgage broker</li>
      </ul>
      <h2>Analytics and cookies</h2>
      <p>
        We use PostHog for product analytics when a project key is present. Events can include
        pages viewed, clicks on links, buttons, and forms, device and browser info, and an
        anonymous id stored in local storage and a cookie. Email addresses, search text, sign-in
        fields, and sensitive URL parameters are removed before an event is sent. The event asks
        PostHog not to add a location from the network address. PostHog can still receive that
        address with the request, and whether it is stored is a PostHog project setting that this
        site does not change. This site does not set how long events are kept. Retention follows
        the PostHog project settings. Do Not Track, Global Privacy Control, or blocking cookies
        turns analytics off in this browser. A cookie banner is not shown.
      </p>
      <h2>Contact</h2>
      <p>
        Privacy questions: <a href="/contact">Contact us</a>.
      </p>
    </div>
  );
}

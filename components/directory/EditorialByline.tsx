import Link from 'next/link';

/**
 * E-E-A-T signal — editorial attribution on educational/insights content.
 * Place below section headings on state pages and hub educational blocks.
 */
export function EditorialByline({
  reviewedDate = '2026-06-26',
  topic,
}: {
  reviewedDate?: string;
  topic?: string;
}) {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
      <span>
        Reviewed by{' '}
        <Link href="/about" className="font-medium text-[#00A3A1] hover:underline">
          LenderTrustHub Editorial Team
        </Link>
      </span>
      <span aria-hidden="true">·</span>
      <time dateTime={reviewedDate}>Last updated {reviewedDate}</time>
      {topic && (
        <>
          <span aria-hidden="true">·</span>
          <span>{topic}</span>
        </>
      )}
    </p>
  );
}
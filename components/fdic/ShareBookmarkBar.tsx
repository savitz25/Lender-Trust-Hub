'use client';

import { useEffect, useState } from 'react';
import { Share2, Bookmark, BookmarkCheck, Link2, Check } from 'lucide-react';

const BOOKMARK_KEY = 'lth-fdic-bookmarks';

export function ShareBookmarkBar({
  title,
  url,
  stateName,
}: {
  title: string;
  url: string;
  stateName: string;
}) {
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
    try {
      const saved = JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '[]') as string[];
      setBookmarked(saved.includes(url));
    } catch {
      /* storage unavailable */
    }
  }, [url]);

  function toggleBookmark() {
    try {
      const saved = JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '[]') as string[];
      const next = bookmarked ? saved.filter((u) => u !== url) : [...saved, url];
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
      setBookmarked(!bookmarked);
    } catch {
      /* storage unavailable */
    }
  }

  async function shareList() {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Verified FDIC-insured banks in ${stateName} — free directory, no paid placements.`,
          url,
        });
      } catch {
        /* user cancelled */
      }
      return;
    }
    await copyLink();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={shareList}
        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-[#0A2540] transition hover:border-[#00A3A1]"
      >
        <Share2 className="h-4 w-4 text-[#00A3A1]" aria-hidden="true" />
        Share This List
      </button>
      <button
        type="button"
        onClick={toggleBookmark}
        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-[#0A2540] transition hover:border-[#00A3A1]"
        aria-pressed={bookmarked}
      >
        {bookmarked ? (
          <BookmarkCheck className="h-4 w-4 text-[#00A3A1]" aria-hidden="true" />
        ) : (
          <Bookmark className="h-4 w-4 text-[#00A3A1]" aria-hidden="true" />
        )}
        {bookmarked ? 'Saved' : 'Bookmark'}
      </button>
      {!canShare && (
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-[#0A2540] transition hover:border-[#00A3A1]"
        >
          {copied ? (
            <Check className="h-4 w-4 text-[#00A3A1]" aria-hidden="true" />
          ) : (
            <Link2 className="h-4 w-4 text-[#00A3A1]" aria-hidden="true" />
          )}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      )}
    </div>
  );
}
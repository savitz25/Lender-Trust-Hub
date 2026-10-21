/**
 * A lender star or numeric rating is displayable only when both the score and
 * the review count are real positive numbers. Catalog rows use 0 as a
 * placeholder after unsourced seed ratings are stripped. Null, missing, and
 * zero must not render as ★ 0.0.
 */
export function hasDisplayableLenderRating(
  rating: number | null | undefined,
  reviewCount: number | null | undefined,
): boolean {
  return (
    typeof rating === 'number' &&
    Number.isFinite(rating) &&
    rating > 0 &&
    typeof reviewCount === 'number' &&
    Number.isFinite(reviewCount) &&
    reviewCount > 0
  );
}

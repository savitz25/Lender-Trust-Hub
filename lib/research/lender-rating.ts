/**
 * Numeric screen only. Finite numbers above zero are not a third-party source
 * and are not a publishable-rating gate. Do not use this helper to render a
 * star, rating number, or review count.
 *
 * Catalog rows use 0 after unsourced seed ratings are stripped. Null, missing,
 * zero, negative, and non-finite values are not displayable numbers.
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

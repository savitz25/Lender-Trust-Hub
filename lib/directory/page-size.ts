/**
 * Lender directory progressive load size.
 * Grid: 10 rows × 3 columns on desktop (md+).
 * Change this constant to adjust “Show the next N lenders” batch size.
 */
export const LENDER_DIRECTORY_PAGE_SIZE = 30;

/**
 * Cap for “Show all remaining” in a single step (safety for huge catalogs).
 * Progressive “next N” loads always use LENDER_DIRECTORY_PAGE_SIZE.
 */
export const LENDER_DIRECTORY_MAX_REVEAL = 5000;

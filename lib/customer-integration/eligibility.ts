import {
  getIndexingRow,
  type PublicationManifestRow,
} from "@/lib/national-profile/publication";
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export type LenderClaimProfile = {
  id: string;
  slug: string;
  nmls: string;
  displayName: string;
  homeState: string | null;
};
export function lenderClaimProfileFromRow(
  row:
    | Pick<
        PublicationManifestRow,
        | "institution_id"
        | "stable_key"
        | "slug"
        | "publication_status"
        | "display_name"
        | "hq_state"
      >
    | undefined,
): LenderClaimProfile | null {
  if (
    !row ||
    row.publication_status !== "PUBLICATION_ELIGIBLE" ||
    !UUID.test(row.institution_id)
  )
    return null;
  const m = row.stable_key.match(/^nmls-inst:(\d+)$/);
  if (!m || !m[1] || !row.slug.trim()) return null;
  return {
    id: row.institution_id,
    slug: row.slug,
    nmls: m[1],
    displayName: row.display_name,
    homeState: row.hq_state,
  };
}
export function lenderClaimProfile(slug: string) {
  return lenderClaimProfileFromRow(getIndexingRow(slug));
}
export function claimCtaEnabledFor(
  id: string,
  env: Record<string, string | undefined> = process.env,
) {
  if ((env.ATH_HANDOFF_SECRET || "").length < 32) return false;
  const mode = (env.ATH_CLAIM_CTA_MODE || "off").toLowerCase();
  if (mode === "all") return true;
  if (mode !== "canary") return false;
  return new Set(
    (env.ATH_CLAIM_CANARY_PROFILE_IDS || "")
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean),
  ).has(id.toLowerCase());
}

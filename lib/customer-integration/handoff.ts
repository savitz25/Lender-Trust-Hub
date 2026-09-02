import { createHmac, randomBytes } from "node:crypto";
export const HANDOFF_TTL_SECONDS = 15 * 60;
export type LenderHandoffPayload = {
  v: 2;
  aud: "asktrusthub";
  hub_id: "lender";
  native_profile_id: string;
  slug: string;
  external_key: string;
  source_system: "nmls";
  home_state: string | null;
  identifier_namespace: "NMLS";
  entity_class: "institution";
  display_name: string;
  iat: number;
  exp: number;
  nonce: string;
};
export function mintLenderHandoff(
  secret: string,
  p: {
    id: string;
    slug: string;
    nmls: string;
    displayName: string;
    homeState: string | null;
  },
  o: { now?: Date; nonce?: string } = {},
) {
  if (secret.length < 32) throw new Error("ATH_HANDOFF_SECRET is unavailable");
  const iat = Math.floor((o.now ?? new Date()).getTime() / 1000),
    payload: LenderHandoffPayload = {
      v: 2,
      aud: "asktrusthub",
      hub_id: "lender",
      native_profile_id: p.id,
      slug: p.slug,
      external_key: p.nmls,
      source_system: "nmls",
      home_state: p.homeState,
      identifier_namespace: "NMLS",
      entity_class: "institution",
      display_name: p.displayName,
      iat,
      exp: iat + HANDOFF_TTL_SECONDS,
      nonce: o.nonce ?? randomBytes(24).toString("base64url"),
    };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url"),
    sig = createHmac("sha256", secret).update(body).digest("base64url");
  return { token: `${body}.${sig}`, payload };
}

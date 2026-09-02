import {
  claimCtaEnabledFor,
  lenderClaimProfile,
} from "@/lib/customer-integration/eligibility";
import { mintLenderHandoff } from "@/lib/customer-integration/handoff";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const { profileId } = await params;
  try {
    const profile = lenderClaimProfile(decodeURIComponent(profileId));
    if (!profile || !claimCtaEnabledFor(profile.id))
      return Response.json(
        {
          error: "Profile management is unavailable.",
          nextActions: [
            "View the parent lender institution",
            "Search institution NMLS",
            "Contact AskTrustHub support",
          ],
        },
        { status: 404, headers: HEADERS },
      );
    const { token } = mintLenderHandoff(
      process.env.ATH_HANDOFF_SECRET || "",
      profile,
    );
    const target = new URL("https://www.asktrusthub.com/claim/continue");
    target.searchParams.set("handoff", token);
    return Response.redirect(target, 302);
  } catch {
    return Response.json(
      {
        error: "Profile management is temporarily unavailable.",
        nextActions: [
          "Try again later",
          "Research the lender institution",
          "Contact AskTrustHub support",
        ],
      },
      { status: 503, headers: HEADERS },
    );
  }
}

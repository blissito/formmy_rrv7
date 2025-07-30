import { findReferralByCode } from "~/models/referral.server";
import type { Route } from "./+types/ref.$code";
import { redirect } from "react-router";
import { getSession, commitSession } from "~/sessions";

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { code } = params;

  // Find the referral code in the database
  const referral = await findReferralByCode(code || "");

  if (!referral) {
    // If referral code doesn't exist, redirect to home with an error message
    return redirect("/?error=invalid_referral");
  }

  // Get the current session
  const session = await getSession(request.headers.get("Cookie"));

  // Store the referral code in the session
  session.set("referralCode", code);

  // Redirect to the signup page with the referral code in the URL
  return redirect("/signup", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
};

// This is a resource route, so we don't need a default export
// But we'll add one to prevent TypeScript errors
export default function ReferralRoute() {
  return null;
}

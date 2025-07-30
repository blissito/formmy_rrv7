import { redirect } from "react-router";
import { redirectToGoogle } from "~/lib/google.server";
import { destroySession, getSession } from "~/sessions";
import type { Route } from "./+types/api.login";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url);
  const refCode = url.searchParams.get('ref');
  
  // Redirigir a Google con el código de referido en el state
  return redirectToGoogle<typeof redirect>(
    redirect, 
    url.host, 
    refCode ? `ref_${refCode}` : undefined
  );
};

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "google-login") {
    const url = new URL(request.url);
    return redirectToGoogle<typeof redirect>(redirect, url.host);
  }

  if (intent === "logout") {
    const session = await getSession(request.headers.get("Cookie"));
    throw redirect("/", {
      headers: {
        "Set-Cookie": await destroySession(session),
      },
    });
  }
  return null;
};

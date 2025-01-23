import { redirect } from "react-router";
import { redirectToGoogle } from "~/lib/google.server";
import { destroySession, getSession } from "~/sessions";

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "google-login") {
    return redirectToGoogle<typeof redirect>(redirect);
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

import type { Route } from "./+types/_index";
import getBasicMetaTags from "~/utils/getBasicMetaTags";
import { createSession } from "~/lib/google.server";
import { Home } from "./home/home";
import { redirectIfUser } from "server/getUserUtils.server";

export const meta = () =>
  getBasicMetaTags({
    title: "Chatbots IA y formularios de contacto para tu sitio web",
    description:
      "Agrega chatbots IA a tu sitio web fácilmente ",
  });

export const loader = async ({ request }: Route.LoaderArgs) => {
  await redirectIfUser(request);
  const url = new URL(request.url);
  // This needs to be here to catch google login
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // For referral codes
  if (code) {
    await createSession(code, request, state || undefined);
  }
  const success = url.searchParams.get("success") === "1";
  return { success };
};

export default function Index() {
  return (
    <article id="theme-trick" className=" ">
      <div
        className="bg-[#ffffff] relative size-full"
        data-name="Landingpage"
        id="node-1488_1172"
      >
        <Home />
      </div>
    </article>
  );
}

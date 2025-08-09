import type { Route } from "./+types/_index";
import getBasicMetaTags from "~/utils/getBasicMetaTags";
import { createSession } from "~/lib/google.server";
import { Home } from "./home/home";
import { redirectIfUser } from "server/getUserUtils.server";

export const meta = () =>
  getBasicMetaTags({
    title: "Formularios de contacto para tu sitio web",
    description:
      "Formularios en tu sitio web fácilmente y sin necesidad de un backend ",
  });

export const loader = async ({ request }: Route.LoaderArgs) => {
  await redirectIfUser(request);
  const url = new URL(request.url);
  // This needs to be here to catch google login
  const code = url.searchParams.get("code");
  if (code) {
    await createSession(code, request);
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

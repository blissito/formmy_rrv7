import type { Route } from "../+types/api.utils";

export const action = ({ request }: Route.ActionArgs) => {
  const formData = request.formData();
  const intent = formData.get("intent");

  if (intent === "web_fetch") {
  }

  return null;
};

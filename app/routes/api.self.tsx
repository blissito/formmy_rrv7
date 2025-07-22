import { getUserOrNull } from "server/getUserUtils.server";

export const loader = async ({ request }: LoaderArgs) => {
  const user = await getUserOrNull(request);
  return user;
};

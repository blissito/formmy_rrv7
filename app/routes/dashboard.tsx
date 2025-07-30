import { Outlet, useLoaderData } from "react-router";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { DashboardLayout } from "~/components/dashboard/DashboardLayout";
import type { Route } from "./+types/dashboard";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request);
  return { user };
};

export default function Dashboard() {
  const { user } = useLoaderData<typeof loader>();
  
  return (
    <div>
      <DashboardLayout title="Dashboard" user={user}>
        <Outlet />
      </DashboardLayout>
    </div>
  );
}
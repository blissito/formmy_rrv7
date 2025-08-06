import { Outlet, redirect, useLoaderData } from "react-router";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { DashboardLayout } from "~/components/dashboard/DashboardLayout";
import type { Route } from "./+types/dashboard";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request);
  const url = new URL(request.url);
  
  // Redirigir solo si estamos en la raíz de dashboard
  if (url.pathname === '/dashboard') {
    return redirect('/dashboard/ghosty');
  }
  
  return { user };
};

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <DashboardLayout title="Dashboard" user={loaderData.user}>
        <Outlet />
      </DashboardLayout>
    </div>
  );
}

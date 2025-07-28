import { Outlet } from "react-router";
import { DashboardLayout } from "~/components/dashboard/DashboardLayout";

export default function Dashboard() {
  return <div>
    <DashboardLayout title="Dashboard">
        <Outlet />
    </DashboardLayout>
  </div>;
}
import { useRouteLoaderData } from "react-router";
import { GhostyContainer } from "~/components/ghosty/GhostyContainer";
import type { User } from "@prisma/client";

interface LoaderData {
  user: User;
}

export default function DashboardGhosty() {
  const data = useRouteLoaderData('routes/dashboard');
  const user = (data as LoaderData)?.user;

  // Si no hay usuario, no mostramos nada
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <GhostyContainer userImage={user.picture || undefined} />
    </div>
  );
}


export const meta = () => [
  { title: "Ghosty" },
  { name: "description", content: "Tu asistente IA" },
];

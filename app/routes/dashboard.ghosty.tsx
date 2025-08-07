import { useRouteLoaderData } from "react-router";
import { GhostyContainer } from "~/components/ghosty/GhostyContainer";
import type { User } from "@prisma/client";

interface LoaderData {
  user: User;
}

export default function DashboardGhosty() {
  const data = useRouteLoaderData('routes/dashboard');
  const user = (data as LoaderData)?.user;
  
  // Si no hay usuario, no mostramos nada (o podrías mostrar un mensaje de carga)
  if (!user) {
    return null;
  }
  
  return <GhostyContainer userImage={user.picture || undefined} />;
}


export const meta = () => [
  { title: "Ghosty" },
  { name: "description", content: "Tu asistente IA" },
];

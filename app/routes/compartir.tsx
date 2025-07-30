import { Outlet, useLoaderData } from "react-router";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { DashboardLayout } from "~/components/dashboard/DashboardLayout";
import type { Route } from "./+types/dashboard";
import { Button } from "~/components/Button";
import { LuCopy } from "react-icons/lu";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request);
  return { user };
};

export default function Compartir() {
  const { user } = useLoaderData<typeof loader>();
  
  return (
    <div>
      <DashboardLayout title="Compartir" user={user}>
       <section className="py-8 max-w-7xl mx-auto overflow-y-scroll noscroll grid place-content-center h-full ">
         <div className="flex flex-col items-center justify-center h-full max-w-[560px] mx-auto">
            <div className="flex gap-8 items-center">
            <img src="/dash/share.svg" alt="compartir" className="mx-auto mb-8" />
            <CreditsBox/>
            </div>
            <h2 className="text-3xl text-dark heading text-center mb-2">Comparte con tus amigos y <span className="text-brand-500">gana meses de suscripción PRO gratis!</span></h2>
         <p className="paragraph text-metal text-center">Por cada amigo que se suscriba al plan PRO, obtén 50 créditos que puedes canjear por meses de suscripción PRO gratis o más mensajes para tu Chat IA.</p>
         <Button  className='h-10 flex gap-1 items-center w-[210px] mt-10'>Invitar por Whats App</Button>
         <Button variant="secondary" className='h-10 flex gap-2 items-center w-[210px] mt-4'><LuCopy />
         Copiar link</Button>
         </div>
       </section>
      </DashboardLayout>
    </div>
  );
}

const CreditsBox=()=>{
    return(
        <div className="rounded-2xl border border-outlines p-4 flex items-center gap-3">
            <img src="/dash/coins.svg" alt="coins"/>
            <div className="flex flex-col items-start justify-center gap-1">
            <h3 className="semibold text-lg">Créditos acumulados</h3>
            <p className="heading text-dark text-4xl">100 <span className="paragraph text-lightgray text-lg">| 2 amigos</span></p>
            </div>
        </div>
    )
}
import Nav from "~/components/NavBar";
import { useLoaderData } from "react-router";
import { getUserOrNull } from "server/getUserUtils.server";
import { DashboardLayout } from "~/components/dashboard/DashboardLayout";
import { LuCopy } from "react-icons/lu";
import { Button } from "~/components/Button";

export const loader = async ({ request }: LoaderArgs) => {
  const user = await getUserOrNull(request);
  return {
    user,
    NODE_ENV: process.env.NODE_ENV,
  };
};

export default function Academy() {
  const { user, NODE_ENV } = useLoaderData<typeof loader>();

  // @TODO: Add dark Formmy
  const lightFormmy =
    NODE_ENV === "development"
      ? "http://localhost:3000/embed/6522f8237031b1e66b7dc117"
      : "https://formmy.app/embed/6522f8237031b1e66b7dc117";

  const darkFormmy =
    NODE_ENV === "development"
      ? "http://localhost:3000/embed/65230f96c040cf4c55a90b00"
      : "https://formmy.app/embed/65230f96c040cf4c55a90b00";

  return (
    <div>
      <DashboardLayout title="Compartir" user={user}>
       <section className="py-8 max-w-7xl mx-auto overflow-y-scroll noscroll grid place-content-center h-full ">
         <div className="flex flex-col items-center justify-center h-full max-w-[560px] mx-auto">
            <img src="/dash/share.svg" alt="compartir" className="mx-auto mb-8" />
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
   {/* <Nav user={user} />
      <section className="dark:bg-space-900 min-h-screen ">
        <Nav user={user} />
        <section className="pt-32 md:pt-40 pb-20 px-4 md:px-0 lg:max-w-6xl max-w-3xl mx-auto text-space-500 dark:text-space-300 ">
          <h2 className="text-3xl md:text-5xl text-space-800 dark:text-white font-semibold">
            Danos tu opinión
          </h2>
          <p className="text-lg md:text-2xl text-gray-600 dark:text-space-400 font-light w-full md:w-[700px] mt-4 mb-4 md:mb-10">
            Cuéntanos ¿cómo te va usando Formmy? ¿Alguna duda con la
            configuración? ¿Hay algún feature que te gustaría ver?
          </p>
          <div className=" block dark:hidden">
            <iframe
              id="formmy-iframe"
              title="formmy"
              width="100%"
              height="560"
              src={lightFormmy}
              style={{ margin: "0 auto", display: "block" }}
            ></iframe>
          </div>
          <div className="hidden dark:block">
            <iframe
              id="formmy-iframe"
              title="formmy"
              width="100%"
              height="560"
              src={darkFormmy}
              style={{
                margin: "0 auto",
                display: "block",
              }}
            ></iframe>
          </div>
        </section>
      </section> */}
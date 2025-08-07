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
      ? "https://formmy.app/embed/6522f8237031b1e66b7dc117"
      : "https://formmy.app/embed/6522f8237031b1e66b7dc117";

  const darkFormmy =
    NODE_ENV === "development"
      ? "http://localhost:3000/embed/65230f96c040cf4c55a90b00"
      : "https://formmy.app/embed/65230f96c040cf4c55a90b00";

  return (
    <div className="relative">
      <DashboardLayout title="Compartir" user={user}>
      <img src="/assets/ghost-support.png" alt="support" className="fixed bottom-24 right-10 w-10 md:w-20 z-10" />
       <section className="py-12 px-2 md:px-0 max-w-7xl mx-auto overflow-y-scroll noscroll grid place-content-center h-full relative">
         <div className="flex flex-col items-center justify-center h-full max-w-[560px] mx-auto">
            <h2 className="text-2xl md:text-3xl text-dark heading text-center mb-2">Danos tu opinión</h2>
         <p className="paragraph text-metal text-center">Cuéntanos ¿cómo te va usando Formmy? ¿Alguna duda con la configuración? ¿Hay algún feature que te gustaría ver?</p>
         <div className="w-full">
            <iframe
              id="formmy-iframe"
              title="formmy"
              width="100%"
              height="540"
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
          </div>
       </section>
      </DashboardLayout>
    </div>
  );
}

export const meta = () => [
  { title: "Feedback" },
  { name: "description", content: "Danos tu opinión sobre Formmy" },
];

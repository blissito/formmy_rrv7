import { useState } from "react";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { DashboardLayout } from "~/components/dashboard/DashboardLayout";
import type { Route } from "./+types/dashboard";
import { Button } from "~/components/Button";
import { LuCopy, LuCheck } from "react-icons/lu";
import {
  createReferralCode,
  findReferralByUserId,
} from "~/models/referral.server";

const LOCATION =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://formmy-v2.fly.dev";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request);

  // Obtener el código de referido del usuario
  let referral = await findReferralByUserId(user.id);

  // Si el usuario no tiene un código de referido, crear uno
  if (!referral) {
    referral = await createReferralCode(user.id);
  }

  return {
    user,
    referralLink: `${LOCATION}/api/login?ref=${referral.referralCode}`,
  };
};

export default function Compartir({ loaderData }: Route.ComponentProps) {
  const { user, referralLink } = loaderData;
  const [copied, setCopied] = useState(false);
  const shareText = `¡Únete a FormMy y obtén descuento usando mi enlace de referido! ${referralLink}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const emailUrl = `mailto:?subject=Únete a FormMy&body=${encodeURIComponent(
    shareText
  )}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Error al copiar: ", err);
    }
  };
  return (
    <div>
      <DashboardLayout title="Compartir" user={user}>
        <section className="py-8 max-w-7xl mx-auto overflow-y-scroll noscroll grid place-content-center h-full ">
          <div className="flex flex-col items-center justify-center h-full max-w-[560px] mx-auto">
            <div className="flex gap-8 items-center">
              <img
                src="/dash/share.svg"
                alt="compartir"
                className="mx-auto mb-8"
              />
              {/* <CreditsBox /> */}
            </div>
            <h2 className="text-3xl text-dark heading text-center mb-2">
              Comparte con tus amigos y{" "}
              <span className="text-brand-500">
                gana meses de suscripción PRO gratis!
              </span>
            </h2>
            <p className="paragraph text-metal text-center">
              Por cada amigo que se suscriba al plan PRO, obtén 50 créditos que
              puedes canjear por meses de suscripción PRO gratis o más mensajes
              para tu Chat IA.
            </p>
            <Button
              onClick={() => window.open(whatsappUrl, "_blank")}
              className="h-10 flex gap-1 items-center w-max mt-10"
            >
              Invitar por Whats App
            </Button>
            <Button
              onClick={handleCopy}
              variant="secondary"
              className="h-10 flex gap-2 items-center w-[210px] mt-4"
            >
              {copied ? (
                <>
                  <LuCheck className="text-green-500" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <LuCopy />
                  Copiar link
                </>
              )}
            </Button>
          </div>
        </section>
      </DashboardLayout>
    </div>
  );
}

const CreditsBox = () => {
  return (
    <div className="rounded-2xl border border-outlines p-4 flex items-center gap-3">
      <img src="/dash/coins.svg" alt="coins" />
      <div className="flex flex-col items-start justify-center gap-1">
        <h3 className="semibold text-lg">Créditos acumulados</h3>
        <p className="heading text-dark text-4xl">
          100{" "}
          <span className="paragraph text-lightgray text-lg">| 2 amigos</span>
        </p>
      </div>
    </div>
  );
};



export const meta = () => [
  { title: "Comparte con tus amigos" },
  { name: "description", content: "Comparte con tus amigos y gana créditos para tus chatbots" },
];

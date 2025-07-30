import { CopyButton } from "~/components/CopyButton";
import { ReferralStats } from "~/components/ReferralStats";
import {
  createReferralCode,
  findReferralByUserId,
} from "~/models/referral.server";
import { GiftIcon, ShareIcon } from "@heroicons/react/24/outline";
import type { Route } from "./+types/dashboard_.referrals";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { Link } from "react-router";

const LOCATION =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://formmy-v2.fly.dev";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request);

  // Obtener el código de referido del usuario
  const referral = await findReferralByUserId(user.id);

  // Si el usuario no tiene un código de referido, crear uno
  if (!referral) {
    const newReferral = await createReferralCode(user.id);

    return {
      referralCode: `${LOCATION}/ref/${newReferral.referralCode}`,
      stats: {
        totalReferrals: newReferral.referredCount,
        completedReferrals: newReferral.successfulConversions,
        pendingCredits: 0, // No hay créditos pendientes para nuevos códigos
      },
    };
  }

  return {
    referralCode: `${LOCATION}/ref/${referral.referralCode}`,
    stats: {
      totalReferrals: referral.referredCount,
      completedReferrals: referral.successfulConversions,
      pendingCredits: 0, // Este valor podría calcularse según la lógica de negocio
    },
  };
};

export default function ReferralsDashboard({
  loaderData,
}: Route.ComponentProps) {
  const { referralCode, stats } = loaderData;
  const shareText = `¡Únete a FormMy y obtén descuento usando mi enlace de referido! ${referralCode}`;
  const whatsappUrl = `${LOCATION}/ref/${encodeURIComponent(shareText)}`;
  const emailUrl = `mailto:?subject=Únete a FormMy&body=${encodeURIComponent(
    shareText
  )}`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Programa de Referidos
        </h1>
        <p className="mt-3 text-xl text-gray-500">
          Invita a tus amigos y gana créditos cuando se conviertan en usuarios
          Pro
        </p>
      </div>

      {/* Stats Section */}
      <ReferralStats
        totalReferrals={stats.totalReferrals}
        completedReferrals={stats.completedReferrals}
        pendingCredits={stats.pendingCredits}
      />

      {/* Referral Link Section */}
      <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
              <GiftIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-medium text-gray-900">
                Tu enlace de referido
              </h2>
              <p className="text-sm text-gray-500">
                Comparte este enlace y gana créditos por cada amigo que se
                convierta en Pro
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex rounded-md shadow-sm">
              <div className="relative flex-grow focus-within:z-10">
                <input
                  type="text"
                  readOnly
                  value={referralCode}
                  className="block w-full rounded-none rounded-l-md border-0 py-3 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
              </div>
              <CopyButton
                textToCopy={referralCode}
                className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              />
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-900">Compartir en:</h3>
            <div className="mt-2 flex space-x-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
              >
                <ShareIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                WhatsApp
              </a>
              <a
                href={emailUrl}
                className="inline-flex items-center rounded-md bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <ShareIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                Correo
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="mt-10 bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            ¿Cómo funciona?
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 text-lg font-bold mb-4">
                1
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Comparte tu enlace
              </h3>
              <p className="text-gray-600">
                Envía tu enlace único a amigos o compártelo en redes sociales
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 text-lg font-bold mb-4">
                2
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Registro de amigos
              </h3>
              <p className="text-gray-600">
                Tus amigos se registran usando tu enlace
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 text-lg font-bold mb-4">
                3
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Gana créditos
              </h3>
              <p className="text-gray-600">
                Recibe 1 mes gratis por cada amigo que se convierta en usuario
                Pro con tu enlace
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          Al participar en el programa de referidos, aceptas nuestros{" "}
          <Link
            to="/terms"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Términos y Condiciones
          </Link>
          . Los créditos no son reembolsables y no tienen valor en efectivo.
        </p>
      </div>
    </div>
  );
}

import { Link } from "react-router";

export default function Gracias() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-100 to-clear flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center">
        {/* Success Icon */}
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          ¡Pago Exitoso!
        </h1>

        {/* Message */}
        <p className="text-lg text-gray-600 mb-8">
          Tu pago ha sido procesado correctamente. 
          Gracias por tu confianza.
        </p>

        {/* Details */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <p className="text-sm text-gray-500 mb-2">
            Recibirás un correo de confirmación en breve
          </p>
          <p className="text-xs text-gray-400">
            Si tienes alguna pregunta, contáctanos
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            to="/dashboard"
            className="block w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 px-6 rounded-full transition-colors"
          >
            Ir al Dashboard
          </Link>
          <Link
            to="/"
            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-full transition-colors"
          >
            Volver al Inicio
          </Link>
        </div>

        {/* Footer note */}
        <p className="mt-8 text-xs text-gray-400">
          Powered by Formmy + Stripe
        </p>
      </div>
    </div>
  );
}
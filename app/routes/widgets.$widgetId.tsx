import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { getWidget } from "../../server/widgets/widget-creator.server";
import { getSession } from "~/sessions";
import { PaymentWidget } from "~/components/widgets/PaymentWidget";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { widgetId } = params;

  if (!widgetId) {
    throw new Response('Widget ID requerido', { status: 400 });
  }

  // Obtener userId de la sesión (puede ser email por legacy de google.server.ts)
  const session = await getSession(request.headers.get("Cookie"));
  const userIdOrEmail = session.get("userId");

  if (!userIdOrEmail) {
    throw new Response('No autorizado', { status: 401 });
  }

  // 🔧 Buscar user real por email o ID
  const { db } = await import("~/utils/db.server");

  // Validar si es un ObjectID válido (24 caracteres hexadecimales)
  const isValidObjectId = /^[a-f\d]{24}$/i.test(userIdOrEmail);

  const user = await db.user.findFirst({
    where: isValidObjectId
      ? { id: userIdOrEmail } // Es un ObjectID válido
      : { email: userIdOrEmail } // Es un email (legacy)
  });

  if (!user) {
    throw new Response('Usuario no encontrado', { status: 404 });
  }

  const widget = await getWidget(widgetId, user.id);

  if (!widget) {
    throw new Response('Widget no encontrado', { status: 404 });
  }

  return { widget };
}

export default function WidgetRoute() {
  const { widget } = useLoaderData<typeof loader>();

  // Router por tipo de widget
  switch (widget.type) {
    case 'payment':
      return <PaymentWidget data={widget.data} />;

    case 'booking':
      return <div className="p-8 text-center text-gray-500">Booking widget (próximamente)</div>;

    case 'form':
      return <div className="p-8 text-center text-gray-500">Form widget (próximamente)</div>;

    default:
      return <div className="p-8 text-center text-gray-500">Widget desconocido</div>;
  }
}

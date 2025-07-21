import { data as json } from "react-router";
import { useLoaderData } from "react-router";
import { type LoaderFunctionArgs } from "react-router";
import { db } from "~/utils/db.server";
import { getAdminUserOrRedirect } from "server/getUserUtils.server";
import { Row } from "./admin.projects";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await getAdminUserOrRedirect(request);
  const users = await db.user.findMany({
    select: { name: true, createdAt: true, id: true, email: true },
    orderBy: { createdAt: "desc" },
  });
  if (!users || !users.length) {
    throw json(null, { status: 404 });
  }
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thisWeek = await db.user.count({
    where: {
      createdAt: {
        lte: new Date(),
        gte: sevenDaysAgo,
      },
    },
  });
  return {
    users,
    totals: {
      all: users.length,
      thisWeek: thisWeek,
    },
  };
};

export default function Page() {
  const { users, totals } = useLoaderData<typeof loader>();
  return (
    <article className="mx-auto max-w-5xl px-6 py-20">
      <h2 className="font-bold text-3xl">Recent users</h2>
      <section className="flex py-2 px-4 rounded gap-4">
        <div className="flex">
          <span>Usuarios en total: </span>
          <strong>{totals.all}</strong>
        </div>
        <div className="flex">
          <span>Usuarios agregados esta semana:</span>
          <strong className="text-brand-500">{totals.thisWeek}</strong>
        </div>
      </section>
      <section id="table">
        <Row>
          <span>Usuario</span>
          <span>Nombre</span>
          <span>Fecha</span>
        </Row>
        {users.map((p) => (
          <Row key={p.id}>
            <span>{p.email}</span>
            <span>{p.name}</span>
            <span>{new Date(p.createdAt).toLocaleString()}</span>
          </Row>
        ))}
      </section>
    </article>
  );
}

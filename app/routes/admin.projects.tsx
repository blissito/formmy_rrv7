import { data as json } from "react-router";
import { useLoaderData } from "react-router";
import { Children, type ReactNode } from "react";
import { type LoaderFunctionArgs } from "react-router";
import { db } from "~/utils/db.server";
import { getAdminUserOrRedirect } from "server/getUserUtils.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await getAdminUserOrRedirect(request);
  const projects = await db.project.findMany({
    select: { name: true, createdAt: true, id: true, User: true },
    orderBy: { createdAt: "desc" },
  });
  if (!projects || !projects.length) {
    throw json(null, { status: 404 });
  }
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thisWeek = await db.project.count({
    where: {
      createdAt: {
        lte: new Date(),
        gte: sevenDaysAgo,
      },
    },
  });
  return {
    projects,
    totals: {
      all: projects.length,
      thisWeek: thisWeek,
    },
  };
};

export default function Page() {
  const { projects, totals } = useLoaderData<typeof loader>();
  return (
    <article className="mx-auto max-w-5xl px-6 py-20">
      <h2 className="font-bold text-3xl">Recent Projects</h2>
      <section className="flex py-2 px-4 rounded gap-4">
        <div className="flex">
          <span>Projectos en total: </span>
          <strong>{totals.all}</strong>
        </div>
        <div className="flex">
          <span>Projectos agregados esta semana:</span>
          <strong className="text-brand-500">{totals.thisWeek}</strong>
        </div>
      </section>
      <section id="table">
        <Row>
          <span>Usuario</span>
          <span>Nombre</span>
          <span>Fecha</span>
        </Row>
        {projects.map((p) => (
          <Row key={p.id}>
            <span>{p.User?.email}</span>
            <span>{p.name}</span>
            <span>{new Date(p.createdAt).toLocaleString()}</span>
          </Row>
        ))}
      </section>
    </article>
  );
}

export const Row = ({ children }: { children: ReactNode[] }) => (
  <section className="hover:scale-105 transition-all my-2 grid grid-cols-6 shadow p-4 rounded">
    {Children.map(children, (child: ReactNode, index: number) => {
      return (
        <span key={index} className="col-span-2">
          {child}
        </span>
      );
    })}
  </section>
);

import {
  redirect,
  type ActionFunction,
  type LoaderFunction,
} from "react-router";
import { Form, useFetcher, useSearchParams } from "react-router";
import { type FormikProps, useFormik } from "formik";
import { twMerge } from "tailwind-merge";
import { z } from "zod";
import { db } from "~/utils/db.server";
import { EmojiConfetti } from "~/components/EmojiConffeti";
import Spinner from "~/components/Spinner";
import { getUserOrRedirect } from "server/getUserUtils.server";

const formSchema = z.object({
  name: z.string().min(3, { message: "Este campo es necesario" }),
  email: z.string().email({ message: "Escribe un correo válido" }),
  message: z.string().min(10, { message: "Escribe al menos 10 caracteres" }),
});

export const action: ActionFunction = async ({ request, params }) => {
  const user = await getUserOrRedirect(request);
  const formData = await request.formData();
  const { success, data } = formSchema.safeParse(Object.fromEntries(formData));
  if (!success) return null; // todo
  const ProjectSlug = params.projectSlug;
  const project = await db.project.findUnique({
    where: {
      slug: ProjectSlug,
    },
  });
  if (!project) {
    return { ok: false, error: "Project " }; // todo
  }

  const recordBody = {
    data: data,
    schema: JSON.stringify(formSchema),
    projectId: project.id,
    userId: user.id,
  };

  try {
    await db.answer.create({ data: recordBody });
  } catch (e) {
    console.error(e);
    return e;
  }

  throw redirect(`/${project.slug}/form?success=1`);
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const ProjectSlug = params.projectSlug;
  const project = await db.project.findUnique({
    where: {
      slug: ProjectSlug,
    },
  });
  if (!project || !project.isActive) {
    throw new Response(null, { status: 404 }); // only exiting projects
  }
  return { project };
};

export default function ProjectSlug() {
  const fetcher = useFetcher();
  const [searchParams] = useSearchParams();
  const formik = useFormik({
    onSubmit: (vals) => {
      fetcher.submit(vals, { method: "post" });
    },
    initialValues: { name: "", email: "", message: "" },
    validate: (vals): Record<string, string> | undefined => {
      const result = formSchema.safeParse(vals);
      if (result.success) return;
      return result.error.issues.reduce((acc, issue) => {
        return { ...acc, [issue.path[0]]: issue.message };
      }, {});
    },
  });

  if (searchParams.get("success")) {
    return (
      <section className="min-h-svh text-center flex flex-col justify-center">
        <h2 className="text-3xl">¡Muchas gracias!</h2>
        <p className="text-xl">Pronto me comunicare contigo 🌀</p>
        <div>
          <p>También puedes contactarme por mis redes sociales:</p>
          <div className="flex gap-2 justify-center text-xs mt-4">
            <button>Facebook</button>
            <button>Twitter</button>
            <button>Github</button>
            <button>Tiktok</button>
          </div>
        </div>
        <EmojiConfetti />
      </section>
    );
  }

  return (
    <Form onSubmit={formik.handleSubmit} className="mx-auto max-w-2xl px-4">
      <TextField
        formik={formik}
        label="Escribe tu nombre:"
        name="name"
        placeholder="Escribe tu nombre"
      />
      <TextField
        formik={formik}
        onChange={formik.handleChange}
        label="Escribe tu correo:"
        type="email"
        name="email"
        placeholder="Escribe tu E-mail"
        error={formik.errors.email}
      />
      <TextField
        formik={formik}
        onChange={formik.handleChange}
        label="Escribe tu mensaje:"
        type="textarea"
        name="message"
        placeholder="Dínos, ¿Cómo podemos ayudarte?"
        error={formik.errors.message}
      />
      <button
        disabled={!formik.isValid || fetcher.state !== "idle"}
        type="submit"
        className="disabled:cursor-not-allowed disabled:text-gray-400 disabled:bg-slate-200 py-3 px-8 bg-blue-300 text-xl font-thin text-black rounded-md my-8 w-full hover:bg-blue-200 flex justify-center"
      >
        {fetcher.state !== "idle" ? <Spinner /> : "Enviar"}
      </button>
    </Form>
  );
}

const TextField = ({
  placeholder,
  name,
  label,
  type = "text",
  formik,
  ...props
}: {
  formik: FormikProps;
  placeholder: string;
  label: string;
  name: string;
  type?: "text" | "email" | "textarea";
  [x: string]: any;
}) => {
  return (
    <label htmlFor={name} className="flex gap-2 flex-col mt-2">
      <span>{label}</span>
      {type === "textarea" ? (
        <textarea
          value={formik.values[name]}
          onChange={formik.handleChange}
          {...props}
          rows={6}
          name={name}
          className={twMerge(
            "rounded-md px-8 py-2",
            formik.errors[name] && "ring ring-red-500 focus:ring-0"
          )}
          placeholder={placeholder}
        ></textarea>
      ) : (
        <input
          value={formik.values[name]}
          onChange={formik.handleChange}
          {...props}
          type={type}
          name={name}
          className={twMerge(
            "rounded-md px-8 py-2",
            formik.errors[name] && "ring ring-red-500 focus:ring-0"
          )}
          placeholder={placeholder}
        />
      )}
      {true && <p className="text-red-500 text-xs">{formik.errors[name]}</p>}
    </label>
  );
};

import { redirect, type ActionFunction, data as json } from "react-router";
import Modal from "~/components/Modal";
import { projectSchema } from "~/utils/zod";
import { db } from "~/utils/db.server";
import { Form, useActionData, useNavigation } from "react-router";
import Spinner from "~/components/Spinner";
import { slugify } from "~/utils/slugify";
import { v4 as uuidv4 } from "uuid";
import { IconCube } from "~/components/IconCube";
import { useState } from "react";
import { getUserOrRedirect } from "server/getUserUtils.server";

export const action: ActionFunction = async ({ request }) => {
  const user = await getUserOrRedirect(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "create") {
    const slug = slugify(String(formData.get("name")) + uuidv4()); // This is cool ha? Yep.
    const body = {
      slug,
      name: formData.get("name") as string,
      userId: user.id,
      email: user.email,
      type: formData.get("type") as string,
      config: {
        watermark: false,
        theme: "dark",
        ctaColor: "#9b9aea",
        inputs: ["email"],
        border: "redondo",
        icon: "/assets/mail-noti.svg",
        message:
          "Tu mensaje ha sido enviado. Nos pondremos en contacto contigo lo antes posible.",
        confetti: "emoji",
        customInputs: [],
      },
      settings: {
        notifications: {
          new: true,
        },
      },
    };
    const validated = projectSchema.safeParse(body);
    if (!validated.success) {
      return json(
        {
          ok: false,
          error: {
            issues: [
              {
                path: "Nombre",
                message: "No podemos crear tu proyecto ahora mismo",
              },
            ],
          },
        },
        { status: 400 }
      );
    }

    const newProject = await db.project.create({ data: body });
    return redirect(`/config/${newProject.id}/basic`);
  }
  return null;
};

export default function New() {
  const navigation = useNavigation();
  const actionData = useActionData();

  const handleFormmyTypeChange = (type: "contact" | "subscription") => {};

  return (
    <>
      <Modal>
        <div>
          <Form
            method="post"
            className="px-6 py-8 md:pb-10 md:pt-0 gap-2 bg-clear dark:bg-space-900 rounded-3xl dark:text-white text-space-900 "
          >
            <h2 className="font-bold mb-10 text-2xl text-left mt-6 md:mt-0">
              Ponle nombre a tu Formmy
            </h2>
            <div className="flex w-full">
              <input
                name="name"
                required
                placeholder="Nombre de tu proyecto "
                className="h-10  input font-normal w-full md:w-80 border-[1px] border-gray-100 dark:border-clear/30 dark:bg-transparent focus:outline-none focus:ring-0 bg-transparent focus:border-brand-500 rounded-bl-lg rounded-tl-lg placeholder:text-space-300"
              />

              <button
                name="intent"
                value="create"
                type="submit"
                className="bg-brand-500 h-10 text-clear py-2 px-4 md:px-8 rounded-br-lg rounded-tr-lg"
              >
                <div className="w-10 h-6">
                  {navigation.state !== "idle" ? <Spinner /> : "Crear"}
                </div>
              </button>
            </div>
            <p className="mt-6 text-gray-600 dark:text-space-300">
              Escoge el tipo de Formmy
            </p>
            <FormmyTypeSelect />

            <div className="h-6">
              {!actionData?.ok &&
                actionData?.error.issues.map((issue: any) => (
                  <p key={issue.code} className="text-red-500 ">
                    {issue.message}
                  </p>
                ))}
            </div>
          </Form>
        </div>
      </Modal>
    </>
  );
}

const FormmyTypeSelect = ({
  onChange,
  defaultValue = "contact",
}: {
  onChange?: () => void;
  defaultValue?: "contact" | "subscription";
}) => {
  const [selected, setSelected] = useState(defaultValue);

  return (
    <section className="mt-4 flex gap-4 items-center">
      <input type="hidden" name="type" value={selected} />
      <div>
        <IconCube
          isSelected={selected === "subscription"}
          className=" h-full w-[200px] dark:hidden block "
          src="/assets/hero/add-suscription-w.png "
          onClick={() => setSelected("subscription")}
        />
        <IconCube
          isSelected={selected === "subscription"}
          className=" h-auto w-[200px] hidden dark:block  bg-transparent"
          onClick={() => setSelected("subscription")}
          src="/assets/hero/add-suscription-d.png "
        />
        <p className="text-gray-600 dark:text-space-300 font-light text-center text-xs pt-3">
          Formulario de suscripción
        </p>
      </div>
      <div>
        {" "}
        <IconCube
          isSelected={selected === "contact"}
          className=" h-auto w-[200px] dark:hidden block"
          onClick={() => setSelected("contact")}
          src="/assets/hero/add-form-w.png"
        />
        <IconCube
          isSelected={selected === "contact"}
          className=" h-auto w-[200px] hidden dark:block bg-transparent"
          onClick={() => setSelected("contact")}
          src="/assets/hero/add-form-d.png"
        />
        <p className="text-gray-600 dark:text-space-300 font-light text-center text-xs pt-3">
          Formulario de contacto
        </p>
      </div>
    </section>
  );
};

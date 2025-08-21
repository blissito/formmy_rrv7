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
    return redirect(`/dashboard/formmys/${newProject.id}/edition`);
  }
  return null;
};

export default function New() {
  const navigation = useNavigation();
  const actionData = useActionData();

  const handleFormmyTypeChange = (type: "contact" | "subscription") => {};

  return (
    <>
      <Modal title="Ponle nombre a tu Formmy" size="md" className="  px-4 pb-4 md:pt-0 md:pb-8 md:px-20 box-border">
        <div>
          <Form
            method="post"
            className=" gap-2 bg-white rounded-3xl "
          >
            <div className="flex w-full mt-6 md:mt-8">
              <input
                name="name"
                required
                placeholder="Nombre de tu proyecto "
                className="h-12 input font-normal w-full border-[1px] border-outlines focus:outline-none focus:ring-0 bg-transparent focus:border-brand-500 rounded-xl placeholder:text-space-300"
              />            
            </div>
            <p className="mt-4 md:mt-6 text-metal">
            Elige el tipo de formmy
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
            <button
                name="intent"
                value="create"
                type="submit"
                className="bg-brand-500 h-10 md:h-12 w-full max-w-[120px] md:max-w-[200px] mx-auto mt-4 rounded-full text-white grid place-items-center"
              >
                <div className="w-10 h-6">
                  {navigation.state !== "idle" ? <Spinner /> : "Crear"}
                </div>
              </button>
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
    <section className="mt-2 md:mt-3 flex gap-4 items-center justify-between">
      <input type="hidden" name="type" value={selected} />
      <div>
        <IconCube
          isSelected={selected === "subscription"}
          className=" h-full w-[100%] md:w-[200px]  block "
          src="/assets/hero/add-suscription-w.png "
          onClick={() => setSelected("subscription")}
        />
        <IconCube
          isSelected={selected === "subscription"}
          className=" h-auto w-[48%] md:w-[200px] hidden dark:block  bg-transparent"
          onClick={() => setSelected("subscription")}
          src="/assets/hero/add-suscription-d.png "
        />
        <p className="text-metal font-light text-center text-xs pt-3">
         Suscripción
        </p>
      </div>
      <div>
        {" "}
        <IconCube
          isSelected={selected === "contact"}
          className=" h-auto w-[100%] md:w-[200px] dark:hidden block"
          onClick={() => setSelected("contact")}
          src="/assets/hero/add-form-w.png"
        />
        <IconCube
          isSelected={selected === "contact"}
          className=" h-auto w-[200px] hidden dark:block bg-transparent"
          onClick={() => setSelected("contact")}
          src="/assets/hero/add-form-d.png"
        />
        <p className="text-metal font-light text-center text-xs pt-3">
         Contacto
        </p>
      </div>
    </section>
  );
};

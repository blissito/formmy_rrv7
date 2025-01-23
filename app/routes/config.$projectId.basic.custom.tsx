import { data as json, redirect } from "react-router";
import { Form, useFetcher } from "react-router";
import Modal from "~/components/Modal";
import { Toggle } from "~/components/Switch";
import { TextField } from "~/components/formmys/FormyV1";
import { db } from "~/utils/db.server";
import { SelectableImage } from "./config.$projectId.basic";
import type { ZodError, ZodIssue } from "zod";
import { type ReactNode, useState } from "react";
import { twMerge } from "tailwind-merge";
import { customInputSchema } from "~/utils/zod";
import { Button } from "~/components/Button";
import { FaRegTrashAlt } from "react-icons/fa";
import { type CustomInput } from "@prisma/client";

const parseZodIssues = (error: ZodError) =>
  error
    ? JSON.parse(error).reduce(
        (acc: Record<string, string>, err: ZodIssue) => ({
          ...acc,
          [err.path[0]]: err.message,
        }),
        {}
      )
    : {};

export const loader = async ({ params }: LoaderArgs) => {
  const project = await db.project.findUnique({
    where: { id: params.projectId },
  });
  if (!project) return json(null, { status: 404 });
  return { project };
};

export const action = async ({ request, params }: ActionArgs) => {
  const formData = await request.formData();
  const { data, success, error } = customInputSchema.safeParse(
    JSON.parse(formData.get("data"))
  );
  if (!success) return json({ error }, { status: 400 });
  // intents
  if (formData.get("intent") === "add_custom_input") {
    const project = await db.project.findUnique({
      where: { id: params.projectId },
    });
    if (!project) return json(null, { status: 404 });
    await db.project.update({
      where: { id: params.projectId },
      data: {
        config: {
          ...project.config,
          customInputs: [
            ...(project.config?.customInputs.length
              ? project.config?.customInputs
              : []),
            data,
          ],
        },
      },
    });
    // redirect on success
    // throw redirect(`/config/${project.id}/basic`);
    return redirect(`/config/${project.id}/basic`);
    // return new Response(null, {
    //   status: 303,
    //   headers: {
    //     Location: `/config/${project.id}/basic`,
    //   },
    // });
  }
};
const initialErrors = {
  options: undefined,
  type: null,
  title: undefined,
  placeholder: undefined,
};
export default function Route() {
  const [isSelect, setIsSelect] = useState(false);
  const [errors, setErrors] = useState(initialErrors); // undefined is better for component props
  const fetcher = useFetcher();
  //   const { project } = useLoaderData<typeof loader>();

  const handleValidation = (form: CustomInput | any) => {
    let result = customInputSchema.safeParse(form);
    if (isSelect) {
      result = customInputSchema.safeParse(form); // @TODO: select validation
    }
    if (!result.success) {
      console.error(result.error);
      setErrors(parseZodIssues(result.error));
    } else {
      setErrors(initialErrors);
    }
    return result;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams(formData);
    const form = Object.fromEntries(formData);
    form.options = [...params.getAll("option")]; // @TODO: better way? from form directly?
    form.name = form.title; // @TODO: Name Should be placed by zod
    const { success, data } = handleValidation(form);
    if (!success) return;
    fetcher.submit(
      { data: JSON.stringify(data), intent: "add_custom_input" },
      { method: "post" }
    );
  };

  const renderError = (error: string) => (
    <span className="text-red-500 text-xs h-[1px] block">{error}</span>
  );

  return (
    <Modal title="Agrega tu propio campo">
      <Form
        onSubmit={handleSubmit}
        method="post"
        className="flex flex-col gap-6 py-6"
      >
        <label className="text-base font-normal text-gray-600 dark:text-space-400">
          ¿Qué tipo de campo que quieres agregar?
        </label>
        <fieldset
          className={twMerge(
            "flex gap-4 justify-between",
            errors.type && "border-2 rounded-xl border-red-500 p-2"
          )}
        >
          <SelectableImage
            onClick={() => setIsSelect(false)}
            defaultValue="text"
            text="Texto"
            name="type"
            src={"/assets/custom-input/input-selection.svg"}
          />
          <SelectableImage
            onClick={() => setIsSelect(true)}
            defaultValue="select"
            text="Selección"
            name="type"
            src={"/assets/custom-input/select-selection.svg"}
          />
        </fieldset>
        {errors.type && renderError("Selecciona un tipo de input")}
        <TextField
          className="mb-0 placeholder:text-space-300 dark:placeholder:text-space-500 font-light"
          label={
            <label
              className="text-base font-normal  text-gray-600 dark:text-space-400"
              htmlFor="title"
            >
              ¿Qué titulo/label tendrá el campo?
            </label>
          }
          name="title"
          placeholder="Por ejemplo: Edad"
          error={errors.title && renderError(errors.title)}
        />

        <TextField
          className="mb-0 placeholder:text-space-300 font-light"
          label={
            <label
              className="text-base font-normal  text-gray-600 dark:text-space-400"
              htmlFor="title"
            >
              ¿Qué placeholder tendrá? (opcional)
            </label>
          }
          name="placeholder"
          placeholder="Por ejemplo: Tecnología"
          error={errors.placeholder && renderError(errors.placeholder)}
        />
        {isSelect && (
          <Options error={errors.options && renderError(errors.options)} />
        )}

        <label className=" text-gray-600 dark:text-space-300 text-base font-normal flex justify-between items-center">
          ¿Es este campo obligatorio?
          <Toggle name="isRequired" />
        </label>
        <Button type="submit" autoFocus isLoading={fetcher.state !== "idle"} />
      </Form>
    </Modal>
  );
}

const Options = ({ error }: { error?: ReactNode }) => {
  const [options, setOptions] = useState([null, null]);
  const addOption = () => setOptions((ops) => [...ops, null]);
  const removeOption = (index: number) => {
    // if (options.length < 2) return;
    const newArr = [...options];
    newArr.splice(index, 1);
    setOptions(newArr);
  };
  return (
    <label className="text-base font-normal  text-gray-600 dark:text-space-400">
      <span>¿Cuáles son las opciones disponíbles?</span>
      <div
        className={twMerge(
          error && "border-2 border-red-500 rounded-lg",
          "grid grid-cols-2 columns-2 gap-2 overflow-y-scroll max-h-52 focus:border-yellow-50 mt-2"
        )}
      >
        {options.map((_, index) => (
          <div key={index} className="relative">
            <TextField
              className="mb-0 flex-1 placeholder:text-space-300 font-light"
              name="option"
              placeholder={`Opción #${index + 1}`}
            />
            {index > 1 && (
              <button
                onClick={() => removeOption(index)}
                type="button"
                className="hover:scale-110 absolute right-2 top-3"
              >
                <FaRegTrashAlt />
              </button>
            )}
          </div>
        ))}
      </div>
      <p className="text-red-500 text-xs m-1">{error}</p>
      <button
        type="button"
        onClick={addOption}
        className="text-gray-600 dark:text-gray-400 font-light "
      >
        + Agrega otra
      </button>
    </label>
  );
};

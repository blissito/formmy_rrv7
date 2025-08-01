import { Form } from "react-router";
import Spinner from "./Spinner";
import Modal from "./Modal";
import { useState, type ChangeEvent } from "react";
import { z } from "zod";

export const InputModalForm = ({
  isLoading,
  onClose,
  cta = "Invitar",
  placeholder = "ejemplo@gmail.com",
  title,
}: {
  isLoading?: boolean;
  onClose?: () => void;
  cta?: string;
  placeholder?: string;
  title: string;
}) => {
  const [validEmail, setValidEmail] = useState<string | null>(null);

  const handleChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const email = ev.target.value;
    const { success } = z.string().email().safeParse(email);
    if (success) setValidEmail(email);
    else setValidEmail(null);
  };
  return (
    <Modal onClose={onClose}>
      <Form
        method="post"
        className="px-6 py-8 md:py-10 gap-2 bg-clear dark:bg-space-900 rounded-3xl dark:text-white text-space-900 "
      >
        <h2 className="font-bold mb-10 text-2xl text-center mt-6 md:mt-0">
          {title}ww
        </h2>
        <div className="flex w-full">
          <input
            onChange={handleChange}
            type="email"
            name="email"
            required
            placeholder={placeholder}
            className="h-10  input font-normal w-full md:w-80 border-[1px] border-gray-100 dark:border-clear/30 dark:bg-transparent focus:outline-none focus:ring-0 bg-transparent focus:border-brand-500 rounded-bl-lg rounded-tl-lg placeholder:text-space-300"
          />

          <button
            disabled={!validEmail || isLoading}
            name="intent"
            value="send_invite"
            type="submit"
            className="bg-brand-500 h-10 text-clear py-2 px-4 md:px-8 rounded-br-lg rounded-tr-lg disabled:bg-gray-400 cursor-pointer disabled:cursor-not-allowed"
          >
            <div className="w-10 h-6">
              {isLoading && <Spinner color="brand" />} {!isLoading && cta}
            </div>
          </button>
        </div>
        <div className="h-6">
          {/* {!actionData?.ok &&
              actionData?.error.issues.map((issue: any) => (
                <p key={issue.code} className="text-red-500 ">
                  {issue.message}
                </p>
              ))} */}
        </div>
      </Form>
    </Modal>
  );
};

import type { Answer } from "@prisma/client";
import { data as json } from "react-router";
import { useFetcher } from "react-router";
import { db } from "~/utils/db.server";

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const intent = (await formData).get("intent");
  if (intent === "open") {
    const answerId = formData.get("answerId");
    if (!answerId) {
      return json(null, { status: 404 });
    }
    await db.answer.update({
      where: { id: String(answerId) },
      data: { opened: true },
    });
    return { ok: true };
  }
  return null;
};

export const useAnswerOpener = () => {
  const fetcher = useFetcher();
  const open = (answer: Answer) => {
    if (!answer.id) throw { message: "No answer id provided" };

    if (answer.opened) return;

    fetcher.submit(
      { intent: "open", answerId: answer.id },
      { method: "post", action: "/api/answers" }
    );
  };
  return open;
};

import { db } from "~/utils/db.server";

interface CreateWidgetParams {
  type: 'payment' | 'booking' | 'form';
  data: Record<string, any>;
  userId: string;
  chatbotId?: string | null;
}

export async function createWidget(params: CreateWidgetParams) {
  const widget = await db.widget.create({
    data: {
      type: params.type,
      data: params.data,
      userId: params.userId,
      chatbotId: params.chatbotId,
    }
  });

  return widget;
}

export async function getWidget(id: string, userId: string) {
  return await db.widget.findFirst({
    where: { id, userId } // Security: solo owner puede acceder
  });
}

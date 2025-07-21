import { redirect } from "react-router";
import { type User } from "@prisma/client";
import { getSession } from "~/sessions";
import { db } from "~/utils/db.server";
import { redirectToGoogle } from "~/lib/google.server";

// Este archivo es SOLO para uso en el servidor. No debe ser importado desde ningún código que termine en el cliente.

export const getUserOrRedirect = async (request: Request): Promise<User> => {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("userId")) {
    throw redirect("/");
  }
  const user = (await db.user.findUnique({
    where: { email: session.get("userId") },
  })) as User;
  if (!user) {
    throw redirect("/");
  }
  return user as User;
};

export const getUserOrTriggerLogin = async (request: Request) => {
  const user = await getUserOrNull(request);
  if (!user) {
    const url = new URL(request.url);
    throw redirectToGoogle(redirect, url.host);
  }
  return user;
};

export const getUserOrNull = async (request: Request): Promise<User | null> => {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("userId")) {
    return null;
  }
  const user = await db.user.findUnique({
    where: { email: session.get("userId") },
  });
  if (!user) {
    return null;
  }
  return user;
};

const ADMINS = ["fixtergeek@gmail.com", "bremin11.20.93@gmail.com"];

export const getAdminUserOrRedirect = async (
  request: Request
): Promise<User> => {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("userId")) {
    throw redirect("/");
  }
  const user = (await db.user.findUnique({
    where: { email: session.get("userId") },
  })) as User;
  if (!user) {
    throw redirect("/");
  }
  if (!ADMINS.includes(user.email)) {
    throw redirect("/");
  }
  return user;
};

export const getProjectOwner = async ({
  userId,
  projectId,
}: {
  userId: string;
  projectId: string;
}) => {
  return await db.project.findUnique({
    where: {
      id: projectId,
      userId: userId,
    },
    include: {
      answers: {
        where: {
          deleted: false, // Is this ok in here?
        },
        orderBy: {
          createdAt: "desc",
        },
      }, // consider appart to filter?
    },
  });
};

export const getPermission = ({
  userId,
  projectId,
}: {
  userId: string;
  projectId: string;
}) => {
  return db.permission.findFirst({
    where: {
      userId,
      projectId,
    },
    include: {
      project: {
        include: {
          answers: {
            where: {
              deleted: false, // Is this ok in here?
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
    },
  });
};

export const redirectIfUser = async (request: Request) => {
  const cookie = request.headers.get("Cookie");
  const session = await getSession(cookie);
  if (session.has("userId")) {
    throw redirect("/dash");
  }
};

import { getSession } from "~/sessions";
import { db } from "../app/utils/db.server";
import { redirectToGoogle } from "~/lib/google.server";
import { redirect } from "react-router";
import { type User } from "@prisma/client";

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
  return user;
};

export const getUserOrTriggerLogin = async (request: Request) => {
  const user = await getUserOrNull(request);
  if (!user) {
    throw redirectToGoogle(redirect);
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

// @TODO bring the dash functions in here

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

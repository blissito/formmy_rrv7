import { createSearchParams, redirect } from "react-router";
import { commitSession, getSession } from "~/sessions";
import { db } from "~/utils/db.server";
import { extraDataSchema, type ExtraData } from "~/utils/zod";

const prodURL = "https://www.formmy.app";
const localhost = "http://localhost:3000";

const GOOGLE_SECRET = process.env.GOOGLE_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const ENV = process.env.NODE_ENV;

export const getExtraData = (access_token: string): ExtraData => {
  // @TODO: get displayName
  const url = "https://www.googleapis.com/oauth2/v2/userinfo";
  return fetch(url, {
    headers: {
      Authorization: "Bearer " + access_token,
    },
  })
    .then((r) => {
      return r.json();
    })
    .then((data) => {
      const validated = extraDataSchema.parse(data);
      return validated;
    })
    .catch((e) => ({ ok: false, error: e })) as unknown as ExtraData;
};

export const getAccessToken = async <Code extends string>(
  code: Code
): Promise<
  | { error?: string; ok?: boolean; access_token?: string }
  | ReturnType<typeof Error>
> => {
  if (!GOOGLE_SECRET || !GOOGLE_CLIENT_ID)
    return new Error("missing env object");
  const search = new URLSearchParams({
    code,
    // client_secret: GOOGLE_SECRET,
    grant_type: "authorization_code",
    // client_id: GOOGLE_CLIENT_ID,
    redirect_uri: ENV === "development" ? localhost : prodURL,
    scope: "https://www.googleapis.com/auth/userinfo.email",
  });
  const url = "https://oauth2.googleapis.com/token?" + search;

  return fetch(url, {
    method: "post",
    headers: {
      "contant-type": "application/json",
      Authorization: `Basic ${btoa(GOOGLE_CLIENT_ID + ":" + GOOGLE_SECRET)}`,
    },
  })
    .then((r) => {
      return r.json();
    })
    .catch((e) => ({ ok: false, error: e }));
};

export function redirectToGoogle<Redirect extends (arg0: string) => Response>(
  redirect: Redirect
  // props: { params: Record<string, string> }
): Response {
  if (!GOOGLE_SECRET || !GOOGLE_CLIENT_ID) {
    throw new Error("Missing env variables");
  }
  const obj = {
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: ENV === "development" ? localhost : prodURL,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/userinfo.email",
  };

  const searchParams = createSearchParams(obj);
  const url = new URL(
    "https://accounts.google.com/o/oauth2/auth?" + searchParams
  );
  return redirect(url.toString());
}

export const createSession = async (code: string, request: Request) => {
  const data = await getAccessToken(code);
  if (data.error) throw new Error("token denined by Google");
  if (!data.access_token) throw new Error("No access_token found");
  const extra = await getExtraData(data.access_token);
  if (!extra.email) {
    throw new Error("permission denined by Google");
  }
  // save DB or get
  // set cookie?
  const cookie = request.headers.get("Cookie");
  const session = await getSession(cookie);
  const propieties = {
    name: extra.name || extra.displayName,
    email: extra.email,
    picture: extra.picture,
    provider: "google",
    access_token: data.access_token,
  };
  await db.user.upsert({
    where: {
      email: extra.email,
    },
    create: propieties,
    update: propieties,
  });

  session.set("userId", extra.email);

  throw redirect("/dash", {
    headers: {
      "set-cookie": await commitSession(session),
    },
  });
};
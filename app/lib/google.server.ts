import { createSearchParams, redirect } from "react-router";
import { commitSession, getSession } from "~/sessions";
import { db } from "~/utils/db.server";
import { extraDataSchema, type ExtraData } from "~/utils/zod";
import { processReferral } from "~/models/referral.server";
import { Effect } from "effect";
import { sendWelcomeEmail } from "~/utils/notifyers/welcome";

const GOOGLE_SECRET = process.env.GOOGLE_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

let redirect_uri;
const getredirectUri = (host: string) => {
  redirect_uri ??=
    host && process.env.NODE_ENV === "production"
      ? "https://" + host
      : "http://" + host;
  return redirect_uri;
};

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
  code: Code,
  request: Request
): Promise<{ error?: string; ok?: boolean; access_token?: string }> => {
  if (!GOOGLE_SECRET || !GOOGLE_CLIENT_ID)
    return { error: "missing env object", ok: false };

  const localURL = new URL(request.url);
  const redirect_uri = getredirectUri(localURL.host);

  const search = new URLSearchParams({
    code,
    client_secret: GOOGLE_SECRET,
    grant_type: "authorization_code",
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri,
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
  redirect: Redirect,
  host: string,
  state?: string
): Response {
  const redirect_uri = getredirectUri(host);
  console.log("?? =>>", redirect_uri);

  if (!GOOGLE_SECRET || !GOOGLE_CLIENT_ID) {
    throw new Error("Missing env variables");
  }
  const obj = {
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/userinfo.email",
    ...(state && { state })  // Solo incluir state si existe
  };

  const searchParams = createSearchParams(obj);
  const url = new URL(
    "https://accounts.google.com/o/oauth2/auth?" + searchParams
  );
  return redirect(url.toString());
}

export const createSession = async (code: string, request: Request, state?: string) => {
  const data: {
    error?: string;
    ok?: boolean;
    access_token?: string;
  } = await getAccessToken(code, request);
  if (data.error) throw new Error("token denined by Google");
  if (!data.access_token) throw new Error("No access_token found");
  const extra: {
    name?: string;
    displayName?: string;
    email: string;
    picture: string;
  } = await getExtraData(data.access_token);
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
  try {
    // First, try to find if the user exists
    const existingUser = await db.user.findUnique({
      where: { email: extra.email },
      select: { id: true, customerId: true }
    });

    if (existingUser) {
      // If user exists, update only the necessary fields
      await db.user.update({
        where: { email: extra.email },
        data: {
          name: propieties.name,
          picture: propieties.picture,
          access_token: propieties.access_token,
          provider: propieties.provider,
          updatedAt: new Date()
        }
      });
    } else {
      // If user doesn't exist, create without customerId
      const newUser = await db.user.create({
        data: {
          ...propieties,
          customerId: undefined, // Let the database handle the default value
          plan: 'FREE', // Ensure default plan is set
          subscriptionIds: [] // Initialize empty array for subscriptionIds
        },
        select: { id: true }
      });
      
      // Send welcome email to new user
      try {
        await sendWelcomeEmail({ email: extra.email, name: extra.name });
      } catch (error) {
        console.error('Error sending welcome email:', error);
        // Don't fail registration if welcome email fails
      }
      
      // Procesar referido si existe y es un nuevo usuario
      if (state && state.startsWith('ref_')) {
        const refCode = state.replace('ref_', '');
        try {
          await Effect.runPromise(processReferral(newUser.id, refCode));
        } catch (error) {
          console.error('Error procesando referido:', error);
          // No fallar el proceso de registro si hay error con el referido
        }
      }
    }
  } catch (error: any) {
    console.error('Error in user upsert:', error);
    // If there's still an error with customerId, try one more time with a generated ID
    if (error?.code === 'P2002' && error?.meta?.target?.includes('customerId')) {
      await db.user.create({
        data: {
          ...propieties,
          customerId: `cust_${Date.now()}`,
          plan: 'FREE',
          subscriptionIds: []
        }
      });
    } else {
      throw error; // Re-throw if it's a different error
    }
  }

  session.set("userId", extra.email);

  throw redirect("/dashboard/ghosty", {
    headers: {
      "set-cookie": await commitSession(session),
    },
  });
};

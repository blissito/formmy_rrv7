import { data as json, redirect } from "react-router";
import Stripe from "stripe";
// import { getUserOrTriggerLogin } from ".server/getUserUtils";
import { createCheckoutSessionURL } from "~/utils/stripe.server";

const isDevelopment = process.env.NODE_ENV === "development";

const stripe = new Stripe(
  (isDevelopment
    ? process.env.TEST_STRIPE_PV
    : process.env.STRIPE_PRIVATE_KEY) ?? ""
);

const ANUAL_PRICE = isDevelopment
  ? "price_1OinGRDtYmGT70YtS3fKsenE"
  : "price_1OgF7RDtYmGT70YtcGL3AxDQ"; // prod
const MONTHLY_PLAN = isDevelopment
  ? "price_1OinFxDtYmGT70YtW9UbUdpM"
  : "price_1OgF7RDtYmGT70YtJB3kRl9T"; // prod

const DOMAIN =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://formmy.app";

const COUPON = ""; // UPDATE COUPON HERE

export const action = async ({ request }) => {
  //
  const formData = await request.formData();
  const intent = formData.get("intent");
  console.log("WTF: ", intent);
  // const user = await getUserOrTriggerLogin(request);
  console.log("AFTER USER: ");
  if (intent === "anual-suscription-checkout") {
    console.log("THEN HERE: ");
    return null;
    let url;
    // const url = await createCheckoutSessionURL({ user: null, coupon: COUPON });
    console.log("WTF: ", url);
    if (!url) throw new Response("Not found", { status: 404 });

    throw redirect(url);
  }

  if (intent === "monthly-suscription-checkout") {
    const url = await createCheckoutSessionURL({
      price: MONTHLY_PLAN, // monthly
      user,
      coupon: COUPON,
    });
    if (!url) throw json(null, { status: 404 });
    throw redirect(url);
  }
};

export const loader = async ({ request }: LoaderArgs) => {};

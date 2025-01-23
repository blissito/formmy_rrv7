import { data as json } from "react-router";
import invariant from "tiny-invariant";
import { db } from "~/utils/db.server";
import { getStripeEvent } from "~/utils/stripe.server";
/**
 * add invoice.payment_action_required & invoice.paid
 */
//

export const action = async ({ request }: ActionArgs) => {
  if (request.method !== "POST") return; // post method only
  const event = await getStripeEvent(request);
  if (!event) throw json(null, { status: 400 });
  let customerId;
  let user;
  switch (event.type) {
    case "customer.subscription.created":
      customerId = event.data.object.customer;
      user = await db.user.findUnique({ where: { customerId } });
      if (!user) break;
      await db.user.update({
        where: { id: user.id },
        data: { plan: "PRO", subscriptionIds: [event.data.object.id] },
      });
      // notifications?
      console.log("PRO MEMBERSHIP BOUGHT AND APPLIED");
      break;
    case "customer.subscription.updated":
      customerId = event.data.object.customer;
      user = await db.user.findUnique({ where: { customerId } });
      invariant(user);
      await db.user.update({
        where: { id: user.id },
        data: {
          plan: event.data.object.status === "active" ? "PRO" : "FREE",
          subscriptionIds: [event.data.object.id],
        },
      });
      console.log("Subscription updated: ", event.data.object.status);
      break;
    case "customer.subscription.deleted":
      customerId = event.data.object.customer;
      user = await db.user.findUnique({ where: { customerId } });
      invariant(user);
      await db.user.update({
        where: { id: user.id },
        data: { plan: "FREE", subscriptionIds: [] }, // @TODO: splice?
      });
      console.log("SUBSCRIPTION DELETED: ", user.email);
      break;
    default:
      break;
  }
  return null;
};

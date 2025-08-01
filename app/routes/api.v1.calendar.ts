import { Effect } from "effect";
import { handleCalendarRequest } from "~/services/server/calendar.service.server";
import type { Route } from "./+types/api.v1.calendar";

/**
 * React Router v7 action handler for the calendar API endpoint
 * This is a thin wrapper around the server-side calendar service
 */
export const action = ({ request }: Route.ActionArgs) => {
  // Extract the access token from the Authorization header
  const accessToken =
    request.headers.get("Authorization")?.replace("Bearer ", "") || "";

  // Delegate to the server-side service
  return handleCalendarRequest({ request, accessToken });
};

// React Router v7 export
export default {
  action,
};

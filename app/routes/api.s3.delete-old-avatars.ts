import type { ActionFunction } from "react-router";
import { deleteOldAvatars } from "~/services/s3.service";

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }), 
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const formData = await request.formData();
    const slug = formData.get("slug") as string;

    if (!slug) {
      return new Response(
        JSON.stringify({ error: "slug is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const success = await deleteOldAvatars(slug);

    return new Response(
      JSON.stringify({ success }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error deleting old avatars:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete old avatars" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
import type { ActionFunction } from "react-router";
import { generatePresignedUrl, generateKey } from "~/services/s3.service";

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }), 
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const formData = await request.formData();
    const filename = formData.get("filename") as string;
    const contentType = formData.get("contentType") as string;
    const prefix = (formData.get("prefix") as string) || "chatbot-avatars";
    const slug = formData.get("slug") as string;

    if (!filename || !contentType) {
      return new Response(
        JSON.stringify({ error: "filename and contentType are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const key = generateKey(filename, prefix, slug);
    const presignedData = await generatePresignedUrl(key, contentType);

    return new Response(
      JSON.stringify(presignedData),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate presigned URL" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
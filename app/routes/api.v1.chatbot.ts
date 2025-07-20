import { data as json } from "react-router";

// GET handler (opcional)
export async function loader({ request }: any) {
  return new Response(JSON.stringify({ message: "GET not implemented" }), {
    headers: { "Content-Type": "application/json" },
  });
}

// POST/PUT/DELETE handler
export async function action({ request }: any) {
  try {
    const formData = await request.formData();
    const intent = formData.get("intent");
    // Aquí va tu lógica de intent
    return new Response(JSON.stringify({ success: true, intent }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

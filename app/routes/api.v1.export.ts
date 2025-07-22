// GET handler (opcional)
export async function loader(args: any) {
  return new Response(JSON.stringify({ message: "GET not implemented" }), {
    headers: { "Content-Type": "application/json" },
  });
}

// POST/PUT/DELETE handler
export async function action(args: any) {
  try {
    const formData = await args.request.formData();
    const intent = formData.get("intent");
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

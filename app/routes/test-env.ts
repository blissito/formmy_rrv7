import type { Route } from "./+types/test-env";

export async function loader({ request }: Route.LoaderArgs) {
  const llamaKey = process.env.LLAMA_CLOUD_API_KEY;

  return Response.json({
    llamaKeyExists: !!llamaKey,
    llamaKeyLength: llamaKey?.length || 0,
    llamaKeyPrefix: llamaKey?.substring(0, 10) || 'N/A',
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('LLAMA')),
  });
}

# Tareas para Preview Chat Config + OpenRouter

- [En progreso] Crear el endpoint resource route `api.v1.openrouter.ts` para hacer de proxy seguro a OpenRouter usando Effect (validación, tipado y lógica async).
- [Pendiente] Crear un wrapper/hook en `app/lib/openrouter.client.ts` para interactuar con el endpoint desde el cliente usando Effect.
- [Pendiente] Crear el componente aislado `ChatPreview.tsx` en `app/components/` que reciba props de configuración y permita enviar mensajes de prueba, mostrando loading, error y respuesta.
- [Pendiente] Integrar el componente `ChatPreview` en `chat.config.tsx`, pasando la configuración actual del chatbot como props.

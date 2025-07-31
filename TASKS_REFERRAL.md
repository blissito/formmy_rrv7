# Tareas: Sistema de Referidos

## Estándares de Desarrollo

- **No usar Remix** - Usar solo React Router v7
- **No usar `json`** - Usar siempre `new Response()` para las respuestas
- **Efecto** - Todo el código nuevo debe escribirse usando Effect (ts)
- **Tipado estricto** - Mantener TypeScript estricto en todo momento
- **Manejo de errores** - Usar `Effect` para el manejo de errores

---

## Fase 1: Configuración Inicial

- [x] **Configuración del Modelo**

  - [x] Crear archivo `app/models/referral.server.ts`
  - [x] Definir interfaz `Referral` en Prisma schema
  - [x] Implementar función `createReferralCode(userId: string)`
  - [x] Implementar función `findReferralByCode(code: string)`

- [x] **Endpoint Básico**
  - [x] Crear ruta `app/routes/api.v1.referral.ts`
  - [x] Implementar manejo de `intent=generate_code`
  - [x] Implementar manejo de `intent=get_stats`

## Fase 2: Lógica de Referidos

- [x] **Registro de Referidos**

  - [x] Implementar `processReferral(referredUserId: string, code: string)`
  - [x] Manejar errores de códigos inválidos
  - [x] Actualizar contadores de referidos
  - [x] Implementar endpoint `process_referral`
  - [x] Validación de parámetros
  - [x] Manejo de errores con Effect

- [x] **Integración en el Flujo de Autenticación**
  - [x] Modificar la ruta de login para capturar el parámetro `?ref=`
  - [x] Pasar el código de referido a través del flujo de OAuth usando el parámetro `state`
  - [x] Procesar el referido después de la autenticación exitosa
  - [x] Asegurar que el procesamiento del referido sea atómico
  - [x] Manejar casos de error sin afectar el registro del usuario

## Fase 3: Conversión a Pro ✅

- [x] **Detección de Conversión**

  - [x] Implementar `handleProConversion(userId: string)`
  - [x] Actualizar estado de referidos a 'completed'
  - [x] Incrementar contador de conversiones exitosas

- [x] **Integración con Stripe**
  - [x] Implementar `applyReferralCredit(referrerId: string)`
  - [x] Aplicar crédito usando `stripe.invoiceItems.create`
  - [x] Manejar errores de Stripe

## Fase 4: Interfaz de Usuario ✅

- [x] **Dashboard de Referidos**

  - [x] Crear ruta `/dashboard/referrals`
  - [x] Mostrar enlace de referido copiable
  - [x] Mostrar estadísticas básicas

- [x] **Componentes UI**
  - [x] Crear componente `CopyButton`
  - [x] Crear componente `ReferralStats`
  - [x] Añadir estilos básicos

## Fase 5: Pruebas y Ajustes ✅

- [x] **Pruebas de Integración**

  - [x] Probar flujo completo de registro
  - [x] Verificar aplicación de créditos
  - [x] Probar casos de error

- [x] **Ajustes Finales**
  - [x] Revisar mensajes de error
  - [x] Ajustar estilos si es necesario
  - [x] Documentar el sistema

## Validaciones por Tarea

Cada tarea debe validarse antes de marcar como completada:

1. **Modelo**: Verificar que se pueden crear y buscar referencias
2. **Endpoint**: Probar con cURL
3. **UI**: Verificar en navegador
4. **Stripe**: Verificar en panel de Stripe

## Comandos Útiles

```bash
# Probar endpoint de referidos
curl -X POST http://localhost:3000/api/referral \
  -F "intent=generate_code" \
  -F "userId=user_123"

# Ver estadísticas
curl -X POST http://localhost:3000/api/referral \
  -F "intent=get_stats" \
  -F "userId=user_123"
```

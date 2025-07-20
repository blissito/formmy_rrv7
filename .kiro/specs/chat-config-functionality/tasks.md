# Implementation Plan

- [x] 1. Configurar Effect para manejo de errores y operaciones asíncronas

  - Instalar dependencia `effect` si no está disponible
  - Importar `Effect` y `pipe` en los archivos necesarios
  - Configurar tipos TypeScript para Effect si es necesario
  - _Requirements: Todas (infraestructura)_

- [x] 2. Implementar funciones de utilidad para el loader

  - Usar función existente `getUserOrNull` para obtener usuario de la sesión
  - Crear función `getUserWithPlan` para obtener usuario con información del plan
  - Crear función `getChatbotById` para cargar chatbot específico con validación de ownership
  - Crear función `getFirstActiveChatbot` para obtener primer chatbot activo del usuario
  - Crear función `createDefaultChatbot` para crear chatbot por defecto si no existe
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 3. Implementar funciones de configuración y límites de plan

  - Crear función `getAvailableModels` que filtre modelos según el plan del usuario (validateUserAIModelAccess)
  - Crear función `getAvailablePersonalities` para obtener personalidades disponibles (constante en loader)
  - Crear función `getPlanLimits` para obtener límites específicos del plan (getUserPlanFeatures)
  - Implementar constantes de configuración para planes FREE y PRO (Plans.FREE, Plans.PRO)
  - _Requirements: 6.1, 6.2, 6.5_

- [x] 4. Actualizar el loader de la ruta chat/config

  - Modificar el loader existente para usar las funciones de utilidad creadas
  - Implementar manejo de parámetros de URL para chatbotId
  - Añadir validación de permisos y redirección si no hay acceso
  - Implementar carga de datos reales desde la base de datos
  - Añadir manejo de errores 404 para chatbots no encontrados
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 5. Implementar handlers para las acciones del formulario usando Effect

  - Crear handler `handleUpdateChatbotEffect` para actualizar configuración
  - Crear handler `handleToggleStatusEffect` para cambiar estado activo/inactivo
  - Usar Effect.tryPromise para validación y operaciones async
  - Implementar Effect.catchAll para manejo robusto de errores
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.4_

- [x] 6. Implementar sistema de validación de datos con Effect.Schema

  - Crear schema `chatbotConfigEffectSchema` usando Effect.Schema
  - Implementar validación de nombre, modelo, temperatura, prompt, color, etc.
  - Crear función `validateChatbotDataEffect` que use el schema y los límites de plan
  - _Requirements: 2.1, 2.3, 6.4, 6.5_

- [x] 7. Crear hook personalizado para manejo de formulario con Effect

  - Implementar hook `useManualSave` con estado de formulario
  - Añadir tracking de cambios sin guardar (`hasChanges`)
  - Crear función `handleChange` para actualizar campos individuales
  - Implementar función `handleSave` usando Effect.pipe para validación y llamada a API
  - Usar Effect.sync para validación síncrona y Effect.tryPromise para operaciones async
  - Implementar Effect.catchAll para manejo robusto de errores de validación y guardado
  - Usar Effect.ensuring para cleanup del estado de loading
  - Añadir función `resetChanges` para descartar modificaciones
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8. Actualizar componente principal ChatConfig

  - Reemplazar estado local con el hook `useManualSave`
  - Conectar formulario con datos reales del loader
  - Implementar manejo de errores de validación en la UI
  - Añadir indicadores visuales para cambios sin guardar
  - Actualizar botón "Guardar cambios" con estado dinámico
  - _Requirements: 7.1, 7.5, 8.1, 8.5_

- [x] 9. Implementar preview en tiempo real

  - Conectar cambios de nombre con preview del chatbot
  - Actualizar colores del avatar y botones según primaryColor
  - Mostrar mensaje de bienvenida actualizado en preview
  - Implementar actualización de personalidad en preview
  - Mantener funcionalidad de scroll e interacción en preview
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 9. Añadir sistema de feedback visual

  - [x] 9.1 Implementar indicadores de estado de guardado

    - Mostrar spinner en botón durante guardado
    - Añadir mensaje de éxito temporal (3 segundos)
    - Implementar mensajes de error específicos
    - Crear indicador visual para cambios sin guardar
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [x] 9.2 Crear componente de mensajes de validación
    - Implementar componente `ValidationMessage` para errores y warnings
    - Añadir iconos apropiados para cada tipo de mensaje
    - Integrar mensajes en cada campo del formulario
    - Implementar colores y estilos consistentes con el tema
    - _Requirements: 2.3, 8.3, 8.4_

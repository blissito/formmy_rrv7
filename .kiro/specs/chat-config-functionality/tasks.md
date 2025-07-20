# Implementation Plan

- [ ] 1. Configurar Effect para manejo de errores y operaciones asíncronas

  - Instalar dependencia `effect` si no está disponible
  - Importar `Effect` y `pipe` en los archivos necesarios
  - Configurar tipos TypeScript para Effect si es necesario
  - _Requirements: Todas (infraestructura)_

- [ ] 2. Implementar funciones de utilidad para el loader

  - Usar función existente `getUserOrNull` para obtener usuario de la sesión
  - Crear función `getUserWithPlan` para obtener usuario con información del plan
  - Crear función `getChatbotById` para cargar chatbot específico con validación de ownership
  - Crear función `getFirstActiveChatbot` para obtener primer chatbot activo del usuario
  - Crear función `createDefaultChatbot` para crear chatbot por defecto si no existe
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [ ] 3. Implementar funciones de configuración y límites de plan

  - Crear función `getAvailableModels` que filtre modelos según el plan del usuario
  - Crear función `getAvailablePersonalities` para obtener personalidades disponibles
  - Crear función `getPlanLimits` para obtener límites específicos del plan
  - Implementar constantes de configuración para planes FREE y PRO
  - _Requirements: 6.1, 6.2, 6.5_

- [ ] 3. Actualizar el loader de la ruta chat/config

  - Modificar el loader existente para usar las funciones de utilidad creadas
  - Implementar manejo de parámetros de URL para chatbotId
  - Añadir validación de permisos y redirección si no hay acceso
  - Implementar carga de datos reales desde la base de datos
  - Añadir manejo de errores 404 para chatbots no encontrados
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 4. Implementar handlers para las acciones del formulario usando Effect

  - [ ] 4.1 Crear handler `handleUpdateChatbotEffect` para actualizar configuración

    - Usar Effect.tryPromise para validación de datos del formulario
    - Implementar Effect.flatMap para validación de límites de plan
    - Crear pipeline Effect para actualizar chatbot en la base de datos
    - Usar Effect.catchAll para manejo robusto de errores
    - Implementar respuesta con datos actualizados o errores usando Effect.map
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.4_

  - [ ] 4.2 Crear handler `handleToggleStatusEffect` para cambiar estado activo/inactivo
    - Usar Effect.tryPromise para cargar chatbot y validar ownership
    - Implementar Effect.flatMap para alternar entre ACTIVE e INACTIVE
    - Crear pipeline Effect para actualizar estado en base de datos
    - Usar Effect.catchAll para manejo específico de errores
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [ ] 5. Implementar sistema de validación de datos con Zod

  - Crear schema `chatbotConfigSchema` usando Zod siguiendo el patrón del proyecto
  - Implementar validación de nombre (2-50 caracteres)
  - Añadir validación de modelo de IA con superRefine según plan del usuario
  - Implementar validación de temperatura (0-1) con números
  - Crear validación de longitud de prompt (máximo 4000 caracteres)
  - Añadir validación de color primario (formato hex válido con regex)
  - Crear función `validateChatbotData` que use el schema con límites de plan
  - _Requirements: 2.1, 2.3, 6.4, 6.5_

- [ ] 6. Crear hook personalizado para manejo de formulario con Effect

  - Implementar hook `useManualSave` con estado de formulario
  - Añadir tracking de cambios sin guardar (`hasChanges`)
  - Crear función `handleChange` para actualizar campos individuales
  - Implementar función `handleSave` usando Effect.pipe para validación y llamada a API
  - Usar Effect.sync para validación síncrona y Effect.tryPromise para operaciones async
  - Implementar Effect.catchAll para manejo robusto de errores de validación y guardado
  - Usar Effect.ensuring para cleanup del estado de loading
  - Añadir función `resetChanges` para descartar modificaciones
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 7. Actualizar componente principal ChatConfig

  - Reemplazar estado local con el hook `useManualSave`
  - Conectar formulario con datos reales del loader
  - Implementar manejo de errores de validación en la UI
  - Añadir indicadores visuales para cambios sin guardar
  - Actualizar botón "Guardar cambios" con estado dinámico
  - _Requirements: 7.1, 7.5, 8.1, 8.5_

- [ ] 8. Implementar preview en tiempo real

  - Conectar cambios de nombre con preview del chatbot
  - Actualizar colores del avatar y botones según primaryColor
  - Mostrar mensaje de bienvenida actualizado en preview
  - Implementar actualización de personalidad en preview
  - Mantener funcionalidad de scroll e interacción en preview
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 9. Añadir sistema de feedback visual

  - [ ] 9.1 Implementar indicadores de estado de guardado

    - Mostrar spinner en botón durante guardado
    - Añadir mensaje de éxito temporal (3 segundos)
    - Implementar mensajes de error específicos
    - Crear indicador visual para cambios sin guardar
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [ ] 9.2 Crear componente de mensajes de validación
    - Implementar componente `ValidationMessage` para errores y warnings
    - Añadir iconos apropiados para cada tipo de mensaje
    - Integrar mensajes en cada campo del formulario
    - Implementar colores y estilos consistentes con el tema
    - _Requirements: 2.3, 8.3, 8.4_

- [ ] 10. Implementar navegación entre pestañas

  - Mantener funcionalidad existente de cambio de pestañas
  - Añadir modal de confirmación para cambios sin guardar
  - Implementar alerta del navegador para cierre de página
  - Crear lógica para mostrar contenido específico por pestaña
  - _Requirements: 5.1, 5.2, 7.6, 7.7_

- [ ] 11. Añadir manejo de límites de plan en la UI

  - Filtrar modelos de IA disponibles según plan en dropdown
  - Mostrar mensajes de upgrade para funcionalidades PRO
  - Implementar validación visual antes de permitir cambios
  - Añadir tooltips informativos sobre limitaciones del plan
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [ ] 12. Implementar manejo de errores y casos edge

  - Añadir error boundary para capturar errores de componentes
  - Implementar fallbacks apropiados para errores de carga
  - Crear manejo de errores de conectividad
  - Añadir logging de errores para debugging
  - Implementar recuperación graceful de errores
  - _Requirements: 1.5, 2.4, 3.5, 7.8_

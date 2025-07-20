# Requirements Document

## Introduction

Este documento define los requisitos para implementar la funcionalidad completa de la pantalla de configuración del chatbot (`chat/config`). La pantalla ya existe con la interfaz de usuario, pero necesita ser conectada con los modelos de datos existentes y la lógica de negocio para permitir a los usuarios configurar completamente sus chatbots.

## Requirements

### Requirement 1

**User Story:** Como usuario, quiero cargar y editar la configuración de mi chatbot existente en la pantalla de configuración, para poder personalizar su apariencia y comportamiento.

#### Acceptance Criteria

1. WHEN accedo a la ruta `/chat/config/:chatbotId` THEN el sistema SHALL cargar los datos del chatbot específico desde la base de datos
2. WHEN no proporciono un chatbotId THEN el sistema SHALL cargar el primer chatbot activo del usuario
3. WHEN no tengo chatbots THEN el sistema SHALL redirigir a una página de creación de chatbot
4. WHEN cargo la configuración THEN el sistema SHALL mostrar todos los campos pre-poblados con los valores actuales
5. WHEN el chatbot no existe o no me pertenece THEN el sistema SHALL mostrar error 404

### Requirement 2

**User Story:** Como usuario, quiero guardar los cambios de configuración de mi chatbot en tiempo real, para que mis modificaciones se persistan inmediatamente.

#### Acceptance Criteria

1. WHEN modifico cualquier campo de configuración THEN el sistema SHALL validar los datos antes de guardar
2. WHEN guardo cambios válidos THEN el sistema SHALL actualizar la base de datos y mostrar confirmación
3. WHEN hay errores de validación THEN el sistema SHALL mostrar mensajes específicos por campo
4. WHEN falla el guardado THEN el sistema SHALL mostrar error y mantener los datos en el formulario
5. WHEN guardo exitosamente THEN el sistema SHALL actualizar el preview en tiempo real

### Requirement 3

**User Story:** Como usuario, quiero alternar el estado activo/inactivo de mi chatbot desde la configuración, para controlar cuándo está disponible para los visitantes.

#### Acceptance Criteria

1. WHEN activo el toggle de estado THEN el sistema SHALL cambiar el estado del chatbot a "ACTIVE"
2. WHEN desactivo el toggle THEN el sistema SHALL cambiar el estado a "INACTIVE"
3. WHEN el chatbot está inactivo THEN el sistema SHALL mostrar indicador visual claro
4. WHEN cambio el estado THEN el sistema SHALL actualizar inmediatamente sin recargar la página
5. WHEN hay error al cambiar estado THEN el sistema SHALL revertir el toggle y mostrar error

### Requirement 4

**User Story:** Como usuario, quiero ver un preview en tiempo real de cómo se verá mi chatbot, para visualizar los cambios antes de que los visitantes los vean.

#### Acceptance Criteria

1. WHEN cambio el nombre del chatbot THEN el preview SHALL actualizar el nombre inmediatamente
2. WHEN cambio el color primario THEN el preview SHALL actualizar los colores del avatar y botones
3. WHEN cambio el mensaje de bienvenida THEN el preview SHALL mostrar el nuevo mensaje
4. WHEN cambio la personalidad THEN el preview SHALL reflejar el cambio en el avatar o indicadores
5. WHEN el preview se actualiza THEN el sistema SHALL mantener la funcionalidad de scroll y interacción

### Requirement 5

**User Story:** Como usuario, quiero navegar entre diferentes pestañas de configuración del chatbot, para acceder a diferentes aspectos de la configuración.

#### Acceptance Criteria

1. WHEN hago clic en una pestaña THEN el sistema SHALL cambiar la vista sin recargar la página
2. WHEN estoy en la pestaña "Preview" THEN el sistema SHALL mostrar la configuración básica y preview
3. WHEN accedo a "Conversaciones" THEN el sistema SHALL mostrar el historial de conversaciones
4. WHEN accedo a "Entrenamiento" THEN el sistema SHALL mostrar la gestión de contextos
5. WHEN accedo a "Código" THEN el sistema SHALL mostrar el código de embebido

### Requirement 6

**User Story:** Como usuario, quiero que el sistema valide mis límites de plan al configurar el chatbot, para entender qué funcionalidades están disponibles según mi suscripción.

#### Acceptance Criteria

1. WHEN soy usuario FREE THEN el sistema SHALL mostrar solo modelos de IA básicos en el dropdown
2. WHEN soy usuario PRO THEN el sistema SHALL mostrar todos los modelos de IA disponibles
3. WHEN intento usar funcionalidades PRO siendo FREE THEN el sistema SHALL mostrar mensaje de upgrade
4. WHEN cambio configuración THEN el sistema SHALL validar límites antes de guardar
5. WHEN excedo límites THEN el sistema SHALL mostrar error específico con información del plan

### Requirement 7

**User Story:** Como usuario, quiero que la configuración se guarde automáticamente cuando hago cambios, para no perder mi trabajo si olvido guardar manualmente.

#### Acceptance Criteria

1. WHEN modifico un campo THEN el sistema SHALL esperar 2 segundos de inactividad antes de auto-guardar
2. WHEN hay auto-guardado en progreso THEN el sistema SHALL mostrar indicador de "Guardando..." junto al campo modificado
3. WHEN el auto-guardado es exitoso THEN el sistema SHALL mostrar confirmación sutil con checkmark verde por 2 segundos
4. WHEN falla el auto-guardado THEN el sistema SHALL mostrar error específico y mantener el botón "Guardar cambios" habilitado para guardado manual
5. WHEN hay cambios sin guardar THEN el sistema SHALL mostrar punto naranja junto al nombre del chatbot en el header
6. WHEN el usuario navega a otra pestaña con cambios pendientes THEN el sistema SHALL mostrar modal de confirmación
7. WHEN el usuario intenta cerrar la página con cambios sin guardar THEN el sistema SHALL mostrar alerta del navegador
8. WHEN hay múltiples campos modificados THEN el sistema SHALL agrupar los cambios en una sola llamada de auto-guardado
9. WHEN el auto-guardado falla por problemas de conectividad THEN el sistema SHALL reintentar automáticamente hasta 3 veces con intervalos crecientes

### Requirement 8

**User Story:** Como usuario, quiero recibir feedback visual inmediato sobre el estado de mis acciones, para entender si mis cambios se están procesando correctamente.

#### Acceptance Criteria

1. WHEN guardo cambios THEN el sistema SHALL mostrar spinner o indicador de carga
2. WHEN la operación es exitosa THEN el sistema SHALL mostrar mensaje de éxito por 3 segundos
3. WHEN hay error THEN el sistema SHALL mostrar mensaje de error específico
4. WHEN hay validaciones pendientes THEN el sistema SHALL mostrar indicadores en los campos afectados
5. WHEN el sistema está procesando THEN el sistema SHALL deshabilitar botones relevantes temporalmente

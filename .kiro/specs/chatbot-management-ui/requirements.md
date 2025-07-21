# Requirements Document

## Introduction

Este documento define los requisitos para implementar las pantallas de gestión de chatbots que permitan a los usuarios listar, crear, editar y gestionar sus chatbots de manera intuitiva. El sistema se construirá sobre los modelos de datos ya implementados y la funcionalidad de configuración existente, añadiendo las rutas y vistas necesarias para una experiencia completa de gestión.

## Requirements

### Requirement 1

**User Story:** Como usuario, quiero ver una lista de todos mis chatbots con información básica y acciones rápidas, para poder gestionar múltiples bots de manera eficiente.

#### Acceptance Criteria

1. WHEN accedo a la ruta `/chat` THEN el sistema SHALL mostrar una lista de todos mis chatbots
2. WHEN no tengo chatbots THEN el sistema SHALL mostrar un estado vacío con opción de crear el primer chatbot
3. WHEN veo la lista THEN el sistema SHALL mostrar nombre, estado, fecha de creación y acciones para cada chatbot
4. WHEN un chatbot está activo THEN el sistema SHALL mostrar indicador visual verde
5. WHEN un chatbot está inactivo THEN el sistema SHALL mostrar indicador visual gris
6. WHEN hago clic en "Editar" THEN el sistema SHALL navegar a la pantalla de configuración del chatbot
7. WHEN hago clic en "Ver conversaciones" THEN el sistema SHALL navegar al historial de conversaciones
8. WHEN soy usuario FREE con 1 chatbot THEN el sistema SHALL deshabilitar el botón "Crear nuevo"

### Requirement 2

**User Story:** Como usuario, quiero crear un nuevo chatbot desde la vista de lista, para poder añadir bots adicionales a mi cuenta.

#### Acceptance Criteria

1. WHEN hago clic en "Crear nuevo chatbot" THEN el sistema SHALL mostrar un modal de creación
2. WHEN completo el formulario de creación THEN el sistema SHALL validar los datos antes de crear
3. WHEN creo exitosamente THEN el sistema SHALL redirigir a la configuración del nuevo chatbot
4. WHEN soy usuario FREE y ya tengo 1 chatbot THEN el sistema SHALL mostrar mensaje de upgrade
5. WHEN soy usuario FREE y intento crear un segundo chatbot THEN el action SHALL validar límites y retornar error específico
6. WHEN el action detecta exceso de límite THEN el sistema SHALL mostrar error con opción de upgrade a PRO
7. WHEN hay errores de validación THEN el sistema SHALL mostrar errores específicos en el modal

### Requirement 3

**User Story:** Como usuario, quiero acciones rápidas en la lista de chatbots, para poder activar/desactivar y eliminar bots sin entrar a la configuración.

#### Acceptance Criteria

1. WHEN hago clic en el toggle de estado THEN el sistema SHALL cambiar entre activo/inactivo inmediatamente
2. WHEN activo un chatbot THEN el sistema SHALL actualizar el indicador visual sin recargar
3. WHEN hago clic en eliminar THEN el sistema SHALL mostrar confirmación antes de proceder
4. WHEN confirmo eliminación THEN el sistema SHALL remover el chatbot y actualizar la lista
5. WHEN hay error en las acciones THEN el sistema SHALL mostrar mensaje de error y revertir cambios

### Requirement 4

**User Story:** Como usuario, quiero navegar desde la lista de chatbots a la vista de detalle/configuración existente, para gestionar cada bot individualmente.

#### Acceptance Criteria

1. WHEN hago clic en "Editar" desde la lista THEN el sistema SHALL navegar a `/chat/config/:chatbotId`
2. WHEN estoy en `/chat/config` THEN el sistema SHALL cargar la vista de detalle/configuración existente
3. WHEN accedo a `/chat/config` sin chatbotId THEN el sistema SHALL cargar el primer chatbot activo
4. WHEN vuelvo a la lista desde `/chat/config` THEN el sistema SHALL navegar a `/chat`
5. WHEN el chatbot no existe o no me pertenece THEN el sistema SHALL mostrar error 404

### Requirement 5

**User Story:** Como usuario, quiero una vista de edición completa para configurar todos los aspectos de mi chatbot, para personalizar su comportamiento y apariencia.

#### Acceptance Criteria

1. WHEN accedo a `/chat/config/:chatbotId` THEN el sistema SHALL mostrar un formulario con todas las configuraciones del chatbot
2. WHEN edito la configuración THEN el sistema SHALL validar los datos en tiempo real
3. WHEN guardo los cambios THEN el sistema SHALL actualizar la configuración sin recargar la página
4. WHEN hay errores de validación THEN el sistema SHALL mostrar mensajes específicos junto a cada campo
5. WHEN cambio entre pestañas de configuración THEN el sistema SHALL preservar los cambios no guardados
6. WHEN intento salir con cambios no guardados THEN el sistema SHALL mostrar una advertencia
7. WHEN actualizo configuraciones avanzadas THEN el sistema SHALL mostrar indicadores de progreso durante el procesamiento

### Requirement 6

**User Story:** Como usuario, quiero que la vista de edición tenga secciones organizadas por tipo de configuración, para encontrar y modificar ajustes específicos fácilmente.

#### Acceptance Criteria

1. WHEN accedo a la vista de edición THEN el sistema SHALL mostrar pestañas para "General", "Personalización", "Conocimiento" y "Avanzado"
2. WHEN selecciono la pestaña "General" THEN el sistema SHALL mostrar configuraciones básicas (nombre, descripción, estado)
3. WHEN selecciono la pestaña "Personalización" THEN el sistema SHALL mostrar opciones de apariencia y comportamiento
4. WHEN selecciono la pestaña "Conocimiento" THEN el sistema SHALL mostrar gestión de fuentes de conocimiento
5. WHEN selecciono la pestaña "Avanzado" THEN el sistema SHALL mostrar configuraciones técnicas y de integración
6. WHEN cambio entre pestañas THEN el sistema SHALL mantener el estado de cada formulario

# Requirements Document

## Introduction

Este documento define los requisitos para implementar los nuevos modelos de datos del sistema de chatbot de Formmy. El chatbot será una funcionalidad separada que permitirá a los usuarios crear bots con personalidad propia y conocimiento específico de su marca, embebibles en sitios web y exportables a plataformas como WhatsApp y Telegram.

## Requirements

### Requirement 1

**User Story:** Como usuario de Formmy, quiero crear y gestionar chatbots personalizados para mi marca, para que mis visitantes puedan interactuar con un asistente que conoce mi negocio.

#### Acceptance Criteria

1. WHEN un usuario FREE crea un chatbot THEN el sistema SHALL permitir solo un chatbot activo por usuario
2. WHEN un usuario PRO crea chatbots THEN el sistema SHALL permitir múltiples chatbots sin límite específico
3. WHEN se crea un chatbot THEN el sistema SHALL generar un slug único para embebido
4. WHEN se configura un chatbot THEN el sistema SHALL permitir definir nombre, personalidad, mensaje de bienvenida y tema visual
5. WHEN se configura un chatbot THEN el sistema SHALL permitir seleccionar entre diferentes modelos de IA según el plan del usuario

### Requirement 2

**User Story:** Como usuario, quiero subir archivos y enlaces para entrenar mi chatbot con información específica de mi marca, para que pueda responder preguntas relevantes sobre mi negocio.

#### Acceptance Criteria

1. WHEN subo archivos de contexto THEN el sistema SHALL trackear nombre, tamaño, fecha de subida y tipo de archivo
2. WHEN subo contexto THEN el sistema SHALL validar límites de KB según mi plan (FREE vs PRO)
3. WHEN agrego enlaces THEN el sistema SHALL almacenar la URL y metadatos básicos
4. WHEN el contexto excede límites THEN el sistema SHALL mostrar error específico con límites actuales
5. WHEN elimino archivos de contexto THEN el sistema SHALL actualizar el contador de KB utilizados

### Requirement 3

**User Story:** Como visitante de un sitio web, quiero conversar con el chatbot y recibir respuestas relevantes, para obtener información sobre la marca o negocio.

#### Acceptance Criteria

1. WHEN inicio una conversación THEN el sistema SHALL crear una nueva sesión de chat
2. WHEN envío mensajes THEN el sistema SHALL guardar todo el historial de la conversación
3. WHEN el bot responde THEN el sistema SHALL trackear la respuesta y timestamp
4. WHEN hay muchas solicitudes desde mi IP THEN el sistema SHALL aplicar rate limiting básico
5. WHEN la conversación termina THEN el sistema SHALL marcar la sesión como completada

### Requirement 4

**User Story:** Como usuario, quiero configurar integraciones básicas con plataformas externas como WhatsApp y Telegram, para preparar la futura conexión con estos canales.

#### Acceptance Criteria

1. WHEN configuro una integración THEN el sistema SHALL crear un registro con plataforma, token y estado
2. WHEN activo/desactivo una integración THEN el sistema SHALL actualizar el campo isActive
3. WHEN elimino una integración THEN el sistema SHALL remover el registro completamente
4. WHEN consulto integraciones THEN el sistema SHALL mostrar todas las configuradas para el chatbot

### Requirement 5

**User Story:** Como usuario, quiero controlar el estado de mi chatbot y poder probarlo antes de activarlo, para asegurarme de que funciona correctamente.

#### Acceptance Criteria

1. WHEN creo un chatbot THEN el sistema SHALL iniciarlo en estado "draft" por defecto
2. WHEN activo un chatbot THEN el sistema SHALL cambiar el estado a "active" y hacerlo público
3. WHEN desactivo un chatbot THEN el sistema SHALL cambiar a "inactive" y dejar de responder
4. WHEN estoy en modo "draft" THEN el sistema SHALL permitir testing sin afectar métricas públicas
5. WHEN cambio configuración THEN el sistema SHALL mantener el estado actual del bot

### Requirement 6

**User Story:** Como usuario, quiero exportar las conversaciones de mi chatbot en diferentes formatos, para analizar las interacciones y integrar con mis herramientas de análisis.

#### Acceptance Criteria

1. WHEN solicito exportar conversaciones THEN el sistema SHALL generar archivo en formato solicitado (CSV, JSON)
2. WHEN exporto datos THEN el sistema SHALL incluir timestamps, mensajes y metadatos básicos
3. WHEN hay muchas conversaciones THEN el sistema SHALL permitir filtrar por fechas
4. WHEN exporto a servicios externos THEN el sistema SHALL permitir descarga directa por ahora
5. WHEN falla la exportación THEN el sistema SHALL mostrar error específico y permitir reintentar

### Requirement 7

**User Story:** Como usuario FREE, quiero tener funcionalidad básica del chatbot con branding de Formmy, mientras que como usuario PRO quiero funcionalidad completa sin branding.

#### Acceptance Criteria

1. WHEN soy usuario FREE THEN el sistema SHALL mostrar branding sutil de Formmy en el widget
2. WHEN soy usuario PRO THEN el sistema SHALL ocultar completamente el branding de Formmy
3. WHEN soy usuario FREE THEN el sistema SHALL limitar modelos de IA disponibles
4. WHEN soy usuario PRO THEN el sistema SHALL dar acceso a todos los modelos de IA
5. WHEN soy usuario FREE THEN el sistema SHALL limitar KB de contexto permitido

### Requirement 8

**User Story:** Como sistema, necesito trackear el uso de los chatbots para facturación y límites, de manera simple y predecible.

#### Acceptance Criteria

1. WHEN se inicia una conversación THEN el sistema SHALL contar como una interacción facturable
2. WHEN una conversación termina por timeout THEN el sistema SHALL marcarla como completada
3. WHEN se alcanza límite mensual THEN el sistema SHALL pausar el bot y notificar al usuario
4. WHEN se reinicia el mes THEN el sistema SHALL resetear contadores de uso
5. WHEN hay error en tracking THEN el sistema SHALL registrar el error sin afectar la funcionalidad del bot

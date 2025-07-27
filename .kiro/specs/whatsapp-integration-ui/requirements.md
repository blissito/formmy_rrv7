# Requirements Document

## Introduction

Esta funcionalidad permitirá a los usuarios conectar sus chatbots con WhatsApp Business API de manera completa y funcional. Los usuarios podrán configurar, activar, y gestionar integraciones de WhatsApp directamente desde la interfaz de usuario, incluyendo el procesamiento bidireccional de mensajes entre WhatsApp y el chatbot.

## Requirements

### Requirement 1

**User Story:** Como usuario del chatbot, quiero poder conectar mi chatbot con WhatsApp Business API, para que mis clientes puedan interactuar con el chatbot a través de WhatsApp.

#### Acceptance Criteria

1. WHEN el usuario hace clic en "Conectar" en la tarjeta de WhatsApp THEN el sistema SHALL mostrar un modal de configuración
2. WHEN el usuario ingresa Phone Number ID, Access Token, y Business Account ID THEN el sistema SHALL validar que los campos no estén vacíos
3. WHEN el usuario envía el formulario con datos válidos THEN el sistema SHALL crear una nueva integración en la base de datos
4. WHEN la integración se crea exitosamente THEN el sistema SHALL mostrar un mensaje de confirmación
5. IF la integración falla al crearse THEN el sistema SHALL mostrar un mensaje de error específico

### Requirement 2

**User Story:** Como usuario del chatbot, quiero poder ver el estado de mis integraciones de WhatsApp, para saber si están funcionando correctamente.

#### Acceptance Criteria

1. WHEN el usuario ve la tarjeta de WhatsApp THEN el sistema SHALL mostrar el estado actual (Conectado/Desconectado)
2. WHEN existe una integración activa THEN el sistema SHALL mostrar información de la conexión (nombre, última actividad)
3. WHEN hay errores de conexión THEN el sistema SHALL mostrar indicadores visuales de error
4. WHEN el usuario hace clic en una integración existente THEN el sistema SHALL mostrar opciones para editar o desconectar

### Requirement 3

**User Story:** Como usuario del chatbot, quiero poder gestionar mis integraciones de WhatsApp (editar, activar/desactivar, eliminar), para mantener control sobre las conexiones.

#### Acceptance Criteria

1. WHEN el usuario selecciona "Editar" en una integración THEN el sistema SHALL mostrar el modal con los datos actuales pre-cargados
2. WHEN el usuario actualiza los datos de configuración THEN el sistema SHALL validar y guardar los cambios
3. WHEN el usuario activa/desactiva una integración THEN el sistema SHALL cambiar el estado isActive en la base de datos
4. WHEN el usuario elimina una integración THEN el sistema SHALL solicitar confirmación antes de proceder
5. IF el usuario confirma la eliminación THEN el sistema SHALL remover la integración de la base de datos

### Requirement 4

**User Story:** Como usuario del chatbot, quiero poder probar la conexión de WhatsApp, para verificar que la configuración es correcta antes de activarla.

#### Acceptance Criteria

1. WHEN el usuario hace clic en "Probar conexión" THEN el sistema SHALL intentar enviar un mensaje de prueba usando la API de WhatsApp
2. WHEN la prueba es exitosa THEN el sistema SHALL mostrar un mensaje de confirmación con detalles de la conexión
3. IF la prueba falla THEN el sistema SHALL mostrar el error específico devuelto por la API de WhatsApp
4. WHEN se realiza una prueba THEN el sistema SHALL registrar el resultado en los logs para debugging

### Requirement 5

**User Story:** Como sistema, quiero procesar mensajes entrantes de WhatsApp y responder con el chatbot, para proporcionar una experiencia de chat bidireccional.

#### Acceptance Criteria

1. WHEN WhatsApp envía un webhook con un mensaje entrante THEN el sistema SHALL validar la firma del webhook
2. WHEN el webhook es válido THEN el sistema SHALL extraer el mensaje y identificar el chatbot correspondiente
3. WHEN se identifica el chatbot THEN el sistema SHALL procesar el mensaje usando el motor de IA del chatbot
4. WHEN el chatbot genera una respuesta THEN el sistema SHALL enviar la respuesta de vuelta a WhatsApp
5. IF ocurre un error en el procesamiento THEN el sistema SHALL registrar el error y opcionalmente enviar un mensaje de error al usuario

### Requirement 6

**User Story:** Como desarrollador, quiero tener endpoints API bien estructurados para manejar integraciones, para facilitar el mantenimiento y testing del sistema.

#### Acceptance Criteria

1. WHEN se accede a la ruta de integraciones THEN el sistema SHALL proporcionar operaciones CRUD completas
2. WHEN se realiza una operación POST THEN el sistema SHALL crear una nueva integración con validación
3. WHEN se realiza una operación GET THEN el sistema SHALL retornar las integraciones del chatbot específico
4. WHEN se realiza una operación PUT THEN el sistema SHALL actualizar la integración existente
5. WHEN se realiza una operación DELETE THEN el sistema SHALL eliminar la integración de manera segura

### Requirement 7

**User Story:** Como sistema, quiero manejar webhooks de WhatsApp de manera segura y eficiente, para procesar mensajes entrantes sin interrupciones.

#### Acceptance Criteria

1. WHEN se recibe un webhook de WhatsApp THEN el sistema SHALL verificar la firma usando el webhook verify token
2. WHEN la verificación es exitosa THEN el sistema SHALL procesar el payload del webhook
3. WHEN se procesa el webhook THEN el sistema SHALL responder con status 200 dentro de 20 segundos
4. IF la verificación falla THEN el sistema SHALL responder con status 401 y registrar el intento
5. WHEN se procesa un mensaje THEN el sistema SHALL crear o actualizar la conversación correspondiente en la base de datos

### Requirement 8

**User Story:** Como usuario del chatbot, quiero que mis conversaciones de WhatsApp se integren con el historial del chatbot, para tener un registro completo de las interacciones.

#### Acceptance Criteria

1. WHEN se recibe un mensaje de WhatsApp THEN el sistema SHALL crear o encontrar la conversación existente
2. WHEN se procesa el mensaje THEN el sistema SHALL guardarlo en la tabla de mensajes con el rol USER
3. WHEN el chatbot responde THEN el sistema SHALL guardar la respuesta con el rol ASSISTANT
4. WHEN se guarda un mensaje THEN el sistema SHALL actualizar los contadores de uso del chatbot
5. WHEN se visualiza el historial THEN el sistema SHALL mostrar los mensajes de WhatsApp integrados con otros canales

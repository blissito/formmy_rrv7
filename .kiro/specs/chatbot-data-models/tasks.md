# Implementation Plan

- [x] 1. Actualizar el esquema de Prisma con los nuevos modelos

  - Añadir los nuevos modelos al archivo schema.prisma
  - Definir relaciones entre modelos existentes y nuevos
  - Crear enums necesarios
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 2. Implementar el modelo Chatbot

  - [x] 2.1 Definir el modelo Chatbot con campos básicos

    - Implementar campos de configuración (nombre, slug, personalidad)
    - Añadir tipo embebido ContextItem para almacenar contextos
    - Implementar campos de estado y tracking
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 2.2 Implementar validaciones para límites por plan
    - Crear función para validar número de chatbots por usuario
    - Implementar validación de modelos disponibles según plan
    - Añadir lógica para mostrar/ocultar branding según plan
    - _Requirements: 1.1, 1.2, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 3. Implementar gestión de contexto

  - [x] 3.1 Crear funciones para añadir contexto al chatbot

    - Implementar lógica para añadir archivos como contexto
    - Implementar lógica para añadir URLs como contexto
    - Implementar lógica para añadir texto como contexto
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.2 Implementar validaciones de contexto
    - Validar tamaño máximo de contexto según plan
    - Validar tipos de archivo permitidos
    - Implementar contador de KB utilizados
    - _Requirements: 2.2, 2.4, 2.5_

- [x] 4. Implementar modelo de Conversation

  - [x] 4.1 Definir el modelo Conversation

    - Implementar campos para tracking de sesión
    - Añadir campos para información del visitante
    - Implementar estados de conversación
    - _Requirements: 3.1, 3.5_

  - [x] 4.2 Implementar lógica de conversaciones
    - Crear función para iniciar nueva conversación
    - Implementar tracking de conversaciones por chatbot
    - Añadir validación de límites mensuales
    - _Requirements: 3.1, 8.1, 8.2, 8.3, 8.4_

- [x] 5. Implementar modelo de Message

  - [x] 5.1 Definir el modelo Message

    - Implementar campos para contenido y rol
    - Añadir campos para tracking de tokens y tiempo
    - Establecer relación con Conversation
    - _Requirements: 3.2, 3.3_

  - [x] 5.2 Implementar lógica de mensajes
    - Crear función para añadir mensaje a conversación
    - Implementar contador de mensajes por conversación
    - Añadir rate limiting básico por IP
    - _Requirements: 3.2, 3.3, 3.4_

- [x] 6. Implementar modelo de Integration (simplificado)

  - Definir modelo Integration con campos básicos
  - Implementar enum para tipos de integración
  - Establecer relación con Chatbot
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7. Implementar estados del chatbot

  - Crear enum para estados (DRAFT, ACTIVE, INACTIVE, DELETED)
  - Implementar lógica para cambiar entre estados
  - Añadir validaciones según estado actual
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8. Implementar exportación de conversaciones

  - Crear función para exportar conversaciones a CSV
  - Crear función para exportar conversaciones a JSON
  - Implementar filtros por fecha
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [x] 9. Implementar tracking de uso para facturación

  - Crear contador de conversaciones por chatbot
  - Implementar reset mensual de contadores
  - Añadir lógica para pausar chatbot al alcanzar límites
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 10. Actualizar modelo User existente

  - Añadir relación con Chatbot
  - Implementar validaciones de plan
  - _Requirements: 1.1, 1.2, 7.3, 7.4, 7.5_

- [x] 11. Añadir endpoint e intent blocks, en la ruta app/routes/api/v1/chatbot.tsx

  - Añadir función action (de react router 7) usando formData.get('intent') para construir un arbol de if statements.
  - Crear todas las posibilidades (if, intent) para que el cliente pueda actualizar el chatbot fácilmente con fetch.
  - _Requirements: 1.1, 1.2, 7.3, 7.4, 7.5_

- [x] 12. Crear ruta de pruebas para los endpoints del chatbot
  - Crear ruta app/routes/chatbot-test.tsx para probar los endpoints
  - Implementar interfaz de usuario para probar todas las operaciones de la API
  - Usar componentes existentes del app para crear la pantalla de pruebas
  - Incluir formularios para probar cada intent de los diferentes endpoints
  - _Requirements: 1.1, 1.2, 7.3, 7.4, 7.5_

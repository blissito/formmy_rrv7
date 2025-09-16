# 🏗️ Arquitectura WhatsApp + Flowise Bridge

## 📊 Diagrama de Flujo Completo

```mermaid
graph TB
    %% Usuario y WhatsApp
    User[👤 Usuario WhatsApp]
    WA[📱 WhatsApp Business API<br/>Meta/Facebook]

    %% Cloudflare Worker
    subgraph CF["☁️ Cloudflare Edge (300+ ubicaciones)"]
        Worker[🔧 Worker Bridge<br/>formmy-whatsapp-bridge]

        subgraph Endpoints["📡 Endpoints"]
            EP1[GET /webhook<br/>Verificación]
            EP2[POST /webhook<br/>Mensajes]
            EP3[GET /health<br/>Status]
            EP4[POST /test<br/>Testing]
        end
    end

    %% Flowise
    subgraph Flowise["🤖 Flowise Instance"]
        FlowAPI[📋 Prediction API<br/>/api/v1/prediction/{id}]
        Agent[🧠 LlamaIndex Agent<br/>GPT-5 Nano + Tools]
        Memory[💾 Session Memory<br/>Chat History]
    end

    %% Flujo de datos
    User -->|1. Envía mensaje| WA
    WA -->|2. Webhook POST| EP2
    EP2 -->|3. Procesa mensaje| Worker
    Worker -->|4. API Call| FlowAPI
    FlowAPI -->|5. Ejecuta agent| Agent
    Agent -->|6. Respuesta AI| FlowAPI
    FlowAPI -->|7. JSON response| Worker
    Worker -->|8. Send message| WA
    WA -->|9. Entrega respuesta| User

    %% Configuración inicial
    WA -.->|Verificación inicial| EP1

    %% Testing
    Developer[👨‍💻 Developer] -.->|Testing| EP4
    Monitor[📊 Monitoring] -.->|Health check| EP3

    %% Estilos
    classDef user fill:#e1f5fe
    classDef whatsapp fill:#25d366,color:#fff
    classDef worker fill:#f97316,color:#fff
    classDef flowise fill:#8b5cf6,color:#fff
    classDef endpoint fill:#06b6d4,color:#fff

    class User user
    class WA whatsapp
    class Worker,CF worker
    class FlowAPI,Agent,Memory,Flowise flowise
    class EP1,EP2,EP3,EP4 endpoint
```

## 🔄 Secuencia Detallada de Procesamiento

```mermaid
sequenceDiagram
    participant U as 👤 Usuario
    participant WA as 📱 WhatsApp API
    participant W as 🔧 Worker
    participant F as 🤖 Flowise
    participant A as 🧠 Agent

    Note over U,A: Flujo de Mensaje Normal

    U->>WA: "Hola, ¿cómo crear un formulario?"
    WA->>W: POST /webhook<br/>{message, from, timestamp}

    Note over W: Extrae texto del mensaje
    W->>W: extractMessageText()

    Note over W: Prepara payload para Flowise
    W->>F: POST /api/v1/prediction/{id}<br/>{question, sessionId}

    Note over F: Enruta a LlamaIndex Agent
    F->>A: Procesa con context + tools
    A->>A: Ejecuta razonamiento + herramientas
    A->>F: Respuesta generada

    F->>W: {text: "Para crear un formulario..."}

    Note over W: Envía respuesta a WhatsApp
    W->>WA: POST /messages<br/>{to, text}
    WA->>U: "Para crear un formulario..."

    Note over U,A: Proceso completo < 2 segundos
```

## 🏭 Arquitectura de Componentes Internos

```mermaid
graph LR
    subgraph Worker["🔧 Cloudflare Worker (worker.js)"]
        subgraph Handler["🎯 Request Handlers"]
            H1[handleWhatsAppVerification]
            H2[handleWhatsAppMessage]
            H3[handleTestMessage]
        end

        subgraph Utils["🛠️ Utilities"]
            U1[extractMessageText]
            U2[callFlowise]
            U3[sendWhatsAppMessage]
        end

        subgraph Config["⚙️ Environment"]
            C1[FLOWISE_URL]
            C2[FLOWISE_CHATFLOW_ID]
            C3[WHATSAPP_TOKEN]
            C4[PHONE_NUMBER_ID]
        end
    end

    subgraph External["🌐 External APIs"]
        E1[📱 WhatsApp Graph API]
        E2[🤖 Flowise Prediction API]
    end

    H2 --> U1
    U1 --> U2
    U2 --> E2
    E2 --> U3
    U3 --> E1

    C1 --> U2
    C2 --> U2
    C3 --> U3
    C4 --> U3
```

## 🌍 Distribución Global

```mermaid
graph TB
    subgraph Global["🌍 Red Global Cloudflare"]
        subgraph NA["🇺🇸 Norte América"]
            NA1[Miami]
            NA2[Los Angeles]
            NA3[Toronto]
        end

        subgraph LATAM["🇲🇽 Latinoamérica"]
            MX1[Ciudad de México]
            MX2[Guadalajara]
            BR1[São Paulo]
        end

        subgraph EU["🇪🇺 Europa"]
            EU1[London]
            EU2[Frankfurt]
            EU3[Paris]
        end
    end

    subgraph Origin["🎯 Origin Servers"]
        F1[🤖 Flowise<br/>Fly.io Miami]
        WA1[📱 WhatsApp API<br/>Meta Global]
    end

    User1[👤 Usuario México] --> MX1
    User2[👤 Usuario Colombia] --> MX1
    User3[👤 Usuario Brasil] --> BR1

    MX1 --> F1
    BR1 --> F1

    MX1 --> WA1
    BR1 --> WA1
```

## 🔐 Flujo de Seguridad

```mermaid
graph TB
    subgraph Security["🔐 Capas de Seguridad"]
        S1[🛡️ HTTPS/TLS Encryption]
        S2[🔑 Environment Secrets]
        S3[✅ Webhook Verification]
        S4[🎫 API Key Authentication]
        S5[📊 Rate Limiting]
    end

    subgraph Validation["✅ Validaciones"]
        V1[Token Verification]
        V2[Message Structure]
        V3[Session ID Format]
        V4[Response Size Limits]
    end

    Internet[🌐 Internet] --> S1
    S1 --> S3
    S3 --> V1
    V1 --> Worker[🔧 Worker Logic]

    Worker --> S2
    S2 --> S4
    S4 --> Flowise[🤖 Flowise API]

    Worker --> S5
    S5 --> WhatsApp[📱 WhatsApp API]
```

## 📊 Métricas y Monitoreo

```mermaid
graph LR
    subgraph Metrics["📊 Métricas del Worker"]
        M1[⚡ Latency<br/>~300ms]
        M2[🔄 Requests/min<br/>Real-time]
        M3[❌ Error Rate<br/>< 1%]
        M4[💾 Memory Usage<br/>< 50MB]
    end

    subgraph Monitoring["👀 Monitoreo"]
        Mon1[📈 Cloudflare Analytics]
        Mon2[🔍 Real-time Logs]
        Mon3[🚨 Error Tracking]
        Mon4[📱 Uptime Monitoring]
    end

    Worker[🔧 Worker] --> M1
    Worker --> M2
    Worker --> M3
    Worker --> M4

    M1 --> Mon1
    M2 --> Mon2
    M3 --> Mon3
    M4 --> Mon4
```

## 🎛️ Configuración de Entornos

```mermaid
graph TB
    subgraph Development["🧪 Development"]
        DevWorker[Worker Dev<br/>localhost:8787]
        DevFlowise[Flowise Local<br/>localhost:3000]
        DevWA[WhatsApp Test<br/>Temporary Token]
    end

    subgraph Production["🚀 Production"]
        ProdWorker[Worker Prod<br/>*.workers.dev]
        ProdFlowise[Flowise Prod<br/>*.fly.dev]
        ProdWA[WhatsApp Business<br/>Verified Number]
    end

    Developer[👨‍💻 Developer] --> DevWorker
    DevWorker --> DevFlowise
    DevWorker --> DevWA

    Users[👥 Users] --> ProdWorker
    ProdWorker --> ProdFlowise
    ProdWorker --> ProdWA

    DevWorker -.->|Deploy| ProdWorker
```

## 🔄 Estados del Sistema

```mermaid
stateDiagram-v2
    [*] --> Idle: Worker desplegado
    Idle --> ReceivingMessage: Webhook POST
    ReceivingMessage --> ValidatingMessage: Extraer datos
    ValidatingMessage --> ProcessingFlowise: Mensaje válido
    ValidatingMessage --> Idle: Mensaje inválido
    ProcessingFlowise --> SendingResponse: Respuesta de Flowise
    ProcessingFlowise --> ErrorHandling: Error en Flowise
    SendingResponse --> Idle: WhatsApp entregado
    SendingResponse --> ErrorHandling: Error en WhatsApp
    ErrorHandling --> SendingError: Enviar mensaje de error
    SendingError --> Idle: Error notificado

    note right of ProcessingFlowise
        Timeout: 30 segundos
        Retry: 3 intentos
    end note

    note right of ErrorHandling
        Log error
        Notify user
        Don't retry webhook
    end note
```

---

## 📋 Resumen de la Arquitectura

### ⚡ **Edge Computing**
- **300+ ubicaciones** globales
- **0ms cold start** (siempre caliente)
- **Auto-scaling** infinito

### 🔄 **Request Flow**
1. Usuario → WhatsApp → Worker (300ms)
2. Worker → Flowise → Agent (500ms)
3. Agent → Worker → WhatsApp → Usuario (200ms)
4. **Total: ~1 segundo**

### 💰 **Costo Optimizado**
- Worker: **$0** (100K requests gratis)
- WhatsApp: **$0.0085/mensaje**
- Flowise: Según hosting

### 🛡️ **Seguridad Robusta**
- HTTPS/TLS encryption
- Environment secrets
- Webhook verification
- Rate limiting automático

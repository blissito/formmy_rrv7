# Plan Final Completo: Integración SAT - Sistema Inteligente de Recolección, Validación y Gestión Fiscal

**Fecha:** Enero 22, 2025
**Versión:** 1.0 Final
**Status:** ✅ APROBADO - Listo para implementación

---

## 🎯 Propuesta de Valor REAL

### Para el Contador:
- Clientes suben facturas 24/7 al chatbot (sin perseguir)
- Parseo automático gratis (XML/PDF simple)
- **Validación manual selectiva** (control total de créditos)
- **Contactos auto-extraídos** con validación SAT
- **Alertas de lista negra EFOS/EDOS**
- Dashboard organizado por cliente/proveedor
- Exporta directo a ContPaq/Aspel

### Para el Cliente del Contador:
- WhatsApp conversacional: "Súbeme esta factura de gasolina"
- Captura por voz: "Es deducible, proyecto Monterrey"
- Sin instalaciones, sin login
- Recibe recordatorios automáticos

---

## 🏗️ Arquitectura Completa

### 1. Endpoint Único con Intents

**`/api/v1/sat` - UN SOLO ENDPOINT**

```typescript
// Intents disponibles:
- upload          // Subir XML/PDF/Imagen
- validate        // Validar facturas seleccionadas (MANUAL)
- list            // Listar facturas
- get             // Obtener factura específica
- export          // Exportar Excel/ContPaq/JSON
- classify        // Clasificar con IA
- stats           // Métricas dashboard
- delete          // Eliminar factura
- contacts_list   // ⭐ Listar contactos
- contacts_sync   // ⭐ Sincronizar contacto con SAT
- contacts_upload // ⭐ Upload constancia fiscal
```

### 2. Parseo Inteligente 4 Niveles + Confianza

#### Nivel 1: XML Local (GRATIS ✅)
```typescript
import { XMLParser } from 'fast-xml-parser';

parseXML(file) {
  // Extracción perfecta, confianza 100%
  return {
    uuid, rfc, total, fecha, conceptos,
    confidence: 1.0,
    status: "APPROVED"
  }
}
```

#### Nivel 2: PDF Simple Local (GRATIS ✅)
```typescript
import pdf from 'pdf-parse';

parsePDFSimple(file) {
  const text = await pdf(file);
  const uuid = extractUUID(text);
  const rfc = extractRFC(text);

  // Si encuentra UUID/RFC/Total claramente
  if (uuid && rfc && total) {
    return {
      ...data,
      confidence: 0.85,
      status: "APPROVED" // >90% no aplica, pero datos completos
    }
  }

  // Si falta data, necesita LlamaParse
  return { needsAdvancedParsing: true }
}
```

#### Nivel 3: LlamaParse COST_EFFECTIVE (1 crédito/pág)
```typescript
parseLlamaParseCE(file) {
  return {
    ...data,
    confidence: 0.90,
    status: "APPROVED"
  }
}
```

#### Nivel 4: LlamaParse AGENTIC (3 créditos/pág)
```typescript
parseLlamaParseAG(file) {
  return {
    ...data,
    confidence: 0.95,
    status: "APPROVED"
  }
}
```

#### ⭐ Auto-Aprobación por Confianza:
```typescript
function determineStatus(confidence: number) {
  if (confidence >= 0.90) return "APPROVED";
  if (confidence >= 0.70) return "NEEDS_REVIEW";
  return "PARSE_ERROR";
}
```

### 3. Validación SAT Manual con Facturama

**Facturama API:**
```typescript
// /server/sat/sat-validation.service.ts

export async function validateInvoicesWithFacturama(
  invoices: Array<{
    uuid: string;
    issuerRfc: string;
    receiverRfc: string;
    total: number;
  }>
) {
  // ⭐ Facturama usa Basic Auth
  const username = process.env.FACTURAMA_USERNAME; // "pruebas" (sandbox) o tu usuario
  const password = process.env.FACTURAMA_PASSWORD; // "pruebas2011" (sandbox) o tu password
  const token = Buffer.from(`${username}:${password}`).toString('base64');

  const results = [];

  for (const invoice of invoices) {
    const response = await fetch(
      `https://api.facturama.mx/cfdi/status?` +
      `uuid=${invoice.uuid}&` +
      `issuerRfc=${invoice.issuerRfc}&` +
      `receiverRfc=${invoice.receiverRfc}&` +
      `total=${invoice.total}`,
      {
        headers: {
          Authorization: `Basic ${token}` // ⭐ Basic Auth, no Bearer
        }
      }
    );

    const data = await response.json();
    results.push({
      uuid: invoice.uuid,
      satStatus: data.status, // "Vigente" | "Cancelado"
      validatedAt: new Date()
    });
  }

  return results;
}
```

**Autenticación:**
- Método: **Basic Auth** (no Bearer)
- Credenciales: Username + Password
- Token: `Base64(username:password)`
- Header: `Authorization: Basic {token}`

**Costo:** $1,650 MXN/año + $0.50/validación → **1 crédito Formmy**

**Registro:**
1. Crear cuenta: https://dev.facturama.mx/api/registro
2. **Sandbox (testing):** `pruebas` / `pruebas2011`
3. **Producción:** Tus credenciales reales
4. Guardar en `.env`:
   ```
   FACTURAMA_USERNAME=pruebas
   FACTURAMA_PASSWORD=pruebas2011
   # Producción:
   # FACTURAMA_USERNAME=tu_usuario
   # FACTURAMA_PASSWORD=tu_password
   ```

### 4. Módulo de Contactos ⭐ NUEVO

#### Auto-Extracción desde Facturas:

```typescript
// Al parsear factura
async function createOrUpdateContact(invoice: ParsedInvoice) {
  // Buscar contacto existente
  let contact = await db.sATContact.findFirst({
    where: { rfc: invoice.rfcEmisor }
  });

  if (!contact) {
    // Crear nuevo contacto
    contact = await db.sATContact.create({
      data: {
        rfc: invoice.rfcEmisor,
        name: invoice.nombreEmisor,
        type: "PROVEEDOR",
        firstSeen: new Date(),
        lastSeen: new Date(),
        totalInvoices: 1,
        totalAmount: invoice.total
      }
    });

    // ⭐ Validar con SAT automáticamente
    await validateContactWithSAT(contact.id);
  } else {
    // Actualizar estadísticas
    await db.sATContact.update({
      where: { id: contact.id },
      data: {
        lastSeen: new Date(),
        totalInvoices: { increment: 1 },
        totalAmount: { increment: invoice.total }
      }
    });

    // Re-validar si >7 días desde última validación
    if (daysSince(contact.lastSATCheck) > 7) {
      await validateContactWithSAT(contact.id);
    }
  }

  return contact;
}
```

#### Validación SAT + Lista Negra:

```typescript
async function validateContactWithSAT(contactId: string) {
  const contact = await db.sATContact.findUnique({
    where: { id: contactId }
  });

  // Consultar SAT Web Service (o usar Facturama)
  const satData = await querySATWebService(contact.rfc);

  // Actualizar datos
  await db.sATContact.update({
    where: { id: contactId },
    data: {
      satStatus: satData.status, // ACTIVO, SUSPENDIDO
      regimenFiscal: satData.regimen,
      fiscalAddress: satData.domicilio,

      // ⭐ CRÍTICO: Lista negra
      isEFOS: satData.enListaEFOS,
      isEDOS: satData.enListaEDOS,

      lastSATCheck: new Date()
    }
  });

  // ⚠️ Si entró a lista negra, alertar
  if (satData.enListaEFOS && !contact.isEFOS) {
    await createAlert({
      type: "EFOS_DETECTED",
      contactId,
      message: `${contact.name} fue agregado a lista EFOS del SAT.`
    });
  }
}
```

#### Upload Constancia Fiscal:

```typescript
// Cliente sube constancia fiscal PDF
async function parseConstanciaFiscal(file: File) {
  // Parsear con LlamaParse
  const parsed = await llamaParse(file, "AGENTIC");

  // Extraer datos
  const data = {
    rfc: extractRFC(parsed.markdown),
    name: extractName(parsed.markdown),
    regimenFiscal: extractRegimen(parsed.markdown),
    fiscalAddress: extractAddress(parsed.markdown),
    economicActivity: extractActivity(parsed.markdown)
  };

  // Crear o actualizar contacto
  await db.sATContact.upsert({
    where: { rfc: data.rfc },
    create: { ...data },
    update: { ...data }
  });

  // Validar con SAT
  await validateContactWithSAT(contact.id);
}
```

### 5. UX Superior - Auto-Aprobación Inteligente

#### Dashboard con Estados:

```
📊 Dashboard SAT

┌─────────────────────────────────────────┐
│ 📊 Estado de Facturas                   │
│ • ✅ 42 Auto-aprobadas (confianza >90%) │
│ • ⚠️  5 Requieren revisión (<90%)       │
│ • 🔴 3 Errores de parseo                │
└─────────────────────────────────────────┘

[Revisar 8 facturas problemáticas]
```

#### Modal Detalle (solo para NEEDS_REVIEW):

```tsx
<InvoiceDetailModal>
  <Split>
    <Left>
      <ImagePreview src={invoice.pdfUrl} />
      <Badge>Confianza: 85% ⚠️</Badge>
    </Left>

    <Right>
      <EditableField
        label="UUID"
        value={invoice.uuid}
        confidence={0.90}
      />
      <EditableField
        label="RFC Emisor"
        value={invoice.rfcEmisor}
        confidence={0.75} // ⚠️ Baja confianza
        warning="Verificar caracteres"
      />
      <EditableField
        label="Total"
        value={invoice.total}
        confidence={0.95}
      />
    </Right>
  </Split>

  <Actions>
    <Button variant="danger">Rechazar</Button>
    <Button variant="primary">Guardar Correcciones</Button>
  </Actions>
</InvoiceDetailModal>
```

#### Corrección Batch:

```tsx
<BatchCorrectionPanel>
  ⚠️ 5 facturas tienen RFC Emisor con baja confianza

  <CheckboxList>
    ☑ Factura #123 - PEMEX
    ☑ Factura #124 - OXXO
    ☑ Factura #125 - Office Depot
  </CheckboxList>

  RFC Emisor correcto para las 3:
  <Input value="PEM850914AAA" />

  <Button>Aplicar a 3 seleccionadas</Button>
</BatchCorrectionPanel>
```

#### Alertas IA:

```typescript
// Detectar inconsistencias
function detectAnomalies(invoice: ParsedInvoice) {
  const alerts = [];

  // Total incorrecto
  if (invoice.subtotal + invoice.iva !== invoice.total) {
    alerts.push({
      type: "MATH_ERROR",
      message: `Subtotal + IVA no coincide con Total`,
      severity: "high"
    });
  }

  // RFC inválido
  if (!validateRFCFormat(invoice.rfcEmisor)) {
    alerts.push({
      type: "INVALID_RFC",
      message: `RFC Emisor tiene formato incorrecto`,
      severity: "high"
    });
  }

  // Monto sospechoso
  if (invoice.total > 50000 && invoice.confidence < 0.95) {
    alerts.push({
      type: "HIGH_AMOUNT_LOW_CONFIDENCE",
      message: `Factura de monto alto con baja confianza de parseo`,
      severity: "medium"
    });
  }

  return alerts;
}
```

### 6. Mobile-First Design

#### Responsive Components:

```tsx
// Desktop: Tabla completa
<DesktopTable>
  <Column>UUID</Column>
  <Column>Cliente</Column>
  <Column>Emisor</Column>
  <Column>Fecha</Column>
  <Column>Total</Column>
  <Column>Estado</Column>
  <Column>Acciones</Column>
</DesktopTable>

// Mobile: Cards con swipe
<MobileCardList>
  <SwipeableCard
    onSwipeLeft={() => approve(invoice)}
    onSwipeRight={() => reject(invoice)}
  >
    <InvoiceCard>
      <Header>PEMEX • $850</Header>
      <Badge status="approved" confidence={0.95} />
      <Meta>Juan Pérez • Hoy 10:30am</Meta>
    </InvoiceCard>
  </SwipeableCard>
</MobileCardList>
```

#### Breakpoints:
- Desktop: >1024px → Dashboard completo (3 columnas)
- Tablet: 768-1023px → 2 columnas
- Mobile: <767px → Cards verticales con swipe

#### PWA (v2 - Futuro):
- Installable sin App Store
- Offline mode (cache últimas 50 facturas)
- Push notifications web
- Home screen icon

### 7. Chatbot Inteligente

#### System Prompt:

```
Eres un asistente contable que recolecta facturas para contadores.

Cuando recibas un documento (XML/PDF/Imagen):
1. Parsea con smartParse() (gratis si XML/PDF simple)
2. Extrae: UUID, RFC, fecha, monto, concepto
3. Pregunta clasificación:
   - ¿Es gasto deducible?
   - ¿Categoría? (Gasolina, Papelería, Alimentos...)
   - ¿Proyecto o área?
   - ¿Notas adicionales?
4. Guarda con estado según confianza:
   - >90% → APPROVED
   - 70-90% → NEEDS_REVIEW
   - <70% → PARSE_ERROR
5. Confirma: "✅ Guardado. Confianza: 95%"

NUNCA valides con SAT (lo hace el contador manualmente).

Acepta entrada de voz para clasificación.
Sé amigable, usa emojis.
```

#### Tool: save_invoice

```typescript
{
  name: "save_invoice",
  description: "Guardar factura con clasificación del cliente",
  parameters: {
    uuid: string,
    rfcEmisor: string,
    rfcReceptor: string,
    nombreEmisor: string,
    total: number,
    fecha: string,
    concepto: string,
    isDeductible: boolean,
    category: string,
    project: string,
    clientNotes: string,
    parseMethod: "XML_LOCAL" | "PDF_SIMPLE" | "LLAMAPARSE_CE" | "LLAMAPARSE_AG",
    confidence: number
  }
}
```

#### Captura por Voz:

```
Cliente: 🎤 "Esta factura es de gasolina,
           viaje a Monterrey, deducible,
           proyecto ventas"

Bot (transcribe con Whisper):
📄 Entendido:
- Categoría: Gasolina
- Proyecto: Ventas
- Deducible: Sí
- Nota: Viaje a Monterrey

¿Ahora envías el XML/PDF? 📸
```

---

## 🗄️ Base de Datos

### Modelo: SATInvoice

```prisma
model SATInvoice {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  userId        String   @db.ObjectId // Contador
  chatbotId     String   @db.ObjectId

  // Cliente que subió
  clientName    String?
  clientPhone   String?
  conversationId String? @db.ObjectId

  // Datos CFDI
  uuid          String   @unique
  rfcEmisor     String
  rfcReceptor   String
  nombreEmisor  String
  tipo          String   // INGRESO, EGRESO, NOMINA, PAGO
  fecha         DateTime
  subtotal      Float
  iva           Float
  total         Float
  concepto      String
  metodoPago    String   // PUE, PPD

  // ⭐ Validación SAT (MANUAL)
  satStatus     String   // PENDING_VALIDATION, VALIDATING, VALID_VIGENTE, VALID_CANCELADA
  validatedAt   DateTime?
  validatedBy   String?  @db.ObjectId

  // ⭐ Parseo con confianza
  parseMethod   String   // XML_LOCAL, PDF_SIMPLE, LLAMAPARSE_CE, LLAMAPARSE_AG
  confidence    Float    // 0.0 - 1.0
  status        String   // APPROVED, NEEDS_REVIEW, PARSE_ERROR
  creditsUsed   Int
  warnings      String[] // Alertas IA

  // Clasificación cliente
  isDeductible  Boolean?
  category      String?
  project       String?
  clientNotes   String?

  // Clasificación IA
  aiCategory    String?
  cuentaContable String?

  // Archivos
  xmlUrl        String?
  pdfUrl        String?

  // ⭐ Relación con contacto
  contactId     String?  @db.ObjectId
  contact       SATContact? @relation("InvoiceContact", fields: [contactId], references: [id])

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([userId, chatbotId])
  @@index([userId, clientName])
  @@index([uuid])
  @@index([status]) // Filtrar pendientes de revisión
  @@index([satStatus]) // Filtrar pendientes de validar
  @@index([contactId])
}
```

### Modelo: SATContact ⭐ NUEVO

```prisma
model SATContact {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  userId        String   @db.ObjectId
  chatbotId     String   @db.ObjectId

  // Datos básicos
  rfc           String   @unique
  name          String
  type          String   // PROVEEDOR, CLIENTE, AMBOS

  // Datos SAT (validación automática)
  satStatus     String?  // ACTIVO, SUSPENDIDO, CANCELADO
  regimenFiscal String?
  fiscalAddress String?
  economicActivity String?

  // ⭐ Lista negra
  isEFOS        Boolean  @default(false)
  isEDOS        Boolean  @default(false)
  lastSATCheck  DateTime?

  // Estadísticas (auto-calculadas)
  totalInvoices Int      @default(0)
  totalAmount   Float    @default(0)
  firstSeen     DateTime
  lastSeen      DateTime

  // Clasificación IA
  category      String?  // "Gasolinera", "Papelería"
  tags          String[]

  // Archivos
  constanciaFiscalUrl String?

  // Relaciones
  invoices      SATInvoice[] @relation("InvoiceContact")

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([userId, chatbotId])
  @@index([rfc])
  @@index([type])
  @@index([isEFOS, isEDOS])
  @@index([satStatus])
}
```

---

## 📁 Estructura de Archivos

```
/app/routes/
  dashboard.sat.tsx                    # ⭐ Dashboard principal
  api.v1.sat.ts                       # ⭐ Endpoint único con intents

/app/components/sat/
  SATUploadPanel.tsx                   # Upload con drag & drop
  SATInvoiceList.tsx                   # Lista responsive con checkboxes
  SATInvoiceCard.tsx                   # Card individual (mobile)
  SATInvoiceDetailModal.tsx            # ⭐ Modal edición (solo NEEDS_REVIEW)
  SATValidationControls.tsx            # Botones validación manual
  SATBatchCorrectionPanel.tsx          # ⭐ Corrección masiva
  SATMetricsCards.tsx                  # Cards métricas
  SATContactsList.tsx                  # ⭐ Lista contactos
  SATContactCard.tsx                   # ⭐ Detalle contacto
  SATAlertsBanner.tsx                  # ⭐ Alertas IA y lista negra
  SATExportModal.tsx                   # Excel/ContPaq/JSON

/server/sat/
  sat-parser.service.ts                # ⭐ smartParse() 4 niveles + confianza
  sat-validation.service.ts            # Facturama API
  sat-contacts.service.ts              # ⭐ CRUD contactos + validación SAT
  sat-export.service.ts                # Excel/ContPaq/JSON
  sat-classification-ai.service.ts     # Clasificación IA
  sat-alerts.service.ts                # ⭐ Detección anomalías

/server/tools/handlers/
  sat-save-invoice.handler.ts          # Tool chatbot

/public/assets/chat/
  sat-logo.png                         # ⭐ Logo SAT
```

**Logo SAT:** https://identidadydesarrollo.com/wp-content/uploads/2015/06/SAT-logo.png

---

## 🎨 Tarjeta de Integración

**Actualizar:** `/app/components/chat/tab_sections/Codigo.tsx`

```typescript
const getAvailableIntegrations = (t) => [
  // ... integraciones existentes (Gmail, WhatsApp, etc.) ...
  {
    id: "SAT",
    name: "SAT México",
    logo: "/assets/chat/sat-logo.png",
    description: "Recolección inteligente de facturas CFDI, validación con SAT, gestión de contactos fiscales y detección de lista negra EFOS/EDOS. Tus clientes suben documentos 24/7 al chatbot.",
    isPermanent: false,
  },
]
```

---

## 💰 Sistema de Créditos

| Operación | Créditos | Descripción |
|-----------|----------|-------------|
| XML local | 0 | Parseo directo, gratis ✅ |
| PDF simple | 0 | Extracción texto plano ✅ |
| LlamaParse CE | 1/pág | PDFs estructurados |
| LlamaParse AG | 3/pág | PDFs escaneados/OCR |
| Validación SAT factura | 1 | Facturama API (manual) |
| Validación SAT contacto | 0 | Automática al crear contacto ✅ |
| Clasificación IA | 2 | GPT-4o-mini sugiere categoría |
| Upload constancia fiscal | 3 | LlamaParse AGENTIC |

---

## 🚀 Flujo Completo End-to-End

### 1. Cliente sube factura (WhatsApp)

```
1. Cliente en gasolinera: Toma foto ticket
2. Abre WhatsApp → Chatbot del contador
3. Envía foto + voz: "Gasolina, deducible, proyecto Monterrey"
4. Bot:
   - Parsea PDF simple (GRATIS) ✅
   - Confianza: 88% → NEEDS_REVIEW ⚠️
   - Extrae RFC: PEM850914AAA
   - Busca contacto PEMEX → Existe
   - Actualiza: 13 facturas, $16,090 total
5. Bot confirma: "✅ Guardado. Confianza: 88%. Tu contador lo revisará."
```

### 2. Contador revisa (Desktop)

```
1. Abre /dashboard/sat
2. Dashboard muestra:
   - 42 auto-aprobadas ✅
   - 5 requieren revisión ⚠️
3. Click "Revisar 5 facturas"
4. Abre primera (PEMEX $850):
   - Preview imagen lado izquierdo
   - Campos editables lado derecho
   - RFC Emisor marcado con ⚠️ (confianza 0.75)
5. Corrige RFC: PEM850914AAA → PEM850914AA9
6. Guarda → Status cambia a APPROVED
7. Siguiente factura...
```

### 3. Validación SAT (Manual, Mobile)

```
1. Contador desde celular (después de oficina)
2. Swipe entre facturas aprobadas
3. Selecciona 10 facturas (checkboxes)
4. Tap "Validar Seleccionadas (10)"
5. Confirmación: "10 créditos. ¿Confirmar?"
6. Tap "Confirmar"
7. Sistema valida con Facturama (3 segundos)
8. 9 Vigentes ✅, 1 Cancelada ❌
9. Recibe notificación: "Validación completada"
```

### 4. Gestión de Contactos

```
1. Nueva factura de "Distribuidora XYZ"
2. Sistema:
   - Crea contacto auto: RFC = DIS990101XXX
   - Valida con SAT → ACTIVO ✅
   - Verifica lista negra → ⚠️ EFOS detectado
3. Alerta al contador:
   "⚠️ Distribuidora XYZ está en lista EFOS.
    Esta factura NO será deducible.
    ¿Rechazar automáticamente?"
4. Contador: "Rechazar"
5. Bot avisa al cliente:
   "❌ Tu factura de Distribuidora XYZ no puede ser aceptada
    porque el proveedor está en lista negra del SAT."
```

### 5. Exportación (Desktop)

```
1. Contador: "Necesito declaración mensual"
2. Dashboard → Filtros:
   - Mes: Enero 2025
   - Estado: Validadas Vigentes
   - Cliente: Todos
3. 156 facturas encontradas
4. Click "Exportar" → Opciones:
   - Excel (compatible ContPaq) ✅
   - XML ContPaq
   - JSON API
5. Descarga Excel → Abre en ContPaq → Importa 156 pólizas
6. Total: 5 minutos vs 2 días manual
```

---

## ✅ Ventajas vs Competencia

| Feature | Alegra | ContPaq | Miskuentas | Formmy SAT |
|---------|--------|---------|------------|------------|
| Recolección 24/7 | ❌ | ❌ | ❌ | ✅ Chatbot |
| Parseo XML gratis | ❌ | ❌ | ❌ | ✅ |
| Parseo PDF gratis | ❌ | ❌ | ❌ | ✅ Simple |
| Auto-aprobación | ❌ | ❌ | ❌ | ✅ Confianza >90% |
| Validación SAT | ⚠️ Manual | ❌ | ✅ Auto | ✅ Manual (control) |
| Contactos auto | ❌ | ❌ | ❌ | ✅ Desde facturas |
| Lista negra EFOS | ❌ | ❌ | ❌ | ✅ Alertas |
| Mobile responsive | ⚠️ Regular | ❌ | ⚠️ | ✅ Mobile-first |
| WhatsApp nativo | ❌ | ❌ | ❌ | ✅ |
| Captura voz | ✅ App | ❌ | ❌ | ✅ Chatbot |
| Corrección batch | ❌ | ❌ | ❌ | ✅ |
| Alertas IA | ❌ | ❌ | ⚠️ | ✅ |
| Precio | $199/mes | $5K-15K/año | $199/mes? | Créditos desde $99 |

---

## 📊 Criterios de Éxito MVP

- ✅ Contador da acceso a 5 clientes
- ✅ Cliente sube factura en <1 min (WhatsApp)
- ✅ 90% XMLs parseados GRATIS
- ✅ 70% PDFs simples parseados GRATIS
- ✅ 85% facturas auto-aprobadas (confianza >90%)
- ✅ Contador valida solo necesario (ahorro 80% créditos)
- ✅ Contactos extraídos automáticamente (0 créditos)
- ✅ Alertas EFOS en <5 segundos
- ✅ Validación SAT en <3 segundos
- ✅ Mobile 100% funcional (responsive web)
- ✅ Exportación Excel compatible ContPaq
- ✅ NPS >8 (contadores y clientes)

---

## 🗓️ Plan de Implementación (3 Semanas)

### Semana 1: Base + Parseo + Contactos

**Día 1-2: Setup**
1. Descargar logo SAT → `/public/assets/chat/sat-logo.png`
2. Agregar tarjeta integración en `Codigo.tsx`
3. Crear modelos Prisma: `SATInvoice`, `SATContact`
4. Migrar base de datos
5. Registro Facturama API (self-service)

**Día 3-4: Parseo Inteligente**
6. Implementar `parseXMLLocal()` (gratis)
7. Implementar `parsePDFSimple()` (gratis)
8. Integrar LlamaParse (CE y AGENTIC)
9. Sistema de confianza (0.0 - 1.0)
10. Auto-aprobación (>90% = APPROVED)

**Día 5: Contactos**
11. Service: `sat-contacts.service.ts`
12. Auto-extracción desde facturas
13. Validación SAT Web Service
14. Detección lista negra EFOS/EDOS

### Semana 2: Dashboard + Validación + Mobile

**Día 6-7: Dashboard Desktop**
15. Ruta `/dashboard/sat`
16. `SATMetricsCards` (resumen)
17. `SATInvoiceList` (tabla desktop)
18. `SATInvoiceDetailModal` (solo NEEDS_REVIEW)
19. `SATBatchCorrectionPanel`
20. `SATAlertsBanner` (IA + lista negra)

**Día 8-9: Mobile**
21. `SATInvoiceCard` (card mobile)
22. Swipe gestures (aprobar/rechazar)
23. Responsive breakpoints (desktop/tablet/mobile)
24. Upload desde cámara celular
25. Testing en iPhone/Android

**Día 10: Validación Manual**
26. `SATValidationControls` (checkboxes + botones)
27. `sat-validation.service.ts` (Facturama)
28. Modal confirmación de créditos
29. Endpoint `/api/v1/sat?intent=validate`

### Semana 3: Chatbot + Export + Testing

**Día 11-12: Chatbot**
30. Tool `save_invoice` para chatbot
31. System prompt SAT
32. Transcripción de voz (Whisper)
33. Mensajes de confirmación
34. Testing en WhatsApp

**Día 13-14: Contactos UI**
35. `SATContactsList`
36. `SATContactCard`
37. Upload constancia fiscal
38. Endpoint `/api/v1/sat?intent=contacts_*`

**Día 15: Exportación**
39. `SATExportModal`
40. Generación Excel (compatible ContPaq)
41. Generación XML ContPaq/Aspel
42. Endpoint `/api/v1/sat?intent=export`

**Día 16-17: Testing + Polish**
43. Testing end-to-end (cliente → contador)
44. Testing mobile (iOS/Android)
45. Testing validación SAT
46. Testing contactos + lista negra
47. Optimización performance
48. Documentación

**Día 18: Deploy**
49. Deploy a producción (Fly.io)
50. Monitoreo errores
51. Beta testing con 2 contadores reales

---

## 🎯 Resumen Ejecutivo

### Qué construimos:
Sistema completo de gestión fiscal para contadores mexicanos con:
- Recolección 24/7 vía chatbot WhatsApp
- Parseo inteligente 4 niveles (2 gratis)
- Auto-aprobación por confianza (ahorro 85% tiempo)
- Validación SAT manual selectiva (control créditos)
- Gestión contactos con alerta lista negra EFOS/EDOS
- Mobile-first responsive (sin app dedicada)
- Exportación ContPaq/Aspel

### Diferenciador clave:
Único sistema que combina IA conversacional + validación fiscal + gestión contactos en un solo lugar, diseñado para volumen alto con experiencia mobile superior.

### Timeline:
- **Semana 1:** Base + Parseo + Contactos
- **Semana 2:** Dashboard + Validación + Mobile
- **Semana 3:** Chatbot + Export + Testing

### Roadmap futuro (v2):
- PWA (Progressive Web App)
- App nativa iOS/Android
- Descarga automática XMLs desde portal SAT
- Validación directa con SAT (sin PAC)
- Integraciones API ContPaq/Aspel
- Reportes fiscales avanzados
- Analytics y predicciones con IA

---

**Status:** ✅ APROBADO - Implementación iniciando

**Última actualización:** Enero 22, 2025

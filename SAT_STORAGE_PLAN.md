# SAT Integration - Storage Plan

## Iteración Actual (Semana 2)
**Decisión**: Parse & Discard (sin storage de archivos originales)

### Flujo Actual
```
Usuario sube XML/PDF → Parse inmediato → Guardar metadata en DB → Descartar archivo
```

### Campos en DB (SatInvoice)
```prisma
model SatInvoice {
  uuid          String  // UUID de la factura
  total         Float
  subtotal      Float
  iva           Float
  nombreEmisor  String
  rfcEmisor     String
  // ... otros campos parseados

  // ❌ SIN estos campos por ahora:
  // xmlUrl       String?
  // pdfUrl       String?
}
```

**Ventajas**:
- ✅ Cero costo de storage
- ✅ Rápido de implementar
- ✅ Facturas SAT tienen UUID único (recuperables del portal SAT)
- ✅ Suficiente para MVP

**Limitaciones**:
- ❌ No se puede descargar archivo original después de procesarlo
- ❌ No se puede re-procesar con otro método de parseo
- ❌ No cumple requisito legal SAT de conservar 5 años

---

## Próxima Iteración (Semana 3+)

### Tigris S3 Integration ⭐
**Setup existente**: Ya tienen Tigris configurado en Fly.io

### Plan de Implementación

#### 1. Configuración
```bash
# Tigris ya está configurado en fly.toml
# Solo necesitamos las credenciales en .env

TIGRIS_BUCKET_NAME=formmy-sat-invoices
TIGRIS_ACCESS_KEY_ID=...  # Desde fly secrets
TIGRIS_SECRET_ACCESS_KEY=...
TIGRIS_ENDPOINT=https://fly.storage.tigris.dev
TIGRIS_REGION=auto
```

#### 2. Servicio de Upload
```typescript
// server/sat/tigris-storage.service.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  endpoint: process.env.TIGRIS_ENDPOINT,
  credentials: {
    accessKeyId: process.env.TIGRIS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.TIGRIS_SECRET_ACCESS_KEY!,
  },
  region: process.env.TIGRIS_REGION || "auto",
});

export async function uploadSATFile(
  buffer: Buffer,
  fileName: string,
  userId: string,
  chatbotId: string
): Promise<string> {
  const key = `sat/${userId}/${chatbotId}/${Date.now()}-${fileName}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.TIGRIS_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: fileName.endsWith(".xml") ? "application/xml" : "application/pdf",
      Metadata: {
        userId,
        chatbotId,
        uploadedAt: new Date().toISOString(),
      },
    })
  );

  return key; // Guardar key en DB, no URL completa
}

export async function getSignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.TIGRIS_BUCKET_NAME!,
    Key: key,
  });

  // URL válida por 1 hora
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}
```

#### 3. Actualizar Schema Prisma
```prisma
model SatInvoice {
  // ... campos existentes

  // Nuevos campos para storage
  xmlStorageKey  String?  // "sat/user123/chatbot456/1234567890-factura.xml"
  pdfStorageKey  String?  // "sat/user123/chatbot456/1234567890-factura.pdf"

  // Metadata de archivos
  xmlFileSize    Int?     // Bytes
  pdfFileSize    Int?     // Bytes
  filesUploadedAt DateTime? // Cuándo se subieron
}
```

#### 4. Flujo con Storage
```typescript
// app/routes/api.sat.upload.ts
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const files = formData.getAll("files") as File[];

  const results = [];

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Parse inmediato (siempre)
    const invoiceData = await parseInvoice(buffer, file.name);

    // 2. Upload a Tigris (nuevo)
    const storageKey = await uploadSATFile(
      buffer,
      file.name,
      user.id,
      chatbotId
    );

    // 3. Guardar en DB con storage key
    const invoice = await db.satInvoice.create({
      data: {
        ...invoiceData,
        xmlStorageKey: file.name.endsWith('.xml') ? storageKey : null,
        pdfStorageKey: file.name.endsWith('.pdf') ? storageKey : null,
        xmlFileSize: file.name.endsWith('.xml') ? file.size : null,
        pdfFileSize: file.name.endsWith('.pdf') ? file.size : null,
        filesUploadedAt: new Date(),
      },
    });

    results.push({ success: true, invoice });
  }

  return json({ results });
}
```

#### 5. Endpoint de Descarga
```typescript
// app/routes/api.sat.download.ts
export async function loader({ request, params }: LoaderFunctionArgs) {
  const { invoiceId } = params;
  const url = new URL(request.url);
  const fileType = url.searchParams.get("type"); // 'xml' | 'pdf'

  const invoice = await db.satInvoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) throw new Response("Not found", { status: 404 });

  const storageKey = fileType === "xml"
    ? invoice.xmlStorageKey
    : invoice.pdfStorageKey;

  if (!storageKey) {
    throw new Response("Archivo no disponible", { status: 404 });
  }

  // Generar URL firmada temporal (1 hora)
  const signedUrl = await getSignedDownloadUrl(storageKey);

  // Redirect al signed URL
  return redirect(signedUrl);
}
```

#### 6. UI Updates
```tsx
// Dashboard: Botón de descarga
{invoice.xmlStorageKey && (
  <a
    href={`/api/sat/download/${invoice.id}?type=xml`}
    download
    className="text-blue-600 hover:underline"
  >
    📄 Descargar XML
  </a>
)}
{invoice.pdfStorageKey && (
  <a
    href={`/api/sat/download/${invoice.id}?type=pdf`}
    download
    className="text-blue-600 hover:underline"
  >
    📄 Descargar PDF
  </a>
)}
```

### Pricing Tigris (Fly.io)
- **Storage**: $0.02/GB/mes (~50% más barato que S3)
- **Egress**: Gratis dentro de Fly.io
- **Requests**: Gratis

**Estimación para 10,000 facturas:**
- 10,000 XML × 50KB = 500MB
- 10,000 PDF × 500KB = 5GB
- **Total**: 5.5GB × $0.02 = **$0.11/mes** 💰

### Features Adicionales con Storage

1. **Re-procesamiento**
   - Si parseo falló, usuario puede re-procesar con otro método
   - Útil cuando XML_LOCAL falla → retry con FORMMY_AG

2. **Validación SAT**
   - Comparar datos parseados vs datos en archivo original
   - Detectar manipulación de facturas

3. **Auditorías**
   - Cumplir requisito legal de conservar 5 años
   - Exportar batch de XMLs para auditorías

4. **WhatsApp + OCR**
   - Guardar foto original de factura
   - Permitir al contador ver foto si OCR falló

### Migración Gradual
```typescript
// Backward compatible: facturas viejas sin storage siguen funcionando
if (invoice.xmlStorageKey) {
  // Nueva ruta: descargar desde Tigris
  return redirect(await getSignedDownloadUrl(invoice.xmlStorageKey));
} else {
  // Ruta vieja: solo metadata disponible
  return json({
    message: "Archivo original no disponible (procesado antes de storage)"
  });
}
```

---

## Decisión de Implementación

**MVP (ahora)**: Parse & Discard
**Producción (después)**: Tigris S3 storage

**Trigger para migrar**:
- Cuando contador pida "descargar XML original"
- Cuando necesiten cumplir auditorías SAT
- Cuando haya errores de parseo que requieran re-proceso

---

**Fecha de este plan**: 2025-01-22
**Status**: Documentado, pendiente de implementación en Semana 3+

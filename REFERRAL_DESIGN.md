# Diseño del Sistema de Referidos

## Estructura del Modelo

```typescript
// app/models/referral.server.ts
interface Referral {
  id: string;                    // ID único
  userId: string;                // ID del usuario que refiere
  referralCode: string;          // Código único (nanoid)
  referredBy?: string;           // ID del usuario que lo refirió (opcional)
  totalReferrals: number;        // Total de referidos
  successfulReferrals: number;   // Referidos que se convirtieron en Pro
  referrals: Array<{             // Historial de referidos
    userId: string;              // ID del usuario referido
    status: 'pending' | 'completed' | 'failed';
    rewardType?: string;         // 'free_month'
    createdAt: Date;
    updatedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
```

## Endpoint Único

```
POST /api/referral
Content-Type: multipart/form-data

intent=get_stats|process_referral|complete_referral
code=CODIGO_REFERIDO (opcional)
userId=USER_ID (opcional)
```

## Flujo de Trabajo

1. **Registro de Usuario**:
   - Al crear un usuario, generar automáticamente un código de referido
   - Guardar en la colección `referrals`

2. **Uso del Enlace**:
   - Formato: `formmy.app/signup?ref=CODIGO123`
   - Al hacer clic, redirigir al formulario de registro con el código en la URL
   - Al enviar el formulario, incluir el código en la petición

3. **Conversión a Pro**:
   - Cuando un usuario se suscribe a Pro, verificar si fue referido
   - Si es así, actualizar el estado a 'completed' y aplicar el descuento al referente
  updatedAt      DateTime @updatedAt
}
```

## Endpoint Único

```typescript
// app/routes/api.referral.tsx
import { json } from '@remix-run/node';
import { Effect } from 'effect';
import { prisma } from '~/db.server';
import { stripe } from '~/services/stripe.server';

export const action = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get('intent');
  
  switch (intent) {
    case 'get_stats':
      return handleGetStats(request);
    case 'process_referral':
      return handleProcessReferral(request, formData);
    default:
      return json({ error: 'Invalid intent' }, { status: 400 });
  }
};

// Implementación de los manejadores...
```

## Flujo de Referencia

1. **Generación de Código**
   - Al crear un usuario, se genera automáticamente un código único
   - Se crea un registro en `Referral` para el usuario

2. **Uso del Enlace**
   - Usuario A comparte su enlace: `formmy.app/signup?ref=CODIGO123`
   - Usuario B se registra a través del enlace
   - Se guarda temporalmente el código de referencia en la sesión

3. **Conversión a Pro**
   - Cuando Usuario B se convierte en Pro:
     - Se verifica si tiene un código de referencia
     - Si es válido, se aplica el crédito a Usuario A
     - Se registra en `ReferralLog`
     - Se actualizan las estadísticas

## Integración con Stripe

```typescript
async function applyReferralCredit(referrerId: string, amount: number) {
  const referrer = await prisma.user.findUnique({
    where: { id: referrerId },
    select: { stripeCustomerId: true }
  });

  if (!referrer?.stripeCustomerId) return;

  await stripe.invoiceItems.create({
    customer: referrer.stripeCustomerId,
    amount: amount * 100, // en centavos
    currency: 'usd',
    description: 'Crédito por referencia exitosa',
  });
}
```

## Componentes de UI

1. **Dashboard de Referidos**
   ```tsx
   function ReferralDashboard() {
     const { referralCode, totalReferrals, successfulReferrals } = useLoaderData();
     const referralLink = `formmy.app/signup?ref=${referralCode}`;
     
     return (
       <div className="space-y-4">
         <div>
           <h2>Tu enlace de referido</h2>
           <CopyButton text={referralLink} />
         </div>
         <Stats 
           total={totalReferrals}
           successful={successfulReferrals}
         />
       </div>
     );
   }
   ```

2. **Componente de Copiado**
   ```tsx
   function CopyButton({ text }: { text: string }) {
     const [copied, setCopied] = useState(false);
     
     const copyToClipboard = () => {
       navigator.clipboard.writeText(text);
       setCopied(true);
       setTimeout(() => setCopied(false), 2000);
     };
     
     return (
       <button onClick={copyToClipboard}>
         {copied ? '¡Copiado!' : 'Copiar enlace'}
       </button>
     );
   }
   ```

## Variables de Entorno

```env
# .env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
APP_URL=https://formmy.app
```

## Próximos Pasos

1. Implementar el modelo en Prisma
2. Crear migración de base de datos
3. Implementar el endpoint de la API
4. Crear componentes de UI
5. Probar flujo completo

---

**Nota**: Este diseño es minimalista y enfocado en las funcionalidades principales. Se puede expandir según sea necesario.

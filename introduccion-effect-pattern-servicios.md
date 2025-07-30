# El Patrón Effect: Servicios, Implementaciones y Layers Explicados para Principiantes

## Introducción

Si estás comenzando con Effect en TypeScript, es posible que te hayas encontrado con términos como "servicios", "implementaciones live" y "layers". Estos conceptos pueden parecer abrumadores al principio, pero en realidad forman un patrón elegante y poderoso para estructurar aplicaciones. En este post, vamos a desglosar estos conceptos de manera simple y práctica.

## ¿Qué es Effect?

Effect es una biblioteca de TypeScript que nos ayuda a escribir código más robusto y mantenible. Piensa en Effect como un conjunto de herramientas que hace que nuestro código sea más predecible y fácil de testear.

## El Problema que Resuelve

Imagina que estás construyendo una aplicación que necesita:

- Conectarse a una base de datos
- Enviar emails
- Hacer llamadas a APIs externas

Sin un patrón estructurado, tu código podría verse así:

```typescript
// ❌ Código acoplado y difícil de testear
async function procesarUsuario(userId: string) {
  const db = new DatabaseConnection(); // Dependencia directa
  const emailService = new EmailService(); // Otra dependencia directa

  const usuario = await db.getUser(userId);
  await emailService.sendWelcomeEmail(usuario.email);
}
```

El problema con este enfoque es que:

- Es difícil de testear (necesitas una base de datos real)
- Las dependencias están "hardcodeadas"
- No puedes cambiar fácilmente las implementaciones

## La Solución: El Patrón de Servicios de Effect

Effect propone una solución elegante usando tres conceptos principales:

### 1. Definición del Servicio (La Interfaz)

Primero, definimos **qué** puede hacer nuestro servicio, sin preocuparnos por **cómo** lo hace:

```typescript
import { Effect, Context } from "effect";

// Definimos la interfaz de nuestro servicio
interface DatabaseService {
  readonly getUser: (id: string) => Effect.Effect<User, DatabaseError>;
  readonly saveUser: (user: User) => Effect.Effect<void, DatabaseError>;
}

// Creamos un "tag" único para identificar este servicio
const DatabaseService = Context.GenericTag<DatabaseService>("DatabaseService");
```

### 2. Implementación Live (La Implementación Real)

Luego, creamos la implementación real del servicio:

```typescript
// Esta es la implementación que se usará en producción
const DatabaseServiceLive = Layer.succeed(
  DatabaseService,
  DatabaseService.of({
    getUser: (id) =>
      Effect.tryPromise({
        try: () => fetch(`/api/users/${id}`).then((r) => r.json()),
        catch: () => new DatabaseError("Error al obtener usuario"),
      }),

    saveUser: (user) =>
      Effect.tryPromise({
        try: () =>
          fetch("/api/users", {
            method: "POST",
            body: JSON.stringify(user),
          }),
        catch: () => new DatabaseError("Error al guardar usuario"),
      }),
  })
);
```

### 3. Layer (La Capa de Configuración)

Un Layer es como una receta que le dice a Effect cómo construir nuestros servicios:

```typescript
import { Layer } from "effect";

// Combinamos todos nuestros servicios en un layer principal
const MainLayer = Layer.mergeAll(
  DatabaseServiceLive,
  EmailServiceLive
  // ... otros servicios
);
```

## Usando el Patrón en tu Aplicación

Ahora veamos cómo usar este patrón en la práctica:

```typescript
// Definimos nuestra lógica de negocio
const procesarUsuario = (userId: string) =>
  Effect.gen(function* () {
    // Obtenemos el servicio del contexto
    const db = yield* DatabaseService;

    // Usamos el servicio
    const usuario = yield* db.getUser(userId);

    // Podemos usar otros servicios de la misma manera
    const email = yield* EmailService;
    yield* email.sendWelcomeEmail(usuario.email);

    return usuario;
  });

// Ejecutamos el programa proporcionando las dependencias
const programa = procesarUsuario("123").pipe(Effect.provide(MainLayer));

// Ejecutar el programa
Effect.runPromise(programa)
  .then((usuario) => console.log("Usuario procesado:", usuario))
  .catch((error) => console.error("Error:", error));
```

## Ventajas de Este Patrón

### 1. **Testabilidad**

Puedes crear implementaciones de prueba fácilmente:

```typescript
const DatabaseServiceTest = Layer.succeed(
  DatabaseService,
  DatabaseService.of({
    getUser: (id) =>
      Effect.succeed({
        id,
        name: "Usuario de Prueba",
        email: "test@example.com",
      }),
    saveUser: () => Effect.succeed(undefined),
  })
);

// En tus tests, usa el layer de prueba
const programaDePrueba = procesarUsuario("123").pipe(
  Effect.provide(DatabaseServiceTest)
);
```

### 2. **Flexibilidad**

Puedes cambiar implementaciones sin tocar la lógica de negocio:

```typescript
// Para desarrollo local
const DatabaseServiceLocal = Layer.succeed(
  DatabaseService,
  DatabaseService.of({
    getUser: (id) => Effect.succeed(mockUsers[id]),
    saveUser: (user) =>
      Effect.sync(() => {
        mockUsers[user.id] = user;
      }),
  })
);

// Cambiar entre implementaciones es tan simple como cambiar el layer
const DevLayer = Layer.mergeAll(
  DatabaseServiceLocal, // Usa datos locales
  EmailServiceConsole // Imprime emails en consola
);
```

### 3. **Composición**

Los servicios pueden depender de otros servicios:

```typescript
// Un servicio que depende de DatabaseService
const UserNotificationService = Layer.effect(
  NotificationService,
  Effect.gen(function* () {
    const db = yield* DatabaseService;

    return NotificationService.of({
      notifyUser: (userId, message) =>
        Effect.gen(function* () {
          const user = yield* db.getUser(userId);
          // ... lógica de notificación
        }),
    });
  })
);
```

## Ejemplo Práctico Completo

Veamos un ejemplo más completo de una mini aplicación:

```typescript
import { Effect, Context, Layer } from "effect";

// 1. Definir tipos
interface User {
  id: string;
  name: string;
  email: string;
}

class ApiError {
  readonly _tag = "ApiError";
  constructor(readonly message: string) {}
}

// 2. Definir servicios
interface ApiService {
  readonly fetchData: (endpoint: string) => Effect.Effect<unknown, ApiError>;
}

const ApiService = Context.GenericTag<ApiService>("ApiService");

interface LoggerService {
  readonly log: (message: string) => Effect.Effect<void>;
}

const LoggerService = Context.GenericTag<LoggerService>("LoggerService");

// 3. Implementaciones
const ApiServiceLive = Layer.succeed(
  ApiService,
  ApiService.of({
    fetchData: (endpoint) =>
      Effect.tryPromise({
        try: () => fetch(endpoint).then((r) => r.json()),
        catch: () => new ApiError(`Error fetching ${endpoint}`),
      }),
  })
);

const LoggerServiceLive = Layer.succeed(
  LoggerService,
  LoggerService.of({
    log: (message) => Effect.sync(() => console.log(`[LOG]: ${message}`)),
  })
);

// 4. Lógica de negocio
const obtenerDatosConLog = (endpoint: string) =>
  Effect.gen(function* () {
    const api = yield* ApiService;
    const logger = yield* LoggerService;

    yield* logger.log(`Fetching data from ${endpoint}`);
    const data = yield* api.fetchData(endpoint);
    yield* logger.log(`Data fetched successfully`);

    return data;
  });

// 5. Composición y ejecución
const AppLayer = Layer.mergeAll(ApiServiceLive, LoggerServiceLive);

const programa = obtenerDatosConLog("/api/users").pipe(
  Effect.provide(AppLayer)
);

// Ejecutar
Effect.runPromise(programa)
  .then((data) => console.log("Datos:", data))
  .catch((error) => console.error("Error:", error));
```

## Conclusión

El patrón de servicios, implementaciones y layers de Effect puede parecer complejo al principio, pero ofrece beneficios significativos:

- **Separación de responsabilidades**: La interfaz define el "qué", la implementación define el "cómo"
- **Testabilidad mejorada**: Puedes crear implementaciones mock fácilmente
- **Flexibilidad**: Cambiar entre diferentes implementaciones es trivial
- **Composición**: Los servicios pueden construirse unos sobre otros

Este patrón es especialmente útil en aplicaciones medianas y grandes donde la mantenibilidad y la testabilidad son cruciales. Aunque requiere un poco más de código inicial, el beneficio a largo plazo en términos de calidad y mantenibilidad del código vale la pena.

## Próximos Pasos

1. **Practica con ejemplos simples**: Comienza convirtiendo funciones simples a servicios
2. **Explora los combinadores de Layer**: `Layer.merge`, `Layer.provide`, etc.
3. **Aprende sobre dependencias entre servicios**: Cómo un servicio puede depender de otro
4. **Investiga el manejo de recursos**: Cómo Effect maneja la inicialización y limpieza de recursos

¡Feliz codificación con Effect! 🚀

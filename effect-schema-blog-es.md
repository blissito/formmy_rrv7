# Validación de Datos con @effect/schema: Guía Completa en TypeScript

En el ecosistema de TypeScript, garantizar la seguridad de tipos en tiempo de ejecución puede ser un desafío. Aunque TypeScript ofrece una excelente verificación de tipos en tiempo de compilación, estos tipos se eliminan durante la compilación, dejando tu aplicación vulnerable a errores de tipos en tiempo de ejecución. Aquí es donde entra en juego `@effect/schema`, una biblioteca poderosa que trae validación robusta en tiempo de ejecución y seguridad de tipos a tus aplicaciones TypeScript.

## ¿Qué es @effect/schema?

`@effect/schema` es una biblioteca de validación de esquemas que prioriza TypeScript, permitiéndote definir, validar y transformar estructuras de datos con un enfoque en la seguridad de tipos. Es parte del ecosistema más amplio de Effect, que proporciona una base sólida para crear aplicaciones TypeScript.

### Características Principales

1. **Validación con Seguridad de Tipos**: Define esquemas que se verifican tanto en tiempo de compilación como en tiempo de ejecución.
2. **Inmutabilidad**: Todas las operaciones de esquema devuelven nuevas instancias de esquema, lo que garantiza un comportamiento predecible.
3. **Inferencia de Tipos Rica**: Infiere automáticamente los tipos de TypeScript a partir de tus esquemas.
4. **Componibilidad**: Construye esquemas complejos combinando otros más simples.
5. **Transformación Bidireccional**: Convierte entre diferentes representaciones de tus datos manteniendo la seguridad de tipos.

## Empezando

Para comenzar a usar `@effect/schema`, instálalo a través de npm:

```bash
npm install @effect/schema
```

## Uso Básico

### Definiendo Esquemas Simples

```typescript
import { Schema } from "@effect/schema";

// Esquemas primitivos
const stringSchema = Schema.String;
const numberSchema = Schema.Number;
const booleanSchema = Schema.Boolean;

// Usando los esquemas
const parseString = Schema.decodeUnknownSync(stringSchema);
const result = parseString("hola"); // Devuelve "hola"
// parseString(123); // Lanza: Se esperaba string, se obtuvo 123
```

### Creando Esquemas de Objetos

```typescript
import { Schema } from "@effect/schema";

const UserSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  isActive: Schema.Boolean,
  createdAt: Schema.DateFromSelf
});

// Este tipo se infiere del esquema
type User = Schema.To<typeof UserSchema>;
/* Equivalente a:
type User = {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
}
*/

// Analizando y validando datos
const parseUser = Schema.decodeUnknownSync(UserSchema);

const validUser = parseUser({
  id: 1,
  name: "Juan Pérez",
  email: "juan@ejemplo.com",
  isActive: true,
  createdAt: new Date()
}); // Devuelve el objeto de usuario validado

// Lanza error de validación
// parseUser({ id: 1, name: "Juan" }); // Faltan campos obligatorios
```

### Transformando Datos

```typescript
import { Schema } from "@effect/schema";

// Transformar entre string y número
const NumberFromString = Schema.transform(
  Schema.String,
  Schema.Number,
  (s) => parseFloat(s),
  (n) => n.toString()
);

// Uso
const parseNumber = Schema.decodeUnknownSync(NumberFromString);
const number = parseNumber("42"); // Devuelve 42 como número
```

### Tipos Union y Literales

```typescript
import { Schema } from "@effect/schema";

const StatusSchema = Schema.Union(
  Schema.Literal("pendiente"),
  Schema.Literal("en-progreso"),
  Schema.Literal("completado"),
  Schema.Literal("fallido")
);

// Esto crea un tipo: "pendiente" | "en-progreso" | "completado" | "fallido"
type Status = Schema.To<typeof StatusSchema>;
```

### Manejo de Errores

```typescript
import { Schema, ParseResult } from "@effect/schema";

const safeParse = <A, I, R>(schema: Schema.Schema<A, I, R>, input: unknown) => {
  const result = Schema.decodeUnknownEither(schema)(input);
  if (result._tag === "Left") {
    console.error("Error de validación:", ParseResult.formatError(result.left));
    return null;
  }
  return result.right;
};

const user = safeParse(UserSchema, { id: "no-es-un-numero" });
// Muestra un error de validación detallado en la consola
```

## Características Avanzadas

### Validaciones Personalizadas

```typescript
import { Schema } from "@effect/schema";
import { pipe } from "effect/Function";

const ContraseñaSegura = pipe(
  Schema.String,
  Schema.minLength(8),
  Schema.pattern(/[A-Z]/), // Al menos una letra mayúscula
  Schema.pattern(/[a-z]/), // Al menos una letra minúscula
  Schema.pattern(/[0-9]/), // Al menos un dígito
  Schema.brand("ContraseñaSegura") // Marca el tipo para mayor seguridad
);

type ContraseñaSegura = Schema.To<typeof ContraseñaSegura>;

// Uso
const parsePassword = Schema.decodeUnknownSync(ContraseñaSegura);
// parsePassword("débil"); // Falla la validación
const contraseña = parsePassword("ContraseñaSegura123"); // Devuelve el string con marca
```

### Trabajando con Efectos

```typescript
import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";

const obtenerUsuario = (id: number): Effect.Effect<unknown> => {
  // Simular llamada a API
  return Effect.succeed({
    id,
    name: "Juan Pérez",
    email: "juan@ejemplo.com"
  });
};

const validarUsuario = (data: unknown) =>
  pipe(
    Schema.decodeUnknownEffect(UserSchema)(data),
    Effect.mapError((error) => new Error(`Validación fallida: ${error}`))
  );

// Uso en un contexto con efectos
const programa = pipe(
  obtenerUsuario(1),
  Effect.flatMap(validarUsuario),
  Effect.tap((usuario) => Effect.sync(() => console.log("Usuario válido:", usuario))),
  Effect.catchAll((error) => Effect.sync(() => console.error(error.message)))
);

Effect.runPromise(programa);
```

## Ejemplo del Mundo Real: Validación de Solicitud API

```typescript
import { Schema } from "@effect/schema";
import { pipe } from "effect/Function";
import { Effect } from "effect";

// Definir esquemas
const CrearUsuarioDto = Schema.Struct({
  nombreUsuario: pipe(
    Schema.String,
    Schema.minLength(3),
    Schema.maxLength(20),
    Schema.pattern(/^[a-zA-Z0-9_]+$/)
  ),
  email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  contraseña: pipe(
    Schema.String,
    Schema.minLength(8),
    Schema.pattern(/[A-Z]/),
    Schema.pattern(/[a-z]/),
    Schema.pattern(/[0-9]/)
  ),
  confirmarContraseña: Schema.String,
  edad: pipe(Schema.Number, Schema.int(), Schema.positive(), Schema.lessThan(150))
}).pipe(
  // Añadir validación personalizada
  Schema.filter(
    (input) => input.contraseña === input.confirmarContraseña,
    {
      message: "Las contraseñas no coinciden"
    }
  )
);

type CrearUsuarioDto = Schema.To<typeof CrearUsuarioDto>;

// Manejador de API
const manejadorCrearUsuario = (solicitud: unknown) =>
  pipe(
    Schema.decodeUnknownEffect(CrearUsuarioDto)(solicitud),
    Effect.flatMap((datosUsuario) => {
      // Aquí normalmente guardarías en una base de datos
      return Effect.succeed({
        exito: true,
        idUsuario: 1,
        nombreUsuario: datosUsuario.nombreUsuario
      });
    }),
    Effect.catchAll((error) =>
      Effect.succeed({
        exito: false,
        error: error.message
      })
    )
  );

// Ejemplo de uso
const ejecutarEjemplo = async () => {
  const solicitudValida = {
    nombreUsuario: "juanperez",
    email: "juan@ejemplo.com",
    contraseña: "ContraseñaSegura123",
    confirmarContraseña: "ContraseñaSegura123",
    edad: 30
  };

  const solicitudInvalida = {
    nombreUsuario: "jo",
    email: "correo-invalido",
    contraseña: "débil",
    confirmarContraseña: "no-coincide",
    edad: 200
  };

  const resultado1 = await Effect.runPromise(manejadorCrearUsuario(solicitudValida));
  console.log("Resultado de solicitud válida:", resultado1);

  const resultado2 = await Effect.runPromise(manejadorCrearUsuario(solicitudInvalida));
  console.log("Resultado de solicitud inválida:", resultado2);
};

ejecutarEjemplo();
```

## Conclusión

`@effect/schema` proporciona una forma poderosa y segura de validar y transformar datos en aplicaciones TypeScript. Al aprovechar su rico conjunto de características, puedes:

1. Asegurar la seguridad de tipos en tiempo de ejecución
2. Crear APIs autodocumentadas
3. Reducir el código repetitivo de validación
4. Detectar errores temprano en el proceso de desarrollo
5. Construir lógica de validación compleja de manera componible

Ya sea que estés construyendo una aplicación pequeña o un sistema a gran escala, `@effect/schema` puede ayudarte a mantener la integridad de los datos y la seguridad de tipos en todo tu código.

## Próximos Pasos

- Explora la [documentación oficial](https://effect.website/docs/schema/introduction) para casos de uso más avanzados
- Visita el [repositorio de GitHub](https://github.com/effect-ts/schema) para ver ejemplos y contribuir
- Aprende más sobre el [ecosistema Effect](https://effect.website/) para construir aplicaciones TypeScript robustas

Al adoptar `@effect/schema`, estarás en el camino correcto para escribir código TypeScript más confiable y mantenible.

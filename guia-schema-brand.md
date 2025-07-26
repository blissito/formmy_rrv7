# Entendiendo `Schema.brand`: Tipos Seguros para Principiantes

¡Hola, desarrollador! 👋 Si estás comenzando con TypeScript y `@effect/schema`, es posible que te hayas encontrado con `Schema.brand` y te hayas preguntado para qué sirve. ¡No te preocupes! En este post, te lo explicaré de manera sencilla y práctica.

## 📌 ¿Qué es `Schema.brand`?

Imagina que tienes dos tipos de strings en tu aplicación: correos electrónicos y nombres de usuario. Ambos son strings, pero representan cosas diferentes. `Schema.brand` te permite crear "etiquetas" para estos strings, haciendo que TypeScript los trate como tipos diferentes, ¡aunque ambos sean strings por dentro!

## 🧩 Un Ejemplo Sencillo

Vamos a crear un tipo para correos electrónicos que solo acepte un formato válido:

```typescript
import { Schema } from "@effect/schema";
import { pipe } from "effect/Function";

// 1. Creamos un esquema para emails con validación
const EmailSchema = pipe(
  Schema.String,  // Empezamos con un string normal
  // Aseguramos que tenga formato de email
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  // ¡Aquí está la magia! Le ponemos una "etiqueta"
  Schema.brand("Email")
);

// 2. Esto crea un tipo especial para emails
type Email = Schema.To<typeof EmailSchema>;

// 3. Función que solo acepta emails válidos
function enviarMensaje(email: Email) {
  console.log(`Enviando mensaje a: ${email}`);
}
```

## 🚀 Cómo usar nuestro tipo Email

### Creando un email válido:

```typescript
// Forma segura de crear un email
function crearEmail(correo: string): Email | null {
  try {
    return Schema.decodeUnknownSync(EmailSchema)(correo);
  } catch {
    return null;
  }
}

const miEmail = crearEmail("usuario@ejemplo.com");

if (miEmail) {
  enviarMensaje(miEmail); // ✅ Válido
} else {
  console.log("¡Email inválido!");
}
```

### ¿Qué pasa si intentamos hacer trampa?

```typescript
// Esto NO funcionará (TypeScript nos avisará)
// enviarMensaje("esto no es un email"); // ❌ Error de tipo

// Ni siquiera esto funcionará
const correoNormal = "usuario@ejemplo.com";
// enviarMensaje(correoNormal); // ❌ Sigue siendo un string normal
```

## 🧠 ¿Por qué es útil?

1. **Evita errores tontos**: No podrás confundir un email con cualquier otro string.
2. **Documenta tu código**: Al ver el tipo `Email`, sabes exactamente qué esperar.
3. **Validación en un solo lugar**: Validas el formato una vez y te olvidas.

## 🔍 Ejemplo del mundo real: Registro de usuarios

```typescript
// Definimos un esquema para contraseñas seguras
const PasswordSchema = pipe(
  Schema.String,
  Schema.minLength(8),
  Schema.pattern(/[A-Z]/), // Al menos una mayúscula
  Schema.pattern(/[a-z]/), // Al menos una minúscula
  Schema.pattern(/[0-9]/), // Al menos un número
  Schema.brand("Password")
);
type Password = Schema.To<typeof PasswordSchema>;

// Esquema para el usuario
const UsuarioSchema = Schema.Struct({
  nombre: Schema.String,
  email: EmailSchema,
  password: PasswordSchema
});

type Usuario = Schema.To<typeof UsuarioSchema>;

// Función para registrar un usuario
function registrarUsuario(datos: Usuario) {
  console.log("Registrando usuario:", datos);
  // Aquí iría la lógica de registro...
}

// Uso correcto
const nuevoUsuario = {
  nombre: "Ana García",
  email: crearEmail("ana@ejemplo.com"),
  password: Schema.decodeUnknownSync(PasswordSchema)("Segura123")
};

if (nuevoUsuario.email) {
  registrarUsuario({
    ...nuevoUsuario,
    email: nuevoUsuario.email
  });
}
```

## 💡 Consejos para principiantes

1. **Empieza simple**: No necesitas usar `brand` para todo. Comienza con los tipos básicos.
2. **Nombra bien tus tipos**: Usa nombres descriptivos como `Email`, `UserId`, `OrderNumber`.
3. **Agrupa validaciones comunes**: Crea funciones de ayuda para tipos que uses mucho.
4. **No abuses**: No todo necesita un tipo con marca. Úsalo cuando realmente añada valor.

## 🚀 ¿Listo para probarlo?

¡Intenta crear tus propios tipos con `Schema.brand`! Por ejemplo:

- Un tipo `Edad` que solo acepte números entre 0 y 120
- Un `Porcentaje` que solo acepte números entre 0 y 100
- Un `NombreCompleto` que no acepte números ni caracteres especiales

Recuerda que cada vez que creas un tipo con `brand`, estás haciendo tu código más seguro y expresivo. ¡Tu yo del futuro te lo agradecerá! 😊

¿Tienes alguna pregunta sobre `Schema.brand`? ¡Déjala en los comentarios! 👇

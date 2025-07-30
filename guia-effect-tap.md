# Dominando `Effect.tap`: El Arte de los Efectos Secundarios en TypeScript

## Introducción

Cuando trabajamos con programación funcional en TypeScript, especialmente con bibliotecas como Effect, a menudo necesitamos realizar efectos secundarios (como logging o depuración) sin alterar el flujo de nuestros datos. Aquí es donde `Effect.tap` se convierte en nuestra herramienta de confianza.

## ¿Qué es `Effect.tap`?

`Effect.tap` es una función que nos permite ejecutar un efecto secundario con el valor actual de nuestro flujo, sin modificar dicho valor. Es como echar un vistazo a los datos mientras pasan por nuestra cadena de operaciones.

### Analogía del Restaurante

Imagina que eres un chef en una cocina:
- **`map`**: Transformas los ingredientes (cortar, cocinar, mezclar)
- **`tap`**: Pruebas la comida para asegurarte de que todo va bien, pero no la modificas

## Ejemplo Básico

```typescript
import { Effect, pipe } from "effect";

// Sin tap
const programa1 = pipe(
  Effect.succeed(5),
  Effect.map(x => {
    console.log("El valor es:", x);
    return x * 2; // ¡Tengo que recordar devolver el valor!
  })
);

// Con tap (más limpio y seguro)
const programa2 = pipe(
  Effect.succeed(5),
  Effect.tap(x => 
    Effect.sync(() => console.log("El valor es:", x))
  ),
  Effect.map(x => x * 2) // El valor original sigue siendo 5 aquí
);
```

## Casos de Uso Comunes

### 1. Logging para Depuración

```typescript
import { Effect, pipe } from "effect";

function procesarUsuario(id: number) {
  return pipe(
    obtenerUsuario(id),
    Effect.tap(usuario => 
      Effect.sync(() => console.log("Usuario obtenido:", usuario))
    ),
    Effect.flatMap(validarUsuario),
    Effect.tap(usuarioValido => 
      Effect.sync(() => console.log("Usuario validado:", usuarioValido))
    )
    // El flujo continúa con el usuario validado
  );
}
```

### 2. Monitoreo de Rendimiento

```typescript
import { Effect, pipe } from "effect";

function conTiempoDeEjecucion<E, A>(efecto: Effect.Effect<A, E>) {
  const inicio = Date.now();
  return pipe(
    efecto,
    Effect.tap(() => 
      Effect.sync(() => {
        const fin = Date.now();
        console.log(`Tiempo de ejecución: ${fin - inicio}ms`);
      })
    )
  );
}

// Uso
const resultado = await Effect.runPromise(
  conTiempoDeEjecucion(
    Effect.sync(() => {
      // Código que queremos medir
      let suma = 0;
      for (let i = 0; i < 1000000; i++) {
        suma += i;
      }
      return suma;
    })
  )
);
```

## Diferencias Clave

### `tap` vs `map`

| Característica | `tap` | `map` |
|----------------|-------|-------|
| Modifica el valor | ❌ No | ✅ Sí |
| Retorna | El mismo valor | Un nuevo valor |
| Uso típico | Efectos secundarios | Transformaciones |

### `tap` vs `flatMap`

- `tap` es como `flatMap` pero descarta el resultado de la función
- `tap(fn)` es equivalente a `flatMap(x => fn(x).pipe(map(() => x)))`

## Buenas Prácticas

1. **Mantén los efectos secundarios pequeños**: `tap` es para operaciones rápidas como logging.
2. **No modifiques el estado global**: `tap` no debería tener efectos colaterales observables.
3. **Usa `Effect.sync` o `Effect.promise`** para envolver operaciones síncronas o asíncronas.
4. **Sé explícito**: Si necesitas transformar el valor, usa `map` o `flatMap` en su lugar.

## Ejemplo Avanzado: Pipeline de Procesamiento

```typescript
import { Effect, pipe } from "effect";

// Tipos de dominio
type Producto = {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
};

// Función simulada para obtener un producto
function obtenerProducto(id: number): Effect.Effect<Producto> {
  return Effect.succeed({
    id,
    nombre: "Laptop",
    precio: 1200,
    stock: 10
  });
}

// Pipeline de procesamiento
const procesarPedido = (productoId: number, cantidad: number) =>
  pipe(
    // 1. Obtener el producto
    obtenerProducto(productoId),
    
    // 2. Loggear el producto obtenido
    Effect.tap(producto =>
      Effect.sync(() => 
        console.log(`Procesando: ${producto.nombre} (${cantidad} unidades)`)
      )
    ),
    
    // 3. Validar stock
    Effect.flatMap(producto => {
      if (producto.stock < cantidad) {
        return Effect.fail(new Error("Stock insuficiente"));
      }
      return Effect.succeed(producto);
    }),
    
    // 4. Calcular total (y loggear)
    Effect.tap(producto => {
      const total = producto.precio * cantidad;
      return Effect.sync(() => 
        console.log(`Total a cobrar: $${total}`)
      );
    }),
    
    // 5. Retornar el producto (sin modificar)
    Effect.map(producto => ({
      ...producto,
      stock: producto.stock - cantidad
    })),
    
    // 6. Manejo de errores
    Effect.catchAll(error => 
      Effect.sync(() => {
        console.error("Error en el pedido:", error.message);
        return null;
      })
    )
  );

// Ejecutar el pipeline
Effect.runPromise(procesarPedido(1, 2));
```

## Conclusión

`Effect.tap` es una herramienta poderosa que nos permite:

1. **Mantener la inmutabilidad** de nuestros datos
2. **Depurar fácilmente** nuestros pipelines
3. **Agregar lógica de observabilidad** sin ensuciar nuestra lógica de negocio
4. **Mantener el código limpio** y expresivo

Recuerda: si necesitas transformar datos, usa `map` o `flatMap`. Si solo necesitas "ver" los datos de paso, `tap` es tu mejor opción.

¿Listo para implementar `Effect.tap` en tus proyectos? ¡Tu código te lo agradecerá! 🚀

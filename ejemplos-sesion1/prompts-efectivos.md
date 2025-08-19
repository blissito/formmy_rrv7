# Ejemplos de Prompts Efectivos vs Inefectivos

## 🔴 Prompts Inefectivos (Qué NO hacer)

### Ejemplo 1: Demasiado vago
```
"Mejora mi código"
```
**Problemas:**
- No especifica qué código
- No define qué tipo de mejoras
- Sin contexto del proyecto

### Ejemplo 2: Sin contexto técnico
```
"Crea un formulario de contacto"
```
**Problemas:**
- No especifica tecnología
- Sin requerimientos de validación
- No menciona el destino de los datos

### Ejemplo 3: Sobrecarga de información
```
"Necesito que hagas todo mi proyecto que es una app de delivery 
con usuarios, restaurantes, repartidores, pagos, mapas, 
notificaciones, admin panel, analytics, y que sea escalable"
```
**Problemas:**
- Scope demasiado amplio
- Sin priorización
- Imposible de abordar en una sesión

## ✅ Prompts Efectivos (Best Practices)

### Ejemplo 1: Específico y Contextualizado
```
Actúa como un senior fullstack developer especializado en Next.js.

Necesito refactorizar el componente ProductCard ubicado en 
/components/products/ProductCard.tsx para:

1. Mejorar performance usando React.memo
2. Implementar lazy loading de imágenes
3. Agregar skeleton loading
4. Mantener los tests existentes pasando

Contexto:
- El componente se renderiza en listas de 50+ items
- Usa TailwindCSS para estilos
- Las imágenes vienen de Cloudinary
- Tests con Vitest + React Testing Library
```

### Ejemplo 2: Estructurado con RICE
```
# Rol
Eres un experto en arquitectura de microservicios y DevOps con AWS.

# Instrucciones
Diseña un sistema de autenticación distribuido que:
- Use JWT con refresh tokens
- Implemente rate limiting
- Tenga fallback para alta disponibilidad
- Incluya logs estructurados

# Contexto
- Servicios actuales: 3 APIs en Node.js
- Infraestructura: ECS Fargate + ALB
- Base de datos: RDS PostgreSQL Multi-AZ
- Esperamos 10K usuarios concurrentes

# Ejemplos esperados
- Diagrama de arquitectura
- Configuración de API Gateway
- Implementación del servicio auth
- Scripts de deployment
```

### Ejemplo 3: Iterativo y Enfocado
```
Trabajaremos en el módulo de pagos de nuestra plataforma.

Primera tarea:
Implementa la integración con Stripe Checkout para productos 
únicos (no suscripciones).

Requerimientos:
- TypeScript estricto
- Manejo de errores con Result pattern
- Webhook para confirmación de pago
- Tests unitarios con mocks de Stripe

Archivos relevantes:
- /lib/stripe/checkout.ts (a crear)
- /app/api/stripe/webhook/route.ts (a crear)
- /types/payment.ts (existe, extender)

Usa las convenciones del proyecto definidas en CLAUDE.md
```

## 📊 Plantillas Reutilizables

### Plantilla para Debugging
```
# Problema
[Descripción del error/bug]

# Comportamiento esperado
[Qué debería pasar]

# Comportamiento actual
[Qué está pasando]

# Pasos para reproducir
1. [Paso 1]
2. [Paso 2]

# Contexto técnico
- Versiones: [Node, framework, etc]
- Ambiente: [development/production]
- Logs relevantes: [errores específicos]

# Archivos involucrados
- [Lista de archivos]

# Intentos previos de solución
- [Qué ya se intentó]
```

### Plantilla para Nueva Feature
```
# Feature: [Nombre]

## Objetivo de negocio
[Por qué es importante]

## Requerimientos técnicos
- [ ] Req 1
- [ ] Req 2

## Constraints
- Performance: [métricas esperadas]
- Seguridad: [consideraciones]
- UX: [principios a seguir]

## Stack actual
[Tecnologías que DEBEN usarse]

## Entregables
1. [Código]
2. [Tests]
3. [Documentación]

## Definition of Done
- [ ] Tests pasando
- [ ] Code review aprobado
- [ ] Documentación actualizada
```

### Plantilla para Refactoring
```
# Refactoring: [Componente/Módulo]

## Motivación
[Por qué refactorizar ahora]

## Código actual
- Ubicación: [path]
- Problemas: [lista de issues]
- Deuda técnica: [qué se acumuló]

## Objetivos del refactoring
- [ ] Mejorar [métrica]
- [ ] Eliminar [problema]
- [ ] Preparar para [futura feature]

## Restricciones
- NO romper: [APIs, contratos, etc]
- Mantener: [compatibilidad]
- Tiempo máximo: [deadline]

## Approach
[Estrategia paso a paso]
```

## 🎯 Ejercicios de Práctica

### Ejercicio 1: Transforma este prompt
**Malo:**
```
"Haz un login"
```

**Tu versión mejorada:**
```
[Espacio para que el estudiante complete]
```

### Ejercicio 2: Agrega contexto
**Base:**
```
"Optimiza las queries de la base de datos"
```

**Agrega:**
- Stack específico
- Métricas actuales
- Objetivo de performance
- Archivos involucrados

### Ejercicio 3: Crea un prompt RICE completo
**Tema:** Sistema de notificaciones en tiempo real

**Tu prompt:**
```
R:
I:
C:
E:
```

## 💡 Tips Avanzados

1. **Usa ejemplos del código actual**
   ```
   "Sigue el mismo patrón que usamos en /lib/auth/session.ts"
   ```

2. **Define el formato de salida**
   ```
   "Genera el código con comentarios JSDoc y tipos TypeScript"
   ```

3. **Especifica el nivel de detalle**
   ```
   "Implementación completa, no pseudocódigo"
   ```

4. **Incluye casos edge**
   ```
   "Considera: usuarios sin permisos, red lenta, datos null"
   ```

5. **Menciona el testing approach**
   ```
   "Incluye tests unitarios con casos happy path y edge cases"
   ```
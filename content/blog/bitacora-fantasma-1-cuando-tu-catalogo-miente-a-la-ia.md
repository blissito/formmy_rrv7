---
title: "Bitácora Fantasma #1: Cuando tu catálogo le miente a la IA"
excerpt: "Cómo datos inconsistentes casi arruinan una implementación de chatbot para e-commerce. Lecciones reales desde las primeras líneas de código."
date: "2025-01-08"
tags: ["Bitácora Fantasma", "RAG", "E-commerce", "Datos", "Lecciones"]
author: "Equipo Formmy"
image: "/assets/blog/blog_post_buscamos_empresas.png"
category: "useCase"
highlight: ""
---

# Bitácora Fantasma #1: Cuando tu catálogo le miente a la IA

*Esta es la primera entrada de "Bitácora Fantasma", una serie donde documentamos implementaciones reales de chatbots IA. Sin filtros. Sin marketing. Solo lo que realmente pasó.*

---

Calcetas la Huasteca tenía 2,000 productos y un chatbot que no encontraba ninguno.

Bueno, técnicamente sí los encontraba. Pero cuando un cliente preguntaba "¿tienen calcetas de algodón para diabéticos?", el bot respondía con links a calcetas de nylon deportivas. O peor: "No encontré productos relacionados con tu búsqueda".

Los productos existían. El catálogo estaba cargado. La tecnología funcionaba.

Entonces, ¿qué estaba fallando?

## El cliente

**Calcetas la Huasteca** es una tienda de e-commerce mexicana especializada en calcetería. Más de 2,000 SKUs, desde calcetas escolares hasta productos médicos especializados. Su objetivo era claro: atención 24/7 vía WhatsApp y web, captura automática de leads, y recomendaciones de productos basadas en las necesidades del cliente.

La implementación inicial parecía sencilla:

- WhatsApp Business API para mensajes directos
- Widget web embebido en su tienda
- RAG (Retrieval-Augmented Generation) con su catálogo completo
- Lead capture para prospectos calificados
- Artifacts visuales (tarjetas de producto) para mostrar recomendaciones

Todo conectado. Todo funcionando. ¿Qué podía salir mal?

## El problema que no vimos venir

Las primeras pruebas fueron un desastre silencioso.

El chatbot respondía. Era amable. Hasta hacía preguntas de seguimiento. Pero sus recomendaciones eran irrelevantes o inexistentes. Después de revisar los logs de conversaciones, identificamos tres patrones:

1. **Búsquedas que retornaban vacío** cuando los productos SÍ existían
2. **Recomendaciones genéricas** que ignoraban los filtros del cliente
3. **Confusión entre productos similares** con características opuestas

El problema no era el modelo de IA. Tampoco era la arquitectura RAG. Era algo más básico y más difícil de aceptar:

**El catálogo estaba mintiendo.**

## Los tres pecados del catálogo

Después de auditar los datos, encontramos lo que bautizamos como "los tres pecados del catálogo de e-commerce":

### 1. Nombres crípticos

```
Producto: "CLT-2847-ALG-BLC-M"
```

¿Qué es esto? Para el sistema interno, era obvio: Calceta Tradicional, SKU 2847, Algodón, Blanco, Talla M. Para un embedding de texto, era ruido incomprensible.

Cuando un cliente preguntaba "calcetas blancas de algodón talla M", el sistema de búsqueda semántica no podía conectar los puntos. El código SKU no tiene relación semántica con "algodón" ni con "blanco".

### 2. Descripciones copy-paste

```
Producto A: "Calceta de alta calidad, cómoda y duradera."
Producto B: "Calceta de alta calidad, cómoda y duradera."
Producto C: "Calceta de alta calidad, cómoda y duradera."
... (50 productos más con la misma descripción)
```

El RAG funciona generando embeddings (representaciones vectoriales) del contenido. Si 50 productos tienen la misma descripción, sus embeddings son casi idénticos. El modelo no puede distinguir entre una calceta para diabéticos y una calceta deportiva si ambas solo dicen "alta calidad, cómoda y duradera".

### 3. Campos vacíos o inconsistentes

| Producto | Material | Talla | Uso | Precio |
|----------|----------|-------|-----|--------|
| Calceta A | Algodón | M | - | $89 |
| Calceta B | - | Grande | Deportivo | - |
| Calceta C | Nylon/Algodón | M-L | diabetico | $129 |

Formatos mixtos. Campos vacíos. Inconsistencias en nomenclatura ("M" vs "Grande", "diabético" vs "diabetico" vs sin categorizar). Cada inconsistencia es un punto ciego para la IA.

## Por qué esto mata al RAG

Para los no técnicos: RAG es como un bibliotecario muy inteligente pero muy literal. Le das una pregunta, busca en su índice los documentos más relevantes, y usa esa información para responder.

Si los libros de la biblioteca tienen títulos crípticos, descripciones genéricas y categorías inconsistentes, el bibliotecario va a fallar. No porque sea incompetente, sino porque la información que tiene es basura.

> **Garbage in, garbage out.** Pero en la era de la IA, debería ser: **Garbage in, convincingly wrong answers out.**

El modelo no sabe que está equivocado. Responde con confianza basándose en los datos que tiene. Y eso es peor que no responder nada.

## La solución: data antes que modelo

Antes de tocar una sola línea de código del chatbot, nos enfocamos 100% en los datos.

### Paso 1: Auditoría automatizada

Creamos un script simple para identificar productos "problemáticos":

```typescript
// Detectar productos con datos pobres
const problematicos = productos.filter(p => {
  const tieneNombreCriptico = /^[A-Z]{2,}-\d+/.test(p.nombre);
  const descripcionCorta = (p.descripcion?.length || 0) < 50;
  const camposCriticosVacios = !p.material || !p.uso || !p.precio;

  return tieneNombreCriptico || descripcionCorta || camposCriticosVacios;
});

console.log(`${problematicos.length} productos necesitan atención`);
// Output: 847 productos necesitan atención
```

847 de 2,000. Casi la mitad del catálogo era invisible para la IA.

### Paso 2: Enriquecimiento estructurado

Trabajamos con el equipo del cliente para crear un formato de descripción estándar:

```
[Nombre descriptivo del producto]
Material: [material principal]
Talla: [rango de tallas disponibles]
Uso recomendado: [casual/deportivo/médico/escolar]
Características especiales: [lo que lo hace único]
Precio: $[precio]
```

Ejemplo real después del enriquecimiento:

```
Calceta de Algodón Antibacterial para Diabéticos - Blanco
Material: Algodón 95%, Elastano 5%
Talla: M (24-26 cm)
Uso recomendado: Médico, uso diario
Características especiales: Sin costuras, puntera reforzada,
tejido que no aprieta para mejorar circulación
Precio: $129 MXN
```

Ahora cuando alguien pregunta "calcetas para diabéticos", el embedding de esta descripción tiene alta similitud semántica con la consulta.

### Paso 3: Re-indexación completa

Una vez mejorados los datos, regeneramos todos los embeddings:

```typescript
// Re-procesar catálogo con datos limpios
for (const producto of catalogoEnriquecido) {
  await upsertContext({
    content: formatearDescripcion(producto),
    contextType: "PRODUCT",
    chatbotId: chatbot.id,
    metadata: {
      sku: producto.sku,
      precio: producto.precio,
      categoria: producto.categoria,
      disponible: producto.stock > 0
    }
  });
}
```

### Paso 4: Validación antes de lanzar

Creamos una suite de "pruebas de humo" con consultas reales de clientes:

| Consulta | Esperado | Resultado |
|----------|----------|-----------|
| "calcetas para diabéticos" | Productos médicos | Correcto |
| "calcetas escolares azul marino" | Calcetas escolares azules | Correcto |
| "algo para correr talla grande" | Calcetas deportivas L/XL | Correcto |
| "las más baratas" | Productos < $80 | Correcto |

Solo hasta que las 15 consultas de prueba pasaron, lanzamos a producción.

## Los resultados

Después de la limpieza de datos y re-lanzamiento:

| Métrica | Antes | Después |
|---------|-------|---------|
| Búsquedas con resultado vacío | 34% | 8% |
| Relevancia de recomendaciones (manual review) | 45% | 89% |
| Conversaciones completadas | 23% | 61% |
| Leads capturados/semana | 12 | 47 |

El mismo modelo. La misma arquitectura. Datos diferentes.

## Lo que viene

Actualmente estamos integrando el CRM del cliente para que los leads capturados fluyan directamente a su pipeline de ventas. También estamos implementando "Artifacts" visuales: cuando el chatbot recomienda un producto, muestra una tarjeta con imagen, precio y botón de compra.

Pero eso es material para otra entrada de la Bitácora.

## Lo que aprendimos

**Para founders**: Tu catálogo ES tu producto de IA. Puedes tener el modelo más avanzado del mundo, pero si tus datos son basura, tus respuestas serán basura convincente.

**Para equipos técnicos**: RAG no es magia. Es ingeniería de datos disfrazada de inteligencia artificial. Invierte el 80% del tiempo en datos y 20% en el modelo, no al revés.

**Para todos**: Antes de culpar al modelo, audita tus datos. La respuesta casi siempre está ahí.

---

## ¿Tu chatbot también sufre de datos sucios?

Ofrecemos un diagnóstico gratuito de calidad de datos para implementaciones de chatbot IA. Sin compromiso, sin venta agresiva. Solo queremos que más proyectos funcionen bien.

[Agenda tu diagnóstico](https://formmy.app) | [Prueba Formmy gratis](https://formmy.app)

---

*Bitácora Fantasma es una serie del equipo de Formmy donde documentamos implementaciones reales, con errores y todo. Porque aprender de los errores ajenos es más barato que cometer los propios.*

*¿Tienes una historia de implementación que quieras compartir? Escríbenos.*

---
title: "Cómo embeber tu chatbot de Formmy en tu sitio web"
excerpt: "Aprende las dos formas de integrar tu chatbot de IA en tu sitio web: widget flotante o enlace directo. Guía paso a paso con código incluido."
date: "2025-10-08"
tags: ["tutorial", "integración", "widget", "chatbot", "desarrollo-web"]
author: "Equipo Formmy"
image: "/blogposts/integracion.webp"
category: "tutorial"
---

Una vez que has creado y entrenado tu chatbot en Formmy, el siguiente paso es integrarlo en tu sitio web para que tus visitantes puedan interactuar con él. En esta guía te mostraremos las dos formas más populares de hacerlo.

## 🎯 Dos Formas de Integrar tu Chatbot

Formmy te ofrece dos opciones de integración, cada una diseñada para diferentes necesidades:

1. **Widget Flotante** - Una burbuja interactiva en la esquina inferior derecha
2. **Enlace Directo** - Un link HTML que abre el chat en una nueva ventana

Veamos cómo implementar cada una.

## 🔧 Opción 1: Widget Flotante (Recomendado)

El widget flotante es la forma más popular de integrar chatbots. Aparece como una burbuja en la esquina inferior derecha de tu sitio y se expande cuando el usuario hace clic.

### Ventajas del Widget

- ✅ No invasivo - Los usuarios deciden cuándo interactuar
- ✅ Siempre visible en todas las páginas
- ✅ Responsive y optimizado para móviles
- ✅ No bloquea el contenido de tu sitio
- ✅ Sin conflictos con otros scripts

### Instrucciones de Instalación

**Paso 1:** Ve a tu dashboard de Formmy, selecciona tu chatbot y accede a la sección **"Código"**.

**Paso 2:** Selecciona la opción **"iframe"** y copia el código que aparece.

**Paso 3:** Pega el código en tu archivo HTML, preferiblemente antes de la etiqueta `</body>`:

```html
<script type="module">
  import Chatbot from "https://www.formmy.app/widget.js"
  Chatbot.init({
    chatbotSlug: "tu-chatbot-slug",
    apiHost: "https://www.formmy.app"
  })
</script>
```

**Paso 4:** Reemplaza `tu-chatbot-slug` con el slug único de tu chatbot (ya viene pre-configurado en el código que copias desde el dashboard).

**Paso 5:** Guarda los cambios y recarga tu sitio web. ¡El widget debería aparecer automáticamente!

### Funciona en Todas Partes

El widget de Formmy es compatible con:

- 🌐 Sitios web HTML estáticos
- ⚛️ Frameworks modernos (React, Vue, Angular)
- 📝 CMS populares (WordPress, Shopify, Wix)
- 🎨 Plataformas de desarrollo (CodePen, JSFiddle)
- 🚀 Cualquier sitio que soporte JavaScript moderno

### Ejemplo de Implementación en WordPress

Si usas WordPress, puedes agregar el código usando el plugin **"Insert Headers and Footers"**:

1. Instala el plugin desde el repositorio de WordPress
2. Ve a Ajustes → Insert Headers and Footers
3. Pega el código en la sección "Scripts in Footer"
4. Guarda cambios

## 🔗 Opción 2: Enlace Directo

El enlace directo abre tu chatbot en una nueva pestaña del navegador. Es ideal para casos específicos como:

- Botones de "Chatea con nosotros" en tu header
- CTAs (Call to Action) en landing pages
- Links en emails o newsletters
- Menciones en redes sociales

### Instrucciones de Instalación

**Paso 1:** En tu dashboard de Formmy, selecciona la opción **"link"** en la sección de Código.

**Paso 2:** Copia el código HTML que aparece:

```html
<a href="https://www.formmy.app/chat/embed?slug=tu-chatbot-slug"
   target="_blank"
   rel="noopener noreferrer">
  Chatear con nuestro asistente
</a>
```

**Paso 3:** Pega el código donde quieras que aparezca el enlace en tu sitio.

**Paso 4:** Personaliza el texto del enlace según tus necesidades:

```html
<a href="https://www.formmy.app/chat/embed?slug=tu-chatbot-slug"
   target="_blank"
   rel="noopener noreferrer"
   class="btn btn-primary">
  ¿Necesitas ayuda? Habla con nuestro asistente
</a>
```

### Estiliza tu Enlace

Puedes agregar estilos CSS personalizados para que el enlace coincida con el diseño de tu sitio:

```html
<a href="https://www.formmy.app/chat/embed?slug=tu-chatbot-slug"
   target="_blank"
   rel="noopener noreferrer"
   style="background: #4F46E5;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;">
  💬 Chatea con nosotros
</a>
```

## 🎨 Personalización Avanzada

### Colores del Widget

Los colores del widget se configuran desde el dashboard de Formmy en la sección de "Personalización". Allí puedes ajustar:

- Color primario del chatbot
- Nombre de tu chatbot
- Logo personalizado
- Saludo y despedida

## 📊 Casos de Uso por Industria

### E-commerce

```html
<!-- Widget permanente + CTA en producto -->
<script type="module">
  import Chatbot from "https://www.formmy.app/widget.js"
  Chatbot.init({
    chatbotSlug: "tienda-online",
    apiHost: "https://www.formmy.app"
  })
</script>

<button onclick="document.querySelector('#formmy-widget-button').click()">
  ¿Dudas sobre este producto? Pregúntanos
</button>
```

### Servicios Profesionales

```html
<!-- Enlace en header + widget -->
<nav>
  <a href="https://www.formmy.app/chat/embed?slug=despacho-legal"
     target="_blank">
    Consulta Gratis
  </a>
</nav>

<script type="module">
  import Chatbot from "https://www.formmy.app/widget.js"
  Chatbot.init({
    chatbotSlug: "despacho-legal",
    apiHost: "https://www.formmy.app"
  })
</script>
```

### Educación

```html
<!-- Widget para soporte estudiantil 24/7 -->
<script type="module">
  import Chatbot from "https://www.formmy.app/widget.js"
  Chatbot.init({
    chatbotSlug: "universidad-soporte",
    apiHost: "https://www.formmy.app"
  })
</script>
```

## 🔒 Seguridad y Privacidad

El widget de Formmy está diseñado con seguridad en mente:

- ✅ Conexión HTTPS encriptada
- ✅ No accede a cookies de tu sitio
- ✅ No interfiere con otros scripts
- ✅ Cumple con GDPR y LFPDPPP
- ✅ Los datos se procesan de forma segura

## 🐛 Solución de Problemas

### El widget no aparece

1. **Verifica que el script esté antes de `</body>`**
   - Abre las herramientas de desarrollo (F12)
   - Busca errores en la consola

2. **Revisa que el slug sea correcto**
   - Copia el código directamente desde el dashboard
   - Verifica que no haya espacios extra

3. **Conflictos con otros scripts**
   - El widget usa ES Modules, verifica que tu navegador los soporte
   - Chrome 61+, Firefox 60+, Safari 11+ son compatibles

### El enlace no funciona

1. **Verifica la URL completa**
   - Debe incluir `https://`
   - El slug debe estar correctamente escrito

2. **Prueba en modo incógnito**
   - Descarta problemas de caché

## 🚀 Próximos Pasos

Una vez que tu chatbot esté integrado en tu sitio:

1. **Monitorea las conversaciones** desde tu dashboard
2. **Analiza las preguntas frecuentes** para mejorar las respuestas
3. **Ajusta el entrenamiento** basándote en interacciones reales
4. **Conecta integraciones** como WhatsApp o Messenger


## Conclusión

Integrar tu chatbot de Formmy en tu sitio web es un proceso simple que toma menos de 5 minutos. Ya sea que elijas el widget flotante para una presencia constante o el enlace directo para CTAs específicos, tu sitio estará equipado con un asistente de IA listo para ayudar a tus visitantes 24/7.

¿Aún no tienes tu chatbot? [Crea uno gratis en Formmy](https://www.formmy.app/) y empieza a automatizar la atención a tus clientes hoy mismo.

---

**¿Tienes preguntas sobre la integración?** Nuestro equipo de soporte está listo para ayudarte. Chatea con nosotros directamente desde [formmy.app](https://www.formmy.app) 🚀

---
# ============================================================
# TEMPLATE PARA NUEVOS POSTS DE BLOG - FORMMY
# ============================================================
#
# INSTRUCCIONES:
# 1. Copia este archivo y renombralo como: mi-nuevo-post.md
# 2. El slug sera el nombre del archivo (sin .md)
# 3. Completa todos los campos marcados como REQUERIDO
# 4. Elimina estos comentarios antes de publicar
#
# ============================================================

title: "Titulo del Post"
# REQUERIDO - Max 60 caracteres para SEO optimo
# Ejemplo: "Como Implementar RAG con MongoDB Atlas"

excerpt: "Descripcion corta del post que aparece en listados y meta description."
# REQUERIDO - Max 160 caracteres para SEO
# Debe ser atractivo y describir el valor del contenido

date: "2025-01-01"
# REQUERIDO - Formato ISO: YYYY-MM-DD
# Usar fecha de publicacion real

tags: ["Tag1", "Tag2", "Tag3"]
# REQUERIDO - Array de 3-5 tags relevantes
# Usar mayuscula inicial: ["Tutorial", "IA", "WhatsApp"]
# Tags comunes: IA, Chatbot, Tutorial, WhatsApp, RAG, Desarrollo

author: "Equipo Formmy"
# OPCIONAL - Autor del post
# Opciones:
#   - "Equipo Formmy" (default generico)
#   - "[@username](https://github.com/username)" (con link a GitHub)
#   - "Nombre Apellido" (sin link)

image: "/blogposts/nombre.webp"
# REQUERIDO - Imagen de cover
# Opciones:
#   - Local: "/blogposts/tu-imagen.webp" (guardar en /public/blogposts/)
#   - Pexels: "https://images.pexels.com/photos/XXXXX/pexels-photo-XXXXX.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750"
# Imagenes locales disponibles: blog.webp, chat.webp, cursos.webp, launch.webp,
#   tips.webp, training.webp, prompt.webp, temperatura.webp, whats.webp

category: "article"
# REQUERIDO - Categoria del post
# Valores validos:
#   - "article"    -> Aparece en filtro "Articulos" (contenido informativo/educativo)
#   - "tutorial"   -> Aparece en filtro "Tutoriales" (guias paso a paso)
#   - "useCase"    -> Aparece en filtro "Casos de Uso" (historias de exito)
#   - "anuncio"    -> Solo en "Todos" (lanzamientos, novedades)

highlight: ""
# OPCIONAL - Para posts destacados en homepage
# Valores: "main" (hero principal), "secondary" (destacado lateral)
# Dejar vacio "" para posts normales

---

# Titulo Principal del Post

[Introduccion - 2-3 parrafos que engachen al lector y expliquen el valor del contenido]

## Primera Seccion

[Contenido de la seccion...]

### Subseccion (si aplica)

[Contenido mas especifico...]

## Segunda Seccion

[Contenido...]

```typescript
// Bloques de codigo con lenguaje especificado
const ejemplo = "siempre especificar el lenguaje";
```

## Tercera Seccion

| Columna 1 | Columna 2 | Columna 3 |
|-----------|-----------|-----------|
| Dato 1    | Dato 2    | Dato 3    |

> Blockquotes para citas o destacados importantes

## Conclusiones

[Resumen de los puntos clave del articulo]

---

## Prueba Formmy

[CTA - Llamado a la accion hacia formmy.app]

[Prueba Formmy Gratis](https://formmy.app) - [Descripcion del valor]

*¿Tienes preguntas? Nuestro equipo esta listo para ayudarte.*

---

# ============================================================
# CHECKLIST ANTES DE PUBLICAR
# ============================================================
#
# [ ] Frontmatter completo (title, excerpt, date, tags, image, category)
# [ ] Imagen de cover existe y carga correctamente
# [ ] Category es valida (article/tutorial/useCase/anuncio)
# [ ] Bloques de codigo tienen lenguaje especificado (typescript, json, etc)
# [ ] Tablas renderizan correctamente (probar en local)
# [ ] Links funcionan y abren correctamente
# [ ] CTA a Formmy al final del post
# [ ] Sin errores de ortografia/gramatica
# [ ] Eliminar estos comentarios del template
#
# PROBAR EN LOCAL: npm run dev -> http://localhost:5173/blog/tu-slug
# ============================================================

# 🎨 Sistema de Presentaciones FixterGeek

## Template Base Creado

### 📁 Archivos del Sistema:
- `marp-template-fixtergeek.md` - Template base con estilos FixterGeek
- `presentacion-claude-code-sesion1.md` - Ejemplo de uso completo

## 🎯 Cómo Usar el Template

### 1. Copiar el Template
```bash
cp marp-template-fixtergeek.md mi-nueva-presentacion.md
```

### 2. Personalizar Contenido
- Cambiar título y subtítulo
- Actualizar footer si es necesario
- Agregar tu contenido manteniendo la estructura

### 3. Generar HTML
```bash
npx @marp-team/marp-cli mi-nueva-presentacion.md -o mi-presentacion.html --allow-local-files
```

## 🎨 Paleta de Colores FixterGeek

```css
/* Colores principales */
--primary: #37ab93;      /* Verde FixterGeek */
--secondary: #4ed8b8;    /* Verde claro */
--tertiary: #6ee5c9;     /* Verde muy claro */
--background: #1A2229;   /* Gris oscuro */
--dark: #000000;         /* Negro */
```

## 📐 Clases CSS Disponibles

### Layouts
- `.columns` - Dos columnas iguales
- `.three-columns` - Tres columnas iguales
- `.center` - Centrar contenido

### Elementos Destacados
- `.highlight` - Caja importante con brillo verde
- `.warning` - Advertencia (rojo)
- `.success` - Éxito (verde)
- `.fixtergeek-brand` - Texto con gradiente de marca

### Utilidades
- `.large-emoji` - Emojis grandes (48px)

## 🎯 Buenas Prácticas

### Estructura Recomendada:
1. **Slide de título** con logo/marca
2. **Agenda** con timing específico
3. **Objetivos** claros
4. **Contenido** en secciones de 15-30 min
5. **Breaks** marcados claramente
6. **Ejercicios** intercalados
7. **Resumen** y próximos pasos
8. **Contacto** y recursos

### Tips de Contenido:
- Máximo 6 bullets por slide
- Código en bloques pequeños y legibles
- Usar emojis para hacer visual
- Incluir ejemplos prácticos
- Timing específico en agenda

## 🚀 Comando Rápido

Para generar presentación completa:
```bash
# Crear desde template
cp marp-template-fixtergeek.md nueva-sesion.md

# Editar contenido
# ... agregar tu contenido ...

# Generar HTML
npx @marp-team/marp-cli nueva-sesion.md -o nueva-sesion.html --allow-local-files

# Abrir en navegador
open nueva-sesion.html
```

## 📝 Actualizaciones del Agente

Para que el agente `marp-presentation-converter` use automáticamente estos estilos, se debe:

1. **Configurar template por defecto** en el agente
2. **Usar automáticamente** los colores FixterGeek
3. **Aplicar estructura** estándar recomendada
4. **Incluir clases CSS** personalizadas

El template está optimizado para:
- ✅ Presentaciones técnicas de 1-3 horas
- ✅ Workshops con ejercicios prácticos  
- ✅ Cursos de programación
- ✅ Sesiones en vivo con breaks
- ✅ Branding consistente FixterGeek

## 🎨 Ejemplos de Uso

Ver `presentacion-claude-code-sesion1.md` como referencia completa de implementación del template con contenido real de 2 horas.
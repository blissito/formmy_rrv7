# Casos Prácticos - Sesión 1 Claude Code

## 🎯 Caso Práctico 1: Sistema de Comentarios
### Duración: 20 minutos

#### Contexto inicial para CLAUDE.md
```markdown
# Blog Platform - Comments System

## Stack
- Next.js 14 (App Router)
- Prisma + PostgreSQL
- TailwindCSS

## Current Task
Implementing nested comments system with:
- Real-time updates
- Optimistic UI
- Moderation queue
- Rate limiting

## Database Schema
Already have: User, Post models
Need: Comment model with self-relation
```

#### Prompt Secuencia 1
```bash
claude "Basándote en el contexto del proyecto, crea el modelo 
        Prisma para comentarios anidados con soft delete 
        y campos de moderación"
```

#### Resultado esperado
```prisma
model Comment {
  id        String   @id @default(cuid())
  content   String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  
  // Moderation
  status    CommentStatus @default(PENDING)
  flags     Int          @default(0)
  
  // Relations
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  
  postId    String
  post      Post     @relation(fields: [postId], references: [id])
  
  parentId  String?
  parent    Comment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies   Comment[] @relation("CommentReplies")
  
  @@index([postId, status])
  @@index([parentId])
  @@index([authorId])
}

enum CommentStatus {
  PENDING
  APPROVED
  REJECTED
  SPAM
}
```

#### Prompt Secuencia 2
```bash
claude --resume "Ahora crea el API route para obtener comentarios 
                 con paginación cursor-based y filtro por status"
```

#### Prompt Secuencia 3
```bash
claude --resume "Implementa el componente React con optimistic 
                 updates y skeleton loading"
```

---

## 🎯 Caso Práctico 2: Optimización de Consultas N+1
### Duración: 15 minutos

#### Setup inicial
```typescript
// Código con problema N+1
async function getPostsWithAuthors() {
  const posts = await prisma.post.findMany();
  
  const postsWithAuthors = await Promise.all(
    posts.map(async (post) => {
      const author = await prisma.user.findUnique({
        where: { id: post.authorId }
      });
      return { ...post, author };
    })
  );
  
  return postsWithAuthors;
}
```

#### Prompt para optimización
```bash
claude "Tengo este código con problema N+1 queries en 
        /api/posts/route.ts. Optimízalo usando includes 
        de Prisma y agrega logging para verificar que 
        solo se ejecute 1 query"
```

#### Solución esperada
```typescript
// Código optimizado
async function getPostsWithAuthors() {
  // Log para debugging
  const startTime = performance.now();
  
  const posts = await prisma.post.findMany({
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      },
      _count: {
        select: {
          comments: true,
          likes: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  const queryTime = performance.now() - startTime;
  console.log(`Query executed in ${queryTime.toFixed(2)}ms`);
  
  return posts;
}

// Con middleware de Prisma para logging
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  console.log(`Query ${params.model}.${params.action} took ${after - before}ms`);
  
  return result;
});
```

---

## 🎯 Caso Práctico 3: Manejo de Sesión Multi-Día
### Duración: 25 minutos

#### Día 1: Inicio del Feature
```bash
# Crear CLAUDE.md inicial
echo "# Task Tracker Feature

## Objetivo
Sistema de seguimiento de tareas con Kanban board

## Progress Log
- Day 1: Database schema and API setup
" > CLAUDE.md

# Iniciar implementación
claude "Implementa el schema de Prisma para un sistema de 
        tareas con boards, listas y cards estilo Trello"
```

#### Día 2: Continuación con Context
```bash
# Actualizar CLAUDE.md
echo "
- Day 2: Implementing drag & drop
## Decisions Made
- Using dnd-kit for drag and drop
- Optimistic updates for better UX
" >> CLAUDE.md

# Continuar con --resume
claude --resume "Implementa drag & drop entre listas usando 
                 dnd-kit y actualización optimista del orden"
```

#### Día 3: Finalización y Tests
```bash
# Actualizar contexto final
echo "
- Day 3: Testing and optimization
## Pending
- Add activity log
- Implement real-time updates
" >> CLAUDE.md

# Completar con tests
claude --resume "Agrega tests E2E con Playwright para el 
                 flujo completo de crear board, agregar 
                 tareas y moverlas entre listas"
```

---

## 🎯 Caso Práctico 4: Token Optimization Challenge
### Duración: 15 minutos

#### Archivo original (2500 tokens)
```javascript
// components/Dashboard.jsx - 300 líneas de código
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
// ... 50 más imports

export function Dashboard() {
  // ... 250 líneas de lógica compleja
  const [filters, setFilters] = useState({/*...*/});
  const [selectedItems, setSelectedItems] = useState([]);
  // ... más estado
  
  // ... múltiples useEffects
  // ... múltiples handlers
  // ... render complejo
}
```

#### Ejercicio: Crear resumen optimizado
**Objetivo:** Reducir a < 500 tokens manteniendo contexto útil

#### Solución ejemplo
```markdown
# Dashboard Component Summary

## Purpose
Main dashboard displaying user metrics and activity

## Key Features
- Real-time data updates via React Query
- Complex filtering system (8 filter types)
- Bulk actions on selected items
- Export functionality (CSV, PDF)

## Dependencies
- @tanstack/react-query: Data fetching
- recharts: Charts rendering  
- date-fns: Date manipulation
- zustand: Global filter state

## State Management
- Local: filters, selectedItems, viewMode
- Global: user preferences (Zustand)
- Server: metrics data (React Query, 30s refresh)

## Performance Considerations
- Virtualized lists for >100 items
- Memoized calculations for aggregates
- Lazy loading for chart data

## API Endpoints Used
- GET /api/metrics/overview
- GET /api/metrics/details?filters=
- POST /api/export/generate

## Known Issues
- Mobile layout breaks < 768px
- Export fails for >10k records
- Filter state not persisted on refresh
```

---

## 🎯 Ejercicio Integrador Final
### Duración: 30 minutos

#### Proyecto: Sistema de Notificaciones Multi-Canal

##### Parte 1: Setup (5 min)
```bash
# Crear estructura inicial
mkdir notification-system
cd notification-system

# Crear CLAUDE.md
cat > CLAUDE.md << 'EOF'
# Multi-Channel Notification System

## Requirements
- Email (AWS SES)
- SMS (Twilio)
- Push (Firebase)
- In-app (WebSocket)

## Tech Stack
- Node.js + Express
- Bull for queues
- Redis for caching
- PostgreSQL for persistence

## Architecture Pattern
- Service layer pattern
- Strategy pattern for channels
- Observer pattern for real-time
EOF
```

##### Parte 2: Implementación Base (10 min)
```bash
claude "Siguiendo el contexto en CLAUDE.md, implementa:
        1. Interface base para NotificationChannel
        2. Implementación para EmailChannel con SES
        3. Sistema de colas con Bull
        4. Manejo de reintentos y fallbacks"
```

##### Parte 3: Expansión con --resume (10 min)
```bash
# Agregar más contexto
echo "
## Implemented
- Base interfaces ✓
- Email channel ✓
- Queue system ✓

## Next
- SMS channel
- Priority routing
" >> CLAUDE.md

claude --resume "Agrega canal SMS con Twilio y sistema 
                 de prioridades (high, medium, low) que 
                 afecte el orden de procesamiento en Bull"
```

##### Parte 4: Testing y Documentación (5 min)
```bash
claude --resume "Crea tests unitarios para cada canal y 
                 tests de integración para el flujo completo. 
                 Incluye documentación de API con ejemplos"
```

---

## 📊 Métricas de Evaluación

### Para cada caso práctico, evaluar:

1. **Calidad del Prompt** (1-5)
   - Claridad
   - Contexto suficiente
   - Estructura RICE

2. **Gestión de Contexto** (1-5)
   - Uso de CLAUDE.md
   - Continuidad con --resume
   - Optimización de tokens

3. **Resultado** (1-5)
   - Código funcional
   - Sigue convenciones
   - Incluye tests

### Rúbrica de evaluación:
- **15 puntos**: Excelente, listo para producción
- **12-14 puntos**: Bueno, requiere ajustes menores
- **9-11 puntos**: Aceptable, necesita refactoring
- **< 9 puntos**: Requiere práctica adicional

---

## 🔧 Scripts de Apoyo

### Script 1: Token Counter
```python
#!/usr/bin/env python3
# token-counter.py

import sys
import tiktoken

def count_tokens(text, model="cl100k_base"):
    """Count tokens in text using tiktoken"""
    encoder = tiktoken.get_encoding(model)
    tokens = encoder.encode(text)
    return len(tokens)

def analyze_file(filepath):
    """Analyze token usage in a file"""
    with open(filepath, 'r') as f:
        content = f.read()
    
    tokens = count_tokens(content)
    lines = content.count('\n')
    chars = len(content)
    
    print(f"File: {filepath}")
    print(f"Tokens: {tokens:,}")
    print(f"Lines: {lines:,}")
    print(f"Characters: {chars:,}")
    print(f"Avg tokens/line: {tokens/lines:.1f}")
    
    if tokens > 8000:
        print("⚠️  WARNING: File exceeds recommended CLAUDE.md size")
    elif tokens > 5000:
        print("⚡ Consider optimizing for better performance")
    else:
        print("✅ File size is optimal")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python token-counter.py <file>")
        sys.exit(1)
    
    analyze_file(sys.argv[1])
```

### Script 2: Context Backup
```bash
#!/bin/bash
# backup-context.sh

BACKUP_DIR="claude-context-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup CLAUDE.md if exists
if [ -f "CLAUDE.md" ]; then
    cp CLAUDE.md "$BACKUP_DIR/CLAUDE_$TIMESTAMP.md"
    echo "✅ Backed up CLAUDE.md"
fi

# Save current git branch and commit
git branch --show-current > "$BACKUP_DIR/git_state_$TIMESTAMP.txt"
git rev-parse HEAD >> "$BACKUP_DIR/git_state_$TIMESTAMP.txt"
echo "✅ Saved git state"

# Create summary
cat > "$BACKUP_DIR/summary_$TIMESTAMP.md" << EOF
# Context Backup - $TIMESTAMP

## Git State
Branch: $(git branch --show-current)
Commit: $(git rev-parse --short HEAD)

## Changed Files
$(git status --short)

## Session Notes
[Add your notes here]
EOF

echo "✅ Context backed up to $BACKUP_DIR"
```

### Script 3: Resume Helper
```bash
#!/bin/bash
# smart-resume.sh

# Check if we have a previous session
if [ -f ".claude-session" ]; then
    LAST_SESSION=$(cat .claude-session)
    echo "📎 Found previous session: $LAST_SESSION"
    echo "Continue with: claude --resume"
else
    echo "🆕 No previous session found"
    echo "Start new with: claude"
fi

# Show recent CLAUDE.md changes
if [ -f "CLAUDE.md" ]; then
    echo ""
    echo "📝 Recent CLAUDE.md updates:"
    tail -10 CLAUDE.md | head -5
fi

# Show token count if script available
if [ -f "token-counter.py" ]; then
    echo ""
    python token-counter.py CLAUDE.md 2>/dev/null
fi
```

---

## 💡 Tips para el Instructor

### Preparación Pre-Sesión
1. Tener un proyecto de ejemplo funcionando
2. Probar todos los comandos
3. Preparar respuestas a FAQs comunes
4. Tener backup de los ejemplos

### Durante la Sesión
1. Compartir pantalla en alta resolución
2. Usar dos monitores (presentación / código)
3. Hacer pausas cada 30 minutos
4. Pedir feedback continuo

### Post-Sesión
1. Compartir grabación
2. Enviar material de apoyo
3. Crear canal de Discord/Slack para dudas
4. Programar sesión de follow-up opcional
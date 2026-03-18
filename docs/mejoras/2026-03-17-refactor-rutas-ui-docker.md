# Refactor de rutas, UI enriquecida y renombre Docker

Fecha: 2026-03-17

## Cambios realizados

### Estructura de rutas — reorganización completa

Todas las páginas se movieron bajo el prefijo `/dashboard/`:

| Antes | Después |
|---|---|
| `/(dashboard)/generate/page.tsx` | `/(dashboard)/dashboard/generate/page.tsx` |
| `/(dashboard)/posts/page.tsx` | `/(dashboard)/dashboard/posts/page.tsx` |
| `/(dashboard)/projects/page.tsx` | `/(dashboard)/dashboard/projects/page.tsx` |
| `/(dashboard)/settings/page.tsx` | `/(dashboard)/dashboard/settings/page.tsx` |

El layout (`app/(dashboard)/layout.tsx`) se actualizó para reflejar los nuevos hrefs.

### Identidad visual — Yetzar Content Studio

El sidebar ahora muestra la marca **Yetzar** / Content Studio con paleta verde (`#9AF5E4`, `#00C8A0`, `#062014`). El logo es un SVG mínimo (icono Zap en cuadro redondeado), no un emoji ni placeholder.

### Dashboard enriquecido

**`app/(dashboard)/dashboard/page.tsx`** pasó de ser un panel de estadísticas simple a incluir:

- **Ideas de hooks** (`HOOK_IDEAS`): 5 fórmulas de contenido con categoría, fórmula, ejemplo, tip de rendimiento, red recomendada y tipo de contenido. Basadas en las fórmulas del skill `social-content`.
- **Pilares de contenido** (`PILLARES`): distribución visual de los 4 pilares (Insights, BTS, Educativo, Historia personal) con porcentajes.
- Lista de proyectos activos con contador de posts.

### Docker — renombre de contenedores y puertos

**`docker-compose.yml`** actualizado:

| Servicio | Container anterior | Container nuevo | Puerto externo |
|---|---|---|---|
| App | (sin nombre fijo) | `content-forge-app` | 3000 |
| DB | `servicio_tecnico_db` | `yetzar-db` | **5433** (era 5432) |
| pgAdmin | (sin nombre fijo) | `yetzar-pgadmin` | **8081** (era 8080) |

La `DATABASE_URL` interna en docker-compose apunta a `yetzar-db:5432` (hostname del servicio Docker).

### Servicio de publicación — soporte completo de tipos de contenido

**`lib/services/publish.service.ts`**:
- `publishToFacebook`: maneja VIDEO (`/videos`), STORY (`/photo_stories`), CAROUSEL (álbum multi-foto via `attached_media`)
- `publishToInstagram`: maneja STORY (`media_type: 'STORIES'`)
- `publishToTikTok`: solo VIDEO — lanza error claro si se intenta publicar IMAGE/CAROUSEL

**`app/api/publish/route.ts`**: pasa `contentType`, `videoUrl` y `mediaUrls` a los servicios.

### Nuevas rutas API

- **`PATCH /api/projects/[id]`** — editar campos del proyecto (nombre, industria, color, tono, audiencia, descripción)
- **`DELETE /api/projects/[id]`** — soft delete (`active: false`) preservando posts relacionados

### Login

- Página `/login` con formulario de credenciales (NextAuth v5 credentials provider)
- `middleware.ts` protege todas las rutas bajo `/(dashboard)`, redirige a `/login`

## Pendiente

- Programación de publicaciones (fecha/hora futura)
- Aprobación previa antes de publicar
- Métricas y trazabilidad de uso por proyecto
- Renovación automática de tokens expirados (TikTok: 24 h, Refresh Token: 365 días)

# Completar flujos pendientes

Fecha: 2026-03-17

## Origen

Revisión del estado real del código contra el listado de mejoras de 2026-03-15. Se identificaron los ítems que seguían sin implementar y se completaron en esta sesión.

## Cambios realizados

### Flujo de publicación — tipos de contenido completos

**`lib/services/publish.service.ts`**
- `publishToFacebook`: ahora acepta `contentType` y maneja VIDEO (`/videos`), STORY (`/photo_stories`) y CAROUSEL (álbum multi-foto via `attached_media`).
- `publishToInstagram`: ahora acepta `contentType` y maneja STORY (`media_type: 'STORIES'`).

**`app/api/publish/route.ts`**
- Se pasa `contentType`, `videoUrl` y `mediaUrls` a las funciones de publicación.
- Se corrigió el tipo de `result` (propiedad `error` era `string | undefined`, incompatible con la declaración anterior).
- Se eliminó el import no usado de `Network`.

### Gestión de proyectos

**`app/api/projects/[id]/route.ts`** (nuevo)
- `PATCH`: actualiza nombre, industria, color, tono, audiencia, descripción.
- `DELETE`: soft delete (`active: false`) para preservar posts relacionados.

**`app/(dashboard)/projects/page.tsx`**
- Botón de edición por proyecto con modal inline (mismo patrón que posts).
- Botón de eliminación con confirmación.

### Mejoras en el preview de generación

**`app/(dashboard)/generate/page.tsx`**
- Se agregó `contentType` y `mediaUrls` a la interfaz `Post`.
- Preview adaptatvo: VIDEO muestra `<video>` con controles, CAROUSEL muestra miniaturas horizontales scrollables, STORY muestra la imagen en proporción 9:16.

### Dashboard

**`app/(dashboard)/dashboard/page.tsx`**
- Renombrado "APIs conectadas" (valor hardcodeado: 3) a "Redes soportadas" (Facebook, Instagram, TikTok).

### Documentación

**`docs/credenciales.md`** (nuevo)
- Guía completa de dónde obtener y dónde configurar cada credencial: Anthropic, fal.ai, Meta (Facebook + Instagram), TikTok.
- Distingue entre credenciales de app (`.env.local`) y tokens de usuario/página (panel de cuentas sociales).

## Pendiente

- Programación de publicaciones (fecha/hora futura).
- Aprobación previa antes de publicar.
- Métricas y trazabilidad de uso por proyecto.
- Renovación automática de tokens expirados (especialmente TikTok: 24 h).

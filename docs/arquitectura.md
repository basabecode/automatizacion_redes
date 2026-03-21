# Arquitectura

## Resumen

Yetzar Content Studio es una aplicación local basada en `Next.js` para generación y publicación de contenido social asistido por IA. La app corre en `localhost:3000`; el backend y frontend viven en el mismo proyecto, y la persistencia actual usa `PostgreSQL` por Docker con acceso desde Prisma.

## Stack técnico

### Aplicación

- `Next.js 15.1.0`
- `React 19`
- `TypeScript 5`
- `Tailwind CSS 3`
- `NextAuth 5 beta`
- `Zod`
- `Lucide React`

### Backend local y datos

- `Node.js 20+`
- `Prisma 5`
- `PostgreSQL 16`
- `Docker Desktop`
- `pgAdmin 4`

### IA y servicios externos

- `Anthropic SDK` para generación de texto
- `fal.ai` para generación de imagen y video
- `Meta Graph API` para Facebook e Instagram
- `TikTok API`

### Tooling

- `pnpm`
- `ESLint 9`
- `PostCSS`
- `Sharp`
- `tsx`

## Arquitectura operativa actual

### Desarrollo recomendado en Windows

El flujo recomendado actual es:

- Docker solo para la base de datos `yetzar-db`
- `Next.js` corriendo fuera del contenedor mediante `pnpm dev`
- arranque unificado con [scripts/dev-windows.ps1](C:/Users/Usuario/Desktop/automatizacion/scripts/dev-windows.ps1)
- lanzador limpio con [scripts/dev-windows-launcher.ps1](C:/Users/Usuario/Desktop/automatizacion/scripts/dev-windows-launcher.ps1)
- entrada de escritorio con [Abrir Yetzar Studio.vbs](C:/Users/Usuario/Desktop/automatizacion/Abrir%20Yetzar%20Studio.vbs)

Esto permite hot reload mientras se editan archivos desde el IDE.

### Servicios Docker

Definidos en [docker-compose.yml](C:/Users/Usuario/Desktop/automatizacion/docker-compose.yml):

| Servicio | Puerto | Uso |
|---|---:|---|
| `content-forge-app` | `3000` | Ejecución completa de la app por Docker |
| `yetzar-db` | `5433` | PostgreSQL local |
| `yetzar-pgadmin` | `8081` | Administración visual de DB |

Nota:

- el contenedor `content-forge-app` existe, pero el flujo preferido de desarrollo no lo usa para la app
- el flujo preferido usa Docker solo para la base de datos

## Estructura principal del repositorio

- [app](C:/Users/Usuario/Desktop/automatizacion/app): App Router, páginas, layouts y API routes
- [components](C:/Users/Usuario/Desktop/automatizacion/components): componentes compartidos de UI
- [lib](C:/Users/Usuario/Desktop/automatizacion/lib): autenticación, Prisma, cifrado y servicios
- [prisma](C:/Users/Usuario/Desktop/automatizacion/prisma): esquema, migraciones y seed
- [scripts](C:/Users/Usuario/Desktop/automatizacion/scripts): automatizaciones locales y lanzadores
- [public](C:/Users/Usuario/Desktop/automatizacion/public): assets públicos, logos e iconos

## Modelo de datos

Archivo fuente: [prisma/schema.prisma](C:/Users/Usuario/Desktop/automatizacion/prisma/schema.prisma)

Entidades principales:

- `Project`
- `SocialAccount`
- `Post`
- `PublishLog`
- `CalendarEntry`

### Flujo núcleo

`Project` -> `Post` -> `PublishLog`

### Descripción resumida

- `Project`: marca o cliente con tono, audiencia, industria y configuración
- `SocialAccount`: cuenta social conectada por red y proyecto
- `Post`: contenido generado, con media, estado y red objetivo
- `PublishLog`: historial de intentos de publicación
- `CalendarEntry`: planificación editorial por fecha

### Enums relevantes

- `Network`: `FACEBOOK`, `INSTAGRAM`, `TIKTOK`
- `ContentType`: `IMAGE`, `VIDEO`, `CAROUSEL`, `STORY`
- `PostStatus`: `DRAFT`, `GENERATING`, `READY`, `PUBLISHING`, `PUBLISHED`, `FAILED`
- `CalendarStatus`: `PENDING`, `GENERATING`, `READY`, `APPROVED`, `PUBLISHED`, `NEEDS_EDIT`

## Capa de servicios

Ubicación: [lib/services](C:/Users/Usuario/Desktop/automatizacion/lib/services)

| Servicio | Responsabilidad |
|---|---|
| `content.service.ts` | generación de copy y prompts con Anthropic |
| `image.service.ts` | generación de imágenes con fal.ai |
| `video.service.ts` | generación de video con fal.ai |
| `publish.service.ts` | publicación hacia Meta y TikTok |

## API

Ubicación: [app/api](C:/Users/Usuario/Desktop/automatizacion/app/api)

| Ruta | Propósito |
|---|---|
| `POST /api/generate` | orquestación de copy y media |
| `POST /api/publish` | publicación de posts |
| `GET/POST /api/posts` | listado y creación |
| `GET/PUT/DELETE /api/posts/[id]` | operaciones individuales |
| `GET/POST /api/projects` | listado y creación de proyectos |
| `PATCH/DELETE /api/projects/[id]` | edición y borrado lógico |
| `GET/POST /api/accounts` | cuentas sociales |
| `/api/auth/[...nextauth]` | autenticación |

## Autenticación y seguridad

- [middleware.ts](C:/Users/Usuario/Desktop/automatizacion/middleware.ts): protege rutas del dashboard
- [lib/auth.options.ts](C:/Users/Usuario/Desktop/automatizacion/lib/auth.options.ts): configuración de NextAuth
- [lib/encrypt.ts](C:/Users/Usuario/Desktop/automatizacion/lib/encrypt.ts): cifrado de tokens
- [next.config.ts](C:/Users/Usuario/Desktop/automatizacion/next.config.ts): headers de seguridad y CSP

## Frontend

La UI principal vive bajo el grupo de rutas del dashboard.

Rutas principales:

- `/dashboard`
- `/dashboard/generate`
- `/dashboard/posts`
- `/dashboard/projects`
- `/dashboard/settings`
- `/dashboard/settings/accounts`

Stack de interfaz:

- Tailwind CSS
- componentes propios
- `Lucide` para iconografía funcional

## Lanzadores y flujo de escritorio

Archivos clave:

- [scripts/dev-windows.ps1](C:/Users/Usuario/Desktop/automatizacion/scripts/dev-windows.ps1)
- [scripts/dev-windows-launcher.ps1](C:/Users/Usuario/Desktop/automatizacion/scripts/dev-windows-launcher.ps1)
- [scripts/create-app-icon.ps1](C:/Users/Usuario/Desktop/automatizacion/scripts/create-app-icon.ps1)
- [scripts/create-desktop-shortcut.ps1](C:/Users/Usuario/Desktop/automatizacion/scripts/create-desktop-shortcut.ps1)
- [Abrir Yetzar Studio.vbs](C:/Users/Usuario/Desktop/automatizacion/Abrir%20Yetzar%20Studio.vbs)
- [Iniciar Desarrollo.cmd](C:/Users/Usuario/Desktop/automatizacion/Iniciar%20Desarrollo.cmd)

Objetivo actual del flujo:

- inicio de un clic
- icono propio
- consola oculta o minimizada
- navegador abierto automáticamente
- reflejo inmediato de cambios del IDE

## Comandos

Los comandos oficiales deben consultarse en [package.json](C:/Users/Usuario/Desktop/automatizacion/package.json).

Comandos operativos clave:

- `pnpm dev`
- `pnpm dev:windows`
- `pnpm desktop:shortcut`
- `pnpm build`
- `pnpm start`
- `pnpm lint`
- `pnpm db:migrate`
- `pnpm db:seed`
- `pnpm db:studio`
- `pnpm db:reset`

## Decisiones operativas vigentes

- no romper el flujo `pnpm dev:windows` sin instrucción explícita
- conservar compatibilidad con el lanzador de escritorio
- mantener documentación operativa en `README.md`
- mantener detalle técnico y estructural en `docs/arquitectura.md`

## Próxima evolución sugerida

Para reducir dependencia de Docker y acercarse a una app de escritorio real:

1. migrar de `PostgreSQL` a `SQLite` local
2. evaluar empaquetado con `Tauri` o `Electron`

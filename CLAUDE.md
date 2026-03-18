# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Skills — Regla obligatoria

**Antes de tomar cualquier decisión de implementación, redactar copy, diseñar una estrategia de contenido o resolver un problema de marketing, debes:**

1. Identificar qué tipo de tarea es (ver tabla abajo)
2. Leer el archivo `.agents/skills/<skill>/SKILL.md` correspondiente
3. Seguir las instrucciones de ese skill como guía principal para tu respuesta o implementación

Las skills están en `.agents/skills/`. Si una tarea encaja en más de una skill, lee ambas.

### Mapa de skills instaladas

| Tarea / Situación                                                                                   | Skill a activar        |
| --------------------------------------------------------------------------------------------------- | ---------------------- |
| Crear, mejorar u optimizar contenido para redes sociales (posts, carruseles, captions, calendarios) | `social-content`       |
| Escribir copy de marketing — títulos, descripciones, CTAs, value propositions                       | `copywriting`          |
| Revisar o mejorar copy ya escrito                                                                   | `copy-editing`         |
| Planificar qué temas publicar, frecuencia, mezcla de contenido por proyecto                         | `content-strategy`     |
| Generar variaciones de anuncios pagados (Facebook Ads, TikTok Ads, Google Ads)                      | `ad-creative`          |
| Estrategia y gestión de campañas pagadas — targeting, presupuesto, plataformas                      | `paid-ads`             |
| Crear lead magnets, recursos gratuitos o incentivos para captar clientes                            | `lead-magnets`         |
| Aplicar principios de persuasión y psicología del comportamiento al copy                            | `marketing-psychology` |
| Generar ideas de campañas, estrategias de crecimiento o iniciativas de marketing                    | `marketing-ideas`      |
| Configurar o auditar tracking de analíticas, eventos, conversiones                                  | `analytics-tracking`   |

### Skills adicionales instaladas (Vercel/general)

| Tarea                                                       | Skill                              |
| ----------------------------------------------------------- | ---------------------------------- |
| Diseño de UI/UX, componentes, layouts                       | `frontend-design`, `ui-ux-pro-max` |
| Diseño de imágenes con canvas (banners, creativos visuales) | `canvas-design`                    |
| Construir servidores MCP                                    | `mcp-builder`                      |
| Crear nuevas skills para agentes                            | `skill-creator`                    |

### Cómo leer una skill

```
Read .agents/skills/<nombre>/SKILL.md
```

Ejemplo para contenido social:

```
Read .agents/skills/social-content/SKILL.md
```

---

## What This Project Is

Yetzar Content Studio (package name: `content-forge`) is a local social media automation platform. It generates AI-powered content (text + images/videos) using Claude and fal.ai, then publishes to Facebook, Instagram, and TikTok. Designed for multi-project management — each project has its own brand identity, linked social accounts, and content history.

## Development Commands

```bash
pnpm dev            # Start Next.js dev server (localhost:3000)
pnpm build          # Production build
pnpm lint           # Run ESLint

pnpm db:migrate     # Run Prisma migrations
pnpm db:seed        # Seed DB with sample data
pnpm db:studio      # Open Prisma Studio (localhost:5555)
pnpm db:reset       # Reset DB and reseed (destructive)
```

### Infrastructure

The app requires PostgreSQL via Docker:

```bash
docker-compose up -d    # Start all services
docker-compose down     # Stop containers
```

Docker containers: `content-forge-app` (port 3000), `yetzar-db` (port 5433), `yetzar-pgadmin` (port 8081).

### Environment Setup

Copy `.env.local` and fill in:

- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- `ANTHROPIC_API_KEY` — Claude 3.5 Sonnet
- `FAL_KEY` — fal.ai (image/video generation)
- `META_APP_ID`, `META_APP_SECRET` — Facebook/Instagram OAuth
- `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` — TikTok OAuth

## Architecture

### Data Model

**Core flow:** `Project` → `Post` → `PublishLog`

- **Project**: Brand entity with tone, audience, industry. Has many `SocialAccount`s and `Post`s.
- **SocialAccount**: Per-network OAuth credentials (encrypted), linked to one Project. Unique per `(projectId, network)`.
- **Post**: Generated content with status lifecycle: `DRAFT → GENERATING → READY → PUBLISHING → PUBLISHED / FAILED`. Stores text fields (title, description, hashtags, CTA), media URLs, and which `SocialAccount` it was published to.
- **PublishLog**: Append-only log of each publish attempt with full API response/error JSON.

Enums: `Network` (FACEBOOK, INSTAGRAM, TIKTOK), `ContentType` (IMAGE, VIDEO, CAROUSEL, STORY), `PostStatus`.

### Service Layer (`lib/services/`)

Business logic is isolated in four services:

| Service              | Responsibility                                                                                           |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| `content.service.ts` | Calls Claude 3.5 Sonnet to write network-specific copy (title, description, hashtags, CTA, image prompt) |
| `image.service.ts`   | Calls fal.ai FLUX to generate images in platform-correct sizes                                           |
| `video.service.ts`   | Calls fal.ai Kling for image-to-video (preferred) or text-to-video at 9:16 for TikTok                    |
| `publish.service.ts` | Calls Meta Graph API v21.0 and TikTok API to publish; handles Instagram carousel logic                   |

### API Routes (`app/api/`)

| Route                              | Purpose                                                             |
| ---------------------------------- | ------------------------------------------------------------------- |
| `POST /api/generate`               | Orchestrates content + image/video generation for selected networks |
| `POST /api/publish`                | Publishes a ready post to its target social platform                |
| `GET/POST /api/posts`              | List (filterable by projectId, status, network) or create posts     |
| `GET/PUT/DELETE /api/posts/[id]`   | Single post operations                                              |
| `GET/POST /api/projects`           | List active projects or create one                                  |
| `PATCH/DELETE /api/projects/[id]`  | Edit project fields or soft-delete (sets `active: false`)           |
| `GET/POST /api/accounts`           | Manage OAuth-linked social accounts                                 |
| `/api/auth/[...nextauth]`          | NextAuth v5 handler (credentials provider)                          |

### Auth & Security

- `middleware.ts` — protects all routes under `/(dashboard)`, redirects unauthenticated users to `/login`
- `lib/encrypt.ts` — AES encryption for storing social media access tokens in the DB
- `lib/auth.options.ts` — NextAuth config with credentials provider using `ADMIN_EMAIL`/`ADMIN_PASSWORD`
- `app/session-provider.tsx` — wraps the app in `SessionProvider` for client-side session access

### Frontend (`app/(dashboard)/dashboard/`)

Route group with shared sidebar layout. All pages live under `/dashboard/`:

| Route | Description |
| ----- | ----------- |
| `/dashboard` | Home — content strategy widgets (hook formulas, content pillars), project list with post counts |
| `/dashboard/generate` | Content generator — select project/topic/networks/type, previews IMAGE/VIDEO/CAROUSEL/STORY |
| `/dashboard/posts` | Post history — filter by project/status/network, publish/delete actions |
| `/dashboard/projects` | Project manager — create, edit, soft-delete projects |
| `/dashboard/settings` | API Keys configuration |
| `/dashboard/settings/accounts` | Social account management (Facebook, Instagram, TikTok OAuth tokens) |

Uses Tailwind CSS + Lucide icons. Brand identity: **Yetzar Content Studio** — green accent palette (`#9AF5E4`, `#00C8A0`, `#062014`). No component library — UI is built inline with Tailwind and CSS custom properties.

### Directrices de diseño — OBLIGATORIAS

**PROHIBIDO (estética genérica de IA):**

- **REGLA ABSOLUTA — FONDOS**: NUNCA usar fondos oscuros en ninguna superficie de la UI (sidebar, main, cards, modals). TODOS los fondos deben ser claros o neutros. Solo los textos, bordes y elementos de acento pueden ser oscuros o de color intenso. Esta regla fue establecida explícitamente por el usuario y no debe ignorarse jamás.
- NO usar emojis como decoración visual (🚀 ⭐ 🎯 ✨ etc.)
- NO usar iconos genéricos de librerías como relleno decorativo
- NO usar gradientes lineales azul-morado
- NO poner logos placeholder tipo "🏢 Company" o "⚡ Brand"
- NO usar paletas genéricas: azul eléctrico + morado + rosa neón
- NO texto centrado en todo, tarjetas todas iguales, simetría perfecta
- NO sombras exageradas con colores neón
- NO fondos oscuros con partículas flotantes sin propósito
- NO bordes redondeados excesivos en todo

**OBLIGATORIO (diseño profesional):**

- Tipografía con jerarquía real: display para títulos, legible para body
- Paleta de máximo 3 colores con propósito (primario, acento, neutro)
- Espaciado generoso y asimétrico, no todo centrado
- Logos como texto estilizado o SVG mínimo, nunca emojis
- Microinteracciones sutiles (hover 0.2s ease, no rebotes de 2s)
- Inspirarse en diseño editorial, no en templates de landing page
- Preferir geometría abstracta sobre iconos literales
- CSS custom properties para colores, no valores hardcodeados.

# Yetzar Content Studio — Generador de contenido social con IA

Herramienta local multi-proyecto para generar y publicar contenido en Facebook, Instagram y TikTok usando Claude AI + fal.ai.

## Requisitos

- Docker Desktop instalado y corriendo
- Node.js 20+ (solo para `pnpm install` inicial)

## Instalación (primera vez)

Abre PowerShell o Terminal en la carpeta del proyecto:

```powershell
# 1. Instalar dependencias
pnpm install

# 2. Editar .env.local con tus API keys (ver abajo)

# 3. Levantar con Docker
docker-compose up --build
```

Abre el navegador en: **http://localhost:3000**
Inicia sesión con el `ADMIN_EMAIL` y `ADMIN_PASSWORD` que configuraste en `.env.local`.

## Configurar API Keys

Edita `.env.local` con tus claves:

| Variable | Dónde obtenerla |
|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `FAL_KEY` | fal.ai/dashboard/keys |
| `META_APP_ID` + `META_APP_SECRET` | developers.facebook.com/apps |
| `TIKTOK_CLIENT_KEY` + `TIKTOK_CLIENT_SECRET` | developers.tiktok.com |

Ver `docs/credenciales.md` para instrucciones detalladas por plataforma.

## Comandos útiles

```powershell
# Levantar el proyecto
docker-compose up

# Levantar en background
docker-compose up -d

# Ver logs de la app
docker-compose logs -f app

# Parar todo
docker-compose down

# Reiniciar solo la app (tras cambiar .env)
docker-compose restart app

# Abrir pgAdmin en el navegador
# http://localhost:8081  (credenciales en .env.local: PGADMIN_EMAIL / PGADMIN_PASSWORD)

# Seed de proyectos de ejemplo (si la DB está vacía)
docker-compose exec app pnpm db:seed

# Abrir Prisma Studio
docker-compose exec app pnpm db:studio
```

## Contenedores Docker

| Contenedor | Puerto externo | Descripción |
|---|---|---|
| `content-forge-app` | 3000 | Aplicación Next.js |
| `yetzar-db` | 5433 | PostgreSQL 16 |
| `yetzar-pgadmin` | 8081 | pgAdmin 4 |

## Agregar un nuevo proyecto

1. Ve a **Proyectos → Nuevo proyecto** en la UI
2. Configura nombre, industria, tono y audiencia
3. Vincula cuentas sociales en **Configuración → Cuentas sociales**

## Estructura del proyecto

```
content-forge/
├── app/
│   ├── (dashboard)/
│   │   └── dashboard/          ← UI principal (todas las páginas)
│   │       ├── page.tsx        ← Inicio con ideas de contenido y pilares
│   │       ├── generate/       ← Generador de posts con IA
│   │       ├── posts/          ← Historial y gestión de posts
│   │       ├── projects/       ← Gestión de proyectos (crear/editar/eliminar)
│   │       └── settings/
│   │           ├── page.tsx    ← API Keys y configuración
│   │           └── accounts/   ← Cuentas sociales vinculadas
│   ├── api/                    ← Route Handlers
│   │   ├── generate/           ← POST: generación de contenido
│   │   ├── publish/            ← POST: publicación en redes
│   │   ├── posts/[id]/         ← GET/PUT/DELETE post individual
│   │   ├── projects/[id]/      ← PATCH/DELETE proyecto individual
│   │   ├── accounts/           ← GET/POST cuentas sociales
│   │   └── auth/               ← NextAuth handler
│   └── login/                  ← Página de inicio de sesión
├── lib/
│   ├── services/               ← content, image, video, publish
│   ├── auth.options.ts         ← Config NextAuth (credentials provider)
│   └── encrypt.ts              ← AES-256-GCM para tokens sociales
├── prisma/
│   ├── schema.prisma           ← Project, Post, SocialAccount, PublishLog
│   └── seed.ts                 ← 3 proyectos de ejemplo
├── middleware.ts                ← Protege rutas /dashboard/*
├── docker-compose.yml
├── Dockerfile
└── .env.local                  ← API keys (no subir a git)
```

## Flujo de uso

1. Inicia sesión en `/login`
2. En **Proyectos**, crea o selecciona tu proyecto de marca
3. Ve a **Generar** — escribe el tema, elige redes y tipo de contenido
4. Claude genera el copy (título, descripción, hashtags, CTA), fal.ai genera la imagen/video
5. Previsualiza el resultado: imagen normal, 9:16 para stories/TikTok, carrusel scrollable
6. Clic en **Publicar** → va directo a las APIs de Meta y TikTok
7. Revisa el historial completo en **Posts**

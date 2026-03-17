# ContentForge — Generador de contenido social con IA

Herramienta local multi-proyecto para generar y publicar contenido en Facebook, Instagram y TikTok usando Claude AI + fal.ai.

## Requisitos

- Docker Desktop instalado y corriendo
- Node.js 20+ (solo para el primer setup)

## Instalación (primera vez)

Abre PowerShell o Terminal en la carpeta del proyecto:

```powershell
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
copy .env.local .env.local.bak   # opcional, ya existe

# 3. Editar .env.local y .env con tus API keys (ver abajo)

# 4. Levantar con Docker
docker-compose up --build
```

Abre el navegador en: **http://localhost:3000**

## Configurar API Keys

Edita `.env.local` Y `.env` con tus claves:

| Variable | Dónde obtenerla |
|---|---|
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys |
| `FAL_KEY` | https://fal.ai/dashboard/keys |
| `META_APP_ID` + `META_APP_SECRET` | https://developers.facebook.com/apps |
| `TIKTOK_CLIENT_KEY` + `TIKTOK_CLIENT_SECRET` | https://developers.tiktok.com |

## Comandos útiles

```powershell
# Levantar el proyecto
docker-compose up

# Levantar en background
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Parar todo
docker-compose down

# Reiniciar solo la app (tras cambiar .env)
docker-compose restart app

# Abrir DB en el navegador (pgAdmin)
# http://localhost:8080  usuario: admin@local.com  pass: admin

# Seed de proyectos de ejemplo (si la DB está vacía)
docker-compose exec app npm run db:seed
```

## Agregar un nuevo proyecto

1. Ve a **Proyectos → Nuevo proyecto** en la UI
2. O ejecuta en la terminal:

```powershell
docker-compose exec app npx prisma studio
```

## Estructura del proyecto

```
content-forge/
├── app/
│   ├── (dashboard)/        ← UI: dashboard, generate, posts, settings
│   └── api/                ← Route Handlers: generate, publish, projects, posts
├── lib/
│   └── services/           ← content.service, image.service, video.service, publish.service
├── prisma/
│   ├── schema.prisma        ← modelos: Project, Post, SocialAccount, PublishLog
│   └── seed.ts             ← datos iniciales (3 proyectos de ejemplo)
├── docker-compose.yml
├── Dockerfile
└── .env.local              ← tus API keys (no subir a git)
```

## Flujo de uso

1. Selecciona un proyecto (SomosTécnicos, Corte Urbano, Odontología, o el tuyo)
2. Escribe el tema del post
3. Elige redes (Facebook, Instagram, TikTok) y tipo (imagen, video, story)
4. Clic en **Generar contenido** → Claude genera el texto, fal.ai genera la imagen/video
5. Previsualiza el resultado por red social
6. Clic en **Publicar** → va directo a las APIs de Meta y TikTok

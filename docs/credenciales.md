# Guía de credenciales y configuración

Este documento indica dónde obtener cada API key, token y credencial que necesita el proyecto, y en qué variable de entorno va cada uno.

---

## Archivo `.env.local` (raíz del proyecto)

Copia `.env.local` y completa los valores antes de iniciar el servidor.

---

## 1. Configuración base de la aplicación

| Variable | Descripción | Cómo obtener |
|---|---|---|
| `NEXTAUTH_SECRET` | Clave secreta para cifrar sesiones. Puede ser cualquier string largo y aleatorio. | Ejecuta `openssl rand -base64 32` en terminal, o genera una en https://generate-secret.vercel.app/32 |
| `NEXTAUTH_URL` | URL base de la app. En desarrollo: `http://localhost:3000` | Fija para desarrollo. En producción, reemplaza por tu dominio. |
| `ADMIN_EMAIL` | Email del usuario administrador para iniciar sesión | Elige el email con el que vas a entrar al panel |
| `ADMIN_PASSWORD` | Contraseña del administrador | Elige una contraseña segura |

---

## 2. Base de datos

| Variable | Descripción | Valor por defecto (Docker) |
|---|---|---|
| `DATABASE_URL` | Cadena de conexión PostgreSQL | `postgresql://postgres:postgres@localhost:5432/contentforge` |

La base de datos corre con Docker. Inicia con `docker-compose up -d`. pgAdmin está disponible en `localhost:8081` (credenciales configuradas con `PGADMIN_EMAIL` / `PGADMIN_PASSWORD` en `.env.local`).

---

## 3. IAs generativas

### Anthropic (Claude) — generación de texto
- **Variable:** `ANTHROPIC_API_KEY`
- **Modelo usado:** `claude-3-5-sonnet-20241022`
- **Dónde obtener la key:**
  1. Ve a https://console.anthropic.com
  2. Inicia sesión o crea una cuenta
  3. En el menú lateral: **API Keys** → **Create Key**
  4. Copia la key (empieza con `sk-ant-...`)
- **Nota:** Requiere método de pago activo para uso en producción.

### fal.ai (FLUX + Kling) — generación de imágenes y videos
- **Variable:** `FAL_KEY`
- **Modelos usados:**
  - Imágenes rápidas: `fal-ai/flux/schnell`
  - Imágenes pro: `fal-ai/flux-pro/v1.1`
  - Video image-to-video: `fal-ai/kling-video/v1.6/standard/image-to-video`
  - Video text-to-video: `fal-ai/kling-video/v1.6/standard/text-to-video`
- **Dónde obtener la key:**
  1. Ve a https://fal.ai
  2. Crea una cuenta o inicia sesión
  3. En el dashboard: **Keys** → **Add key**
  4. Copia la key (formato: `uuid:hash`)
- **Nota:** Los videos Kling pueden tardar 1–3 minutos en generarse.

---

## 4. Meta (Facebook e Instagram)

Estas credenciales son para la **aplicación Meta** (OAuth). Se guardan en `.env.local`.
Los **tokens de usuario/página** se ingresan en el panel bajo **Configuración → Cuentas sociales** y se cifran en la base de datos.

### App Meta (`.env.local`)

| Variable | Descripción |
|---|---|
| `META_APP_ID` | ID de la app en Meta for Developers |
| `META_APP_SECRET` | Secret de la app en Meta for Developers |

**Dónde obtener:**
1. Ve a https://developers.facebook.com
2. Crea una app → tipo **Business**
3. En **Configuración → Básica**: copia el **App ID** y el **App Secret**
4. Permisos requeridos en la app: `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`

### Cuenta Facebook (en el panel de la app)

Se ingresa en **Configuración → Cuentas sociales → Agregar cuenta → Facebook**.

| Campo | Qué ingresar |
|---|---|
| **ID de cuenta** | ID numérico de tu **Página de Facebook** (no el perfil personal). Se encuentra en Configuración de la página → Información de la página. |
| **Nombre de cuenta** | Nombre visible de la página |
| **Access Token** | Token de larga duración (Long-Lived Token) de la página. Ver instrucciones abajo. |

**Cómo obtener el Page Access Token de larga duración:**
1. En el [Graph API Explorer](https://developers.facebook.com/tools/explorer/), selecciona tu app
2. Genera un User Token con permisos `pages_manage_posts`, `pages_read_engagement`
3. Llama a `GET /me/accounts` para obtener el token de tu página específica
4. Convierte a Long-Lived Token con: `GET /oauth/access_token?grant_type=fb_exchange_token&client_id={app_id}&client_secret={app_secret}&fb_exchange_token={short_token}`
5. Los tokens de página no expiran si el usuario los generó (long-lived page tokens son permanentes)

### Cuenta Instagram Business (en el panel de la app)

Se ingresa en **Configuración → Cuentas sociales → Agregar cuenta → Instagram**.

| Campo | Qué ingresar |
|---|---|
| **ID de cuenta** | Instagram Business Account ID (formato numérico largo, ej: `17841400000000000`). Se obtiene via `GET /{page-id}?fields=instagram_business_account` en Graph API Explorer. |
| **Nombre de cuenta** | Nombre de usuario de Instagram |
| **Access Token** | El mismo Page Access Token de larga duración de la página Facebook vinculada a la cuenta Instagram Business |

**Requisito:** La cuenta de Instagram debe ser tipo **Business** o **Creator** y estar vinculada a una Página de Facebook.

---

## 5. TikTok

Las credenciales de la app TikTok van en `.env.local`. El token de usuario se ingresa en el panel.

### App TikTok (`.env.local`)

| Variable | Descripción |
|---|---|
| `TIKTOK_CLIENT_KEY` | Client Key de la app TikTok for Developers |
| `TIKTOK_CLIENT_SECRET` | Client Secret de la app TikTok for Developers |

**Dónde obtener:**
1. Ve a https://developers.tiktok.com
2. Crea una app → tipo **Web**
3. En el dashboard de la app: copia el **Client Key** y el **Client Secret**
4. Activa el producto **Content Posting API**
5. Permisos requeridos: `video.upload`, `video.publish`

### Cuenta TikTok (en el panel de la app)

Se ingresa en **Configuración → Cuentas sociales → Agregar cuenta → TikTok**.

| Campo | Qué ingresar |
|---|---|
| **ID de cuenta** | `open_id` del usuario TikTok. Se obtiene del paso de autenticación OAuth de TikTok. |
| **Nombre de cuenta** | Nombre de usuario en TikTok |
| **Access Token** | Bearer token obtenido del flujo OAuth de TikTok (`/oauth/token`). Expira en 24 horas; usa el Refresh Token para renovarlo. |
| **Refresh Token** | Token para renovar el Access Token. Válido por 365 días. |
| **Fecha de expiración** | Fecha en que expira el Access Token actual |

**Nota:** TikTok solo soporta publicación de **videos**. Si un post generado es de tipo IMAGE o CAROUSEL para TikTok, la publicación fallará con un mensaje claro.

---

## Resumen rápido

```
# .env.local
NEXTAUTH_SECRET=<string-aleatorio-largo>
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=tucorreo@ejemplo.com
ADMIN_PASSWORD=tucontraseña

DATABASE_URL=postgresql://postgres:postgres@localhost:5433/contentforge

ANTHROPIC_API_KEY=sk-ant-...          # console.anthropic.com
FAL_KEY=uuid:hash                     # fal.ai dashboard

META_APP_ID=123456789                 # developers.facebook.com
META_APP_SECRET=abcdef...

TIKTOK_CLIENT_KEY=aw...               # developers.tiktok.com
TIKTOK_CLIENT_SECRET=xyz...
```

Los tokens de Facebook, Instagram y TikTok **no van en el .env** — se ingresan directamente en el panel bajo **Configuración → Cuentas sociales** y se cifran con AES-256-GCM antes de guardarse en la base de datos.

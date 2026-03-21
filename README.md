# Yetzar Content Studio

Aplicación local para generar y publicar contenido social multi-proyecto con IA en Facebook, Instagram y TikTok.

## Estado actual

- La app corre localmente en `http://localhost:3000`.
- La base de datos actual es `PostgreSQL 16` en Docker, expuesta en `localhost:5433`.
- En Windows ya existe un flujo de arranque de un clic con icono propio, consola minimizada y hot reload.

## Stack tecnológico

- `Next.js 15`
- `React 19`
- `TypeScript 5`
- `Tailwind CSS 3`
- `NextAuth 5 beta`
- `Prisma 5`
- `PostgreSQL 16`
- `Docker Desktop`
- `Anthropic SDK`
- `fal.ai`
- `pnpm`

Detalle técnico completo en [docs/arquitectura.md](C:/Users/Usuario/Desktop/automatizacion/docs/arquitectura.md).

## Requisitos

- `Node.js 20+`
- `pnpm`
- `Docker Desktop`

## Configuración inicial

```powershell
cd C:\Users\Usuario\Desktop\automatizacion
pnpm install
```

Configura `.env` o `.env.local` con al menos:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ANTHROPIC_API_KEY`
- `FAL_KEY`
- `META_APP_ID`
- `META_APP_SECRET`
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`

Credenciales y contexto adicional en [docs/credenciales.md](C:/Users/Usuario/Desktop/automatizacion/docs/credenciales.md).

## Cómo iniciar

### Desde terminal

```powershell
pnpm dev:windows
```

### Desde archivo local

Abre:

- [Iniciar Desarrollo.cmd](C:/Users/Usuario/Desktop/automatizacion/Iniciar%20Desarrollo.cmd)
- o [Abrir Yetzar Studio.vbs](C:/Users/Usuario/Desktop/automatizacion/Abrir%20Yetzar%20Studio.vbs)

Ese flujo:

- inicia Docker Desktop si hace falta
- levanta `yetzar-db`
- arranca la app en desarrollo
- abre `http://localhost:3000`
- deja la consola minimizada lo más posible

## Acceso directo con icono

Para crear el acceso directo del escritorio:

```powershell
pnpm desktop:shortcut
```

Eso crea `Yetzar Studio.lnk` en el escritorio usando el icono del proyecto.

## Cambios desde el IDE

Mientras la app esté abierta con el flujo anterior:

- los cambios normales del proyecto se reflejan automáticamente
- no necesitas reiniciar por cambios de frontend o lógica habitual
- si cambias variables de entorno o Prisma, puede hacer falta reiniciar

## Scripts

Los scripts disponibles viven en [package.json](C:/Users/Usuario/Desktop/automatizacion/package.json).

Los más usados son:

```powershell
pnpm dev
pnpm dev:windows
pnpm desktop:shortcut
pnpm build
pnpm lint
```

## Documentación

- Operación general: [README.md](C:/Users/Usuario/Desktop/automatizacion/README.md)
- Arquitectura y detalle técnico: [docs/arquitectura.md](C:/Users/Usuario/Desktop/automatizacion/docs/arquitectura.md)
- Credenciales: [docs/credenciales.md](C:/Users/Usuario/Desktop/automatizacion/docs/credenciales.md)

## Evolución sugerida

Si luego quieres eliminar Docker por completo, el siguiente paso sería migrar de PostgreSQL a SQLite local y evaluar empaquetado con `Tauri` o `Electron`.

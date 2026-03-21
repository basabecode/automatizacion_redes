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

## Source Of Truth

- Operación general y arranque: [README.md](C:/Users/Usuario/Desktop/automatizacion/README.md)
- Arquitectura, estructura, servicios y modelo de datos: [docs/arquitectura.md](C:/Users/Usuario/Desktop/automatizacion/docs/arquitectura.md)
- Credenciales y configuración externa: [docs/credenciales.md](C:/Users/Usuario/Desktop/automatizacion/docs/credenciales.md)
- Scripts y comandos oficiales: [package.json](C:/Users/Usuario/Desktop/automatizacion/package.json)

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

## Reglas operativas nuevas

### Arranque local

- No romper el flujo `pnpm dev:windows` salvo que el usuario pida cambiarlo explícitamente.
- Mantener compatibilidad con el lanzador [scripts/dev-windows.ps1](C:/Users/Usuario/Desktop/automatizacion/scripts/dev-windows.ps1), el lanzador limpio [scripts/dev-windows-launcher.ps1](C:/Users/Usuario/Desktop/automatizacion/scripts/dev-windows-launcher.ps1) y [Abrir Yetzar Studio.vbs](C:/Users/Usuario/Desktop/automatizacion/Abrir%20Yetzar%20Studio.vbs).
- Recordar que el flujo actual esperado es: Docker solo para PostgreSQL, Next.js fuera del contenedor.

### UX del lanzador de escritorio

- Si se modifica el flujo de inicio, preservar en lo posible estas propiedades:
- inicio con un solo clic desde escritorio
- consola oculta o minimizada
- apertura automática del navegador cuando la app responda
- icono propio del proyecto

### Documentación

- Cada cambio operativo relevante debe actualizar `README.md`.
- Cada cambio técnico estructural debe actualizar `docs/arquitectura.md`.
- Los comandos no deben duplicarse aquí si ya existen en `package.json`; referenciar el archivo fuente.

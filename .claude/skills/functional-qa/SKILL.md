---
name: functional-qa
description: Functional QA for Yetzar Content Studio. Use when reviewing the login, dashboard, content generation flows, post management, project administration, publishing actions, connected social accounts, or any UI driven by AI agents. Invoke this skill for smoke tests, dead UI detection, release checks, regression reviews, async action validation, and when verifying that the automation portal actually produces visible results for the user.
model: claude-sonnet-4-5
metadata:
  version: 2.0.0
  author: basabecode
  domain: qa-testing
  project: Yetzar Content Studio
  triggers: QA, audit funcional, smoke test, dashboard review, dead UI, botones sin función, regression check, portal review, validar dashboard, generación con IA, publicar contenido, revisión funcional
  related-skills: frontend-design, webapp-testing, debugging, analytics-tracking
---

# Functional QA — Yetzar Content Studio

Auditoría funcional para el portal de automatización de contenido para redes
sociales. Este skill sirve para revisar que login, dashboard, generador de
contenido, historial de posts, proyectos, configuraciones y conexiones sociales
estén realmente implementados y produzcan resultados observables.

La prioridad no es solo detectar errores visibles. También hay que identificar
UI muerta, flujos incompletos, handlers vacíos, estados asíncronos mal resueltos
y puntos donde el sistema aparenta usar IA o publicar contenido, pero no deja
evidencia real en la interfaz o en la capa de API.

## Cuándo usar este skill

Úsalo cuando el usuario pida cualquiera de estas cosas:

- Revisar el portal o dashboard antes de una entrega
- Hacer smoke testing funcional
- Validar que botones, forms y navegación sí funcionen
- Confirmar que la generación con IA realmente dispara acciones reales
- Confirmar que publicar posts, conectar cuentas o guardar proyectos sí produce cambios
- Detectar stubs, TODOs, acciones sin feedback o pantallas engañosas

## Objetivo

Validar que cada interacción importante del producto:

1. Tiene implementación real
2. Llama a una ruta, servicio o handler existente
3. Muestra loading y feedback adecuado
4. Refleja éxito o error de forma visible
5. Mantiene consistencia con el flujo de automatización de contenido

## Contexto mínimo a leer antes de auditar

Primero revisa estos archivos para entender el sistema:

```txt
CLAUDE.md
app/login/page.tsx
app/(dashboard)/dashboard/
app/api/
lib/services/content.service.ts
lib/services/image.service.ts
lib/services/video.service.ts
lib/services/publish.service.ts
lib/auth.options.ts
middleware.ts
```

Si el alcance toca una pantalla concreta, lee además sus componentes y hooks
relacionados antes de concluir que algo está roto o incompleto.

## Áreas del producto a auditar

### 1. Login y acceso

Rutas y foco:

- `/login`
- protección por `middleware.ts`
- sesión y credenciales vía NextAuth

Verifica:

- El formulario acepta input, valida y envía correctamente
- El botón de acceso muestra estado de carga
- Error de autenticación se muestra al usuario
- Login exitoso redirige al dashboard real
- Rutas protegidas redirigen si no hay sesión

### 2. Dashboard principal

Rutas y foco:

- `/dashboard`

Verifica:

- Widgets y métricas cargan datos reales o muestran empty state honesto
- Links y CTAs llevan a módulos existentes
- No hay tarjetas decorativas sin acción definida
- Los datos mostrados corresponden a entidades reales del sistema

### 3. Generación de contenido con IA

Rutas y foco:

- `/dashboard/generate`
- `POST /api/generate`
- servicios de contenido, imagen y video

Verifica:

- El usuario puede seleccionar proyecto, tema, red y tipo de contenido
- El submit dispara una acción real hacia la API
- Hay feedback de loading durante generación
- El resultado exitoso se ve en UI o persiste como post
- Si falla Claude, fal.ai o una validación, el error se muestra claramente
- No existen previews falsas o placeholders presentados como resultado final

### 4. Gestión de posts

Rutas y foco:

- `/dashboard/posts`
- `GET/POST /api/posts`
- `GET/PUT/DELETE /api/posts/[id]`

Verifica:

- Filtros por proyecto, estado y red cambian resultados reales
- Publicar, editar o eliminar posts ejecuta acciones reales
- Los cambios impactan la lista o el detalle
- Los estados `DRAFT`, `GENERATING`, `READY`, `PUBLISHING`, `PUBLISHED`, `FAILED`
  se reflejan de forma coherente

### 5. Gestión de proyectos

Rutas y foco:

- `/dashboard/projects`
- `GET/POST /api/projects`
- `PATCH/DELETE /api/projects/[id]`

Verifica:

- Crear, editar y desactivar proyectos funciona de extremo a extremo
- Los formularios tienen validación mínima razonable
- Un proyecto desactivado no aparece como activo si no debe hacerlo
- La UI reacciona al cambio sin requerir refresh manual inesperado

### 6. Configuración y cuentas sociales

Rutas y foco:

- `/dashboard/settings`
- `/dashboard/settings/accounts`
- `GET/POST /api/accounts`

Verifica:

- Guardar configuración persiste cambios reales
- Vincular cuentas sociales refleja estado conectado/desconectado
- No hay botones OAuth que solo abran UI local sin completar flujo
- Los mensajes explican claramente si falta una credencial o token

## Checklist funcional base

Aplica este checklist a toda pantalla o componente interactivo:

### Botones y acciones

```txt
[ ] Tiene onClick o acción real asociada
[ ] No usa handlers vacíos, TODOs o console.log como implementación
[ ] Ejecuta mutación, navegación o apertura útil
[ ] Muestra loading si la acción es asíncrona
[ ] Deshabilita reintentos cuando corresponde
[ ] Muestra resultado visible en éxito
[ ] Muestra mensaje claro en error
```

### Formularios

```txt
[ ] Tiene onSubmit real
[ ] Valida campos obligatorios
[ ] Muestra error usable, no solo error técnico
[ ] Tiene estado de envío
[ ] Resetea o actualiza UI tras éxito
[ ] No permite dobles submits accidentales
```

### Navegación

```txt
[ ] Todos los href apuntan a rutas existentes
[ ] Sidebar y navegación secundaria coinciden con páginas reales
[ ] El estado activo de navegación es correcto
[ ] Los botones de volver o cancelar llevan a destinos válidos
```

### Feedback y transparencia del sistema

```txt
[ ] La UI distingue claramente idle, loading, success y error
[ ] No hay loaders infinitos sin resolución
[ ] No hay mensajes ambiguos como "Procesando..." sin resultado final
[ ] Los vacíos de datos usan empty states honestos
[ ] El usuario entiende qué ocurrió después de cada acción
```

## Patrones de problema que debes buscar

### Dead UI

Detecta casos como:

```tsx
<button onClick={() => {}}>Generar</button>
<button onClick={() => console.log('publish')}>Publicar</button>
const handleSave = async () => {
  // TODO
}
```

### Falsa automatización

Bandera roja cuando:

- Se muestra un resultado mock sin venir de API o estado persistido
- La UI dice "contenido generado" pero no existe post creado
- La UI dice "publicado" pero no hay llamada real al flujo de publish
- Un botón de IA solo cambia estado local sin ejecutar el backend

### Flujos asíncronos mal cerrados

Bandera roja cuando:

- La acción arranca pero nunca limpia loading
- El usuario no sabe si la tarea falló o terminó
- Un error queda silenciado en `catch`
- La lista no refresca tras una mutación importante

## Búsquedas rápidas recomendadas

Usa búsquedas para acelerar la auditoría:

```bash
rg "TODO|console\\.log|por implementar|stub" app lib
rg "onClick=\\{\\(\\) => \\{\\}\\}|onClick=\\{\\(\\) => null\\}" app components
rg "fetch\\(|axios\\.|signIn\\(" app lib
rg "/api/" app lib
rg "loading|isLoading|isSubmitting|pending" app components lib
```

Cruza los resultados con archivos reales en `app/api/` y con los servicios en
`lib/services/`.

## Método de auditoría recomendado

1. Identifica la ruta o módulo a revisar.
2. Mapea sus elementos interactivos visibles.
3. Localiza el handler de cada acción.
4. Confirma si ese handler llama a API, servicio o navegación real.
5. Verifica feedback de loading, éxito y error.
6. Revisa si el estado final queda reflejado en la interfaz.
7. Documenta hallazgos por severidad.

## Formato del reporte

Usa este formato al entregar resultados:

```markdown
# Functional QA Report — Yetzar Content Studio

Fecha: [fecha]
Scope: [ruta, módulo o flujo]

## Resumen

- Elementos revisados: X
- OK: X
- Riesgos: X
- Críticos: X

## Hallazgos

| Severidad | Ruta/Página | Elemento | Problema | Evidencia | Acción recomendada |
| --------- | ----------- | -------- | -------- | --------- | ------------------ |

## Flujos validados

| Flujo | Estado | Notas |
| ----- | ------ | ----- |

## Riesgos residuales

- ...
```

## Criterios de severidad

- `Crítico`: bloquea login, generación, publicación o persistencia principal
- `Alto`: el flujo existe pero falla o engaña al usuario en casos comunes
- `Medio`: hay feedback incompleto, errores poco claros o refresh inconsistente
- `Bajo`: problema menor de UX funcional sin romper el flujo central

## Regla final

No des por funcional una interfaz solo porque "se ve terminada". En este
proyecto, una acción vale como implementada únicamente si conecta con la lógica
real del dashboard, los servicios de IA o la capa de publicación, y deja una
evidencia observable para el usuario.

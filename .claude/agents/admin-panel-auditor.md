# Admin Panel Auditor

Audita el panel administrativo de este repositorio con foco funcional y tecnico.

## Objetivo

Encontrar:

- incongruencias entre UI, rutas, estado, APIs y documentacion
- codigo repetido o patrones duplicados que no aportan valor
- funcionalidades faltantes o flujos a medio implementar
- mejoras priorizadas para el panel administrativo

## Alcance

Revisa primero:

- `app/(dashboard)/dashboard/**`
- `app/(dashboard)/layout.tsx`
- `app/api/**` relacionado con dashboard, projects, posts, accounts, generate, publish y calendar
- `lib/**` solo si afecta directamente el panel admin
- `tests/**` y `docs/**` solo para contrastar comportamiento real vs esperado

Evita ruido fuera del panel admin salvo que una dependencia externa rompa un flujo del panel.

## Forma de trabajar

1. Mapea las rutas reales del panel y sus flujos principales.
2. Contrasta cada pantalla con las APIs que consume.
3. Contrasta la UI con tests y docs para detectar promesas no cumplidas.
4. Busca duplicacion de:
   - fetches a las mismas APIs
   - tipos locales repetidos
   - mapas de estados, redes o labels repetidos
   - modales y handlers CRUD casi identicos
5. Detecta "dead UI":
   - botones que solo informan pero no ejecutan
   - estados que no se reflejan en backend
   - pantallas que aparentan configuracion pero no administran nada
6. Detecta huecos funcionales:
   - falta de aprobacion
   - falta de edicion
   - falta de feedback de error
   - falta de consistencia entre flujo rapido y flujo completo

## Señales a priorizar

- inconsistencias entre una ruta global y la ruta por proyecto
- datos que se editan en un flujo pero no en otro
- estados del dominio que no aparecen en la UI o viceversa
- respuestas de API que la UI ignora o maneja mal
- decisiones que obligan al usuario a salir del panel para completar tareas "internas"
- fragmentacion del producto: dos formas de hacer lo mismo con reglas distintas

## Salida requerida

Entrega una revision tipo code review.

### 1. Findings

Lista hallazgos ordenados por severidad:

- `high`
- `medium`
- `low`

Cada hallazgo debe incluir:

- impacto
- por que es un problema real
- referencia de archivo y linea cuando sea posible
- si es incongruencia, duplicacion, funcionalidad faltante o mejora

### 2. Open Questions

Incluye solo dudas que cambien la recomendacion.

### 3. Mejoras priorizadas

Propone mejoras concretas agrupadas por:

- quick wins
- refactor estructural
- producto/UX

## Reglas

- No hagas cambios.
- No inventes comportamiento no soportado por el codigo.
- Si algo es inferencia, dilo explicitamente.
- Prefiere pocos hallazgos solidos sobre una lista larga de observaciones debiles.

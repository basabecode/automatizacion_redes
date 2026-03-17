# Mejoras iniciales

Fecha: 2026-03-15

## Origen

Revision general del proyecto para identificar faltantes funcionales y tecnicos.

## Solicitud

Crear una carpeta de documentacion orientada a mejoras y registrar por fecha cada solicitud o planteamiento de mejora.

## Hallazgos principales

1. Falta gestion real de cuentas sociales.
2. `CAROUSEL` y `STORY` aparecen en la interfaz, pero no estan implementados en la logica de generacion/publicacion.
3. La configuracion actual solo informa sobre variables de entorno; no administra conexiones ni credenciales.
4. Faltan operaciones de edicion, eliminacion y reintento sobre posts y proyectos.
5. No hay autenticacion ni control de acceso.
6. Los tokens sociales se almacenan en texto plano en base de datos.
7. No se identificaron pruebas automatizadas para el flujo principal.
8. Conviene revisar la logica de formatos/aspect ratio para contenido vertical.

## Mejoras propuestas

## Prioridad alta

- Implementar conexion y administracion de cuentas sociales por proyecto.
- Completar el flujo real de publicacion para cada red segun el tipo de contenido.
- Proteger credenciales y tokens almacenados.
- Agregar autenticacion para acceso al panel.

## Prioridad media

- Implementar soporte real para `CAROUSEL` y `STORY`.
- Permitir editar, eliminar y reintentar posts.
- Mejorar manejo de errores, logs y estados transitorios de publicacion.

## Prioridad baja

- Agregar programacion de publicaciones.
- Incorporar aprobacion previa antes de publicar.
- Añadir metricas o trazabilidad de uso por proyecto.

## Convencion para futuros registros

Toda nueva mejora debe registrarse en este directorio con un archivo Markdown usando este patron:

- `YYYY-MM-DD-descripcion-corta.md`

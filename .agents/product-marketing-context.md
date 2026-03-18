# Product Marketing Context

Este archivo es leído automáticamente por todos los skills de marketing antes de comenzar cualquier tarea. Proporciona el contexto base del proyecto para evitar preguntas repetitivas.

---

## Producto

**Nombre:** ContentForge
**Tipo:** Plataforma local de automatización de contenido para redes sociales
**Descripción corta:** Herramienta que genera y publica contenido de marketing con IA (texto + imágenes + videos) en Facebook, Instagram y TikTok para múltiples proyectos/marcas desde un solo panel.

**Propuesta de valor principal:**
Automatiza el ciclo completo de contenido social: desde la idea hasta la publicación, usando Claude para el copy y fal.ai para los visuales. Diseñado para agencias, emprendedores y negocios que gestionan varias marcas.

---

## Audiencia objetivo

**Usuario primario:** Dueño de negocio, emprendedor o agencia de marketing que administra la presencia en redes sociales de uno o más proyectos/clientes.

**Perfil:**
- Administra 2–10 proyectos/marcas simultáneamente
- No necesariamente tiene experiencia técnica en IA
- Quiere velocidad: generar y publicar contenido de calidad en minutos
- Valora el control: revisar y aprobar antes de publicar
- Opera principalmente en mercados de habla hispana (aunque la plataforma es bilingüe)

**Pain points:**
- Crear contenido diferenciado por red social consume demasiado tiempo
- Contratar diseñadores/redactores para cada proyecto es costoso
- Mantener consistencia de marca entre múltiples proyectos es difícil
- El contenido genérico no conecta con la audiencia específica de cada proyecto

---

## Redes sociales soportadas

| Red | Tipos de contenido |
|---|---|
| Facebook | Imagen, Video, Carrusel (álbum), Story |
| Instagram | Imagen, Video (Reels), Carrusel, Story |
| TikTok | Video (único formato soportado) |

---

## Tecnologías de generación de contenido

| Función | Herramienta |
|---|---|
| Generación de copy (texto, hashtags, CTA) | Claude 3.5 Sonnet (Anthropic) |
| Generación de imágenes | fal.ai FLUX (schnell / pro) |
| Generación de video | fal.ai Kling (image-to-video / text-to-video) |

---

## Modelo de proyectos

Cada **Proyecto** representa una marca o cliente con:
- **Nombre e industria**: identifica el negocio
- **Tono de comunicación**: cercano y casual / profesional / urgente y persuasivo / educativo / inspiracional
- **Audiencia objetivo**: descripción del cliente ideal del proyecto
- **Color de marca**: usado en la identidad visual
- **Cuentas sociales vinculadas**: tokens cifrados por red

El contenido generado se adapta automáticamente a estas características de cada proyecto.

---

## Tono y voz de la plataforma (ContentForge como marca)

- **Tono general**: profesional pero accesible, directo, sin tecnicismos innecesarios
- **Idioma principal de la UI y docs**: español
- **Personalidad**: eficiente, confiable, moderno
- **Evitar**: jerga de IA exagerada ("revolucionario", "disruptivo"), promesas sin sustento

---

## Contexto competitivo

**Alternativas que usan los usuarios:**
- Hacer el contenido manualmente (Canva + ChatGPT + publicación manual)
- Buffer / Hootsuite (programación, sin generación con IA)
- Later / Metricool (scheduling, sin generación visual)
- Herramientas de IA generales (no especializadas en publicación social)

**Diferenciadores:**
- Ciclo completo: genera texto + imagen/video + publica en un solo flujo
- Multi-proyecto: gestiona varias marcas desde un panel
- Contenido adaptado por red: cada red recibe copy y visual optimizado para su formato
- Local y privado: corre en infraestructura propia del usuario

---

## Objetivos de marketing del producto

1. **Captación**: demostrar la velocidad y calidad del contenido generado (demos, ejemplos por industria)
2. **Activación**: que el usuario conecte su primera cuenta social y genere su primer post en menos de 10 minutos
3. **Retención**: contenido consistente = resultados = el usuario sigue usando la plataforma
4. **Expansión**: agregar más proyectos/clientes al panel

---

## Notas para los skills

- Cuando generes copy o estrategia de contenido para **los proyectos del usuario** (sus clientes/marcas), adapta el tono y audiencia al proyecto específico, no a ContentForge.
- Cuando generes contenido para **promover ContentForge** en sí mismo, usa el tono y diferenciadores descritos arriba.
- Los hashtags deben ir sin `#` en la base de datos; el sistema los agrega al publicar.
- Los captions de Instagram deben tener emojis y saltos de línea. Facebook: hasta 400 caracteres conversacional. TikTok: hasta 150 caracteres, gancho inicial viral.

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface GeneratedContent {
  network: string
  title: string
  description: string
  hashtags: string[]
  cta: string
  imagePrompt: string
  tip: string
}

interface GenerateParams {
  topic: string
  projectName: string
  industry: string
  tone: string
  audience: string
  networks: string[]
}

export async function generateSocialContent(
  params: GenerateParams
): Promise<GeneratedContent[]> {
  const { topic, projectName, industry, tone, audience, networks } = params

  const prompt = `Eres un experto en marketing de contenidos para redes sociales.
Genera contenido para: ${networks.join(', ')}.

Proyecto: ${projectName}
Industria: ${industry}
Tema/Producto: ${topic}
Tono: ${tone}
Audiencia: ${audience}

Para CADA red social genera un objeto con estos campos exactos:
- network: nombre de la red (FACEBOOK, INSTAGRAM o TIKTOK)
- title: título llamativo
- description: texto adaptado al formato de cada red
  * FACEBOOK: hasta 400 caracteres, conversacional
  * INSTAGRAM: hasta 300 caracteres con emojis y saltos de línea
  * TIKTOK: hasta 150 caracteres, muy corto y viral con gancho inicial
- hashtags: array de 5 hashtags relevantes SIN el símbolo #
- cta: llamado a la acción específico (máx 8 palabras)
- imagePrompt: prompt en INGLÉS para generar imagen con IA, muy detallado.
  Incluir: estilo fotográfico, colores, composición, formato
  * FACEBOOK e INSTAGRAM: formato cuadrado 1:1
  * TIKTOK: formato vertical 9:16
- tip: consejo corto de publicación para esa red (máx 15 palabras)

Responde SOLO con un array JSON válido. Sin texto adicional, sin backticks, sin explicaciones.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean) as GeneratedContent[]
}

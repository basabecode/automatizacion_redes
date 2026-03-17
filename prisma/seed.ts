import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding projects...')

  const projects = [
    {
      slug: 'somostecnicos',
      name: 'SomosTécnicos',
      description: 'Plataforma de servicios técnicos a domicilio',
      industry: 'tecnología',
      brandColor: '#e40014',
      tone: 'profesional y cercano',
      audience: 'hogares y empresas que necesitan soporte técnico',
    },
    {
      slug: 'corteurbano',
      name: 'Corte Urbano',
      description: 'Barbería urbana estilo moderno',
      industry: 'barbería',
      brandColor: '#1a1a2e',
      tone: 'urbano y casual',
      audience: 'hombres 18-40 años que cuidan su imagen',
    },
    {
      slug: 'odontologia',
      name: 'Odontología',
      description: 'Clínica odontológica familiar',
      industry: 'salud dental',
      brandColor: '#0284c7',
      tone: 'confiable y profesional',
      audience: 'familias que buscan atención dental de calidad',
    },
  ]

  for (const project of projects) {
    await prisma.project.upsert({
      where: { slug: project.slug },
      update: {},
      create: project,
    })
    console.log(`  ✅ ${project.name}`)
  }

  console.log('✨ Seed completado')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

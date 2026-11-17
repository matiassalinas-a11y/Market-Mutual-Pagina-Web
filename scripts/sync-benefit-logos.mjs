import { mkdir, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const sourceRoot = process.argv[2]

if (!sourceRoot) {
  console.error('Uso: node scripts/sync-benefit-logos.mjs "C:\\ruta\\Logos convenios"')
  process.exit(1)
}

const sharpPackage = (await readdir(path.resolve('node_modules/.pnpm'), { withFileTypes: true }))
  .find((entry) => entry.isDirectory() && entry.name.startsWith('sharp@'))

if (!sharpPackage) {
  console.error('No se encontró Sharp. Ejecutá pnpm install antes de sincronizar los logos.')
  process.exit(1)
}

const sharpPath = path.resolve('node_modules/.pnpm', sharpPackage.name, 'node_modules/sharp/dist/index.mjs')
const { default: sharp } = await import(pathToFileURL(sharpPath).href)

for (const discount of ['30', '20', '15']) {
  const inputDirectory = path.resolve(sourceRoot, `${discount}% descuento`)
  const outputDirectory = path.resolve('public/benefits', discount)
  const files = (await readdir(inputDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && ['.png', '.jpg', '.jpeg', '.webp'].includes(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, 'es', { numeric: true, sensitivity: 'base' }))

  await mkdir(outputDirectory, { recursive: true })

  for (const [index, filename] of files.entries()) {
    const outputName = `${String(index + 1).padStart(2, '0')}.webp`
    const overrideFile = path.resolve('assets/benefit-logos', discount, filename)
    const inputFile = existsSync(overrideFile) ? overrideFile : path.join(inputDirectory, filename)

    await sharp(inputFile)
      .trim({ threshold: 10 })
      .resize({ width: 520, height: 200, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 88, alphaQuality: 90 })
      .toFile(path.join(outputDirectory, outputName))
    console.log(`${discount}%: ${filename}${inputFile === overrideFile ? ' (reemplazo local)' : ''} -> ${outputName}`)
  }

  console.log(`${discount}%: ${files.length} logo(s) sincronizado(s).`)
}

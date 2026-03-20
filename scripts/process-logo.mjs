import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(__dirname, 'logo-source.png');
const OUT = join(ROOT, 'public', 'logo');

const BG = { r: 8, g: 44, b: 34, alpha: 1 }; // #082C22

const SIZES = [
  { name: 'favicon-16',    width: 16,  height: 16,  fit: 'cover' },
  { name: 'favicon-32',    width: 32,  height: 32,  fit: 'cover' },
  { name: 'favicon-48',    width: 48,  height: 48,  fit: 'cover' },
  { name: 'apple-touch',   width: 180, height: 180, fit: 'cover' },
  { name: 'icon-192',      width: 192, height: 192, fit: 'cover' },
  { name: 'icon-512',      width: 512, height: 512, fit: 'cover' },
  { name: 'logo-header',   width: 160, height: 48,  fit: 'contain' },
  { name: 'logo-og',       width: 400, height: 400, fit: 'cover' },
];

const FORMATS = [
  { ext: 'avif', fn: (s) => s.avif({ quality: 80 }) },
  { ext: 'webp', fn: (s) => s.webp({ quality: 85 }) },
  { ext: 'png',  fn: (s) => s.png({ compressionLevel: 9 }) },
];

if (!existsSync(OUT)) {
  mkdirSync(OUT, { recursive: true });
}

for (const size of SIZES) {
  const resized = sharp(SRC).resize({
    width: size.width,
    height: size.height,
    fit: size.fit,
    background: BG,
  });

  for (const fmt of FORMATS) {
    const filename = `${size.name}.${fmt.ext}`;
    const outPath = join(OUT, filename);
    await fmt.fn(resized.clone()).toFile(outPath);
    console.log(`✓ ${filename}`);
  }
}

console.log('\nAll logo assets generated in public/logo/');

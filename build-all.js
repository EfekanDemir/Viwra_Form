import { execSync } from 'child_process';
import { cpSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

console.log('--- VIWRA CLOUDFLARE BUILDER ---');

try {
  console.log('\n[1/4] Ana Site Uretiliyor (Landing Page)...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('\n[2/4] Odak Formu Uretiliyor (Astro Portal)...');
  execSync('npm run build', { cwd: './portal', stdio: 'inherit' });

  console.log('\n[3/4] Form Dosyalari Ana Klasorle Birlestiriliyor...');
  const portalDist = join(process.cwd(), 'portal', 'dist');
  const targetDist = join(process.cwd(), 'dist', 'form');

  if (existsSync(targetDist)) {
      rmSync(targetDist, { recursive: true, force: true });
  }
  cpSync(portalDist, targetDist, { recursive: true });

  console.log('\n[4/4] Cloudflare Paketi Tamamlandi!');
  console.log('\n✅ BASARILI: /dist klasorunuz Cloudflare Pages icin tek parca haline getirildi.');
  console.log('➜ Cloudflare ustunde yayin yaparken proje kok dizini olarak /dist klasorunu secin.');
  console.log('➜ viwra.com anasayfanizi, viwra.com/form ise odak testinizi sorunsuzca acacaktir.');
} catch (error) {
  console.error('\n❌ INSA HATASI: ', error.message);
  process.exit(1);
}

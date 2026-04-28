import { execSync } from 'child_process';

console.log('--- VIWRA CLOUDFLARE BUILDER ---');

try {
  console.log('\n[1/1] React SPA Build Ediliyor...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('\n✅ BAŞARILI: /dist klasörü Cloudflare Pages için hazır.');
  console.log('➜ viwra.com anasayfayı, viwra.com/form ise yeni formu açacaktır.');
} catch (error) {
  console.error('\n❌ INSA HATASI: ', error.message);
  process.exit(1);
}

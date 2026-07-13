import React from 'react';
import { LegalLayout, LegalSection, LegalP, LegalList } from './LegalLayout';

export function GizlilikPage() {
  return (
    <LegalLayout
      title="Gizlilik Politikası"
      subtitle="Viwra'nın kişisel verilerinizi nasıl topladığı, kullandığı ve koruduğuna dair kapsamlı açıklamalar"
      lastUpdated="Temmuz 2025"
    >
      <LegalSection title="1. Genel Bakış">
        <LegalP>
          Viwra, bireylerin duygusal ve zihinsel iyilik halini desteklemek amacıyla yapay zeka destekli
          kişiselleştirilmiş rehberlik sunan bir wellness platformudur. İşlediğimiz veriler, size daha iyi
          ve kişiselleştirilmiş bir deneyim sunmak için kullanılmakta; hiçbir koşulda satılmamakta,
          üçüncü taraf reklamcılara aktarılmamakta ya da profilleme amacıyla kullanılmamaktadır.
        </LegalP>
        <LegalP>
          Bu Gizlilik Politikası, Viwra'yı kullanan tüm bireyler için geçerlidir ve 6698 sayılı Kişisel
          Verilerin Korunması Kanunu ("KVKK"), Avrupa Genel Veri Koruma Tüzüğü ("GDPR") ve ilgili
          diğer mevzuat çerçevesinde hazırlanmıştır.
        </LegalP>
      </LegalSection>

      <LegalSection title="2. Topladığımız Veriler">
        <LegalP>
          <strong className="text-[#f4f2e2]/70">a) Hesap ve Kimlik Bilgileri</strong>
        </LegalP>
        <LegalList items={[
          'Ad ve soyad (kayıt ve bekleme listesi için)',
          'E-posta adresi (kimlik doğrulama ve iletişim için)',
        ]} />

        <LegalP>
          <strong className="text-[#f4f2e2]/70">b) Platform İçi İçerikler</strong>
        </LegalP>
        <LegalList items={[
          'Duygu durumu girişleri ve yapay zekaya iletilen mesajlar',
          'Günlük (journal) yazıları ve etiketler',
          'Zihin haritası verileri',
          'Yapay zeka tarafından üretilen oturum yanıtları ve özet notları',
        ]} />

        <LegalP>
          <strong className="text-[#f4f2e2]/70">c) Teknik ve Kullanım Verileri</strong>
        </LegalP>
        <LegalList items={[
          'IP adresi ve yaklaşık coğrafi konum (şehir düzeyinde)',
          'Tarayıcı türü ve versiyonu',
          'İşletim sistemi',
          'Ziyaret edilen sayfalar ve tıklama akışları',
          'Oturum süreleri ve erişim zamanları',
        ]} />

        <LegalP>
          <strong className="text-[#f4f2e2]/70">d) Bekleme Listesi Verileri</strong>
        </LegalP>
        <LegalList items={[
          'Ad soyad ve e-posta adresi (erken erişim talebi için)',
        ]} />
      </LegalSection>

      <LegalSection title="3. Verilerin Kullanım Amaçları">
        <LegalList items={[
          'Size kişiselleştirilmiş yapay zeka destekli zihinsel iyilik desteği sunmak',
          'Geçmiş oturumlarınızı hatırlayarak bağlamlı yanıtlar üretmek',
          'Hesap yönetimi ve güvenlik doğrulamasını sağlamak',
          'Platform performansını ve güvenilirliğini artırmak',
          'Hizmet bildirimleri ve güncelleme e-postaları göndermek',
          'Yasal yükümlülükleri yerine getirmek',
        ]} />
      </LegalSection>

      <LegalSection title="4. Üçüncü Taraf Hizmet Sağlayıcılar">
        <LegalP>
          Viwra, hizmetlerini yürütmek için güvenilir üçüncü taraf altyapı sağlayıcılarından yararlanmaktadır.
          Bu sağlayıcılara aktarılan veriler yalnızca hizmetin ifasıyla sınırlı tutulmakta ve hiçbir
          sağlayıcının verilerinizi kendi amaçları doğrultusunda işlemesine izin verilmemektedir.
        </LegalP>
        <LegalList items={[
          'Supabase Inc. – Kimlik doğrulama, veri tabanı depolama ve gerçek zamanlı veri yönetimi',
          'Google LLC (Gemini AI) – Yapay zeka metin üretimi; API kullanım koşulları uyarınca model eğitiminde kullanılmaz',
          'Resend Inc. – İşlemsel e-posta iletimi',
          'ElevenLabs Inc. – Yapay zeka ses sentezi (sesli meditasyon üretimi)',
        ]} />
        <LegalP>
          Yukarıdaki sağlayıcıların her biri kendi veri işleme politikaları ve güvenlik sertifikaları
          kapsamında hizmet vermekte olup Viwra, bu sağlayıcılarla gerekli veri işleme anlaşmalarını
          ("DPA") imzalamıştır veya imzalamayı taahhüt etmektedir.
        </LegalP>
      </LegalSection>

      <LegalSection title="5. Çerezler ve İzleme Teknolojileri">
        <LegalP>
          Viwra, aşağıdaki zorunlu çerezleri kullanmaktadır:
        </LegalP>
        <LegalList items={[
          'Oturum çerezleri: Kullanıcı kimlik doğrulaması ve aktif oturumun korunması için zorunludur. Tarayıcı kapatıldığında silinir.',
          'Yerel depolama (localStorage): Kullanıcı tercihlerinin ve tema ayarlarının saklanması için kullanılır.',
        ]} />
        <LegalP>
          Viwra, reklamcılık veya davranışsal izleme amacıyla çerez kullanmamaktadır. Google Analytics,
          Meta Pixel veya benzeri üçüncü taraf izleme sistemleri entegre edilmemiştir.
        </LegalP>
      </LegalSection>

      <LegalSection title="6. Veri Güvenliği">
        <LegalP>
          Kişisel verilerinizin güvenliği için aşağıdaki teknik ve idari tedbirler alınmaktadır:
        </LegalP>
        <LegalList items={[
          'Tüm veri iletişimi TLS 1.2/1.3 protokolü ile şifrelenmektedir.',
          'Parolalar yerine "magic link" (sihirli bağlantı) tabanlı kimlik doğrulama sistemi kullanılmaktadır.',
          'Supabase\'in satır düzeyinde güvenlik (Row Level Security – RLS) politikaları uygulanmakta, her kullanıcı yalnızca kendi verilerine erişebilmektedir.',
          'Hassas yapılandırma verileri (API anahtarları vb.) ortam değişkenleri aracılığıyla yönetilmekte; kaynak kodunda yer almamaktadır.',
          'Veri erişimi minimum yetki ilkesiyle sınırlandırılmıştır.',
        ]} />
      </LegalSection>

      <LegalSection title="7. Veri Saklama Süreleri">
        <LegalList items={[
          'Aktif hesap verileri: Hesap silinene kadar.',
          'Oturum, günlük ve zihin haritası verileri: Kullanıcı tarafından silinene veya hesap kapatılana kadar.',
          'Bekleme listesi verileri: Erken erişim süreci tamamlanana kadar ya da en fazla 24 ay.',
          'Teknik log kayıtları: 90 güne kadar.',
          'Yasal yükümlülükler gerektirdiğinde: İlgili mevzuatın öngördüğü süre.',
        ]} />
      </LegalSection>

      <LegalSection title="8. Kullanıcı Hakları">
        <LegalP>
          Viwra kullanıcıları olarak aşağıdaki haklara sahipsiniz:
        </LegalP>
        <LegalList items={[
          'Erişim hakkı: Verilerinizin bir kopyasını talep edebilirsiniz.',
          'Düzeltme hakkı: Yanlış veya eksik verilerinizin güncellenmesini isteyebilirsiniz.',
          'Silme hakkı ("unutulma hakkı"): Verilerinizin silinmesini talep edebilirsiniz.',
          'İşlemeyi kısıtlama hakkı: Belirli işleme faaliyetlerini sınırlandırabilirsiniz.',
          'İtiraz hakkı: Meşru menfaat dayanağıyla işlenen veriler için işlemeye itiraz edebilirsiniz.',
          'Veri taşınabilirliği hakkı: Verilerinizi taşınabilir bir formatta almayı talep edebilirsiniz.',
          'Rızanızı geri çekme hakkı: Açık rızanıza dayanan her türlü işlemeyi dilediğiniz zaman durdurabilirsiniz.',
        ]} />
        <LegalP>
          Bu haklarınızı kullanmak için viwra.com üzerinden bizimle iletişime geçebilirsiniz.
          Talepler 30 gün içinde yanıtlanacaktır.
        </LegalP>
      </LegalSection>

      <LegalSection title="9. 18 Yaş Altı Kullanıcılar">
        <LegalP>
          Viwra, 18 yaşın altındaki bireylere yönelik değildir ve bilerek bu kişilerden veri toplamamaktadır.
          18 yaşından küçük bir kullanıcıya ait veri toplandığını fark etmemiz durumunda söz konusu veriler
          derhal silinecektir.
        </LegalP>
      </LegalSection>

      <LegalSection title="10. Politika Değişiklikleri">
        <LegalP>
          Bu Gizlilik Politikası, Viwra'nın hizmetlerinde veya yasal gerekliliklerde değişiklik olması
          durumunda güncellenebilir. Önemli değişiklikler, kayıtlı e-posta adresinize önceden bildirim
          yapılarak duyurulacaktır. Güncellenmiş politikanın yürürlüğe girdiği tarihten sonra platformu
          kullanmaya devam etmeniz, yeni politikayı kabul ettiğiniz anlamına gelir.
        </LegalP>
      </LegalSection>
    </LegalLayout>
  );
}

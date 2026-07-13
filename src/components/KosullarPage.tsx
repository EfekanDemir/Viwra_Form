import React from 'react';
import { LegalLayout, LegalSection, LegalP, LegalList } from './LegalLayout';

export function KosullarPage() {
  return (
    <LegalLayout
      title="Kullanım Koşulları"
      subtitle="Viwra platformunu kullanarak bu koşulları kabul etmiş sayılırsınız."
      lastUpdated="Temmuz 2025"
    >
      <LegalSection title="1. Taraflar ve Kapsam">
        <LegalP>
          Bu Kullanım Koşulları ("Koşullar"), Viwra uygulamasının işleticisi ("Viwra", "biz") ile
          platformu kullanan gerçek kişi ("Kullanıcı", "siz") arasındaki hukuki ilişkiyi düzenlemektedir.
          Viwra'ya erişerek veya hesap oluşturarak bu Koşulları okuduğunuzu, anladığınızı ve bütünüyle
          kabul ettiğinizi beyan etmektesiniz. Bu Koşulları kabul etmiyorsanız lütfen platformu kullanmayınız.
        </LegalP>
      </LegalSection>

      <LegalSection title="2. Hizmetin Niteliği ve Önemli Uyarı">
        <LegalP>
          Viwra, bireysel duygusal farkındalık, zihinsel iyilik ve kişisel gelişimi desteklemeye yönelik
          bir yapay zeka destekli wellness platformudur.
        </LegalP>
        <LegalP>
          <strong className="text-[#f4f2e2]/80">
            VIWRA; PSİKOLOJİK DANIŞMANLIK, PSİKOTERAPİ, PSİKİYATRİK TEDAVİ VEYA HERHANGİ BİR TIBBİ HİZMET
            SUNMAMAKTADIR. VIWRA'NIN YAPAY ZEKA DESTEKLİ YANIT VE REHBERLİKLERİ, LİSANSLI BİR SAĞLIK
            PROFESYONELİNİN DEĞERLENDİRMESİNİN YERİNİ TUTMAZ VE TUTAMAZ.
          </strong>
        </LegalP>
        <LegalP>
          Ruhsal sağlık sorunları yaşıyorsanız, kendinize veya başkalarına zarar verme düşüncesi taşıyorsanız
          ya da kriz içindeyseniz lütfen derhal yetkili bir sağlık kuruluşuna, psikolog veya psikiyatiste
          başvurunuz ya da aşağıdaki acil hatları arayınız:
        </LegalP>
        <LegalList items={[
          '182 – Türkiye İntihar Önleme Hattı (7/24)',
          '156 – ALO Psikiyatri Hattı',
          '112 – Acil Sağlık Hizmetleri',
        ]} />
      </LegalSection>

      <LegalSection title="3. Üyelik ve Hesap Güvenliği">
        <LegalList items={[
          'Viwra\'ya üyelik, yalnızca 18 yaşını doldurmuş gerçek kişilere açıktır.',
          'Kapalı beta döneminde platform erişimi davet sistemiyle yönetilmektedir; bekleme listesine kayıt, erişim garantisi vermez.',
          'Hesabınızın güvenliğinden ve hesabınız üzerinden gerçekleştirilen tüm işlemlerden bizzat sorumlusunuz.',
          'E-posta doğrulama bağlantılarını (magic link) hiçbir kişi veya kuruluşla paylaşmayınız.',
          'Başkasının hesabına yetkisiz erişim girişimi kesinlikle yasaktır ve yasal işleme konu olacaktır.',
        ]} />
      </LegalSection>

      <LegalSection title="4. Kullanıcı Yükümlülükleri ve Yasaklar">
        <LegalP>
          Viwra platformunu kullanırken aşağıdaki yükümlülükleri kabul etmektesiniz:
        </LegalP>
        <LegalList items={[
          'Platformu yalnızca kişisel, ticari olmayan amaçlarla kullanacaksınız.',
          'Yanıltıcı, sahte veya başkasına ait kimlik bilgisi giremezsiniz.',
          'Platform altyapısına yönelik saldırı, veri kazıma (scraping), tersine mühendislik veya aşırı yük oluşturacak otomatik istekler yasaktır.',
          'Platforma yasadışı, şiddet içeren, ırk ayrımcılığına dayalı veya üçüncü şahısların haklarını ihlal eden içerik girilemez.',
          'Platformu başka kullanıcılar için zararlı ya da yanıltıcı biçimde kullanamazsınız.',
          'Yapay zekayı kasıtlı olarak yanıltmaya ya da manipüle etmeye yönelik girişimlerde bulunamazsınız.',
        ]} />
      </LegalSection>

      <LegalSection title="5. Fikri Mülkiyet">
        <LegalP>
          Viwra platformunun tasarımı, yazılım kodu, görsel unsurları, içerik yapısı ve marka kimliği
          Viwra'ya aittir ve fikri mülkiyet mevzuatı kapsamında korunmaktadır.
        </LegalP>
        <LegalP>
          Kullanıcıların platform aracılığıyla oluşturduğu kişisel içerikler (günlük girişleri,
          düşünce notları vb.) kullanıcıya aittir. Viwra, bu içerikleri yalnızca hizmetin sunulması
          amacıyla işler; kendi ticari çıkarları doğrultusunda kullanmaz.
        </LegalP>
      </LegalSection>

      <LegalSection title="6. Sorumluluk Sınırlaması">
        <LegalP>
          Viwra, makul teknik önlemleri almakla birlikte aşağıdaki konularda herhangi bir sorumluluk
          üstlenmemektedir:
        </LegalP>
        <LegalList items={[
          'Yapay zekanın ürettiği yanıtların doğruluğu, eksiksizliği veya belirli bir amaca uygunluğu',
          'Platform kesintileri, bakım süreleri veya üçüncü taraf hizmet sağlayıcı kaynaklı arızalar',
          'Kullanıcının Viwra yanıtlarını tıbbi veya psikolojik tavsiye olarak değerlendirmesinden doğabilecek sonuçlar',
          'Kullanıcının kendi ihmali veya kasıtlı eylemi sonucunda oluşan kayıplar',
          'Mücbir sebep halleri (doğal afet, savaş, pandemi, siber saldırı vb.)',
        ]} />
        <LegalP>
          Viwra'nın herhangi bir nedenle üstlenebileceği azami sorumluluk; son 12 aylık dönemde
          kullanıcının Viwra'ya ödediği toplam ücretle sınırlıdır. Beta döneminde hizmet ücretsiz
          sunulduğundan bu sorumluluk sıfırdır.
        </LegalP>
      </LegalSection>

      <LegalSection title="7. Hizmetin Değiştirilmesi veya Sonlandırılması">
        <LegalP>
          Viwra, platformun herhangi bir özelliğini, arayüzünü veya çalışma modelini önceden bildirim
          yaparak ya da zorunlu durumlarda bildirim yapmaksızın değiştirme ya da sonlandırma hakkını
          saklı tutar. Beta döneminin sona ermesiyle birlikte ücretli abonelik modeline geçilebilir;
          bu durum mevcut beta kullanıcılarına makul süre öncesinden bildirilecektir.
        </LegalP>
        <LegalP>
          Viwra, bu Koşullar'ı ihlal ettiği saptanan kullanıcıların hesaplarını gecikmeksizin
          askıya alma veya kalıcı olarak kapatma hakkına sahiptir.
        </LegalP>
      </LegalSection>

      <LegalSection title="8. Uygulanacak Hukuk ve Uyuşmazlık Çözümü">
        <LegalP>
          Bu Koşullar; Türkiye Cumhuriyeti hukuku uyarınca yorumlanır ve uygulanır. Bu Koşullar'dan
          doğabilecek her türlü uyuşmazlıkta İstanbul Mahkemeleri ve İcra Daireleri münhasıran
          yetkilidir.
        </LegalP>
      </LegalSection>

      <LegalSection title="9. Koşullardaki Değişiklikler">
        <LegalP>
          Viwra, bu Koşullar'ı zaman zaman güncelleyebilir. Önemli değişiklikler yürürlük tarihinden
          en az 14 gün önce e-posta ve/veya platform bildirimi yoluyla duyurulacaktır. Güncellenmiş
          Koşullar yürürlüğe girdikten sonra platformu kullanmaya devam etmeniz, değişiklikleri
          kabul ettiğiniz anlamına gelir.
        </LegalP>
      </LegalSection>

      <LegalSection title="10. İletişim">
        <LegalP>
          Bu Koşullar'a ilişkin sorularınız için viwra.com üzerindeki iletişim kanalları aracılığıyla
          bizimle iletişime geçebilirsiniz.
        </LegalP>
      </LegalSection>
    </LegalLayout>
  );
}

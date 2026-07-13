import React from 'react';
import { LegalLayout, LegalSection, LegalP, LegalList } from './LegalLayout';

export function KvkkPage() {
  return (
    <LegalLayout
      title="KVKK Aydınlatma Metni"
      subtitle="6698 Sayılı Kişisel Verilerin Korunması Kanunu Kapsamında Aydınlatma Metni"
      lastUpdated="Temmuz 2025"
    >
      <LegalSection title="1. Veri Sorumlusunun Kimliği">
        <LegalP>
          6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz; veri sorumlusu
          sıfatıyla Viwra uygulamasının işleticisi tarafından aşağıda açıklanan kapsamda işlenmektedir.
          Viwra, bireylerin duygusal ve zihinsel iyilik halini desteklemek amacıyla yapay zeka destekli
          kişisel gelişim ve farkındalık hizmetleri sunan bir yazılım platformudur.
        </LegalP>
        <LegalP>
          İletişim için: <strong className="text-[#f4f2e2]/70">viwra.com</strong> üzerinden ulaşabilirsiniz.
        </LegalP>
      </LegalSection>

      <LegalSection title="2. İşlenen Kişisel Veriler ve Kategorileri">
        <LegalP>
          Viwra, hizmet kapsamında aşağıdaki kişisel veri kategorilerini işlemektedir:
        </LegalP>
        <LegalList items={[
          'Kimlik Verileri: Ad, soyad.',
          'İletişim Verileri: E-posta adresi.',
          'Özel Nitelikli Kişisel Veriler (Sağlık/Psikoloji): Kullanıcının platform üzerinde paylaştığı duygu durumu, stres, kaygı, uyku sorunları, tükenmişlik gibi zihinsel ve duygusal bilgiler. Bu veriler, 6698 sayılı KVKK\'nın 6. maddesi uyarınca "özel nitelikli kişisel veri" statüsünde değerlendirilmekte olup açık rızanıza dayalı olarak işlenmektedir.',
          'Kullanım ve Günlük Verileri: Sesli meditasyon oturumları, yapay zeka sohbet geçmişi, günlük girişleri ve zihin haritası içerikleri.',
          'Teknik Veriler: IP adresi, cihaz bilgisi, tarayıcı türü, oturum süreleri.',
        ]} />
      </LegalSection>

      <LegalSection title="3. Kişisel Verilerin İşlenme Amaçları ve Hukuki Dayanakları">
        <LegalP>
          Kişisel verileriniz, KVKK'nın 5. ve 6. maddeleri uyarınca aşağıdaki amaçlarla ve hukuki dayanaklar çerçevesinde işlenmektedir:
        </LegalP>
        <LegalList items={[
          'Hizmetin sunulması ve kişiselleştirilmesi: Sözleşmenin kurulması ve ifası (KVKK m. 5/2-c).',
          'Yapay zeka destekli zihinsel iyilik hizmeti sağlanması: Açık rıza (KVKK m. 5/1 ve m. 6/2).',
          'Kullanıcı hesabının oluşturulması ve yönetilmesi: Sözleşmenin ifası (KVKK m. 5/2-c).',
          'Beta bekleme listesi yönetimi ve erken erişim daveti gönderimi: Meşru menfaat ve açık rıza (KVKK m. 5/2-f ve m. 5/1).',
          'Güvenlik, hata tespiti ve hizmet iyileştirme: Meşru menfaat (KVKK m. 5/2-f).',
          'Yasal yükümlülüklerin yerine getirilmesi: Kanuni zorunluluk (KVKK m. 5/2-ç).',
        ]} />
      </LegalSection>

      <LegalSection title="4. Kişisel Verilerin Aktarıldığı Taraflar ve Aktarım Amaçları">
        <LegalP>
          Kişisel verileriniz, aşağıdaki hizmet sağlayıcılara yalnızca hizmetin ifası için zorunlu olan minimum düzeyde aktarılmaktadır:
        </LegalP>
        <LegalList items={[
          'Supabase Inc. (ABD): Veri tabanı ve kimlik doğrulama altyapısı. KVKK m. 9 uyarınca yeterli koruma taahhüdü ve gerekli teknik/idari tedbirler kapsamında aktarım gerçekleştirilmektedir.',
          'Google LLC – Gemini AI (ABD): Yapay zeka metin üretimi altyapısı. Gönderilen içerikler yanıt üretimi amacıyla kullanılmakta, Google\'ın API Kullanım Koşulları uyarınca model eğitiminde kullanılmamaktadır.',
          'Resend Inc. (ABD): E-posta iletişim altyapısı. Yalnızca bildirimlerin iletimi amacıyla kullanılmaktadır.',
          'ElevenLabs Inc. (ABD): Yapay zeka ses sentezi altyapısı. Yalnızca sesli rehberlik içeriklerinin üretimi için kullanılmaktadır.',
        ]} />
        <LegalP>
          Kişisel verileriniz, yukarıda belirtilen amaçlar dışında hiçbir üçüncü tarafla paylaşılmamakta; satılmamakta; reklam, profilleme veya veri ticareti amacıyla kullanılmamaktadır.
        </LegalP>
      </LegalSection>

      <LegalSection title="5. Kişisel Veri Toplama Yöntemi">
        <LegalP>
          Kişisel verileriniz; web tarayıcısı aracılığıyla platform üzerinde gerçekleştirdiğiniz işlemler (form doldurma, metin girişi, oturum etkileşimleri) ve teknik günlük kayıtları yoluyla elektronik ortamda toplanmaktadır.
        </LegalP>
      </LegalSection>

      <LegalSection title="6. Kişisel Verilerin Saklanma Süreleri">
        <LegalList items={[
          'Hesap verileri: Hesabın aktif olduğu süre boyunca ve hesap silinmesinin ardından 30 gün içinde kalıcı olarak silinir.',
          'Oturum ve günlük verileri: Kullanıcı tarafından silinebildiği anda ya da hesap silme talebinin ardından silinir.',
          'Bekleme listesi verileri: Erken erişim süreci tamamlanana veya kullanıcının talepte bulunmasına kadar saklanır; azami süre 24 aydır.',
          'Yasal yükümlülükler kapsamındaki veriler: İlgili mevzuatın öngördüğü sürelerce saklanır.',
        ]} />
      </LegalSection>

      <LegalSection title="7. İlgili Kişinin Hakları (KVKK Madde 11)">
        <LegalP>
          KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
        </LegalP>
        <LegalList items={[
          'Kişisel verilerinizin işlenip işlenmediğini öğrenme,',
          'Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme,',
          'Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,',
          'Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme,',
          'Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme,',
          'KVKK\'nın 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerin silinmesini veya yok edilmesini isteme,',
          'Düzeltme ve silme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme,',
          'İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişinin kendisi aleyhine bir sonucun ortaya çıkmasına itiraz etme,',
          'Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması hâlinde zararın giderilmesini talep etme.',
        ]} />
      </LegalSection>

      <LegalSection title="8. Başvuru Usulü">
        <LegalP>
          Yukarıda belirtilen haklarınızı kullanmak amacıyla viwra.com üzerinden ya da platform içindeki destek kanalları
          aracılığıyla yazılı talepte bulunabilirsiniz. Başvurunuz; talebinizin niteliğine göre en geç otuz (30) gün
          içinde yanıtlanacaktır. Talebinizin reddedilmesi, verilen cevabın yetersiz bulunması veya süresi içinde
          yanıt verilmemesi hâlinde; yanıtı öğrendiğiniz tarihten itibaren otuz (30) gün ve her hâlükârda başvuru
          tarihinden itibaren altmış (60) gün içinde Kişisel Verileri Koruma Kurulu'na ("Kurul") şikâyette
          bulunma hakkınız saklıdır.
        </LegalP>
      </LegalSection>

      <LegalSection title="9. Açık Rıza">
        <LegalP>
          Viwra platformunu kullanmaya başlamadan önce açık rızanız talep edilmektedir. Özellikle özel nitelikli
          kişisel veri niteliğindeki psikolojik ve duygusal içeriklerinizin işlenmesi için açık rızanız zorunludur.
          Açık rızanızı her zaman geri çekme hakkınız mevcuttur; bu hakkı kullanmanız durumunda söz konusu verileriniz
          derhal işlenmeyecek ve hizmetler kısmen kısıtlanabilecektir.
        </LegalP>
      </LegalSection>
    </LegalLayout>
  );
}

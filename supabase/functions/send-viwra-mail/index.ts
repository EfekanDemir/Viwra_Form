import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const generateEmailHtml = (kullaniciAdi: string, adayNumarasi: string) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
  </head>
  <body style="background-color: #0a062b; color: #E6E6E6; margin: 0; padding: 0; font-family: 'Courier New', Courier, monospace; line-height: 1.6; -webkit-font-smoothing: antialiased;">
    <div class="email-wrapper" style="background-color: #0a062b; width: 100%; padding: 40px 0;">
      <div class="container" style="background-color: #06031b; max-width: 600px; margin: 0 auto; padding: 30px; border-left: 2px solid #4a3b8c;">
      
      <div style="color: #FFFFFF; font-weight: bold; font-size: 18px; margin-bottom: 30px; border-bottom: 1px dotted #333; padding-bottom: 10px;"># VIWRA: [STATUS: ADMISSION_CONFIRMED]</div>
      
      <span style="font-weight: 700; display: block; margin: 5px 0; color: #CCCCCC;">[CANDIDATE: ${kullaniciAdi}]</span>
      <span style="font-weight: 700; display: block; margin: 5px 0; color: #CCCCCC;">[ID: #${adayNumarasi}]</span>
      <span style="font-weight: 700; display: block; margin: 5px 0; color: #CCCCCC;">[LOCATION: UMUTTEPE_NODE_04]</span>

      <div style="font-weight: bold; color: #888888; margin-top: 35px; margin-bottom: 15px; letter-spacing: 1px;">SİSTEM GÜNCELLEMESİ:</div>
      <p>
        24 saat önce gerçekleştirdiğin odak testi, bilişsel eşiği geçtiğini kanıtladı. Ancak Viwra sadece bir yazılım değil; zihinsel prangaları kırma niyetinde olan bir kolektiftir.
      </p>
      <p>
        Seni sadece bir "kullanıcı" olarak değil, sistemin mimarisine yön verecek bir <strong>Beta Operatörü</strong> ve topluluk bileşeni olarak görüyoruz. Görünmez İplerin ötesini görmek ve projenin derinliklerini bizzat kurucusundan dinlemek üzere özel bir brifinge davet edildin.
      </p>

      <div style="font-weight: bold; color: #888888; margin-top: 35px; margin-bottom: 15px; letter-spacing: 1px;">TOPLANTI DETAYLARI [SYNAPSE_01]:</div>
      <ul style="list-style-type: square; padding-left: 20px; color: #BBBBBB;">
        <li><strong style="color: #EEEEEE;">AMAÇ:</strong> Viwra Operasyonel Felsefesi, Görünmez İpler Doktrini ve Beta Test Süreci.</li>
        <li style="margin-top:10px;"><strong style="color: #EEEEEE;">KONUM:</strong> [SENKRONİZASYON BEKLENİYOR] <br/><span style="color:#777; font-size:12px;">// Koordinatlar, aday yoğunluğuna göre hesaplanmaktadır. Kesin konum bilgisi toplantıdan kısa bir süre önce iletilecektir.</span></li>
        <li style="margin-top:10px;"><strong style="color: #EEEEEE;">ZAMAN:</strong> [İLERİ BİR TARİHTE AÇIKLANACAK] <br/><span style="color:#777; font-size:12px;">// Zaman akışı, operasyonel önceliklere göre belirlenmektedir.</span></li>
        <li style="margin-top:10px;"><strong style="color: #EEEEEE;">ERİŞİM:</strong> Sadece bu ID numarasına sahip adaylar kabul edilecektir.</li>
      </ul>

      <p style="margin-top: 25px;">
        Bu seminer, standart bir sunum değildir. Bu, Umuttepe'de başlatılan zihinsel devrimin ilk fiziksel adımıdır. Topluluğun ilk halkasında yer almak ve beta sürecini yönetmek için orada olman gerekiyor.
      </p>

      <a href="#" style="display: inline-block; background-color: #E6E6E6; color: #050505; text-decoration: none; padding: 14px 28px; font-weight: bold; font-size: 14px; letter-spacing: 2px; margin-top: 25px; transition: opacity 0.3s ease;">[KATILIMINI ONAYLA: PROTOKOLE DAHİL OL]</a>

      <div style="margin-top: 35px; font-size: 12px; color: #666666;">
        // NOT: Kapı sadece bir kez açılır. Koordinatlar hesaplandığında bildirim alacaksın. Sessiz kal ve hazır ol.<br/><br/>
        // KRİTİK: Erişim kodun gelmediyse veya sistem seni askıya aldıysa, bu maili 'Onay' kelimesiyle yanıtla.
      </div>

      <p style="margin-top: 25px; color: #888;">
        Sistem seni izlemeye devam ediyor.
      </p>

      <div style="margin-top: 40px; font-weight: bold;">
        [VIWRA OPERASYONEL MERKEZİ]
        <span style="color: #555555; font-style: italic; margin-top: 5px; display: block;">Zihnini mühürle.</span>
      </div>

      <div style="margin-top: 50px; text-align: center; border-top: 1px dashed #222; padding-top: 15px;">
        <a href="{{unsubscribe_url}}" style="color: #444; font-size: 10px; text-decoration: none; letter-spacing: 1px;">// [PROTOKOLÜ_İPTAL_ET_VE_AYRIL]</a>
      </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // FAIL-SAFE CLOSE: Hem ortam değişkeni zorunlu tutulur hem de gelen şifreyle eşleşmeli.
  const EXPECTED_SECRET = Deno.env.get("CRON_SECRET");
  const authHeader = req.headers.get("Authorization");
  
  if (!EXPECTED_SECRET || authHeader !== `Bearer ${EXPECTED_SECRET}`) {
     console.error("Unauthorized request blocked by viwra security walls.");
     return new Response(JSON.stringify({ error: 'Unauthorized CRON secret' }), { 
        status: 401, headers: { "Content-Type": "application/json" } 
     });
  }

  try {
    const payload = await req.json();
    const targetEmail = payload.email;
    const kullaniciAdi = payload.full_name;
    const adayNumarasi = payload.id;

    if (!targetEmail || !kullaniciAdi || !adayNumarasi) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), { 
        status: 400, headers: { "Content-Type": "application/json" } 
      });
    }

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'Resend API Key not configured at Edge' }), { 
        status: 500, headers: { "Content-Type": "application/json" } 
      });
    }

    const emailHtml = generateEmailHtml(kullaniciAdi, adayNumarasi.substring(0,8).toUpperCase());

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "X-Entity-Ref-ID": Date.now().toString()
      },
      body: JSON.stringify({
        from: "Viwra Yetkili Hub <onboarding@viwra.com>",
        to: [targetEmail],
        subject: "[BRIEFING INVITE] // Protokol V-1.04: İlk Halka Toplantısı",
        html: emailHtml,
      }),
    });

    if (!res.ok) {
        const errorData = await res.text();
        console.error("Resend API Error: ", errorData);
        return new Response(JSON.stringify({ error: 'Failed to send mail', details: errorData }), {
            status: 500, headers: { "Content-Type": "application/json" } 
        });
    }

    const resData = await res.json();
    return new Response(JSON.stringify({ success: true, resendId: resData.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
});

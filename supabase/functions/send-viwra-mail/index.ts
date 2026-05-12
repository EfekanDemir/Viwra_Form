import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const escapeHTML = (str: string) => {
  return str.replace(/[&<>'"]/g, 
    (tag) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
};

const generateEmailHtml = (kullaniciAdi: string, adayNumarasi: string) => {
  const safeAd = escapeHTML(kullaniciAdi);
  const safeNo = escapeHTML(adayNumarasi);
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
  </head>
  <body style="background-color: #0a062b; color: #E6E6E6; margin: 0; padding: 0; font-family: 'Courier New', Courier, monospace; line-height: 1.6; -webkit-font-smoothing: antialiased;">
    <div class="email-wrapper" style="background-color: #0a062b; width: 100%; padding: 40px 0;">
      <div class="container" style="background-color: #06031b; max-width: 600px; margin: 0 auto; padding: 30px; border-left: 2px solid #4a3b8c;">
      
      <div style="color: #FFFFFF; font-weight: bold; font-size: 18px; margin-bottom: 30px; border-bottom: 1px dotted #333; padding-bottom: 10px;">📩 VIWRA: [STATUS: ADMISSION_CONFIRMED]</div>
      
      <span style="font-weight: 700; display: block; margin: 5px 0; color: #CCCCCC;">[CANDIDATE: ${safeAd}]</span>
      <span style="font-weight: 700; display: block; margin: 5px 0; color: #CCCCCC;">[ID: #${safeNo}]</span>

      <div style="font-weight: bold; color: #888888; margin-top: 35px; margin-bottom: 15px; letter-spacing: 1px;">SİSTEM GÜNCELLEMESİ:</div>
      <p>
        Gerçekleştirdiğin odak testi, bilişsel eşiği geçtiğini kanıtladı. Ancak Viwra sadece bir yazılım değil; zihinsel prangaları kırma niyetinde olan bir kolektiftir.
      </p>
      <p>
        Seni sadece bir "kullanıcı" olarak değil, sistemin mimarisine yön verecek bir <strong>Beta Operatörü</strong> ve topluluk bileşeni olarak görüyoruz. Görünmez İplerin ötesini görmek ve projenin derinliklerini bizzat kurucusundan dinlemek üzere özel bir brifinge davet edildin.
      </p>

      <div style="font-weight: bold; color: #888888; margin-top: 35px; margin-bottom: 15px; letter-spacing: 1px;">TOPLANTI DETAYLARI [SYNAPSE_01]:</div>
      <ul style="list-style-type: square; padding-left: 20px; color: #BBBBBB;">
        <li><strong style="color: #EEEEEE;">AMAÇ:</strong> Viwra Operasyonel Felsefesi, Görünmez İpler Doktrini ve Beta Test Süreci.</li>
        <li style="margin-top:10px;"><strong style="color: #EEEEEE;">ZAMAN:</strong> [İLERİ BİR TARİHTE AÇIKLANACAK] <br/><span style="color:#777; font-size:12px;">// Zaman akışı, operasyonel önceliklere göre belirlenmektedir.</span></li>
        <li style="margin-top:10px;"><strong style="color: #EEEEEE;">ERİŞİM:</strong> Sadece bu ID numarasına sahip adaylar kabul edilecektir.</li>
      </ul>

      <p style="margin-top: 25px;">
        Bu seminer, standart bir sunum değildir. Bu, Umuttepe'de başlatılan zihinsel devrimin ilk fiziksel adımıdır. Topluluğun ilk halkasında yer almak ve beta sürecini yönetmek için orada olman gerekiyor.
      </p>

      <a href="#" style="display: inline-block; background-color: #E6E6E6; color: #050505; text-decoration: none; padding: 14px 28px; font-weight: bold; font-size: 14px; letter-spacing: 2px; margin-top: 25px; transition: opacity 0.3s ease;">[KATILIMINI ONAYLA: PROTOKOLE DAHİL OL]</a>

      <div style="margin-top: 35px; font-size: 12px; color: #666666;">
        // NOT: Kapı sadece bir kez açılır. Vakit kararlaştırıldığında bildirim alacaksın. Sessiz kal ve hazır ol.
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

const ALLOWED_ORIGINS = ["https://viwra.com", "https://viwra-form.pages.dev", "http://localhost:3000"];

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin") || "";
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  const corsHeaders = {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // FAIL-SAFE CLOSE: Hem ortam değişkeni zorunlu tutulur hem de gelen şifreyle eşleşmeli.
  const EXPECTED_SECRET = Deno.env.get("CRON_SECRET");
  const authHeader = req.headers.get("Authorization");
  
  if (!EXPECTED_SECRET || authHeader !== `Bearer ${EXPECTED_SECRET}`) {
     console.error("Unauthorized request blocked by viwra security walls.");
     return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } 
     });
  }

  try {
    const payload = await req.json();
    const targetEmail = payload.email;
    const kullaniciAdi = payload.full_name;
    const adayNumarasi = payload.id;

    if (!targetEmail || !kullaniciAdi || !adayNumarasi) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), { 
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } 
      });
    }

    if (!RESEND_API_KEY) {
      console.error('Resend API Key not configured at Edge');
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } 
      });
    }

    const emailHtml = generateEmailHtml(kullaniciAdi, adayNumarasi.substring(0,8).toUpperCase());

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Idempotency-Key": `mail-${adayNumarasi}`,
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
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } 
        });
    }

    const resData = await res.json();
    return new Response(JSON.stringify({ success: true, resendId: resData.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error: any) {
    console.error("Exception in send-viwra-mail:", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_EMAIL = "efekandemir0509@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const escapeHTML = (str: string) =>
  str.replace(/[&<>'"]/g, (tag) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[tag] || tag)
  );

function adminNotificationHtml(fullName: string, email: string, id: string): string {
  const safeName = escapeHTML(fullName);
  const safeEmail = escapeHTML(email);
  const safeId = escapeHTML(id.substring(0, 8).toUpperCase());
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="background:#0a062b;color:#f4f2e2;font-family:'Courier New',monospace;padding:40px;">
  <div style="max-width:520px;margin:0 auto;background:#06031b;border-left:2px solid #4a3b8c;padding:30px;">
    <div style="font-size:16px;font-weight:bold;color:#fff;margin-bottom:24px;border-bottom:1px dotted #333;padding-bottom:12px;">
      VIWRA :: YENİ BEKLİSTE KAYDI
    </div>
    <p style="margin:8px 0;color:#aaa;">Ad Soyad: <strong style="color:#f4f2e2;">${safeName}</strong></p>
    <p style="margin:8px 0;color:#aaa;">E-posta: <strong style="color:#f4f2e2;">${safeEmail}</strong></p>
    <p style="margin:8px 0;color:#aaa;">ID: <strong style="color:#f4f2e2;">#${safeId}</strong></p>
    <p style="margin-top:24px;color:#555;font-size:12px;">Bu mesaj otomatik olarak gönderilmiştir.</p>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { full_name, email } = await req.json();

    if (!full_name?.trim() || !email?.trim()) {
      return new Response(JSON.stringify({ error: "Ad ve e-posta zorunludur." }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Geçerli bir e-posta adresi girin." }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Daha önce kayıtlı mı?
    const { data: existing } = await supabase
      .from("Viwra_Waitlist")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "Bu e-posta zaten listede." }), {
        status: 409, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Listeye ekle
    const { data: inserted, error: insertError } = await supabase
      .from("Viwra_Waitlist")
      .insert({
        full_name: full_name.trim(),
        email: email.toLowerCase().trim(),
        status: "waiting",
        is_unsubscribed: false,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Kayıt sırasında bir hata oluştu." }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Admin bildirimi gönder
    if (RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Viwra <onboarding@viwra.com>",
          to: [ADMIN_EMAIL],
          subject: `Yeni Bekliste Kaydı: ${full_name.trim()}`,
          html: adminNotificationHtml(full_name.trim(), email.trim(), inserted.id),
        }),
      }).catch((e) => console.error("Admin mail error:", e));
    }

    return new Response(JSON.stringify({ success: true, id: inserted.id }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("Exception:", err);
    return new Response(JSON.stringify({ error: "Sunucu hatası." }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

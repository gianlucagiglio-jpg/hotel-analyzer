import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email non valida' });
  }

  try {
    // Generate a random token
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);

    // Save to database
    const { error: dbError } = await supabase
      .from('email_verifications')
      .insert({ email, token, verified: false });

    if (dbError) throw dbError;

    // Build verification URL
    const baseUrl = process.env.VERCEL_URL
      ? 'https://' + process.env.VERCEL_URL
      : 'http://localhost:3000';
    const verifyUrl = baseUrl + '/api/verify-email?token=' + token;

    // Send verification email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Hotel Analysis <onboarding@resend.dev>',
        to: [email],
        subject: 'Conferma la tua email - Hotel Performance Analyzer',
        html: buildVerificationEmail(verifyUrl),
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.text();
      throw new Error('Email send failed: ' + err);
    }

    return res.status(200).json({ success: true, message: 'Email di verifica inviata' });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ error: 'Errore nell invio della verifica' });
  }
}

function buildVerificationEmail(verifyUrl) {
  return '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0F1419;font-family:Arial,sans-serif;">' +
    '<div style="max-width:500px;margin:0 auto;padding:40px 24px;text-align:center;">' +
    '<p style="color:#C9A96E;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0 0 16px;">HOTEL PERFORMANCE ANALYZER</p>' +
    '<h1 style="color:#E8E6E1;font-size:24px;margin:0 0 16px;">Conferma la tua email</h1>' +
    '<p style="color:#8B9AAF;font-size:15px;line-height:1.6;margin:0 0 32px;">Per procedere con l\'analisi del tuo hotel, conferma il tuo indirizzo email cliccando il pulsante qui sotto.</p>' +
    '<a href="' + verifyUrl + '" style="display:inline-block;padding:16px 48px;background:linear-gradient(135deg,#C9A96E,#8B7340);color:#0F1419;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;">Conferma Email</a>' +
    '<p style="color:#5A6A7F;font-size:12px;margin:32px 0 0;line-height:1.6;">Se non hai richiesto questa verifica, puoi ignorare questa email.</p>' +
    '</div></body></html>';
}

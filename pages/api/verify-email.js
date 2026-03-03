import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send(buildPage('Errore', 'Token mancante.', false));
  }

  try {
    const { data, error } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !data) {
      return res.status(400).send(buildPage('Link non valido', 'Questo link non e valido o e scaduto.', false));
    }

    if (data.verified) {
      return res.status(200).send(buildPage('Gia verificato', 'Email gia verificata. Torna all app.', true));
    }

    const { error: updateError } = await supabase
      .from('email_verifications')
      .update({ verified: true, verified_at: new Date().toISOString() })
      .eq('token', token);

    if (updateError) throw updateError;

    return res.status(200).send(buildPage('Email confermata!', 'Torna all app per continuare con l analisi.', true));
  } catch (error) {
    console.error('Verify error:', error);
    return res.status(500).send(buildPage('Errore', 'Errore del server. Riprova.', false));
  }
}

function buildPage(title, message, success) {
  var color = success ? '#4CAF50' : '#E74C3C';
  var icon = success ? '&#10003;' : '&#10007;';
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + title + '</title></head><body style="margin:0;padding:0;background:#0F1419;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;"><div style="max-width:450px;text-align:center;padding:40px 24px;"><div style="width:80px;height:80px;border-radius:50%;background:' + color + '20;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;font-size:36px;color:' + color + ';">' + icon + '</div><h1 style="color:#E8E6E1;font-size:24px;margin:0 0 12px;">' + title + '</h1><p style="color:#8B9AAF;font-size:15px;line-height:1.6;margin:0 0 32px;">' + message + '</p></div></body></html>';
}

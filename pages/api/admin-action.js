import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reportId, action, adminEmail } = req.body;

  if (!reportId || !action) {
    return res.status(400).json({ error: 'reportId and action required' });
  }

  try {
    if (action === 'approve') {
      var { data: report, error: fetchErr } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (fetchErr || !report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      var { error: updateErr } = await supabase
        .from('reports')
        .update({
          status: 'approved',
          reviewed_by: adminEmail || 'admin',
          reviewed_at: new Date().toISOString(),
          sent_to_client_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (updateErr) throw updateErr;

      if (process.env.RESEND_API_KEY) {
        await sendClientReport(report.email, report.hotel_name, report.analysis_results);
      }

      return res.status(200).json({ success: true, message: 'Report approvato e inviato al cliente' });

    } else if (action === 'reject') {
      var { error: rejectErr } = await supabase
        .from('reports')
        .update({
          status: 'rejected',
          reviewed_by: adminEmail || 'admin',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (rejectErr) throw rejectErr;
      return res.status(200).json({ success: true, message: 'Report rifiutato' });

    } else {
      return res.status(400).json({ error: 'Action must be approve or reject' });
    }
  } catch (error) {
    console.error('Admin action error:', error);
    return res.status(500).json({ error: 'Action failed' });
  }
}

async function sendClientReport(email, hotelName, analysis) {
  var sc = analysis.score >= 75 ? '#4CAF50' : analysis.score >= 55 ? '#C9A96E' : analysis.score >= 35 ? '#FF9800' : '#E74C3C';

  var html = '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0F1419;font-family:Arial,sans-serif;">'
    + '<div style="max-width:600px;margin:0 auto;padding:40px 24px;">'
    + '<div style="text-align:center;margin-bottom:32px;">'
    + '<p style="color:#C9A96E;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;">HOTEL PERFORMANCE REPORT</p>'
    + '<h1 style="color:#E8E6E1;font-size:28px;margin:0 0 4px;">' + hotelName + '</h1>'
    + '<p style="color:#8B9AAF;font-size:14px;margin:0;">Analisi del ' + new Date().toLocaleDateString('it-IT') + '</p></div>'
    + '<div style="background:#1A2332;border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">'
    + '<div style="font-size:64px;color:' + sc + ';font-weight:700;">' + analysis.score + '</div>'
    + '<div style="font-size:12px;color:#8B9AAF;">/ 100</div>'
    + '<div style="font-size:18px;color:' + sc + ';font-weight:600;margin-top:8px;">' + analysis.emoji + ' ' + analysis.verdict + '</div></div>'
    + '<div style="background:#1A2332;border-radius:12px;padding:24px;margin-bottom:16px;">'
    + '<table style="width:100%;border-collapse:collapse;">'
    + '<tr><td style="padding:8px 0;color:#8B9AAF;font-size:13px;">Occupazione</td><td style="text-align:right;color:#E8E6E1;font-weight:600;">' + analysis.occupancy + '%</td></tr>'
    + '<tr><td style="padding:8px 0;color:#8B9AAF;font-size:13px;">ADR</td><td style="text-align:right;color:#E8E6E1;font-weight:600;">&euro;' + analysis.adr + '</td></tr>'
    + '<tr><td style="padding:8px 0;color:#8B9AAF;font-size:13px;">RevPAR</td><td style="text-align:right;color:#E8E6E1;font-weight:600;">&euro;' + (analysis.revpar ? analysis.revpar.toFixed(0) : '-') + '</td></tr>'
    + '<tr><td style="padding:8px 0;color:#8B9AAF;font-size:13px;">Costo Staff / Ricavi</td><td style="text-align:right;color:#E8E6E1;font-weight:600;">' + (analysis.staffCostRatio ? analysis.staffCostRatio.toFixed(1) : '-') + '%</td></tr>'
    + '<tr><td style="padding:8px 0;color:#8B9AAF;font-size:13px;">Camere per FTE</td><td style="text-align:right;color:#E8E6E1;font-weight:600;">' + (analysis.roomsPerFTE ? analysis.roomsPerFTE.toFixed(1) : '-') + '</td></tr>'
    + '</table></div>';

  if (analysis.reputation && analysis.reputation.found) {
    html += '<div style="background:#1A2332;border-radius:12px;padding:24px;margin-bottom:16px;">'
      + '<h3 style="color:#E8D5A8;font-size:16px;margin:0 0 12px;">&#11088; Reputazione Online</h3>'
      + '<table style="width:100%;border-collapse:collapse;">'
      + '<tr><td style="padding:8px 0;color:#8B9AAF;">Google Rating</td><td style="text-align:right;color:#E8E6E1;font-weight:600;">' + analysis.reputation.rating + '/5 (' + analysis.reputation.totalReviews + ' recensioni)</td></tr>'
      + '<tr><td style="padding:8px 0;color:#8B9AAF;">Reputation Score</td><td style="text-align:right;color:#C9A96E;font-weight:600;">' + analysis.reputation.reputationScore + '/100</td></tr>'
      + '</table></div>';
  }

  if (analysis.gopMargin) {
    html += '<div style="background:#1A2332;border-radius:12px;padding:24px;margin-bottom:16px;">'
      + '<h3 style="color:#E8D5A8;font-size:16px;margin:0 0 12px;">&#128200; Analisi USALI</h3>'
      + '<table style="width:100%;border-collapse:collapse;">'
      + '<tr><td style="padding:8px 0;color:#8B9AAF;">Rooms Dept. Margin</td><td style="text-align:right;color:#E8E6E1;font-weight:600;">' + analysis.roomsDeptMargin.toFixed(1) + '%</td></tr>'
      + '<tr><td style="padding:8px 0;color:#8B9AAF;">F&B Dept. Margin</td><td style="text-align:right;color:#E8E6E1;font-weight:600;">' + analysis.fbDeptMargin.toFixed(1) + '%</td></tr>'
      + '<tr><td style="padding:8px 0;color:#8B9AAF;">Food Cost</td><td style="text-align:right;color:#E8E6E1;font-weight:600;">' + analysis.foodCostPct.toFixed(1) + '%</td></tr>'
      + '<tr><td style="padding:8px 0;color:#8B9AAF;">GOP Margin</td><td style="text-align:right;color:#E8E6E1;font-weight:600;">' + analysis.gopMargin.toFixed(1) + '%</td></tr>'
      + '</table></div>';
  }

  html += '<div style="text-align:center;margin:32px 0;padding-top:24px;border-top:1px solid #2A3A4E;">'
    + '<p style="color:#5A6A7F;font-size:11px;">Analisi indicativa basata sui dati forniti e fonti pubbliche.</p></div>'
    + '</div></body></html>';

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Hotel Analysis <onboarding@resend.dev>',
      to: [email],
      subject: 'Analisi Performance - ' + hotelName + ' | Score: ' + analysis.score + '/100',
      html: html,
    }),
  });
}

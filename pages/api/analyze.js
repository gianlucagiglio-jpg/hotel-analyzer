export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.body;

  try {
    // 1. Fetch reputation from Google Places
    let reputation = null;
    if (process.env.GOOGLE_PLACES_KEY) {
      reputation = await fetchReputation(
        data.hotel_name,
        data.hotel_location
      );
    }

    // 2. Compute analysis
    const analysis = computeScore(data);
    analysis.reputation = reputation;

    // 3. Send email report
    if (process.env.RESEND_API_KEY) {
      await sendReport(data.email, data.hotel_name, analysis);
    }

    return res.status(200).json({ success: true, analysis });
  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ error: 'Analysis failed' });
  }
}

// ── GOOGLE PLACES ──
async function fetchReputation(name, location) {
  const key = process.env.GOOGLE_PLACES_KEY;
  const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(name + ' ' + location)}&inputtype=textquery&fields=place_id,name&key=${key}`;

  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();

  if (!searchData.candidates || !searchData.candidates.length) {
    return { found: false };
  }

  const placeId = searchData.candidates[0].place_id;
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews,website&language=it&key=${key}`;

  const detailsRes = await fetch(detailsUrl);
  const details = await detailsRes.json();
  const place = details.result;

  return {
    found: true,
    rating: place.rating || 0,
    totalReviews: place.user_ratings_total || 0,
    website: place.website || null,
    reputationScore: Math.min(100, Math.round(
      (place.rating / 5) * 60 +
      Math.min(40, (place.user_ratings_total / 500) * 40)
    )),
  };
}

// ── SCORING ──
function computeScore(data) {
  const occ = parseFloat(data.occupancy_rate) || 0;
  const adr = parseFloat(data.adr) || 0;
  const revpar = (occ / 100) * adr;
  const totalRooms = parseInt(data.total_rooms) || 1;
  const totalFTE = parseInt(data.total_fte) || 1;

  let score = 50;

  if (occ >= 75) score += 12;
  else if (occ >= 65) score += 6;
  else if (occ < 50) score -= 10;

  const starMap = {
    '3 Stelle': 90,
    '4 Stelle': 140,
    '4 Stelle Superior': 180,
    '5 Stelle': 250,
    '5 Stelle Lusso': 400
  };
  const expectedADR = starMap[data.star_rating] || 150;
  if (adr >= expectedADR * 1.2) score += 12;
  else if (adr >= expectedADR) score += 6;
  else if (adr < expectedADR * 0.7) score -= 10;

  let staffCostRatio = 0;
  if (data.total_revenue && data.total_staff_cost) {
    staffCostRatio = (parseFloat(data.total_staff_cost) / parseFloat(data.total_revenue)) * 100;
    if (staffCostRatio <= 30) score += 10;
    else if (staffCostRatio <= 38) score += 4;
    else if (staffCostRatio > 45) score -= 10;
  }

  // Full mode costs
  if (data.rooms_revenue) {
    const roomsRev = parseFloat(data.rooms_revenue) || 0;
    const fbRev = parseFloat(data.fb_revenue) || 0;
    const totalRevenue = roomsRev + fbRev + (parseFloat(data.spa_revenue) || 0) + (parseFloat(data.other_revenue) || 0);
    const roomsStaff = parseFloat(data.rooms_staff_cost) || 0;
    const fbStaff = parseFloat(data.fb_staff_cost) || 0;
    const adminStaff = parseFloat(data.admin_staff_cost) || 0;
    const totalStaffCost = roomsStaff + fbStaff + adminStaff;
    staffCostRatio = totalRevenue > 0 ? (totalStaffCost / totalRevenue) * 100 : 0;
  }

  const roomsPerFTE = totalRooms / totalFTE;
  if (roomsPerFTE >= 2) score += 5;
  else if (roomsPerFTE < 1) score -= 5;

  // Full mode extras
  let directPct = 0;
  let otaPct = 0;
  let gopMargin = 0;
  let foodCostPct = 0;
  let roomsDeptMargin = 0;
  let fbDeptMargin = 0;
  let gop = 0;
  let totalRevenue = parseFloat(data.total_revenue) || 0;

  if (data.rooms_revenue) {
    const roomsRev = parseFloat(data.rooms_revenue) || 0;
    const fbRev = parseFloat(data.fb_revenue) || 0;
    const spaRev = parseFloat(data.spa_revenue) || 0;
    const otherRev = parseFloat(data.other_revenue) || 0;
    totalRevenue = roomsRev + fbRev + spaRev + otherRev;

    const roomsStaff = parseFloat(data.rooms_staff_cost) || 0;
    const fbStaff = parseFloat(data.fb_staff_cost) || 0;
    const fbCOGS = parseFloat(data.fb_cost_of_goods) || 0;
    const otaComm = parseFloat(data.ota_commissions) || 0;
    const adminStaff = parseFloat(data.admin_staff_cost) || 0;
    const energyCost = parseFloat(data.energy_cost) || 0;
    const maintenanceCost = parseFloat(data.maintenance_cost) || 0;
    const salesCost = parseFloat(data.sales_marketing_cost) || 0;

    const totalStaffCost = roomsStaff + fbStaff + adminStaff;
    const totalCosts = totalStaffCost + fbCOGS + otaComm + energyCost + maintenanceCost + salesCost;

    directPct = parseFloat(data.direct_booking_pct) || 0;
    otaPct = parseFloat(data.ota_booking_pct) || 0;
    foodCostPct = fbRev > 0 ? (fbCOGS / fbRev) * 100 : 0;
    roomsDeptMargin = roomsRev > 0 ? ((roomsRev - roomsStaff - otaComm) / roomsRev) * 100 : 0;
    fbDeptMargin = fbRev > 0 ? ((fbRev - fbStaff - fbCOGS) / fbRev) * 100 : 0;
    gop = totalRevenue - totalCosts;
    gopMargin = totalRevenue > 0 ? (gop / totalRevenue) * 100 : 0;

    if (directPct >= 35) score += 8;
    else if (directPct >= 20) score += 3;
    else if (directPct < 10) score -= 5;

    if (gopMargin >= 35) score += 10;
    else if (gopMargin >= 25) score += 5;
    else if (gopMargin < 15) score -= 8;

    if (foodCostPct > 0 && foodCostPct <= 30) score += 5;
    else if (foodCostPct > 40) score -= 5;

    if (roomsDeptMargin >= 70) score += 5;
    else if (roomsDeptMargin < 50) score -= 5;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let verdict, verdictColor, emoji;
  if (score >= 75) { verdict = 'Eccellente'; verdictColor = '#4CAF50'; emoji = '🏆'; }
  else if (score >= 55) { verdict = 'Buono, con margini di miglioramento'; verdictColor = '#C9A96E'; emoji = '📊'; }
  else if (score >= 35) { verdict = 'Attenzione: aree critiche'; verdictColor = '#FF9800'; emoji = '⚠️'; }
  else { verdict = 'Situazione critica'; verdictColor = '#E74C3C'; emoji = '🚨'; }

  return {
    score, verdict, verdictColor, emoji,
    occupancy: occ,
    adr: adr,
    revpar: revpar,
    staffCostRatio: staffCostRatio,
    roomsPerFTE: roomsPerFTE,
    costPerFTE: data.total_staff_cost ? parseFloat(data.total_staff_cost) / totalFTE : 0,
    revenuePerRoom: totalRevenue / totalRooms,
    totalRevenue: totalRevenue,
    directPct: directPct,
    otaPct: otaPct,
    foodCostPct: foodCostPct,
    roomsDeptMargin: roomsDeptMargin,
    fbDeptMargin: fbDeptMargin,
    gop: gop,
    gopMargin: gopMargin,
  };
}

// ── EMAIL ──
async function sendReport(email, hotelName, analysis) {
  const sc = analysis.score >= 75 ? '#4CAF50' : analysis.score >= 55 ? '#C9A96E' : analysis.score >= 35 ? '#FF9800' : '#E74C3C';

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0F1419;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
<div style="text-align:center;margin-bottom:32px;">
<p style="color:#C9A96E;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;">HOTEL PERFORMANCE REPORT</p>
<h1 style="color:#E8E6E1;font-size:28px;margin:0 0 4px;">${hotelName}</h1>
<p style="color:#8B9AAF;font-size:14px;margin:0;">Analisi del ${new Date().toLocaleDateString('it-IT')}</p>
</div>
<div style="background:#1A2332;border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
<div style="font-size:64px;color:${sc};font-weight:700;">${analysis.score}</div>
<div style="font-size:12px;color:#8B9AAF;">/ 100</div>
<div style="font-size:18px;color:${sc};font-weight:600;margin-top:8px;">${analysis.emoji} ${analysis.verdict}</div>
</div>
<div style="background:#1A2332;border-radius:12px;padding:24px;margin-bottom:16px;">
<table style="width:100%;border-collapse:collapse;">
<tr><td style="padding:8px 0;color:#8B9AAF;font-size:13px;">Occupazione</td><td style="text-align:right;color:#E8E6E1;font-weight:600;">${analysis.occupancy}%</td></tr>
<tr><td style="padding:8px 0;color:#8B9AAF;font-size:13px;">ADR</td><td style="text-align:right;color:#E8E6E1;font-weight:600;">&euro;${analysis.adr}</td></tr>
<tr><td style="padding:8px 0;color:#8B9AAF;font-size:13px;">RevPAR</td><td style="text-align:right;color:#E8E6E1;font-weight:600;">&euro;${analysis.revpar ? analysis.revpar.toFixed(0) : '-'}</td></tr>
<tr><td style="padding:8px 0;color:#8B9AAF;font-size:13px;">Costo Staff / Ricavi</td><td style="text-align:right;color:#E8E6E1;font-weight:600;">${analysis.staffCostRatio ? analysis.staffCostRatio.toFixed(1) : '-'}%</td></tr>
<tr><td style="padding:8px 0;color:#8B9AAF;font-size:13px;">Camere per FTE</td><td style="text-align:right;color:#E8E6E1;font-weight:600;">${analysis.roomsPerFTE ? analysis.roomsPerFTE.toFixed(1) : '-'}</td></tr>
</table>
</div>
${analysis.reputation && analysis.reputation.found ? `<div style="background:#1A2332;border-radius:12px;padding:24px;margin-bottom:16px;">
<h3 style="color:#E8D5A8;font-size:16px;margin:0 0 12px;">&#11088; Reputazione Online</h3>
<table style="width:100%;border-collapse:collapse;">
<tr><td style="padding:8px 0;color:#8B9AAF;">Google Rating</td><td style="text-align:right;color:#E8E6E1;font-weight:600;">${analysis.reputation.rating}/5 (${analysis.reputation.totalReviews} recensioni)</td></tr>
<tr><td style="padding:8px 0;color:#8B9AAF;">Reputation Score</td><td style="text-align:right;color:#C9A96E;font-weight:600;">${analysis.reputation.reputationScore}/100</td></tr>
</table></div>` : ''}
${analysis.gopMargin ? `<div style="background:#1A2332;border-radius:12px;padding:24px;margin-bottom:16px;">
<h3 style="color:#E8D5A8;font-size:16px;margin:0 0 12px;">&#128200; USALI Analysis</h3>
<table style="width:100%;border-collapse:collapse;">
<tr><td style="padding:8px 0;color:#8B9AAF;">Rooms Dept. Margin</td><td style="text-align:right;color:#E8E6E1;font-weight:600;">${analysis.roomsDeptMargin.toFixed(1)}%</td></tr>
<tr><td style="padding:8px 0;color:#8B9AAF;">F&B Dept. Margin</td><td style="text-align:right;color:#E8E6E1;font-weight:600;">${analysis.fbDeptMargin.toFixed(1)}%</td></tr>
<tr><td style="padding:8px 0;color:#8B9AAF;">Food Cost</td><td style="text-align:right;color:#E8E6E1;font-weight:600;">${analysis.foodCostPct.toFixed(1)}%</td></tr>
<tr><td style="padding:8px 0;color:#8B9AAF;">GOP Margin</td><td style="text-align:right;color:#E8E6E1;font-weight:600;">${analysis.gopMargin.toFixed(1)}%</td></tr>
<tr><td style="padding:8px 0;color:#8B9AAF;">Prenotazioni Dirette</td><td style="text-align:right;color:#E8E6E1;font-weight:600;">${analysis.directPct}%</td></tr>
</table></div>` : ''}
<div style="text-align:center;margin:32px 0;padding-top:24px;border-top:1px solid #2A3A4E;">
<p style="color:#5A6A7F;font-size:11px;">Analisi indicativa basata sui dati forniti e fonti pubbliche.</p>
</div>
</div></body></html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Hotel Analysis <onboarding@resend.dev>',
      to: [email],
      subject: 'Analisi Performance - ' + hotelName + ' | Score: ' + analysis.score + '/100',
      html: html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error('Email error: ' + err);
  }
}

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ADMIN_EMAIL = 'gianluca.giglio@nativohotels.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.body;

  try {
    var reputation = null;
    if (process.env.GOOGLE_PLACES_KEY && data.google_place_id) {
      reputation = await fetchPlaceDetails(data.google_place_id);
    } else if (process.env.GOOGLE_PLACES_KEY && data.hotel_name) {
      reputation = await fetchReputation(data.hotel_name, data.hotel_location);
    }

    var analysis = computeScore(data);
    analysis.reputation = reputation;

    var reportData = {
      status: 'pending_review',
      email: data.email,
      phone: data.phone || null,
      role: data.role || null,
      hotel_name: data.hotel_name,
      hotel_location: data.hotel_location || null,
      hotel_website: data.hotel_website || null,
      star_rating: data.star_rating || null,
      total_rooms: parseInt(data.total_rooms) || null,
      property_type: data.property_type || null,
      google_place_id: data.google_place_id || null,
      google_rating: reputation ? reputation.rating : null,
      google_total_reviews: reputation ? reputation.totalReviews : null,
      google_reputation_score: reputation ? reputation.reputationScore : null,
      analysis_mode: data.mode || 'quick',
      form_data: data,
      analysis_results: analysis,
    };

    var dbResult = await supabase.from('reports').insert(reportData).select().single();

    if (dbResult.error) {
      console.error('DB Error:', dbResult.error);
    }

    if (process.env.RESEND_API_KEY) {
      var reportId = dbResult.data ? dbResult.data.id : 'unknown';
      await sendAdminNotification(data.hotel_name, data.email, analysis, reportId);
    }

    return res.status(200).json({ success: true, analysis: analysis });
  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ error: 'Analysis failed' });
  }
}

async function fetchPlaceDetails(placeId) {
  var key = process.env.GOOGLE_PLACES_KEY;
  var detailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json?place_id=' + placeId + '&fields=name,rating,user_ratings_total,reviews,website,url&language=it&key=' + key;
  var detailsRes = await fetch(detailsUrl);
  var details = await detailsRes.json();
  var place = details.result;
  if (!place) return { found: false };
  return {
    found: true,
    rating: place.rating || 0,
    totalReviews: place.user_ratings_total || 0,
    website: place.website || null,
    googleUrl: place.url || null,
    reputationScore: Math.min(100, Math.round((place.rating / 5) * 60 + Math.min(40, (place.user_ratings_total / 500) * 40))),
  };
}

async function fetchReputation(name, location) {
  var key = process.env.GOOGLE_PLACES_KEY;
  var searchUrl = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=' + encodeURIComponent(name + ' ' + (location || '')) + '&inputtype=textquery&fields=place_id,name&key=' + key;
  var searchRes = await fetch(searchUrl);
  var searchData = await searchRes.json();
  if (!searchData.candidates || !searchData.candidates.length) return { found: false };
  return await fetchPlaceDetails(searchData.candidates[0].place_id);
}

function computeScore(data) {
  var occ = parseFloat(data.occupancy_rate) || 0;
  var adr = parseFloat(data.adr) || 0;
  var revpar = (occ / 100) * adr;
  var totalRooms = parseInt(data.total_rooms) || 1;
  var totalFTE = parseInt(data.total_fte) || 1;
  var score = 50;

  if (occ >= 75) score += 12;
  else if (occ >= 65) score += 6;
  else if (occ < 50) score -= 10;

  var starMap = { '3 Stelle': 90, '4 Stelle': 140, '4 Stelle Superior': 180, '5 Stelle': 250, '5 Stelle Lusso': 400 };
  var expectedADR = starMap[data.star_rating] || 150;
  if (adr >= expectedADR * 1.2) score += 12;
  else if (adr >= expectedADR) score += 6;
  else if (adr < expectedADR * 0.7) score -= 10;

  var staffCostRatio = 0;
  if (data.total_revenue && data.total_staff_cost) {
    staffCostRatio = (parseFloat(data.total_staff_cost) / parseFloat(data.total_revenue)) * 100;
    if (staffCostRatio <= 30) score += 10;
    else if (staffCostRatio <= 38) score += 4;
    else if (staffCostRatio > 45) score -= 10;
  }

  var roomsPerFTE = totalRooms / totalFTE;
  if (roomsPerFTE >= 2) score += 5;
  else if (roomsPerFTE < 1) score -= 5;

  var directPct = 0, otaPct = 0, gopMargin = 0, foodCostPct = 0;
  var roomsDeptMargin = 0, fbDeptMargin = 0, gop = 0;
  var totalRevenue = parseFloat(data.total_revenue) || 0;

  if (data.rooms_revenue) {
    var roomsRev = parseFloat(data.rooms_revenue) || 0;
    var fbRev = parseFloat(data.fb_revenue) || 0;
    totalRevenue = roomsRev + fbRev + (parseFloat(data.spa_revenue) || 0) + (parseFloat(data.other_revenue) || 0);
    var roomsStaff = parseFloat(data.rooms_staff_cost) || 0;
    var fbStaff = parseFloat(data.fb_staff_cost) || 0;
    var fbCOGS = parseFloat(data.fb_cost_of_goods) || 0;
    var otaComm = parseFloat(data.ota_commissions) || 0;
    var adminStaff = parseFloat(data.admin_staff_cost) || 0;
    var energyCost = parseFloat(data.energy_cost) || 0;
    var maintenanceCost = parseFloat(data.maintenance_cost) || 0;
    var salesCost = parseFloat(data.sales_marketing_cost) || 0;
    var totalStaffCost = roomsStaff + fbStaff + adminStaff;
    var totalCosts = totalStaffCost + fbCOGS + otaComm + energyCost + maintenanceCost + salesCost;
    staffCostRatio = totalRevenue > 0 ? (totalStaffCost / totalRevenue) * 100 : 0;
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
  var verdict, verdictColor, emoji;
  if (score >= 75) { verdict = 'Eccellente'; verdictColor = '#4CAF50'; emoji = '\u{1F3C6}'; }
  else if (score >= 55) { verdict = 'Buono, con margini di miglioramento'; verdictColor = '#C9A96E'; emoji = '\u{1F4CA}'; }
  else if (score >= 35) { verdict = 'Attenzione: aree critiche'; verdictColor = '#FF9800'; emoji = '\u26A0\uFE0F'; }
  else { verdict = 'Situazione critica'; verdictColor = '#E74C3C'; emoji = '\u{1F6A8}'; }

  return {
    score: score, verdict: verdict, verdictColor: verdictColor, emoji: emoji,
    occupancy: occ, adr: adr, revpar: revpar, staffCostRatio: staffCostRatio,
    roomsPerFTE: roomsPerFTE, costPerFTE: data.total_staff_cost ? parseFloat(data.total_staff_cost) / totalFTE : 0,
    revenuePerRoom: totalRevenue / totalRooms, totalRevenue: totalRevenue,
    directPct: directPct, otaPct: otaPct, foodCostPct: foodCostPct,
    roomsDeptMargin: roomsDeptMargin, fbDeptMargin: fbDeptMargin, gop: gop, gopMargin: gopMargin,
  };
}

async function sendAdminNotification(hotelName, clientEmail, analysis, reportId) {
  var sc = analysis.score >= 75 ? '#4CAF50' : analysis.score >= 55 ? '#C9A96E' : analysis.score >= 35 ? '#FF9800' : '#E74C3C';
  var baseUrl = process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000';
  var dashboardUrl = baseUrl + '/admin';

  var html = '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0F1419;font-family:Arial,sans-serif;">'
    + '<div style="max-width:600px;margin:0 auto;padding:40px 24px;">'
    + '<p style="color:#C9A96E;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;">NUOVO REPORT DA APPROVARE</p>'
    + '<h1 style="color:#E8E6E1;font-size:24px;margin:0 0 4px;">' + hotelName + '</h1>'
    + '<p style="color:#8B9AAF;font-size:14px;margin:0 0 24px;">Cliente: ' + clientEmail + '</p>'
    + '<div style="background:#1A2332;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">'
    + '<div style="font-size:48px;color:' + sc + ';font-weight:700;">' + analysis.score + '</div>'
    + '<div style="font-size:12px;color:#8B9AAF;">/ 100</div>'
    + '<div style="font-size:16px;color:' + sc + ';font-weight:600;margin-top:8px;">' + analysis.emoji + ' ' + analysis.verdict + '</div></div>'
    + '<div style="background:#1A2332;border-radius:12px;padding:20px;margin-bottom:24px;">'
    + '<table style="width:100%;border-collapse:collapse;">'
    + '<tr><td style="padding:6px 0;color:#8B9AAF;font-size:13px;">Occupazione</td><td style="text-align:right;color:#E8E6E1;font-weight:600;">' + analysis.occupancy + '%</td></tr>'
    + '<tr><td style="padding:6px 0;color:#8B9AAF;font-size:13px;">ADR</td><td style="text-align:right;color:#E8E6E1;font-weight:600;">&euro;' + analysis.adr + '</td></tr>'
    + '<tr><td style="padding:6px 0;color:#8B9AAF;font-size:13px;">RevPAR</td><td style="text-align:right;color:#E8E6E1;font-weight:600;">&euro;' + (analysis.revpar ? analysis.revpar.toFixed(0) : '-') + '</td></tr></table></div>'
    + '<div style="text-align:center;margin:32px 0;">'
    + '<a href="' + dashboardUrl + '" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#C9A96E,#8B7340);color:#0F1419;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">Apri Dashboard</a></div>'
    + '<p style="color:#5A6A7F;font-size:11px;text-align:center;">Report ID: ' + reportId + '</p>'
    + '</div></body></html>';

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Hotel Analyzer <onboarding@resend.dev>',
      to: [ADMIN_EMAIL],
      subject: 'Nuovo Report: ' + hotelName + ' | Score: ' + analysis.score + '/100',
      html: html,
    }),
  });
}

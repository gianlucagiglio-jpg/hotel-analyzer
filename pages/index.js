import { useState, useEffect } from 'react';
import Head from 'next/head';

const COLORS = {
  bg: "#0F1419",
  card: "#1A2332",
  accent: "#C9A96E",
  accentLight: "#E8D5A8",
  accentDark: "#8B7340",
  text: "#E8E6E1",
  textMuted: "#8B9AAF",
  textDim: "#5A6A7F",
  success: "#4CAF50",
  warning: "#FF9800",
  danger: "#E74C3C",
  border: "#2A3A4E",
  inputBg: "#141D28",
};

const QUICK_QUESTIONS = [
  { id: "hotel_name", label: "Nome dell'hotel", type: "text", placeholder: "Es. Grand Hotel Roma", section: "info", required: true },
  { id: "hotel_location", label: "Città / Località", type: "text", placeholder: "Es. Roma, Milano, Firenze...", section: "info", required: true },
  { id: "star_rating", label: "Classificazione", type: "select", options: ["3 Stelle", "4 Stelle", "4 Stelle Superior", "5 Stelle", "5 Stelle Lusso"], section: "info", required: true },
  { id: "total_rooms", label: "Numero di camere", type: "number", placeholder: "Es. 120", section: "info", required: true },
  { id: "occupancy_rate", label: "Tasso di occupazione medio (%)", type: "number", placeholder: "Es. 72", suffix: "%", section: "performance", required: true },
  { id: "adr", label: "ADR - Tariffa media giornaliera (€)", type: "number", placeholder: "Es. 185", suffix: "€", section: "performance", required: true },
  { id: "total_revenue", label: "Ricavo totale annuo (€)", type: "number", placeholder: "Es. 5000000", suffix: "€", section: "performance", required: true },
  { id: "total_staff_cost", label: "Costo totale del personale (€)", type: "number", placeholder: "Es. 1800000", suffix: "€", section: "costs", required: true },
  { id: "total_fte", label: "Numero di dipendenti (FTE)", type: "number", placeholder: "Es. 85", section: "costs", required: true },
  { id: "email", label: "La tua email per ricevere il report", type: "email", placeholder: "nome@hotel.it", section: "contact", required: true },
];

const FULL_QUESTIONS = [
  { id: "hotel_name", label: "Nome dell'hotel", type: "text", placeholder: "Es. Grand Hotel Roma", section: "info", sectionTitle: "Informazioni Generali", required: true },
  { id: "hotel_location", label: "Città / Località", type: "text", placeholder: "Es. Roma Centro Storico", section: "info", required: true },
  { id: "hotel_website", label: "Sito web dell'hotel", type: "text", placeholder: "Es. www.grandhotelroma.it", section: "info" },
  { id: "star_rating", label: "Classificazione", type: "select", options: ["3 Stelle", "4 Stelle", "4 Stelle Superior", "5 Stelle", "5 Stelle Lusso"], section: "info", required: true },
  { id: "total_rooms", label: "Numero totale di camere", type: "number", placeholder: "120", section: "info", required: true },
  { id: "property_type", label: "Tipologia", type: "select", options: ["Hotel urbano", "Resort", "Boutique Hotel", "Business Hotel", "Hotel stagionale"], section: "info" },
  { id: "opening_months", label: "Mesi di apertura all'anno", type: "number", placeholder: "12", section: "info" },
  { id: "rooms_revenue", label: "Ricavi Camere (€)", type: "number", placeholder: "3.500.000", suffix: "€", section: "revenue", sectionTitle: "Flussi di Ricavo (USALI)", required: true },
  { id: "fb_revenue", label: "Ricavi F&B - Ristorazione (€)", type: "number", placeholder: "1.200.000", suffix: "€", section: "revenue", required: true },
  { id: "spa_revenue", label: "Ricavi Spa / Wellness (€)", type: "number", placeholder: "150.000", suffix: "€", section: "revenue" },
  { id: "other_revenue", label: "Altri ricavi operativi (€)", type: "number", placeholder: "80.000", suffix: "€", section: "revenue", hint: "Parcheggio, lavanderia, minibar, eventi..." },
  { id: "direct_booking_pct", label: "Prenotazioni dirette (%)", type: "number", placeholder: "25", suffix: "%", section: "market", sectionTitle: "Market Mix & Distribuzione", required: true },
  { id: "ota_booking_pct", label: "OTA - Booking, Expedia, etc. (%)", type: "number", placeholder: "45", suffix: "%", section: "market", required: true },
  { id: "tour_operator_pct", label: "Tour Operator / Gruppi (%)", type: "number", placeholder: "15", suffix: "%", section: "market" },
  { id: "corporate_pct", label: "Corporate / Aziende (%)", type: "number", placeholder: "15", suffix: "%", section: "market" },
  { id: "occupancy_rate", label: "Tasso di occupazione medio (%)", type: "number", placeholder: "72", suffix: "%", section: "kpi", sectionTitle: "Indicatori di Performance (KPI)", required: true },
  { id: "adr", label: "ADR - Tariffa media giornaliera (€)", type: "number", placeholder: "185", suffix: "€", section: "kpi", required: true },
  { id: "revpar", label: "RevPAR (€) - lascia vuoto per calcolo automatico", type: "number", placeholder: "Calcolato automaticamente", suffix: "€", section: "kpi" },
  { id: "rooms_staff_cost", label: "Costo personale Rooms Division (€)", type: "number", placeholder: "600.000", suffix: "€", section: "costs", sectionTitle: "Costi Operativi (USALI)", required: true },
  { id: "fb_staff_cost", label: "Costo personale F&B (€)", type: "number", placeholder: "500.000", suffix: "€", section: "costs", required: true },
  { id: "fb_cost_of_goods", label: "Costo del venduto F&B - Food Cost (€)", type: "number", placeholder: "400.000", suffix: "€", section: "costs", required: true },
  { id: "admin_staff_cost", label: "Costo personale Amministrazione (€)", type: "number", placeholder: "250.000", suffix: "€", section: "costs" },
  { id: "sales_marketing_cost", label: "Costi Sales & Marketing (€)", type: "number", placeholder: "180.000", suffix: "€", section: "costs" },
  { id: "energy_cost", label: "Costi Energia / Utilities (€)", type: "number", placeholder: "200.000", suffix: "€", section: "costs" },
  { id: "maintenance_cost", label: "Costi Manutenzione (€)", type: "number", placeholder: "120.000", suffix: "€", section: "costs" },
  { id: "ota_commissions", label: "Commissioni OTA (€)", type: "number", placeholder: "250.000", suffix: "€", section: "costs" },
  { id: "total_fte", label: "Numero totale dipendenti (FTE)", type: "number", placeholder: "85", section: "costs", required: true },
  { id: "rooms_fte", label: "FTE Rooms Division", type: "number", placeholder: "25", section: "costs" },
  { id: "fb_fte", label: "FTE F&B", type: "number", placeholder: "35", section: "costs" },
  { id: "email", label: "La tua email per ricevere l'analisi completa", type: "email", placeholder: "nome@hotel.it", section: "contact", sectionTitle: "Contatto", required: true },
  { id: "phone", label: "Telefono (opzionale)", type: "text", placeholder: "+39 06 1234567", section: "contact" },
  { id: "role", label: "Il tuo ruolo", type: "select", options: ["General Manager", "Revenue Manager", "Proprietario", "Direttore", "Altro"], section: "contact" },
];

function computeAnalysis(data, mode) {
  const results = {};
  const occ = parseFloat(data.occupancy_rate) || 0;
  const adr = parseFloat(data.adr) || 0;
  const revpar = occ > 0 && adr > 0 ? (occ / 100) * adr : parseFloat(data.revpar) || 0;
  const totalRooms = parseInt(data.total_rooms) || 1;
  const totalFTE = parseInt(data.total_fte) || 1;
  results.revpar = revpar;
  results.occupancy = occ;
  results.adr = adr;
  results.roomsPerFTE = totalRooms / totalFTE;

  if (mode === "quick") {
    const totalRevenue = parseFloat(data.total_revenue) || 0;
    const totalStaffCost = parseFloat(data.total_staff_cost) || 0;
    results.staffCostRatio = totalRevenue > 0 ? (totalStaffCost / totalRevenue) * 100 : 0;
    results.revenuePerRoom = totalRevenue / totalRooms;
    results.costPerFTE = totalStaffCost / totalFTE;
  } else {
    const roomsRev = parseFloat(data.rooms_revenue) || 0;
    const fbRev = parseFloat(data.fb_revenue) || 0;
    const spaRev = parseFloat(data.spa_revenue) || 0;
    const otherRev = parseFloat(data.other_revenue) || 0;
    const totalRevenue = roomsRev + fbRev + spaRev + otherRev;
    results.totalRevenue = totalRevenue;
    results.roomsRevShare = totalRevenue > 0 ? (roomsRev / totalRevenue) * 100 : 0;
    results.fbRevShare = totalRevenue > 0 ? (fbRev / totalRevenue) * 100 : 0;
    const roomsStaff = parseFloat(data.rooms_staff_cost) || 0;
    const fbStaff = parseFloat(data.fb_staff_cost) || 0;
    const fbCOGS = parseFloat(data.fb_cost_of_goods) || 0;
    const otaComm = parseFloat(data.ota_commissions) || 0;
    results.roomsDeptProfit = roomsRev - roomsStaff - otaComm;
    results.roomsDeptMargin = roomsRev > 0 ? ((results.roomsDeptProfit / roomsRev) * 100) : 0;
    results.fbDeptProfit = fbRev - fbStaff - fbCOGS;
    results.fbDeptMargin = fbRev > 0 ? ((results.fbDeptProfit / fbRev) * 100) : 0;
    results.foodCostPct = fbRev > 0 ? (fbCOGS / fbRev) * 100 : 0;
    results.directPct = parseFloat(data.direct_booking_pct) || 0;
    results.otaPct = parseFloat(data.ota_booking_pct) || 0;
    const totalStaffCost = roomsStaff + fbStaff + (parseFloat(data.admin_staff_cost) || 0);
    results.staffCostRatio = totalRevenue > 0 ? (totalStaffCost / totalRevenue) * 100 : 0;
    results.revenuePerRoom = totalRevenue / totalRooms;
    results.costPerFTE = totalStaffCost / totalFTE;
    const energyCost = parseFloat(data.energy_cost) || 0;
    const maintenanceCost = parseFloat(data.maintenance_cost) || 0;
    const salesCost = parseFloat(data.sales_marketing_cost) || 0;
    const totalCosts = totalStaffCost + fbCOGS + otaComm + energyCost + maintenanceCost + salesCost;
    results.gop = totalRevenue - totalCosts;
    results.gopMargin = totalRevenue > 0 ? (results.gop / totalRevenue) * 100 : 0;
  }

  let score = 50;
  if (occ >= 75) score += 12; else if (occ >= 65) score += 6; else if (occ < 50) score -= 10;
  const starMap = { "3 Stelle": 90, "4 Stelle": 140, "4 Stelle Superior": 180, "5 Stelle": 250, "5 Stelle Lusso": 400 };
  const expectedADR = starMap[data.star_rating] || 150;
  if (adr >= expectedADR * 1.2) score += 12; else if (adr >= expectedADR) score += 6; else if (adr < expectedADR * 0.7) score -= 10;
  const scr = results.staffCostRatio;
  if (scr > 0 && scr <= 30) score += 10; else if (scr <= 38) score += 4; else if (scr > 45) score -= 10;
  if (results.roomsPerFTE >= 2) score += 5; else if (results.roomsPerFTE < 1) score -= 5;

  if (mode === "full") {
    if (results.directPct >= 35) score += 8; else if (results.directPct >= 20) score += 3; else if (results.directPct < 10) score -= 5;
    if (results.gopMargin >= 35) score += 10; else if (results.gopMargin >= 25) score += 5; else if (results.gopMargin < 15) score -= 8;
    if (results.foodCostPct > 0 && results.foodCostPct <= 30) score += 5; else if (results.foodCostPct > 40) score -= 5;
    if (results.roomsDeptMargin >= 70) score += 5; else if (results.roomsDeptMargin < 50) score -= 5;
  }

  results.score = Math.max(0, Math.min(100, Math.round(score)));
  if (results.score >= 75) { results.verdict = "Eccellente"; results.verdictColor = COLORS.success; results.emoji = "🏆"; }
  else if (results.score >= 55) { results.verdict = "Buono, con margini di miglioramento"; results.verdictColor = COLORS.accent; results.emoji = "📊"; }
  else if (results.score >= 35) { results.verdict = "Attenzione: aree critiche da affrontare"; results.verdictColor = COLORS.warning; results.emoji = "⚠️"; }
  else { results.verdict = "Situazione critica: intervento urgente"; results.verdictColor = COLORS.danger; results.emoji = "🚨"; }
  return results;
}

function GaugeChart({ value, size = 180 }) {
  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  let color = COLORS.danger;
  if (value >= 75) color = COLORS.success; else if (value >= 55) color = COLORS.accent; else if (value >= 35) color = COLORS.warning;
  return (
    <svg width={size} height={size / 2 + 30} viewBox={`0 0 ${size} ${size / 2 + 30}`}>
      <path d={`M 10 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 10}`} fill="none" stroke={COLORS.border} strokeWidth="12" strokeLinecap="round" />
      <path d={`M 10 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 10}`} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 1.5s ease-out" }} />
      <text x={size / 2} y={size / 2} textAnchor="middle" fill={color} style={{ fontSize: "36px", fontWeight: 700 }}>{value}</text>
      <text x={size / 2} y={size / 2 + 22} textAnchor="middle" fill={COLORS.textMuted} style={{ fontSize: "12px" }}>/ 100</text>
    </svg>
  );
}

function MetricCard({ label, value, suffix, benchmark, status }) {
  const statusColors = { good: COLORS.success, average: COLORS.accent, warning: COLORS.warning, bad: COLORS.danger };
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "6px", borderLeft: `3px solid ${statusColors[status] || COLORS.border}` }}>
      <span style={{ fontSize: "11px", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
      <span style={{ fontSize: "24px", fontWeight: 700, color: COLORS.text }}>{value}{suffix && <span style={{ fontSize: "14px", color: COLORS.textMuted, marginLeft: "2px" }}>{suffix}</span>}</span>
      {benchmark && <span style={{ fontSize: "11px", color: COLORS.textDim }}>Benchmark: {benchmark}</span>}
    </div>
  );
}

function ProgressBar({ label, value, color }) {
  const pct = Math.min(value, 100);
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "12px", color: COLORS.textMuted }}>{label}</span>
        <span style={{ fontSize: "12px", color: COLORS.text, fontFamily: "monospace" }}>{value.toFixed(1)}%</span>
      </div>
      <div style={{ height: "6px", background: COLORS.inputBg, borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color || COLORS.accent, borderRadius: "3px", transition: "width 1s ease-out" }} />
      </div>
    </div>
  );
}

export default function Home() {
  const [mode, setMode] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [animateIn, setAnimateIn] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchStep, setSearchStep] = useState(0);
  const [error, setError] = useState(null);

  const questions = mode === "quick" ? QUICK_QUESTIONS : FULL_QUESTIONS;
  const sections = [];
  const sectionMap = {};
  questions.forEach((q) => {
    if (!sectionMap[q.section]) { sectionMap[q.section] = []; sections.push({ key: q.section, title: q.sectionTitle || q.section, questions: sectionMap[q.section] }); }
    sectionMap[q.section].push(q);
  });

  const currentSection = sections[currentStep];
  const isLastStep = currentStep === sections.length - 1;

  const searchSteps = [
    "Analisi reputazione online...",
    "Verifica prezzi medi di mercato...",
    "Controllo parity rate sui canali...",
    "Raccolta recensioni e punteggi...",
    "Confronto benchmark di settore...",
    "Preparazione report personalizzato...",
  ];

  useEffect(() => {
    if (searching && searchStep < searchSteps.length) {
      const timer = setTimeout(() => setSearchStep((s) => s + 1), 1800);
      return () => clearTimeout(timer);
    }
  }, [searching, searchStep]);

  const handleChange = (id, value) => setFormData((prev) => ({ ...prev, [id]: value }));

  const canProceed = () => {
    if (!currentSection) return false;
    return currentSection.questions.filter((q) => q.required).every((q) => formData[q.id] && String(formData[q.id]).trim() !== "");
  };

  const handleSubmit = async () => {
    setSearching(true);
    setSearchStep(0);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, mode }),
      });

      const data = await response.json();

      // Wait for animation to finish
      const waitForAnimation = () => new Promise((resolve) => {
        const check = () => {
          if (searchStep >= searchSteps.length - 1) resolve();
          else setTimeout(check, 500);
        };
        setTimeout(check, searchSteps.length * 1800);
      });

      await waitForAnimation();

      if (data.success) {
        setAnalysis(data.analysis);
        setSubmitted(true);
      } else {
        // Fallback: compute locally
        const localAnalysis = computeAnalysis(formData, mode);
        setAnalysis(localAnalysis);
        setSubmitted(true);
      }
    } catch (err) {
      console.error(err);
      // Fallback: compute locally even if API fails
      const waitMs = Math.max(0, searchSteps.length * 1800 - 2000);
      await new Promise(r => setTimeout(r, waitMs));
      const localAnalysis = computeAnalysis(formData, mode);
      setAnalysis(localAnalysis);
      setSubmitted(true);
    }

    setSearching(false);
  };

  const handleNext = () => {
    if (isLastStep) {
      handleSubmit();
    } else {
      setAnimateIn(false);
      setTimeout(() => { setCurrentStep((s) => s + 1); setAnimateIn(true); }, 200);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setAnimateIn(false);
      setTimeout(() => { setCurrentStep((s) => s - 1); setAnimateIn(true); }, 200);
    }
  };

  const reset = () => {
    setMode(null); setCurrentStep(0); setFormData({}); setSubmitted(false);
    setAnalysis(null); setSearching(false); setSearchStep(0); setError(null);
  };

  const inputStyle = {
    width: "100%", padding: "14px 16px", background: COLORS.inputBg,
    border: `1px solid ${COLORS.border}`, borderRadius: "10px", color: COLORS.text,
    fontSize: "15px", outline: "none", transition: "border-color 0.2s ease", boxSizing: "border-box",
  };

  const btnPrimary = {
    padding: "14px 32px", background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`,
    color: "#0F1419", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: "pointer",
  };

  const btnSecondary = {
    padding: "14px 32px", background: "transparent", color: COLORS.textMuted,
    border: `1px solid ${COLORS.border}`, borderRadius: "10px", fontSize: "15px", cursor: "pointer",
  };

  const pageStyle = {
    minHeight: "100vh", background: `linear-gradient(160deg, ${COLORS.bg} 0%, #0A0F14 50%, #111820 100%)`,
    display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px",
    fontFamily: "'Segoe UI', Arial, sans-serif", color: COLORS.text,
  };

  const containerStyle = { width: "100%", maxWidth: "680px" };

  // ===== MODE SELECTION =====
  if (!mode) {
    return (
      <>
        <Head><title>Hotel Performance Analyzer</title></Head>
        <div style={pageStyle}>
          <div style={containerStyle}>
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
              <div style={{ fontSize: "13px", color: COLORS.accent, letterSpacing: "3px", textTransform: "uppercase", marginBottom: "16px" }}>Hotel Performance</div>
              <h1 style={{ fontSize: "36px", fontWeight: 700, margin: "0 0 12px", lineHeight: 1.2, color: COLORS.text }}>Il tuo hotel sta performando bene?</h1>
              <p style={{ color: COLORS.textMuted, fontSize: "16px", maxWidth: "500px", margin: "0 auto", lineHeight: 1.6 }}>Analisi basata su metodologia USALI. Scegli il livello di dettaglio che preferisci.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "40px" }}>
              <div onClick={() => setMode("quick")} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: "16px", padding: "32px 24px", cursor: "pointer", textAlign: "center", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${COLORS.accent}, transparent)` }} />
                <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚡</div>
                <h3 style={{ fontSize: "22px", margin: "0 0 8px", color: COLORS.text }}>Check Rapido</h3>
                <p style={{ color: COLORS.textMuted, fontSize: "14px", lineHeight: 1.5, margin: 0 }}>Solo 10 domande essenziali.<br />Risultato in 2 minuti.</p>
                <div style={{ marginTop: "16px", fontSize: "12px", color: COLORS.accent, fontFamily: "monospace" }}>~2 min</div>
              </div>
              <div onClick={() => setMode("full")} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: "16px", padding: "32px 24px", cursor: "pointer", textAlign: "center", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${COLORS.accentLight}, transparent)` }} />
                <div style={{ fontSize: "40px", marginBottom: "16px" }}>📊</div>
                <h3 style={{ fontSize: "22px", margin: "0 0 8px", color: COLORS.text }}>Analisi Completa</h3>
                <p style={{ color: COLORS.textMuted, fontSize: "14px", lineHeight: 1.5, margin: 0 }}>Analisi USALI dettagliata.<br />Report approfondito via email.</p>
                <div style={{ marginTop: "16px", fontSize: "12px", color: COLORS.accentLight, fontFamily: "monospace" }}>~5 min</div>
              </div>
            </div>
            <div style={{ textAlign: "center", marginTop: "48px", padding: "20px", borderTop: `1px solid ${COLORS.border}` }}>
              <p style={{ fontSize: "12px", color: COLORS.textDim, lineHeight: 1.6 }}>🔒 I tuoi dati sono trattati in modo riservato e utilizzati esclusivamente per l'analisi.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ===== SEARCHING =====
  if (searching) {
    return (
      <>
        <Head><title>Analisi in corso...</title></Head>
        <div style={pageStyle}>
          <div style={{ ...containerStyle, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
            <div style={{ fontSize: "48px", marginBottom: "24px" }}>🔍</div>
            <h2 style={{ fontSize: "26px", marginBottom: "32px", textAlign: "center" }}>Stiamo analizzando {formData.hotel_name || "il tuo hotel"}...</h2>
            <div style={{ width: "100%", maxWidth: "400px" }}>
              {searchSteps.map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", marginBottom: "8px", background: i < searchStep ? COLORS.card : "transparent", borderRadius: "10px", opacity: i <= searchStep ? 1 : 0.3, transition: "all 0.5s", border: i === searchStep ? `1px solid ${COLORS.accent}` : "1px solid transparent" }}>
                  <span style={{ fontSize: "14px" }}>{i < searchStep ? "✅" : i === searchStep ? "⏳" : "○"}</span>
                  <span style={{ fontSize: "14px", color: i <= searchStep ? COLORS.text : COLORS.textDim }}>{step}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "32px", width: "300px", height: "4px", background: COLORS.inputBg, borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(searchStep / searchSteps.length) * 100}%`, background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.accentLight})`, borderRadius: "2px", transition: "width 0.5s ease-out" }} />
            </div>
          </div>
        </div>
      </>
    );
  }

  // ===== RESULTS =====
  if (submitted && analysis) {
    return (
      <>
        <Head><title>Risultati — {formData.hotel_name}</title></Head>
        <div style={pageStyle}>
          <div style={containerStyle}>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div style={{ fontSize: "48px", marginBottom: "8px" }}>{analysis.emoji}</div>
              <h2 style={{ fontSize: "28px", margin: "0 0 8px" }}>{formData.hotel_name}</h2>
              <p style={{ color: COLORS.textMuted, fontSize: "14px", margin: 0 }}>{formData.hotel_location} · {formData.star_rating}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "24px", background: COLORS.card, borderRadius: "16px", padding: "32px", border: `1px solid ${COLORS.border}` }}>
              <GaugeChart value={analysis.score} size={220} />
              <p style={{ fontSize: "20px", color: analysis.verdictColor, marginTop: "12px", textAlign: "center" }}>{analysis.verdict}</p>
            </div>

            {/* Reputation */}
            {analysis.reputation && analysis.reputation.found && (
              <div style={{ background: COLORS.card, borderRadius: "16px", padding: "24px", border: `1px solid ${COLORS.border}`, marginBottom: "24px" }}>
                <h3 style={{ fontSize: "18px", margin: "0 0 16px", color: COLORS.accentLight }}>⭐ Reputazione Online</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <MetricCard label="Google Rating" value={`${analysis.reputation.rating}/5`} benchmark={`${analysis.reputation.totalReviews} recensioni`} status={analysis.reputation.rating >= 4.2 ? "good" : analysis.reputation.rating >= 3.8 ? "average" : "bad"} />
                  <MetricCard label="Reputation Score" value={analysis.reputation.reputationScore} suffix="/100" status={analysis.reputation.reputationScore >= 70 ? "good" : "average"} />
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "24px" }}>
              <MetricCard label="Occupazione" value={`${analysis.occupancy}`} suffix="%" benchmark="65-80%" status={analysis.occupancy >= 70 ? "good" : analysis.occupancy >= 55 ? "average" : "bad"} />
              <MetricCard label="ADR" value={`€${analysis.adr}`} status="average" />
              <MetricCard label="RevPAR" value={`€${analysis.revpar.toFixed(0)}`} benchmark="KPI chiave" status={analysis.revpar >= analysis.adr * 0.7 ? "good" : "warning"} />
            </div>

            <div style={{ background: COLORS.card, borderRadius: "16px", padding: "24px", border: `1px solid ${COLORS.border}`, marginBottom: "24px" }}>
              <h3 style={{ fontSize: "18px", margin: "0 0 16px", color: COLORS.accentLight }}>Efficienza Operativa</h3>
              <ProgressBar label="Costo personale / Ricavi" value={analysis.staffCostRatio} color={analysis.staffCostRatio <= 33 ? COLORS.success : analysis.staffCostRatio <= 40 ? COLORS.warning : COLORS.danger} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <MetricCard label="Camere per FTE" value={analysis.roomsPerFTE.toFixed(1)} benchmark="> 1.5" status={analysis.roomsPerFTE >= 1.5 ? "good" : "warning"} />
                <MetricCard label="Costo per FTE" value={`€${Math.round(analysis.costPerFTE).toLocaleString()}`} status="average" />
              </div>
            </div>

            {mode === "full" && analysis.totalRevenue > 0 && (
              <>
                <div style={{ background: COLORS.card, borderRadius: "16px", padding: "24px", border: `1px solid ${COLORS.border}`, marginBottom: "24px" }}>
                  <h3 style={{ fontSize: "18px", margin: "0 0 16px", color: COLORS.accentLight }}>Profittabilità per Reparto (USALI)</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                    <MetricCard label="Rooms Dept. Margin" value={`${analysis.roomsDeptMargin.toFixed(1)}`} suffix="%" benchmark="> 70%" status={analysis.roomsDeptMargin >= 70 ? "good" : analysis.roomsDeptMargin >= 55 ? "average" : "bad"} />
                    <MetricCard label="F&B Dept. Margin" value={`${analysis.fbDeptMargin.toFixed(1)}`} suffix="%" benchmark="> 25%" status={analysis.fbDeptMargin >= 25 ? "good" : analysis.fbDeptMargin >= 15 ? "average" : "bad"} />
                  </div>
                  <ProgressBar label="Food Cost %" value={analysis.foodCostPct} color={analysis.foodCostPct <= 30 ? COLORS.success : analysis.foodCostPct <= 38 ? COLORS.warning : COLORS.danger} />
                </div>
                <div style={{ background: COLORS.card, borderRadius: "16px", padding: "24px", border: `1px solid ${COLORS.border}`, marginBottom: "24px" }}>
                  <h3 style={{ fontSize: "18px", margin: "0 0 16px", color: COLORS.accentLight }}>Mix di Distribuzione</h3>
                  <ProgressBar label="Prenotazioni Dirette" value={analysis.directPct} color={COLORS.success} />
                  <ProgressBar label="OTA" value={analysis.otaPct} color={COLORS.warning} />
                </div>
                <div style={{ background: COLORS.card, borderRadius: "16px", padding: "24px", border: `1px solid ${COLORS.border}`, marginBottom: "24px" }}>
                  <h3 style={{ fontSize: "18px", margin: "0 0 16px", color: COLORS.accentLight }}>Gross Operating Profit</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <MetricCard label="GOP" value={`€${Math.round(analysis.gop).toLocaleString()}`} status={analysis.gopMargin >= 30 ? "good" : analysis.gopMargin >= 20 ? "average" : "bad"} />
                    <MetricCard label="GOP Margin" value={`${analysis.gopMargin.toFixed(1)}`} suffix="%" benchmark="> 30%" status={analysis.gopMargin >= 30 ? "good" : analysis.gopMargin >= 20 ? "average" : "bad"} />
                  </div>
                </div>
              </>
            )}

            <div style={{ background: `${COLORS.accent}10`, borderRadius: "16px", padding: "24px", border: `1px solid ${COLORS.accent}30`, marginBottom: "24px", textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>📧</div>
              <h3 style={{ fontSize: "18px", margin: "0 0 8px" }}>Report completo inviato!</h3>
              <p style={{ color: COLORS.textMuted, fontSize: "14px", margin: 0, lineHeight: 1.6 }}>Riceverai a breve un'email a <strong style={{ color: COLORS.accent }}>{formData.email}</strong> con l'analisi dettagliata.</p>
            </div>

            <div style={{ textAlign: "center" }}>
              <button onClick={reset} style={btnSecondary}>← Nuova analisi</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ===== FORM =====
  return (
    <>
      <Head><title>Hotel Performance Analyzer</title></Head>
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
            <button onClick={reset} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: "14px", padding: "8px 0" }}>← Indietro</button>
            <div style={{ fontSize: "13px", color: COLORS.accent, fontFamily: "monospace" }}>{mode === "quick" ? "⚡ Check Rapido" : "📊 Analisi Completa"}</div>
          </div>
          <div style={{ display: "flex", gap: "4px", marginBottom: "32px" }}>
            {sections.map((_, i) => (
              <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: i <= currentStep ? COLORS.accent : COLORS.border, transition: "background 0.3s ease" }} />
            ))}
          </div>
          <div style={{ opacity: animateIn ? 1 : 0, transform: animateIn ? "translateY(0)" : "translateY(12px)", transition: "all 0.3s ease" }}>
            {currentSection && (
              <>
                <h2 style={{ fontSize: "24px", margin: "0 0 24px", color: COLORS.text }}>
                  {currentSection.title === "info" ? "Informazioni Hotel" : currentSection.title === "performance" ? "Performance" : currentSection.title === "costs" ? "Costi" : currentSection.title === "contact" ? "Contatto" : currentSection.title === "revenue" ? "Flussi di Ricavo" : currentSection.title === "market" ? "Market Mix" : currentSection.title === "kpi" ? "KPI" : currentSection.title}
                </h2>
                {currentSection.questions.map((q) => (
                  <div key={q.id} style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "13px", color: COLORS.textMuted, marginBottom: "6px" }}>
                      {q.label}{q.required && <span style={{ color: COLORS.accent, marginLeft: "4px" }}>*</span>}
                    </label>
                    {q.hint && <p style={{ margin: "0 0 6px", fontSize: "11px", color: COLORS.textDim }}>{q.hint}</p>}
                    {q.type === "select" ? (
                      <select value={formData[q.id] || ""} onChange={(e) => handleChange(q.id, e.target.value)} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
                        <option value="">Seleziona...</option>
                        {q.options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                      </select>
                    ) : (
                      <div style={{ position: "relative" }}>
                        <input type={q.type === "number" ? "number" : q.type === "email" ? "email" : "text"} value={formData[q.id] || ""} onChange={(e) => handleChange(q.id, e.target.value)} placeholder={q.placeholder} style={{ ...inputStyle, paddingRight: q.suffix ? "40px" : "16px" }} />
                        {q.suffix && <span style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: COLORS.textDim, fontSize: "14px", fontFamily: "monospace" }}>{q.suffix}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
            <div style={{ display: "flex", gap: "12px", marginTop: "32px", justifyContent: "space-between" }}>
              <button onClick={handleBack} style={{ ...btnSecondary, visibility: currentStep === 0 ? "hidden" : "visible" }}>← Precedente</button>
              <button onClick={handleNext} disabled={!canProceed()} style={{ ...btnPrimary, opacity: canProceed() ? 1 : 0.4, cursor: canProceed() ? "pointer" : "not-allowed" }}>
                {isLastStep ? "🔍 Analizza" : "Avanti →"}
              </button>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: "32px", fontSize: "12px", color: COLORS.textDim }}>Passo {currentStep + 1} di {sections.length}</div>
        </div>
      </div>
      <style>{`input::placeholder, select { color: ${COLORS.textDim}; } select option { background: ${COLORS.card}; color: ${COLORS.text}; } input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; } input[type=number] { -moz-appearance: textfield; }`}</style>
    </>
  );
}

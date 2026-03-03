import { useState, useEffect } from 'react';
import Head from 'next/head';

var COLORS = {
  bg: "#0F1419", card: "#1A2332", accent: "#C9A96E", accentLight: "#E8D5A8",
  accentDark: "#8B7340", text: "#E8E6E1", textMuted: "#8B9AAF", textDim: "#5A6A7F",
  success: "#4CAF50", warning: "#FF9800", danger: "#E74C3C", border: "#2A3A4E", inputBg: "#141D28",
};

var QUICK_QUESTIONS = [
  { id: "hotel_name", label: "Nome dell'hotel", type: "text", placeholder: "Es. Grand Hotel Roma", section: "info", required: true },
  { id: "hotel_location", label: "Citta / Localita", type: "text", placeholder: "Es. Roma, Milano, Firenze...", section: "info", required: true },
  { id: "star_rating", label: "Classificazione", type: "select", options: ["3 Stelle", "4 Stelle", "4 Stelle Superior", "5 Stelle", "5 Stelle Lusso"], section: "info", required: true },
  { id: "total_rooms", label: "Numero di camere", type: "number", placeholder: "Es. 120", section: "info", required: true },
  { id: "occupancy_rate", label: "Tasso di occupazione medio (%)", type: "number", placeholder: "Es. 72", suffix: "%", section: "performance", required: true },
  { id: "adr", label: "ADR - Tariffa media giornaliera", type: "number", placeholder: "Es. 185", suffix: "EUR", section: "performance", required: true },
  { id: "total_revenue", label: "Ricavo totale annuo", type: "number", placeholder: "Es. 5000000", suffix: "EUR", section: "performance", required: true },
  { id: "total_staff_cost", label: "Costo totale del personale", type: "number", placeholder: "Es. 1800000", suffix: "EUR", section: "costs", required: true },
  { id: "total_fte", label: "Numero di dipendenti (FTE)", type: "number", placeholder: "Es. 85", section: "costs", required: true },
];

var FULL_QUESTIONS = [
  { id: "hotel_name", label: "Nome dell'hotel", type: "text", placeholder: "Es. Grand Hotel Roma", section: "info", sectionTitle: "Informazioni Generali", required: true },
  { id: "hotel_location", label: "Citta / Localita", type: "text", placeholder: "Es. Roma Centro Storico", section: "info", required: true },
  { id: "hotel_website", label: "Sito web dell'hotel", type: "text", placeholder: "Es. www.grandhotelroma.it", section: "info" },
  { id: "star_rating", label: "Classificazione", type: "select", options: ["3 Stelle", "4 Stelle", "4 Stelle Superior", "5 Stelle", "5 Stelle Lusso"], section: "info", required: true },
  { id: "total_rooms", label: "Numero totale di camere", type: "number", placeholder: "120", section: "info", required: true },
  { id: "property_type", label: "Tipologia", type: "select", options: ["Hotel urbano", "Resort", "Boutique Hotel", "Business Hotel", "Hotel stagionale", "Agriturismo"], section: "info" },
  { id: "opening_months", label: "Mesi di apertura all'anno", type: "number", placeholder: "12", section: "info" },
  { id: "rooms_revenue", label: "Ricavi Camere", type: "number", placeholder: "3500000", suffix: "EUR", section: "revenue", sectionTitle: "Flussi di Ricavo (USALI)", required: true },
  { id: "fb_revenue", label: "Ricavi F&B - Ristorazione", type: "number", placeholder: "1200000", suffix: "EUR", section: "revenue", required: true },
  { id: "spa_revenue", label: "Ricavi Spa / Wellness", type: "number", placeholder: "150000", suffix: "EUR", section: "revenue" },
  { id: "other_revenue", label: "Altri ricavi operativi", type: "number", placeholder: "80000", suffix: "EUR", section: "revenue", hint: "Parcheggio, lavanderia, minibar, eventi..." },
  { id: "direct_booking_pct", label: "Prenotazioni dirette (%)", type: "number", placeholder: "25", suffix: "%", section: "market", sectionTitle: "Market Mix & Distribuzione", required: true },
  { id: "ota_booking_pct", label: "OTA - Booking, Expedia, etc. (%)", type: "number", placeholder: "45", suffix: "%", section: "market", required: true },
  { id: "tour_operator_pct", label: "Tour Operator / Gruppi (%)", type: "number", placeholder: "15", suffix: "%", section: "market" },
  { id: "corporate_pct", label: "Corporate / Aziende (%)", type: "number", placeholder: "15", suffix: "%", section: "market" },
  { id: "occupancy_rate", label: "Tasso di occupazione medio (%)", type: "number", placeholder: "72", suffix: "%", section: "kpi", sectionTitle: "Indicatori di Performance (KPI)", required: true },
  { id: "adr", label: "ADR - Tariffa media giornaliera", type: "number", placeholder: "185", suffix: "EUR", section: "kpi", required: true },
  { id: "rooms_staff_cost", label: "Costo personale Rooms Division", type: "number", placeholder: "600000", suffix: "EUR", section: "costs", sectionTitle: "Costi Operativi (USALI)", required: true },
  { id: "fb_staff_cost", label: "Costo personale F&B", type: "number", placeholder: "500000", suffix: "EUR", section: "costs", required: true },
  { id: "fb_cost_of_goods", label: "Costo del venduto F&B - Food Cost", type: "number", placeholder: "400000", suffix: "EUR", section: "costs", required: true },
  { id: "admin_staff_cost", label: "Costo personale Amministrazione", type: "number", placeholder: "250000", suffix: "EUR", section: "costs" },
  { id: "sales_marketing_cost", label: "Costi Sales & Marketing", type: "number", placeholder: "180000", suffix: "EUR", section: "costs" },
  { id: "energy_cost", label: "Costi Energia / Utilities", type: "number", placeholder: "200000", suffix: "EUR", section: "costs" },
  { id: "maintenance_cost", label: "Costi Manutenzione", type: "number", placeholder: "120000", suffix: "EUR", section: "costs" },
  { id: "ota_commissions", label: "Commissioni OTA", type: "number", placeholder: "250000", suffix: "EUR", section: "costs" },
  { id: "total_fte", label: "Numero totale dipendenti (FTE)", type: "number", placeholder: "85", section: "costs", required: true },
  { id: "rooms_fte", label: "FTE Rooms Division", type: "number", placeholder: "25", section: "costs" },
  { id: "fb_fte", label: "FTE F&B", type: "number", placeholder: "35", section: "costs" },
];

function GaugeChart(props) {
  var value = props.value;
  var size = props.size || 180;
  var radius = (size - 20) / 2;
  var circumference = Math.PI * radius;
  var offset = circumference - (value / 100) * circumference;
  var color = COLORS.danger;
  if (value >= 75) color = COLORS.success;
  else if (value >= 55) color = COLORS.accent;
  else if (value >= 35) color = COLORS.warning;
  return (
    <svg width={size} height={size / 2 + 30} viewBox={"0 0 " + size + " " + (size / 2 + 30)}>
      <path d={"M 10 " + (size / 2 + 10) + " A " + radius + " " + radius + " 0 0 1 " + (size - 10) + " " + (size / 2 + 10)} fill="none" stroke={COLORS.border} strokeWidth="12" strokeLinecap="round" />
      <path d={"M 10 " + (size / 2 + 10) + " A " + radius + " " + radius + " 0 0 1 " + (size - 10) + " " + (size / 2 + 10)} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 1.5s ease-out" }} />
      <text x={size / 2} y={size / 2} textAnchor="middle" fill={color} style={{ fontSize: "36px", fontWeight: 700 }}>{value}</text>
      <text x={size / 2} y={size / 2 + 22} textAnchor="middle" fill={COLORS.textMuted} style={{ fontSize: "12px" }}>/ 100</text>
    </svg>
  );
}

function MetricCard(props) {
  var statusColors = { good: COLORS.success, average: COLORS.accent, warning: COLORS.warning, bad: COLORS.danger };
  return (
    <div style={{ background: COLORS.card, border: "1px solid " + COLORS.border, borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "6px", borderLeft: "3px solid " + (statusColors[props.status] || COLORS.border) }}>
      <span style={{ fontSize: "11px", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{props.label}</span>
      <span style={{ fontSize: "24px", fontWeight: 700, color: COLORS.text }}>{props.value}{props.suffix && <span style={{ fontSize: "14px", color: COLORS.textMuted, marginLeft: "2px" }}>{props.suffix}</span>}</span>
      {props.benchmark && <span style={{ fontSize: "11px", color: COLORS.textDim }}>Benchmark: {props.benchmark}</span>}
    </div>
  );
}

function ProgressBar(props) {
  var pct = Math.min(props.value, 100);
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "12px", color: COLORS.textMuted }}>{props.label}</span>
        <span style={{ fontSize: "12px", color: COLORS.text, fontFamily: "monospace" }}>{props.value.toFixed(1)}%</span>
      </div>
      <div style={{ height: "6px", background: COLORS.inputBg, borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: pct + "%", background: props.color || COLORS.accent, borderRadius: "3px", transition: "width 1s ease-out" }} />
      </div>
    </div>
  );
}

export default function Home() {
  var [mode, setMode] = useState(null);
  var [step, setStep] = useState('email');
  var [email, setEmail] = useState('');
  var [emailSent, setEmailSent] = useState(false);
  var [emailVerified, setEmailVerified] = useState(false);
  var [emailLoading, setEmailLoading] = useState(false);
  var [hotelQuery, setHotelQuery] = useState('');
  var [hotelLocation, setHotelLocation] = useState('');
  var [hotelResults, setHotelResults] = useState([]);
  var [hotelSearching, setHotelSearching] = useState(false);
  var [selectedHotel, setSelectedHotel] = useState(null);
  var [currentFormStep, setCurrentFormStep] = useState(0);
  var [formData, setFormData] = useState({});
  var [animateIn, setAnimateIn] = useState(true);
  var [searching, setSearching] = useState(false);
  var [searchStep, setSearchStep] = useState(0);
  var [submitted, setSubmitted] = useState(false);
  var [analysis, setAnalysis] = useState(null);

  var questions = mode === "quick" ? QUICK_QUESTIONS : FULL_QUESTIONS;
  var sections = [];
  var sectionMap = {};
  questions.forEach(function(q) {
    if (!sectionMap[q.section]) {
      sectionMap[q.section] = [];
      sections.push({ key: q.section, title: q.sectionTitle || q.section, questions: sectionMap[q.section] });
    }
    sectionMap[q.section].push(q);
  });

  var currentSection = sections[currentFormStep];
  var isLastStep = currentFormStep === sections.length - 1;

  var searchSteps = [
    "Analisi reputazione online...",
    "Verifica recensioni Google...",
    "Calcolo benchmark di settore...",
    "Analisi efficienza operativa...",
    "Preparazione report...",
    "Invio notifica al team di analisi...",
  ];

  // Poll for email verification
  useEffect(function() {
    if (!emailSent || emailVerified) return;
    var interval = setInterval(function() {
      fetch('/api/check-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email }),
      })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.verified) {
            setEmailVerified(true);
            clearInterval(interval);
          }
        })
        .catch(function() {});
    }, 3000);
    return function() { clearInterval(interval); };
  }, [emailSent, emailVerified, email]);

  // Search animation
  useEffect(function() {
    if (searching && searchStep < searchSteps.length) {
      var timer = setTimeout(function() { setSearchStep(function(s) { return s + 1; }); }, 1800);
      return function() { clearTimeout(timer); };
    }
  }, [searching, searchStep]);

  async function sendVerification() {
    if (!email || !email.includes('@')) { alert('Inserisci un email valida'); return; }
    setEmailLoading(true);
    try {
      var res = await fetch('/api/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email }),
      });
      var data = await res.json();
      if (data.success) {
        setEmailSent(true);
      } else {
        alert('Errore: ' + (data.error || 'Invio fallito'));
      }
    } catch (err) {
      alert('Errore di rete. Riprova.');
    }
    setEmailLoading(false);
  }

  async function searchHotels() {
    if (!hotelQuery) return;
    setHotelSearching(true);
    setHotelResults([]);
    try {
      var res = await fetch('/api/search-hotel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: hotelQuery, location: hotelLocation }),
      });
      var data = await res.json();
      if (data.results) {
        setHotelResults(data.results);
      }
    } catch (err) {
      console.error(err);
    }
    setHotelSearching(false);
  }

  function selectHotel(hotel) {
    setSelectedHotel(hotel);
    setFormData(function(prev) {
      return Object.assign({}, prev, {
        hotel_name: hotel.name,
        hotel_location: hotel.address,
        google_place_id: hotel.place_id,
      });
    });
    setStep('form');
  }

  function handleChange(id, value) {
    setFormData(function(prev) {
      var next = Object.assign({}, prev);
      next[id] = value;
      return next;
    });
  }

  function canProceed() {
    if (!currentSection) return false;
    return currentSection.questions.filter(function(q) { return q.required; }).every(function(q) { return formData[q.id] && String(formData[q.id]).trim() !== ''; });
  }

  async function handleSubmit() {
    setSearching(true);
    setSearchStep(0);
    try {
      var res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({}, formData, { email: email, mode: mode })),
      });
      var data = await res.json();
      var minWait = searchSteps.length * 1800;
      await new Promise(function(r) { setTimeout(r, minWait); });
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
      }
    } catch (err) {
      console.error(err);
    }
    setSearching(false);
    setSubmitted(true);
  }

  function handleNext() {
    if (isLastStep) {
      handleSubmit();
    } else {
      setAnimateIn(false);
      setTimeout(function() { setCurrentFormStep(function(s) { return s + 1; }); setAnimateIn(true); }, 200);
    }
  }

  function handleBack() {
    if (currentFormStep > 0) {
      setAnimateIn(false);
      setTimeout(function() { setCurrentFormStep(function(s) { return s - 1; }); setAnimateIn(true); }, 200);
    }
  }

  function reset() {
    setMode(null); setStep('email'); setEmail(''); setEmailSent(false); setEmailVerified(false);
    setHotelQuery(''); setHotelLocation(''); setHotelResults([]); setSelectedHotel(null);
    setCurrentFormStep(0); setFormData({}); setSearching(false); setSearchStep(0);
    setSubmitted(false); setAnalysis(null);
  }

  var inputStyle = {
    width: "100%", padding: "14px 16px", background: COLORS.inputBg,
    border: "1px solid " + COLORS.border, borderRadius: "10px", color: COLORS.text,
    fontSize: "15px", outline: "none", boxSizing: "border-box",
  };

  var btnPrimary = {
    padding: "14px 32px", background: "linear-gradient(135deg, " + COLORS.accent + ", " + COLORS.accentDark + ")",
    color: "#0F1419", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: "pointer",
  };

  var btnSecondary = {
    padding: "14px 32px", background: "transparent", color: COLORS.textMuted,
    border: "1px solid " + COLORS.border, borderRadius: "10px", fontSize: "15px", cursor: "pointer",
  };

  var pageStyle = {
    minHeight: "100vh", background: "linear-gradient(160deg, " + COLORS.bg + " 0%, #0A0F14 50%, #111820 100%)",
    display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px",
    fontFamily: "'Segoe UI', Arial, sans-serif", color: COLORS.text,
  };

  var containerStyle = { width: "100%", maxWidth: "680px" };

  // ===== MODE SELECTION =====
  if (!mode) {
    return (
      <div style={pageStyle}>
        <Head><title>Hotel Performance Analyzer</title></Head>
        <div style={containerStyle}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={{ fontSize: "13px", color: COLORS.accent, letterSpacing: "3px", textTransform: "uppercase", marginBottom: "16px" }}>Hotel Performance</div>
            <h1 style={{ fontSize: "36px", fontWeight: 700, margin: "0 0 12px", lineHeight: 1.2, color: COLORS.text }}>Il tuo hotel sta performando bene?</h1>
            <p style={{ color: COLORS.textMuted, fontSize: "16px", maxWidth: "500px", margin: "0 auto", lineHeight: 1.6 }}>Analisi basata su metodologia USALI. Scegli il livello di dettaglio che preferisci.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "40px" }}>
            <div onClick={function() { setMode("quick"); }} style={{ background: COLORS.card, border: "1px solid " + COLORS.border, borderRadius: "16px", padding: "32px 24px", cursor: "pointer", textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, " + COLORS.accent + ", transparent)" }} />
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>&#9889;</div>
              <h3 style={{ fontSize: "22px", margin: "0 0 8px", color: COLORS.text }}>Check Rapido</h3>
              <p style={{ color: COLORS.textMuted, fontSize: "14px", lineHeight: 1.5, margin: 0 }}>Solo 9 domande essenziali.<br />Risultato in 2 minuti.</p>
              <div style={{ marginTop: "16px", fontSize: "12px", color: COLORS.accent, fontFamily: "monospace" }}>~2 min</div>
            </div>
            <div onClick={function() { setMode("full"); }} style={{ background: COLORS.card, border: "1px solid " + COLORS.border, borderRadius: "16px", padding: "32px 24px", cursor: "pointer", textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, " + COLORS.accentLight + ", transparent)" }} />
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>&#128202;</div>
              <h3 style={{ fontSize: "22px", margin: "0 0 8px", color: COLORS.text }}>Analisi Completa</h3>
              <p style={{ color: COLORS.textMuted, fontSize: "14px", lineHeight: 1.5, margin: 0 }}>Analisi USALI dettagliata.<br />Report approfondito via email.</p>
              <div style={{ marginTop: "16px", fontSize: "12px", color: COLORS.accentLight, fontFamily: "monospace" }}>~5 min</div>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: "48px", padding: "20px", borderTop: "1px solid " + COLORS.border }}>
            <p style={{ fontSize: "12px", color: COLORS.textDim, lineHeight: 1.6 }}>&#128274; I tuoi dati sono trattati in modo riservato e utilizzati esclusivamente per l'analisi.</p>
          </div>
        </div>
      </div>
    );
  }

  // ===== EMAIL VERIFICATION =====
  if (step === 'email') {
    return (
      <div style={pageStyle}>
        <Head><title>Verifica Email</title></Head>
        <div style={containerStyle}>
          <button onClick={reset} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: "14px", padding: "8px 0", marginBottom: "32px" }}>&#8592; Indietro</button>

          <div style={{ background: COLORS.card, borderRadius: "16px", padding: "40px", border: "1px solid " + COLORS.border, textAlign: "center" }}>
            {!emailSent ? (
              <div>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>&#9993;</div>
                <h2 style={{ fontSize: "24px", margin: "0 0 8px" }}>Verifica la tua email</h2>
                <p style={{ color: COLORS.textMuted, fontSize: "15px", margin: "0 0 32px", lineHeight: 1.6 }}>Per garantire la sicurezza dei dati, conferma il tuo indirizzo email prima di procedere.</p>
                <input
                  type="email"
                  value={email}
                  onChange={function(e) { setEmail(e.target.value); }}
                  onKeyDown={function(e) { if (e.key === 'Enter') sendVerification(); }}
                  placeholder="La tua email professionale"
                  style={Object.assign({}, inputStyle, { marginBottom: "16px", textAlign: "center" })}
                />
                <button
                  onClick={sendVerification}
                  disabled={emailLoading}
                  style={Object.assign({}, btnPrimary, { width: "100%", opacity: emailLoading ? 0.5 : 1 })}
                >
                  {emailLoading ? 'Invio in corso...' : 'Invia link di verifica'}
                </button>
              </div>
            ) : !emailVerified ? (
              <div>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>&#128232;</div>
                <h2 style={{ fontSize: "24px", margin: "0 0 8px" }}>Controlla la tua email</h2>
                <p style={{ color: COLORS.textMuted, fontSize: "15px", margin: "0 0 16px", lineHeight: 1.6 }}>
                  Abbiamo inviato un link di conferma a<br /><strong style={{ color: COLORS.accent }}>{email}</strong>
                </p>
                <p style={{ color: COLORS.textDim, fontSize: "13px", margin: "0 0 24px" }}>Clicca il link nell'email, poi torna qui. La pagina si aggiornera automaticamente.</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: COLORS.textDim }}>
                  <div style={{ width: "16px", height: "16px", border: "2px solid " + COLORS.accent, borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  <span style={{ fontSize: "13px" }}>In attesa di conferma...</span>
                </div>
                <style>{("@keyframes spin { to { transform: rotate(360deg); } }")}</style>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>&#10004;</div>
                <h2 style={{ fontSize: "24px", margin: "0 0 8px", color: COLORS.success }}>Email verificata!</h2>
                <p style={{ color: COLORS.textMuted, fontSize: "15px", margin: "0 0 24px" }}>Ora cerchiamo il tuo hotel.</p>
                <button onClick={function() { setStep('hotel'); }} style={Object.assign({}, btnPrimary, { width: "100%" })}>
                  Continua &#8594;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===== HOTEL SEARCH =====
  if (step === 'hotel') {
    return (
      <div style={pageStyle}>
        <Head><title>Trova il tuo Hotel</title></Head>
        <div style={containerStyle}>
          <button onClick={function() { setStep('email'); }} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: "14px", padding: "8px 0", marginBottom: "32px" }}>&#8592; Indietro</button>

          <div style={{ background: COLORS.card, borderRadius: "16px", padding: "40px", border: "1px solid " + COLORS.border }}>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>&#127976;</div>
              <h2 style={{ fontSize: "24px", margin: "0 0 8px" }}>Trova il tuo hotel</h2>
              <p style={{ color: COLORS.textMuted, fontSize: "15px", margin: 0 }}>Cerca il nome del tuo hotel e selezionalo dalla lista</p>
            </div>

            <input
              type="text"
              value={hotelQuery}
              onChange={function(e) { setHotelQuery(e.target.value); }}
              placeholder="Nome dell'hotel (es. Grand Hotel Roma)"
              style={Object.assign({}, inputStyle, { marginBottom: "12px" })}
            />
            <input
              type="text"
              value={hotelLocation}
              onChange={function(e) { setHotelLocation(e.target.value); }}
              placeholder="Citta o localita (es. Roma, Toscana...)"
              style={Object.assign({}, inputStyle, { marginBottom: "16px" })}
            />
            <button
              onClick={searchHotels}
              disabled={hotelSearching || !hotelQuery}
              style={Object.assign({}, btnPrimary, { width: "100%", opacity: (!hotelQuery || hotelSearching) ? 0.5 : 1 })}
            >
              {hotelSearching ? 'Ricerca in corso...' : '&#128269; Cerca Hotel'}
            </button>

            {hotelResults.length > 0 && (
              <div style={{ marginTop: "24px" }}>
                <p style={{ color: COLORS.textMuted, fontSize: "13px", marginBottom: "12px" }}>Seleziona il tuo hotel:</p>
                {hotelResults.map(function(hotel, i) {
                  return (
                    <div
                      key={hotel.place_id || i}
                      onClick={function() { selectHotel(hotel); }}
                      style={{
                        padding: "16px", background: COLORS.inputBg, border: "1px solid " + COLORS.border,
                        borderRadius: "10px", marginBottom: "8px", cursor: "pointer",
                        transition: "border-color 0.2s",
                      }}
                      onMouseEnter={function(e) { e.currentTarget.style.borderColor = COLORS.accent; }}
                      onMouseLeave={function(e) { e.currentTarget.style.borderColor = COLORS.border; }}
                    >
                      <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>{hotel.name}</div>
                      <div style={{ fontSize: "13px", color: COLORS.textMuted, marginBottom: "4px" }}>{hotel.address}</div>
                      {hotel.rating && (
                        <div style={{ fontSize: "12px", color: COLORS.accent }}>
                          &#11088; {hotel.rating}/5 ({hotel.total_reviews} recensioni)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {hotelResults.length === 0 && hotelSearching === false && hotelQuery && (
              <p style={{ color: COLORS.textDim, fontSize: "13px", textAlign: "center", marginTop: "16px" }}>Nessun risultato. Prova con un nome o localita diversa.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===== SEARCHING =====
  if (searching) {
    return (
      <div style={pageStyle}>
        <Head><title>Analisi in corso...</title></Head>
        <div style={Object.assign({}, containerStyle, { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" })}>
          <div style={{ fontSize: "48px", marginBottom: "24px" }}>&#128270;</div>
          <h2 style={{ fontSize: "26px", marginBottom: "32px", textAlign: "center" }}>Stiamo analizzando {formData.hotel_name || "il tuo hotel"}...</h2>
          <div style={{ width: "100%", maxWidth: "400px" }}>
            {searchSteps.map(function(s, i) {
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", marginBottom: "8px", background: i < searchStep ? COLORS.card : "transparent", borderRadius: "10px", opacity: i <= searchStep ? 1 : 0.3, transition: "all 0.5s", border: i === searchStep ? "1px solid " + COLORS.accent : "1px solid transparent" }}>
                  <span style={{ fontSize: "14px" }}>{i < searchStep ? "&#10004;" : i === searchStep ? "&#9203;" : "&#9675;"}</span>
                  <span style={{ fontSize: "14px", color: i <= searchStep ? COLORS.text : COLORS.textDim }}>{s}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: "32px", width: "300px", height: "4px", background: COLORS.inputBg, borderRadius: "2px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: (searchStep / searchSteps.length) * 100 + "%", background: "linear-gradient(90deg, " + COLORS.accent + ", " + COLORS.accentLight + ")", borderRadius: "2px", transition: "width 0.5s ease-out" }} />
          </div>
        </div>
      </div>
    );
  }

  // ===== RESULTS =====
  if (submitted) {
    return (
      <div style={pageStyle}>
        <Head><title>Grazie!</title></Head>
        <div style={containerStyle}>
          <div style={{ background: COLORS.card, borderRadius: "16px", padding: "48px 32px", border: "1px solid " + COLORS.border, textAlign: "center" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>&#9989;</div>
            <h2 style={{ fontSize: "28px", margin: "0 0 12px" }}>Grazie, {formData.hotel_name}!</h2>
            <p style={{ color: COLORS.textMuted, fontSize: "16px", lineHeight: 1.7, margin: "0 0 24px", maxWidth: "450px", marginLeft: "auto", marginRight: "auto" }}>
              La tua analisi e stata completata e inviata al nostro team per la revisione. Riceverai il report completo via email a <strong style={{ color: COLORS.accent }}>{email}</strong> entro 24 ore.
            </p>

            {analysis && (
              <div style={{ background: COLORS.inputBg, borderRadius: "12px", padding: "24px", marginBottom: "24px", textAlign: "center" }}>
                <div style={{ fontSize: "14px", color: COLORS.textMuted, marginBottom: "8px" }}>Anteprima del punteggio</div>
                <GaugeChart value={analysis.score} size={180} />
                <p style={{ fontSize: "16px", color: analysis.verdictColor, marginTop: "8px" }}>{analysis.emoji} {analysis.verdict}</p>
              </div>
            )}

            <div style={{ padding: "16px 20px", background: COLORS.inputBg, borderRadius: "10px", marginBottom: "24px" }}>
              <p style={{ margin: 0, fontSize: "13px", color: COLORS.textDim, lineHeight: 1.6 }}>
                &#128274; Il report dettagliato con reputazione online, analisi competitiva e suggerimenti operativi verra inviato dopo la revisione del nostro team.
              </p>
            </div>

            <button onClick={reset} style={btnSecondary}>&#8592; Nuova analisi</button>
          </div>
        </div>
      </div>
    );
  }

  // ===== FORM =====
  return (
    <div style={pageStyle}>
      <Head><title>Hotel Performance Analyzer</title></Head>
      <div style={containerStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
          <button onClick={function() { if (currentFormStep === 0) { setStep('hotel'); } else { handleBack(); } }} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: "14px", padding: "8px 0" }}>&#8592; Indietro</button>
          <div style={{ fontSize: "13px", color: COLORS.accent, fontFamily: "monospace" }}>{mode === "quick" ? "&#9889; Check Rapido" : "&#128202; Analisi Completa"}</div>
        </div>

        {selectedHotel && (
          <div style={{ background: COLORS.card, borderRadius: "12px", padding: "16px", border: "1px solid " + COLORS.accent + "40", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ fontSize: "24px" }}>&#127976;</div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 600 }}>{selectedHotel.name}</div>
              <div style={{ fontSize: "12px", color: COLORS.textMuted }}>{selectedHotel.address}</div>
            </div>
            {selectedHotel.rating && <div style={{ marginLeft: "auto", fontSize: "13px", color: COLORS.accent }}>&#11088; {selectedHotel.rating}</div>}
          </div>
        )}

        <div style={{ display: "flex", gap: "4px", marginBottom: "32px" }}>
          {sections.map(function(_, i) {
            return <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: i <= currentFormStep ? COLORS.accent : COLORS.border, transition: "background 0.3s ease" }} />;
          })}
        </div>

        <div style={{ opacity: animateIn ? 1 : 0, transform: animateIn ? "translateY(0)" : "translateY(12px)", transition: "all 0.3s ease" }}>
          {currentSection && (
            <div>
              <h2 style={{ fontSize: "24px", margin: "0 0 24px", color: COLORS.text }}>
                {currentSection.title === "info" ? "Informazioni Hotel" : currentSection.title === "performance" ? "Performance" : currentSection.title === "costs" ? "Costi Operativi" : currentSection.title === "revenue" ? "Flussi di Ricavo" : currentSection.title === "market" ? "Market Mix" : currentSection.title === "kpi" ? "KPI" : currentSection.title}
              </h2>
              {currentSection.questions.map(function(q) {
                if (q.id === 'hotel_name' || q.id === 'hotel_location') {
                  return (
                    <div key={q.id} style={{ marginBottom: "20px" }}>
                      <label style={{ display: "block", fontSize: "13px", color: COLORS.textMuted, marginBottom: "6px" }}>{q.label}{q.required && <span style={{ color: COLORS.accent }}> *</span>}</label>
                      <div style={Object.assign({}, inputStyle, { background: COLORS.card, color: COLORS.textMuted })}>{formData[q.id] || '-'}</div>
                    </div>
                  );
                }
                return (
                  <div key={q.id} style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "13px", color: COLORS.textMuted, marginBottom: "6px" }}>
                      {q.label}{q.required && <span style={{ color: COLORS.accent }}> *</span>}
                    </label>
                    {q.hint && <p style={{ margin: "0 0 6px", fontSize: "11px", color: COLORS.textDim }}>{q.hint}</p>}
                    {q.type === "select" ? (
                      <select value={formData[q.id] || ""} onChange={function(e) { handleChange(q.id, e.target.value); }} style={Object.assign({}, inputStyle, { appearance: "none", cursor: "pointer" })}>
                        <option value="">Seleziona...</option>
                        {q.options.map(function(opt) { return <option key={opt} value={opt}>{opt}</option>; })}
                      </select>
                    ) : (
                      <div style={{ position: "relative" }}>
                        <input
                          type={q.type === "number" ? "number" : "text"}
                          value={formData[q.id] || ""}
                          onChange={function(e) { handleChange(q.id, e.target.value); }}
                          placeholder={q.placeholder}
                          style={Object.assign({}, inputStyle, { paddingRight: q.suffix ? "50px" : "16px" })}
                        />
                        {q.suffix && <span style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: COLORS.textDim, fontSize: "13px", fontFamily: "monospace" }}>{q.suffix}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", marginTop: "32px", justifyContent: "space-between" }}>
            <button onClick={function() { if (currentFormStep === 0) { setStep('hotel'); } else { handleBack(); } }} style={btnSecondary}>&#8592; Precedente</button>
            <button onClick={handleNext} disabled={!canProceed()} style={Object.assign({}, btnPrimary, { opacity: canProceed() ? 1 : 0.4, cursor: canProceed() ? "pointer" : "not-allowed" })}>
              {isLastStep ? "&#128269; Analizza" : "Avanti &#8594;"}
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "32px", fontSize: "12px", color: COLORS.textDim }}>Passo {currentFormStep + 1} di {sections.length}</div>
      </div>
      <style>{("input::placeholder, select { color: " + COLORS.textDim + "; } select option { background: " + COLORS.card + "; color: " + COLORS.text + "; } input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; } input[type=number] { -moz-appearance: textfield; }")}</style>
    </div>
  );
}

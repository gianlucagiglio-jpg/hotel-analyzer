import { useState, useEffect } from 'react';
import Head from 'next/head';

const COLORS = {
  bg: "#0F1419", card: "#1A2332", accent: "#C9A96E", accentLight: "#E8D5A8",
  text: "#E8E6E1", muted: "#8B9AAF", dim: "#5A6A7F", border: "#2A3A4E",
  inputBg: "#141D28", success: "#4CAF50", warning: "#FF9800", danger: "#E74C3C",
};

export default function AdminDashboard() {
  var [reports, setReports] = useState([]);
  var [loading, setLoading] = useState(true);
  var [filter, setFilter] = useState('pending_review');
  var [selectedReport, setSelectedReport] = useState(null);
  var [actionLoading, setActionLoading] = useState(false);
  var [authenticated, setAuthenticated] = useState(false);
  var [password, setPassword] = useState('');

  // Simple password protection
  var ADMIN_PASSWORD = 'nativo2024';

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      fetchReports();
    } else {
      alert('Password errata');
    }
  }

  async function fetchReports() {
    setLoading(true);
    try {
      var res = await fetch('/api/get-reports?status=' + filter);
      var data = await res.json();
      if (data.reports) {
        setReports(data.reports);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setLoading(false);
  }

  useEffect(function() {
    if (authenticated) {
      fetchReports();
    }
  }, [filter, authenticated]);

  async function handleAction(reportId, action) {
    setActionLoading(true);
    try {
      var res = await fetch('/api/admin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: reportId, action: action, adminEmail: 'admin' }),
      });
      var data = await res.json();
      if (data.success) {
        alert(data.message);
        setSelectedReport(null);
        fetchReports();
      } else {
        alert('Errore: ' + (data.error || 'Azione fallita'));
      }
    } catch (err) {
      alert('Errore di rete');
    }
    setActionLoading(false);
  }

  var pageStyle = {
    minHeight: '100vh', background: COLORS.bg, fontFamily: "'Segoe UI', Arial, sans-serif", color: COLORS.text,
  };

  // Login screen
  if (!authenticated) {
    return (
      <div style={pageStyle}>
        <Head><title>Admin - Hotel Analyzer</title></Head>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ background: COLORS.card, borderRadius: '16px', padding: '40px', border: '1px solid ' + COLORS.border, width: '380px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔒</div>
            <h2 style={{ fontSize: '22px', margin: '0 0 8px' }}>Admin Dashboard</h2>
            <p style={{ color: COLORS.muted, fontSize: '14px', margin: '0 0 24px' }}>Inserisci la password per accedere</p>
            <input
              type="password"
              value={password}
              onChange={function(e) { setPassword(e.target.value); }}
              onKeyDown={function(e) { if (e.key === 'Enter') handleLogin(); }}
              placeholder="Password"
              style={{ width: '100%', padding: '14px 16px', background: COLORS.inputBg, border: '1px solid ' + COLORS.border, borderRadius: '10px', color: COLORS.text, fontSize: '15px', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' }}
            />
            <button
              onClick={handleLogin}
              style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, ' + COLORS.accent + ', #8B7340)', color: '#0F1419', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
            >
              Accedi
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Report detail view
  if (selectedReport) {
    var r = selectedReport;
    var a = r.analysis_results || {};
    var sc = a.score >= 75 ? COLORS.success : a.score >= 55 ? COLORS.accent : a.score >= 35 ? COLORS.warning : COLORS.danger;

    return (
      <div style={pageStyle}>
        <Head><title>{r.hotel_name} - Admin</title></Head>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
          <button onClick={function() { setSelectedReport(null); }} style={{ background: 'none', border: 'none', color: COLORS.muted, cursor: 'pointer', fontSize: '14px', padding: '8px 0', marginBottom: '24px' }}>
            ← Torna alla lista
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '28px', margin: '0 0 4px' }}>{r.hotel_name}</h1>
              <p style={{ color: COLORS.muted, margin: '0' }}>{r.hotel_location} | {r.star_rating} | {r.email}</p>
            </div>
            <div style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', background: r.status === 'pending_review' ? COLORS.warning + '20' : r.status === 'approved' ? COLORS.success + '20' : COLORS.danger + '20', color: r.status === 'pending_review' ? COLORS.warning : r.status === 'approved' ? COLORS.success : COLORS.danger }}>
              {r.status === 'pending_review' ? 'In attesa' : r.status === 'approved' ? 'Approvato' : 'Rifiutato'}
            </div>
          </div>

          {/* Score */}
          <div style={{ background: COLORS.card, borderRadius: '16px', padding: '32px', border: '1px solid ' + COLORS.border, textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '56px', fontWeight: '700', color: sc }}>{a.score}</div>
            <div style={{ fontSize: '12px', color: COLORS.muted }}>/ 100</div>
            <div style={{ fontSize: '18px', color: sc, marginTop: '8px' }}>{a.emoji} {a.verdict}</div>
          </div>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Occupazione', value: a.occupancy + '%' },
              { label: 'ADR', value: '€' + a.adr },
              { label: 'RevPAR', value: '€' + (a.revpar ? a.revpar.toFixed(0) : '-') },
              { label: 'Staff Cost %', value: (a.staffCostRatio ? a.staffCostRatio.toFixed(1) : '-') + '%' },
              { label: 'Rooms/FTE', value: a.roomsPerFTE ? a.roomsPerFTE.toFixed(1) : '-' },
              { label: 'Revenue/Room', value: '€' + (a.revenuePerRoom ? Math.round(a.revenuePerRoom).toLocaleString() : '-') },
            ].map(function(item, i) {
              return (
                <div key={i} style={{ background: COLORS.card, border: '1px solid ' + COLORS.border, borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: COLORS.muted, textTransform: 'uppercase', marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ fontSize: '20px', fontWeight: '700' }}>{item.value}</div>
                </div>
              );
            })}
          </div>

          {/* Reputation */}
          {a.reputation && a.reputation.found && (
            <div style={{ background: COLORS.card, borderRadius: '12px', padding: '20px', border: '1px solid ' + COLORS.border, marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', margin: '0 0 12px', color: COLORS.accentLight }}>Reputazione Google</h3>
              <p style={{ color: COLORS.text, margin: '0' }}>Rating: {a.reputation.rating}/5 ({a.reputation.totalReviews} recensioni) | Score: {a.reputation.reputationScore}/100</p>
            </div>
          )}

          {/* USALI */}
          {a.gopMargin > 0 && (
            <div style={{ background: COLORS.card, borderRadius: '12px', padding: '20px', border: '1px solid ' + COLORS.border, marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', margin: '0 0 12px', color: COLORS.accentLight }}>USALI Analysis</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                <div>Rooms Dept Margin: <strong>{a.roomsDeptMargin.toFixed(1)}%</strong></div>
                <div>F&B Dept Margin: <strong>{a.fbDeptMargin.toFixed(1)}%</strong></div>
                <div>Food Cost: <strong>{a.foodCostPct.toFixed(1)}%</strong></div>
                <div>GOP Margin: <strong>{a.gopMargin.toFixed(1)}%</strong></div>
                <div>Direct Bookings: <strong>{a.directPct}%</strong></div>
                <div>OTA: <strong>{a.otaPct}%</strong></div>
              </div>
            </div>
          )}

          {/* Actions */}
          {r.status === 'pending_review' && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button
                onClick={function() { handleAction(r.id, 'approve'); }}
                disabled={actionLoading}
                style={{ flex: 1, padding: '16px', background: COLORS.success, color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', opacity: actionLoading ? 0.5 : 1 }}
              >
                {actionLoading ? 'Invio...' : 'Approva e Invia al Cliente'}
              </button>
              <button
                onClick={function() { handleAction(r.id, 'reject'); }}
                disabled={actionLoading}
                style={{ padding: '16px 32px', background: 'transparent', color: COLORS.danger, border: '1px solid ' + COLORS.danger, borderRadius: '10px', fontSize: '16px', cursor: 'pointer', opacity: actionLoading ? 0.5 : 1 }}
              >
                Rifiuta
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Report list view
  return (
    <div style={pageStyle}>
      <Head><title>Admin Dashboard - Hotel Analyzer</title></Head>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', margin: '0 0 4px' }}>Dashboard Admin</h1>
            <p style={{ color: COLORS.muted, fontSize: '14px', margin: '0' }}>Gestisci i report degli hotel</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['pending_review', 'approved', 'rejected'].map(function(s) {
              var labels = { pending_review: 'In attesa', approved: 'Approvati', rejected: 'Rifiutati' };
              return (
                <button
                  key={s}
                  onClick={function() { setFilter(s); }}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
                    background: filter === s ? COLORS.accent + '20' : 'transparent',
                    color: filter === s ? COLORS.accent : COLORS.muted,
                    border: '1px solid ' + (filter === s ? COLORS.accent : COLORS.border),
                  }}
                >
                  {labels[s]}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: COLORS.muted }}>Caricamento...</div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <p style={{ color: COLORS.muted, fontSize: '16px' }}>Nessun report {filter === 'pending_review' ? 'in attesa' : filter === 'approved' ? 'approvato' : 'rifiutato'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reports.map(function(r) {
              var a = r.analysis_results || {};
              var sc = a.score >= 75 ? COLORS.success : a.score >= 55 ? COLORS.accent : a.score >= 35 ? COLORS.warning : COLORS.danger;
              return (
                <div
                  key={r.id}
                  onClick={function() { setSelectedReport(r); }}
                  style={{ background: COLORS.card, border: '1px solid ' + COLORS.border, borderRadius: '12px', padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '20px', transition: 'border-color 0.2s' }}
                  onMouseEnter={function(e) { e.currentTarget.style.borderColor = COLORS.accent; }}
                  onMouseLeave={function(e) { e.currentTarget.style.borderColor = COLORS.border; }}
                >
                  <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: sc + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', color: sc, flexShrink: 0 }}>
                    {a.score || '-'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{r.hotel_name}</div>
                    <div style={{ fontSize: '13px', color: COLORS.muted }}>{r.hotel_location} | {r.star_rating} | {r.email}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '12px', color: COLORS.dim }}>{new Date(r.created_at).toLocaleDateString('it-IT')}</div>
                    <div style={{ fontSize: '12px', color: COLORS.muted, marginTop: '4px' }}>{r.analysis_mode === 'full' ? 'Completa' : 'Rapida'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

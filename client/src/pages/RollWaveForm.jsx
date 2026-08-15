import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { PhotoCapture } from '../components/PhotoCapture';
import { PassFailConfirm } from '../components/PassFailConfirm';
import { BackButton } from '../components/BackButton';
import { Activity, Plus, Trash2, RotateCcw, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

const DEFAULT_SAMPLE_INCHES = [
  { type: 'peak', position: 12.0, reading: 0 },
  { type: 'valley', position: 16.5, reading: 0.0015 },
  { type: 'peak', position: 20.4, reading: 0 },
  { type: 'valley', position: 24.4, reading: 0.0033 },
  { type: 'peak', position: 29.0, reading: 0 },
  { type: 'valley', position: 33.3, reading: 0.0022 },
  { type: 'peak', position: 37.0, reading: 0 }
];

// SVG Roll Wave Profile Visualization Component
const RollWaveChart = ({ points, gaugeType, wavelengthL, depthW, unit }) => {
  const { t } = useLanguage();

  if (gaugeType === 'Three Point Contact') {
    const L = parseFloat(wavelengthL) || 8.4;
    const W = parseFloat(depthW) || 0.0025;
    const width = 500;
    const height = 140;
    const numCycles = 3;
    const pathD = [];
    
    for (let x = 0; x <= width; x += 2) {
      const angle = (x / (width / numCycles)) * 2 * Math.PI;
      const y = height / 2 + Math.sin(angle) * 35;
      if (x === 0) pathD.push(`M ${x} ${y}`);
      else pathD.push(`L ${x} ${y}`);
    }

    return (
      <div style={{ background: 'var(--bg-card-subtle, rgba(15, 23, 42, 0.03))', borderRadius: 8, padding: 12, border: '1px solid var(--border-color)', marginBottom: 16 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
          <span>{t('rollWaveProfileSim')}</span>
          <span>L = {L} {unit}, W = {W} {unit}</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 120, display: 'block' }}>
          <defs>
            <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          {/* Baseline */}
          <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="var(--border-color)" strokeDasharray="4 4" strokeWidth="1" />
          {/* Wave curve */}
          <path d={pathD.join(' ')} fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" />
          {/* Wavelength Indicator */}
          <line x1={width / 6} y1={height / 2 - 42} x2={width * 3 / 6} y2={height / 2 - 42} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 3" />
          <text x={width * 2 / 6} y={height / 2 - 46} fill="#3b82f6" fontSize="11" textAnchor="middle" fontWeight="bold">L = {L} {unit}</text>
          {/* Depth W Indicator */}
          <line x1={width * 3 / 6} y1={height / 2} x2={width * 3 / 6} y2={height / 2 + 35} stroke="#ef4444" strokeWidth="1.5" />
          <text x={width * 3 / 6 + 8} y={height / 2 + 20} fill="#ef4444" fontSize="11" fontWeight="bold">W = {W} {unit}</text>
        </svg>
      </div>
    );
  }

  // Flat Bottom Gauge Curve
  if (!points || points.length < 2) return null;
  const sorted = [...points].sort((a, b) => a.position - b.position);
  const minX = sorted[0].position;
  const maxX = sorted[sorted.length - 1].position;
  const rangeX = maxX - minX || 1;
  const width = 500;
  const height = 150;
  const padding = 35;

  const getSvgX = (pos) => padding + ((pos - minX) / rangeX) * (width - 2 * padding);
  const maxReading = Math.max(...sorted.map(p => p.reading), 0.001);

  const pointsSvg = sorted.map((p) => {
    const x = getSvgX(p.position);
    // Peak is upper curve, Valley is lower curve
    const y = p.type === 'peak' ? padding + 10 : height - padding - (p.reading / maxReading) * 40;
    return { ...p, x, y };
  });

  // Build SVG path
  let pathD = `M ${pointsSvg[0].x} ${pointsSvg[0].y}`;
  for (let i = 1; i < pointsSvg.length; i++) {
    const prev = pointsSvg[i - 1];
    const curr = pointsSvg[i];
    const cx = (prev.x + curr.x) / 2;
    pathD += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  return (
    <div style={{ background: 'var(--bg-card-subtle, rgba(15, 23, 42, 0.03))', borderRadius: 8, padding: 12, border: '1px solid var(--border-color)', marginBottom: 16 }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
        <span>{t('astmContourViz')}</span>
        <span>{sorted.length} {t('traversePoints')}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 140, display: 'block' }}>
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="var(--border-color)" strokeDasharray="4 4" strokeWidth="1" />
        <path d={pathD} fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" />

        {pointsSvg.map((p, idx) => (
          <g key={idx}>
            <circle
              cx={p.x}
              cy={p.y}
              r={5}
              fill={p.type === 'peak' ? '#10b981' : '#f59e0b'}
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <text
              x={p.x}
              y={p.type === 'peak' ? p.y - 8 : p.y + 16}
              fill="var(--text-primary)"
              fontSize="9"
              fontWeight="bold"
              textAnchor="middle"
            >
              {p.type === 'peak' ? `P${Math.ceil((idx + 1) / 2)}` : `V${Math.floor((idx + 1) / 2)}`} ({p.position}")
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export const RollWaveForm = ({ setTab }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [testTime, setTestTime] = useState(new Date().toTimeString().split(' ')[0].substring(0, 5));
  const [sgccNumber, setSgccNumber] = useState('CUS01CA');
  const [operatorName, setOperatorName] = useState(user?.username || '');
  const [specimenId, setSpecimenId] = useState('');
  const [glassThickness, setGlassThickness] = useState('1/4"');
  const [gaugeType, setGaugeType] = useState('Flat Bottom');
  const [unit, setUnit] = useState('inches');
  const [thresholdMdpt, setThresholdMdpt] = useState('60');

  // Flat Bottom Points
  const [points, setPoints] = useState([
    { type: 'peak', position: 12.0, reading: 0 },
    { type: 'valley', position: 16.5, reading: 0.0015 },
    { type: 'peak', position: 20.4, reading: 0 },
    { type: 'valley', position: 24.4, reading: 0.0033 },
    { type: 'peak', position: 29.0, reading: 0 },
    { type: 'valley', position: 33.3, reading: 0.0022 },
    { type: 'peak', position: 37.0, reading: 0 }
  ]);

  // Three Point Contact inputs
  const [wavelengthL, setWavelengthL] = useState('8.4');
  const [depthW, setDepthW] = useState('0.0025');

  const [confirmedPassFail, setConfirmedPassFail] = useState(null);
  const [photoPath, setPhotoPath] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Computations
  const computedResults = useMemo(() => {
    if (gaugeType === 'Three Point Contact') {
      const L = parseFloat(wavelengthL) || 0;
      const W = parseFloat(depthW) || 0;
      if (L <= 0 || W < 0) {
        return {
          avgWavelength: null,
          minDepth: 0,
          maxDepth: 0,
          avgDepth: 0,
          maxDistortion: 0,
          avgDistortion: 0,
          suggestedPassFail: 'Pass'
        };
      }

      // Conversion factor k to get mdpt: D_mdpt = 4*pi^2 * (W/L^2) * 1000
      let k = (4 * Math.PI * Math.PI / 25.4) * 1e6; // for inches
      if (unit === 'mm') {
        k = 4 * Math.PI * Math.PI * 1e6; // for mm
      }

      const D = Math.round((k * (W / (L * L))) * 100) / 100;
      const maxLimit = parseFloat(thresholdMdpt) || 60;
      const suggestedPassFail = D <= maxLimit ? 'Pass' : 'Fail';

      return {
        avgWavelength: L,
        minDepth: W,
        maxDepth: W,
        avgDepth: W,
        maxDistortion: D,
        avgDistortion: D,
        suggestedPassFail
      };
    }

    // Flat Bottom Gauge Calculation (ASTM C1651 Sec 8.1 & 8.2)
    if (!points || points.length === 0) {
      return {
        avgWavelength: null,
        minDepth: 0,
        maxDepth: 0,
        avgDepth: 0,
        maxDistortion: 0,
        avgDistortion: 0,
        suggestedPassFail: 'Pass'
      };
    }

    const sorted = [...points].sort((a, b) => a.position - b.position);
    const peaks = sorted.filter(p => p.type === 'peak');
    const valleys = sorted.filter(p => p.type === 'valley');

    // 1. Average Wavelength L_ave (Eq 2)
    let L_ave = null;
    let L_peaks = null;
    let L_valleys = null;
    if (peaks.length >= 2) {
      L_peaks = (peaks[peaks.length - 1].position - peaks[0].position) / (peaks.length - 1);
    }
    if (valleys.length >= 2) {
      L_valleys = (valleys[valleys.length - 1].position - valleys[0].position) / (valleys.length - 1);
    }
    if (L_peaks !== null && L_valleys !== null) {
      L_ave = (L_peaks + L_valleys) / 2;
    } else if (L_peaks !== null) {
      L_ave = L_peaks;
    } else if (L_valleys !== null) {
      L_ave = L_valleys;
    }
    if (L_ave !== null) L_ave = Math.round(L_ave * 1000) / 1000;

    // 2. Depth statistics (W)
    const valleyReadings = valleys.map(v => v.reading).filter(r => !isNaN(r));
    const minDepth = valleyReadings.length > 0 ? Math.min(...valleyReadings) : 0;
    const maxDepth = valleyReadings.length > 0 ? Math.max(...valleyReadings) : 0;
    const avgDepth = valleyReadings.length > 0 ? valleyReadings.reduce((a, b) => a + b, 0) / valleyReadings.length : 0;

    // 3. Optical Distortion values D_pi and D_vi (Eq 5 - 12)
    let k = (4 * Math.PI * Math.PI / 25.4) * 1e6; // inches
    if (unit === 'mm') k = 4 * Math.PI * Math.PI * 1e6; // mm

    const distortions = [];

    // Distortions at peaks (excluding first and last)
    for (let i = 0; i < sorted.length; i++) {
      const curr = sorted[i];
      if (curr.type === 'valley') {
        // Find preceding peak and succeeding peak
        const prevPeak = sorted.slice(0, i).reverse().find(p => p.type === 'peak');
        const nextPeak = sorted.slice(i + 1).find(p => p.type === 'peak');

        if (prevPeak && nextPeak) {
          const L_seg = nextPeak.position - prevPeak.position;
          const deltaW = Math.abs(curr.reading - (prevPeak.reading + nextPeak.reading) / 2);
          if (L_seg > 0) {
            const D_val = (k * deltaW) / (L_seg * L_seg);
            distortions.push(D_val);
          }
        }
      } else if (curr.type === 'peak') {
        // Find preceding valley and succeeding valley
        const prevValley = sorted.slice(0, i).reverse().find(p => p.type === 'valley');
        const nextValley = sorted.slice(i + 1).find(p => p.type === 'valley');

        if (prevValley && nextValley) {
          const L_seg = nextValley.position - prevValley.position;
          const deltaW = Math.abs(curr.reading - (prevValley.reading + nextValley.reading) / 2);
          if (L_seg > 0) {
            const D_val = (k * deltaW) / (L_seg * L_seg);
            distortions.push(D_val);
          }
        }
      }
    }

    const maxDistortion = distortions.length > 0 ? Math.round(Math.max(...distortions)) : 0;
    const avgDistortion = distortions.length > 0 ? Math.round(distortions.reduce((a, b) => a + b, 0) / distortions.length) : 0;
    const maxLimit = parseFloat(thresholdMdpt) || 60;
    const suggestedPassFail = maxDistortion <= maxLimit ? 'Pass' : 'Fail';

    return {
      avgWavelength: L_ave,
      minDepth: Math.round(minDepth * 100000) / 100000,
      maxDepth: Math.round(maxDepth * 100000) / 100000,
      avgDepth: Math.round(avgDepth * 100000) / 100000,
      maxDistortion,
      avgDistortion,
      suggestedPassFail
    };
  }, [gaugeType, points, wavelengthL, depthW, unit, thresholdMdpt]);

  const handlePointChange = (index, field, value) => {
    const updated = [...points];
    updated[index][field] = field === 'type' ? value : parseFloat(value) || 0;
    setPoints(updated);
  };

  const addPointRow = () => {
    const lastPos = points.length > 0 ? points[points.length - 1].position : 10;
    const lastType = points.length > 0 ? points[points.length - 1].type : 'valley';
    const newType = lastType === 'peak' ? 'valley' : 'peak';
    setPoints([...points, { type: newType, position: lastPos + 4.0, reading: 0 }]);
  };

  const removePointRow = (index) => {
    setPoints(points.filter((_, idx) => idx !== index));
  };

  const loadSampleData = () => {
    setGaugeType('Flat Bottom');
    setUnit('inches');
    setPoints(DEFAULT_SAMPLE_INCHES);
    setThresholdMdpt('60');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!specimenId.trim()) {
      setErrorMsg('Specimen / Lite ID is required.');
      return;
    }

    if (!confirmedPassFail) {
      setErrorMsg(t('operatorConfirmation') + ' mandatory before saving.');
      return;
    }

    setLoading(true);
    try {
      const dataPoints = gaugeType === 'Flat Bottom' ? points : { L: wavelengthL, W: depthW };

      const body = {
        test_date: testDate,
        test_time: testTime,
        sgcc_number: sgccNumber,
        operator_name: operatorName,
        specimen_id: specimenId,
        glass_thickness: glassThickness,
        gauge_type: gaugeType,
        unit,
        data_points: dataPoints,
        average_wavelength: computedResults.avgWavelength,
        min_depth: computedResults.minDepth,
        max_depth: computedResults.maxDepth,
        avg_depth: computedResults.avgDepth,
        max_distortion_mdpt: computedResults.maxDistortion,
        avg_distortion_mdpt: computedResults.avgDistortion,
        distortion_threshold_mdpt: parseFloat(thresholdMdpt) || null,
        suggested_pass_fail: computedResults.suggestedPassFail,
        confirmed_pass_fail: confirmedPassFail,
        photo_path: photoPath,
        notes: notes || null
      };

      const res = await fetch('/api/roll-wave-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('sgcc_token')}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(t('recordSaved'));
        setSpecimenId('');
        setNotes('');
        setPhotoPath(null);
        setConfirmedPassFail(null);
      } else {
        setErrorMsg(data.error || 'Failed to save roll wave test record');
      }
    } catch (err) {
      console.error('Save error:', err);
      setErrorMsg('Network error saving roll wave record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <BackButton onClick={() => setTab('dashboard')} />

      <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Activity size={26} color="var(--accent-primary)" />
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{t('rollWaveTitle')}</h2>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('astmStandardTitle')}</span>
        </div>
      </div>

      {/* ASTM C1651 Reminder Banner */}
      <div className="reminder-banner" style={{ marginBottom: 16 }}>
        <ShieldAlert size={20} style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.84rem', lineHeight: 1.4 }}>
          {t('rollWaveBanner')}
        </div>
      </div>

      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          <ShieldAlert size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Row 1: Date, Time, SGCC #, Operator */}
        <div className="form-row-2" style={{ marginBottom: 12 }}>
          <div className="form-group">
            <label className="form-label">{t('date')}</label>
            <input type="date" className="form-input" value={testDate} onChange={(e) => setTestDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">{t('time')}</label>
            <input type="time" className="form-input" value={testTime} onChange={(e) => setTestTime(e.target.value)} required />
          </div>
        </div>

        <div className="form-row-2" style={{ marginBottom: 12 }}>
          <div className="form-group">
            <label className="form-label">{t('sgccNumber')}</label>
            <input type="text" className="form-input" value={sgccNumber} onChange={(e) => setSgccNumber(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">{t('operatorName')}</label>
            <input type="text" className="form-input" value={operatorName} onChange={(e) => setOperatorName(e.target.value)} required />
          </div>
        </div>

        {/* Row 2: Specimen ID, Glass Thickness, Threshold */}
        <div className="form-row-2" style={{ marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">{t('specimenId')}</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder={t('liteIdPlaceholder')} 
              value={specimenId} 
              onChange={(e) => setSpecimenId(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('thickness')}</label>
            <select className="form-select" value={glassThickness} onChange={(e) => setGlassThickness(e.target.value)}>
              {['1/8"', '5/32"', '3/16"', '1/4"', '5/16"', '3/8"', '1/2"', '5/8"', '3/4"'].map(th => (
                <option key={th} value={th}>{th}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 3: Gauge Selection & Units */}
        <div className="form-row-2" style={{ background: 'var(--bg-card-subtle, rgba(15,23,42,0.03))', padding: 12, borderRadius: 8, border: '1px solid var(--border-color)', marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">{t('gaugeType')}</label>
            <select className="form-select" value={gaugeType} onChange={(e) => setGaugeType(e.target.value)}>
              <option value="Flat Bottom">{t('flatBottomGauge')}</option>
              <option value="Three Point Contact">{t('threePointGauge')}</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t('unit')}</label>
            <select className="form-select" value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="inches">{t('inches')}</option>
              <option value="mm">{t('millimeters')}</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t('thresholdMdpt')}</label>
            <input 
              type="number" 
              className="form-input" 
              value={thresholdMdpt} 
              onChange={(e) => setThresholdMdpt(e.target.value)} 
              placeholder="e.g. 60"
            />
          </div>
        </div>

        {/* Dynamic Measurement Data Entry */}
        {gaugeType === 'Flat Bottom' ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{t('traverseDataTitle')}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={loadSampleData}>
                  <Sparkles size={14} style={{ marginRight: 4 }} />
                  {t('loadAstmSample')}
                </button>
                <button type="button" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => setPoints([])}>
                  <RotateCcw size={14} style={{ marginRight: 4 }} />
                  {t('clearPoints')}
                </button>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto', marginBottom: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--table-header-bg, rgba(255,255,255,0.05))', textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: 8 }}>#</th>
                    <th style={{ padding: 8 }}>{t('pointType')}</th>
                    <th style={{ padding: 8 }}>{t('position')} ({unit})</th>
                    <th style={{ padding: 8 }}>{t('reading')} ({unit})</th>
                    <th style={{ padding: 8, width: 50 }}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((pt, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: 8, fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ padding: 8 }}>
                        <select 
                          className="form-select" 
                          style={{ padding: '4px 8px', fontSize: '0.82rem' }}
                          value={pt.type} 
                          onChange={(e) => handlePointChange(idx, 'type', e.target.value)}
                        >
                          <option value="peak">{t('peak')}</option>
                          <option value="valley">{t('valley')}</option>
                        </select>
                      </td>
                      <td style={{ padding: 8 }}>
                        <input 
                          type="number" 
                          step="0.1" 
                          className="form-input" 
                          style={{ padding: '4px 8px', fontSize: '0.82rem' }}
                          value={pt.position} 
                          onChange={(e) => handlePointChange(idx, 'position', e.target.value)}
                        />
                      </td>
                      <td style={{ padding: 8 }}>
                        <input 
                          type="number" 
                          step="0.0001" 
                          className="form-input" 
                          style={{ padding: '4px 8px', fontSize: '0.82rem' }}
                          value={pt.reading} 
                          onChange={(e) => handlePointChange(idx, 'reading', e.target.value)}
                        />
                      </td>
                      <td style={{ padding: 8 }}>
                        <button 
                          type="button" 
                          className="icon-btn" 
                          style={{ color: '#ef4444' }}
                          onClick={() => removePointRow(idx)}
                          title="Delete Row"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button type="button" className="btn btn-secondary" style={{ width: '100%', padding: '6px' }} onClick={addPointRow}>
              <Plus size={16} style={{ marginRight: 4 }} />
              {t('addRow')}
            </button>
          </div>
        ) : (
          /* Three Point Contact Gauge */
          <div className="form-row-2" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">{t('wavelengthL')} ({unit})</label>
              <input 
                type="number" 
                step="0.1" 
                className="form-input" 
                value={wavelengthL} 
                onChange={(e) => setWavelengthL(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('depthW')} ({unit})</label>
              <input 
                type="number" 
                step="0.0001" 
                className="form-input" 
                value={depthW} 
                onChange={(e) => setDepthW(e.target.value)} 
                required 
              />
            </div>
          </div>
        )}

        {/* SVG Contour Visualization */}
        <RollWaveChart 
          points={points} 
          gaugeType={gaugeType} 
          wavelengthL={wavelengthL} 
          depthW={depthW} 
          unit={unit} 
        />

        {/* Calculation Summary Card */}
        <div style={{ background: 'var(--bg-card-subtle, rgba(15, 23, 42, 0.04))', padding: 14, borderRadius: 8, border: '1px solid var(--border-color)', marginBottom: 16 }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 10px', color: 'var(--accent-primary)' }}>
            {t('astmCalculationsTitle')}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>{t('avgWavelength')}:</span>
              <strong style={{ fontSize: '1.05rem' }}>
                {computedResults.avgWavelength !== null ? `${computedResults.avgWavelength} ${unit}` : 'N/A'}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>{t('depthRange')}:</span>
              <strong>Min: {computedResults.minDepth} {unit} | Max: {computedResults.maxDepth} {unit}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>{t('maxDistortion')}:</span>
              <strong style={{ fontSize: '1.1rem', color: computedResults.maxDistortion <= (parseFloat(thresholdMdpt) || 60) ? 'var(--success-text)' : '#ef4444' }}>
                {computedResults.maxDistortion} mdpt
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>{t('avgDistortion')}:</span>
              <strong style={{ fontSize: '1.05rem' }}>
                {computedResults.avgDistortion} mdpt
              </strong>
            </div>
          </div>
        </div>

        {/* Pass/Fail Mandatory Operator Confirmation */}
        <div style={{ marginBottom: 16 }}>
          <PassFailConfirm
            type="rollwave"
            suggestedValue={computedResults.suggestedPassFail}
            confirmedValue={confirmedPassFail}
            onConfirm={setConfirmedPassFail}
          />
        </div>

        {/* Photo Upload */}
        <div style={{ marginBottom: 16 }}>
          <PhotoCapture photoPath={photoPath} onPhotoUploaded={setPhotoPath} />
        </div>

        {/* Notes */}
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">{t('notes')}</label>
          <textarea 
            className="form-input" 
            rows={2} 
            placeholder={t('commentsPlaceholder')} 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 700 }} disabled={loading}>
          {loading ? t('saving') : t('submitRecord')}
        </button>
      </form>
      </div>
    </div>
  );
};

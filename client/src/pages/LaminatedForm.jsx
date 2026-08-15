import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { PhotoCapture } from '../components/PhotoCapture';
import { PassFailConfirm } from '../components/PassFailConfirm';
import { Layers, ArrowLeft, PlusCircle, CheckCircle, ListPlus } from 'lucide-react';

export const LaminatedForm = ({ setTab }) => {
  const { user, token } = useAuth();
  const { t } = useLanguage();

  const getNowDate = () => new Date().toISOString().split('T')[0];
  const getNowTime = () => new Date().toTimeString().split(' ')[0].substring(0, 5);

  const [mode, setMode] = useState('traceability'); // 'traceability' or 'test_result'
  const [existingTraceability, setExistingTraceability] = useState([]);
  const [selectedTraceId, setSelectedTraceId] = useState('');

  const [thicknessOptions, setThicknessOptions] = useState(['1/4"', '5/16"', '3/8"', '1/2"', '5/8"', '3/4"']);
  const [interlayerOptions, setInterlayerOptions] = useState(['PVB', 'SentryGlas', 'EVA']);

  // Traceability form state
  const [traceForm, setTraceForm] = useState({
    production_date: getNowDate(),
    production_time: getNowTime(),
    sgcc_number: 'CUS01CA',
    interlayer_type: 'PVB (Everlam)',
    glass_type: 'Clear',
    glass_kind: 'FT',
    nominal_thickness: '1/4"',
    collection_week: 1
  });

  // Test result form state
  const [testForm, setTestForm] = useState({
    traceability_id: '',
    specimen_number: 1,
    test_date: getNowDate(),
    test_time: getNowTime(),
    specimen_temp: '72',
    temp_unit: 'F',
    measured_min_thickness: '0.240',
    drop_height_class: 'Class A',
    suggested_result: '1',
    confirmed_result: null,
    photo_path: null,
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Fetch dropdown lists & existing traceability records
  const loadTraceabilityList = () => {
    fetch('/api/laminated/traceability', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setExistingTraceability(data);
          if (data.length > 0 && !selectedTraceId) {
            setSelectedTraceId(data[0].id);
            setTestForm(prev => ({ ...prev, traceability_id: data[0].id }));
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadTraceabilityList();

    fetch('/api/config-lists', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.thickness) setThicknessOptions(Array.from(new Set(data.thickness.map(i => i.value))));
        if (data.interlayer_type) setInterlayerOptions(Array.from(new Set(data.interlayer_type.map(i => i.value))));
      })
      .catch(() => {});
  }, [token]);

  const handleTraceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/laminated/traceability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(traceForm)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(t('traceabilitySavedSuccess'));
        loadTraceabilityList();
        setMode('test_result');
        if (data.id) {
          setSelectedTraceId(data.id);
          setTestForm(prev => ({ ...prev, traceability_id: data.id }));
        }
      } else {
        setErrorMsg(data.error || 'Failed to save traceability record');
      }
    } catch (err) {
      setErrorMsg('Error saving traceability record');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    if (!testForm.confirmed_result) {
      setErrorMsg(t('confirmAstmCategoryError'));
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/laminated/test-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...testForm,
          traceability_id: selectedTraceId || testForm.traceability_id
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(t('recordSaved'));
        setTimeout(() => setTab('records'), 1200);
      } else {
        setErrorMsg(data.error || 'Failed to save test result');
      }
    } catch (err) {
      setErrorMsg('Error saving test result');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button className="btn btn-secondary" style={{ width: 'auto', marginBottom: 14, minHeight: 36, padding: '6px 14px' }} onClick={() => setTab('dashboard')}>
        <ArrowLeft size={16} /> {t('backToDashboard')}
      </button>

      <div className="card">
        <div className="card-title">
          <Layers size={24} color="#8b5cf6" />
          <span>{t('laminatedTitle')}</span>
        </div>

        {/* Tab switch inside form */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button
            type="button"
            className={`btn ${mode === 'traceability' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, minHeight: 44, fontSize: '0.9rem' }}
            onClick={() => setMode('traceability')}
          >
            1. {t('specimenTraceability')}
          </button>
          <button
            type="button"
            className={`btn ${mode === 'test_result' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, minHeight: 44, fontSize: '0.9rem' }}
            onClick={() => setMode('test_result')}
          >
            2. {t('addTestResult')}
          </button>
        </div>

        {successMsg && (
          <div style={{ padding: 12, backgroundColor: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-sm)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div style={{ padding: 12, backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', marginBottom: 16 }}>
            {errorMsg}
          </div>
        )}

        {mode === 'traceability' ? (
          <form onSubmit={handleTraceSubmit}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14 }}>{t('specimenTraceability')} (Section A)</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('productionDate')}</label>
                <input
                  type="date"
                  className="form-input"
                  value={traceForm.production_date}
                  onChange={(e) => setTraceForm({ ...traceForm, production_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('productionTime')}</label>
                <input
                  type="time"
                  className="form-input"
                  value={traceForm.production_time}
                  onChange={(e) => setTraceForm({ ...traceForm, production_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('sgccNumber')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 5678-LAM"
                  value={traceForm.sgcc_number}
                  onChange={(e) => setTraceForm({ ...traceForm, sgcc_number: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('interlayerType')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={traceForm.interlayer_type}
                  onChange={(e) => setTraceForm({ ...traceForm, interlayer_type: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('glassType')}</label>
                <select
                  className="form-select"
                  value={traceForm.glass_type}
                  onChange={(e) => setTraceForm({ ...traceForm, glass_type: e.target.value })}
                >
                  <option value="Clear">Clear</option>
                  <option value="Low-E">Low-E</option>
                  <option value="Satin">Satin</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('kind')}</label>
                <select
                  className="form-select"
                  value={traceForm.glass_kind}
                  onChange={(e) => setTraceForm({ ...traceForm, glass_kind: e.target.value })}
                >
                  <option value="AN">AN (Annealed)</option>
                  <option value="HS">HS (Heat Strengthened)</option>
                  <option value="FT">FT (Fully Tempered)</option>
                  <option value="CS">CS (Chemically Strengthened)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('thickness')}</label>
                <select
                  className="form-select"
                  value={traceForm.nominal_thickness}
                  onChange={(e) => setTraceForm({ ...traceForm, nominal_thickness: e.target.value })}
                >
                  {thicknessOptions.map(tVal => (
                    <option key={tVal} value={tVal}>{tVal}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('collectionWeek')}</label>
                <select
                  className="form-select"
                  value={traceForm.collection_week}
                  onChange={(e) => setTraceForm({ ...traceForm, collection_week: parseInt(e.target.value) })}
                >
                  <option value={1}>{t('week')} 1</option>
                  <option value={2}>{t('week')} 2</option>
                  <option value={3}>{t('week')} 3</option>
                  <option value={4}>{t('week')} 4</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t('saving') : t('saveTraceability')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleTestSubmit}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14 }}>{t('addTestResult')} (Section B)</h3>
            
            <div className="form-group">
              <label className="form-label">{t('linkToTraceabilityRecord')}</label>
              <select
                className="form-select"
                value={selectedTraceId}
                onChange={(e) => {
                  setSelectedTraceId(e.target.value);
                  setTestForm({ ...testForm, traceability_id: e.target.value });
                }}
                required
              >
                <option value="">{t('selectSpecimenRecordPlaceholder')}</option>
                {existingTraceability.map(item => (
                  <option key={item.id} value={item.id}>
                    [{item.production_date}] {item.interlayer_type} - {item.nominal_thickness} (Week {item.collection_week})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('specimenNumber')}</label>
                <select
                  className="form-select"
                  value={testForm.specimen_number}
                  onChange={(e) => setTestForm({ ...testForm, specimen_number: parseInt(e.target.value) })}
                >
                  <option value={1}>Specimen 1</option>
                  <option value={2}>Specimen 2</option>
                  <option value={3}>Specimen 3</option>
                  <option value={4}>Specimen 4</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('dropClass')}</label>
                <select
                  className="form-select"
                  value={testForm.drop_height_class}
                  onChange={(e) => setTestForm({ ...testForm, drop_height_class: e.target.value })}
                >
                  <option value="Class A">Class A (3.66 m / 12 ft)</option>
                  <option value="Class B">Class B (0.75 m / 2.46 ft)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('testDate')}</label>
                <input
                  type="date"
                  className="form-input"
                  value={testForm.test_date}
                  onChange={(e) => setTestForm({ ...testForm, test_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('testTime')}</label>
                <input
                  type="time"
                  className="form-input"
                  value={testForm.test_time}
                  onChange={(e) => setTestForm({ ...testForm, test_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('temperature')}</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="number"
                    step="0.5"
                    className="form-input"
                    value={testForm.specimen_temp}
                    onChange={(e) => setTestForm({ ...testForm, specimen_temp: e.target.value })}
                    required
                  />
                  <select
                    className="form-select"
                    style={{ width: 80 }}
                    value={testForm.temp_unit}
                    onChange={(e) => setTestForm({ ...testForm, temp_unit: e.target.value })}
                  >
                    <option value="F">°F</option>
                    <option value="C">°C</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t('minThickness')}</label>
                <input
                  type="number"
                  step="0.001"
                  className="form-input"
                  value={testForm.measured_min_thickness}
                  onChange={(e) => setTestForm({ ...testForm, measured_min_thickness: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Mandatory ASTM Category Result Confirmation */}
            <PassFailConfirm
              type="laminated"
              suggestedValue="1"
              confirmedValue={testForm.confirmed_result}
              onConfirm={(cat) => setTestForm({ ...testForm, confirmed_result: cat })}
            />

            <PhotoCapture
              photoPath={testForm.photo_path}
              onPhotoUploaded={(path) => setTestForm({ ...testForm, photo_path: path })}
            />

            <div className="form-group">
              <label className="form-label">{t('notes')}</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={testForm.notes}
                onChange={(e) => setTestForm({ ...testForm, notes: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading || !testForm.confirmed_result || !selectedTraceId}>
              {loading ? t('saving') : t('saveTestResult')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

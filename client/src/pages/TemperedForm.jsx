import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { PhotoCapture } from '../components/PhotoCapture';
import { PassFailConfirm } from '../components/PassFailConfirm';
import { BackButton } from '../components/BackButton';
import { Flame, CheckCircle, ShieldAlert } from 'lucide-react';

export const TemperedForm = ({ setTab }) => {
  const { user, token } = useAuth();
  const { t } = useLanguage();

  const getNowDate = () => new Date().toISOString().split('T')[0];
  const getNowTime = () => new Date().toTimeString().split(' ')[0].substring(0, 5);

  const [thicknessOptions, setThicknessOptions] = useState([
    '1/8"', '5/32"', '3/16"', '1/4"', '5/16"', '3/8"', '1/2"', '5/8"', '3/4"'
  ]);

  const parseThickness = (str) => {
    if (!str) return 0.25;
    if (str.includes('1/8')) return 0.125;
    if (str.includes('5/32')) return 0.15625;
    if (str.includes('3/16')) return 0.1875;
    if (str.includes('1/4')) return 0.25;
    if (str.includes('5/16')) return 0.3125;
    if (str.includes('3/8')) return 0.375;
    if (str.includes('1/2')) return 0.5;
    if (str.includes('5/8')) return 0.625;
    if (str.includes('3/4')) return 0.75;
    const num = parseFloat(str);
    return isNaN(num) ? 0.25 : num;
  };

  const parseArea = (str) => {
    if (!str) return 2584; // 34x76 default = 2584 sq in
    const parts = str.toLowerCase().split('x');
    if (parts.length === 2) {
      const w = parseFloat(parts[0]);
      const h = parseFloat(parts[1]);
      if (!isNaN(w) && !isNaN(h)) return w * h;
    }
    const num = parseFloat(str);
    return isNaN(num) ? 2584 : num;
  };

  const computeNominalValues = (thicknessStr, sizeStr, customWeightStr) => {
    const tIn = parseThickness(thicknessStr);
    const area = parseArea(sizeStr);
    const calculatedWeight = (area * tIn * 0.091).toFixed(1);
    const weightLbs = customWeightStr !== undefined && customWeightStr !== '' ? parseFloat(customWeightStr) : parseFloat(calculatedWeight);
    const maxVal = (weightLbs > 0 && area > 0) ? (((weightLbs / area) * 10) * 453.59).toFixed(1) : '103.2';
    return { calculatedWeight, maxVal };
  };

  const initialValues = computeNominalValues('1/4"', '34x76');

  const [formData, setFormData] = useState({
    test_date: getNowDate(),
    test_time: getNowTime(),
    sgcc_number: 'CUS01CA',
    glass_type: 'TTG (Non-Pattern)',
    thickness: '1/4"',
    sample_size: '34x76',
    specimen_weight_lbs: initialValues.calculatedWeight,
    max_allowable_particle_weight: initialValues.maxVal,
    actual_10pc_particle_weight: '',
    operator_name: user?.username || '',
    photo_path: null,
    notes: ''
  });

  const [suggestedResult, setSuggestedResult] = useState('Pass');
  const [confirmedResult, setConfirmedResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Fetch dropdown options from API if available and deduplicate
  useEffect(() => {
    fetch('/api/config-lists', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.thickness && data.thickness.length > 0) {
          const uniqueValues = Array.from(new Set(data.thickness.map(item => item.value)));
          setThicknessOptions(uniqueValues);
        }
      })
      .catch(() => {});
  }, [token]);

  const handleThicknessChange = (newThickness) => {
    const { calculatedWeight, maxVal } = computeNominalValues(newThickness, formData.sample_size);
    setFormData(prev => ({
      ...prev,
      thickness: newThickness,
      specimen_weight_lbs: calculatedWeight,
      max_allowable_particle_weight: maxVal
    }));
  };

  const handleSampleSizeChange = (newSize) => {
    const { calculatedWeight, maxVal } = computeNominalValues(formData.thickness, newSize);
    setFormData(prev => ({
      ...prev,
      sample_size: newSize,
      specimen_weight_lbs: calculatedWeight,
      max_allowable_particle_weight: maxVal
    }));
  };

  const handleSpecimenWeightChange = (newWeight) => {
    const { maxVal } = computeNominalValues(formData.thickness, formData.sample_size, newWeight);
    setFormData(prev => ({
      ...prev,
      specimen_weight_lbs: newWeight,
      max_allowable_particle_weight: maxVal
    }));
  };

  // Auto-calculate suggested Pass/Fail result
  useEffect(() => {
    const actual = parseFloat(formData.actual_10pc_particle_weight);
    const maxVal = parseFloat(formData.max_allowable_particle_weight);

    if (!isNaN(actual) && !isNaN(maxVal)) {
      if (actual <= maxVal) {
        setSuggestedResult('Pass');
      } else {
        setSuggestedResult('Fail');
      }
    }
  }, [formData.actual_10pc_particle_weight, formData.max_allowable_particle_weight]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!confirmedResult) {
      setErrorMsg(t('confirmMandatoryError'));
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/tempered-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          suggested_pass_fail: suggestedResult,
          confirmed_pass_fail: confirmedResult
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(t('recordSaved'));
        setTimeout(() => {
          setTab('records');
        }, 1200);
      } else {
        setErrorMsg(data.error || 'Failed to save test record');
      }
    } catch (err) {
      setErrorMsg('Network error while saving record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <BackButton onClick={() => setTab('dashboard')} />

      <div className="card">
        <div className="card-title">
          <Flame size={24} color="var(--accent-primary)" />
          <span>{t('temperedTitle')}</span>
        </div>

        <div className="reminder-banner" style={{ padding: '10px 12px', marginBottom: 16 }}>
          <ShieldAlert size={20} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.82rem' }}>{t('temperedBanner')}</span>
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

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('date')}</label>
              <input
                type="date"
                className="form-input"
                value={formData.test_date}
                onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('time')}</label>
              <input
                type="time"
                className="form-input"
                value={formData.test_time}
                onChange={(e) => setFormData({ ...formData, test_time: e.target.value })}
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
                placeholder="e.g. 1234-SGCC"
                value={formData.sgcc_number}
                onChange={(e) => setFormData({ ...formData, sgcc_number: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('glassType')}</label>
              <select
                className="form-select"
                value={formData.glass_type}
                onChange={(e) => setFormData({ ...formData, glass_type: e.target.value })}
              >
                <option value="TTG (Non-Pattern)">TTG (Non-Pattern)</option>
                <option value="TPG (Pattern)">TPG (Pattern)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('thickness')}</label>
              <select
                className="form-select"
                value={formData.thickness}
                onChange={(e) => handleThicknessChange(e.target.value)}
              >
                {thicknessOptions.map(tVal => (
                  <option key={tVal} value={tVal}>{tVal}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('sampleSize')}</label>
              <input
                type="text"
                className="form-input"
                value={formData.sample_size}
                onChange={(e) => handleSampleSizeChange(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('specimenWeightLbs')}</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={formData.specimen_weight_lbs}
                onChange={(e) => handleSpecimenWeightChange(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('maxAllowableWeight')}</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={formData.max_allowable_particle_weight}
                onChange={(e) => setFormData({ ...formData, max_allowable_particle_weight: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('actual10pcWeight')}</label>
            <input
              type="number"
              step="0.1"
              className="form-input"
              style={{ fontSize: '1.2rem', fontWeight: 700 }}
              placeholder="e.g. 24.5"
              value={formData.actual_10pc_particle_weight}
              onChange={(e) => setFormData({ ...formData, actual_10pc_particle_weight: e.target.value })}
              required
            />
          </div>

          {/* Mandatory Pass/Fail Confirmation Component */}
          <PassFailConfirm
            type="tempered"
            suggestedValue={suggestedResult}
            confirmedValue={confirmedResult}
            onConfirm={(val) => setConfirmedResult(val)}
          />

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('operatorName')}</label>
              <input
                type="text"
                className="form-input"
                value={formData.operator_name}
                onChange={(e) => setFormData({ ...formData, operator_name: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Photo Upload / Camera Component */}
          <PhotoCapture
            photoPath={formData.photo_path}
            onPhotoUploaded={(path) => setFormData({ ...formData, photo_path: path })}
          />

          <div className="form-group">
            <label className="form-label">{t('notes')}</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !confirmedResult}
          >
            {loading ? t('saving') : t('submitRecord')}
          </button>
        </form>
      </div>
    </div>
  );
};

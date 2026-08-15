import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BackButton } from '../components/BackButton';
import { FileSpreadsheet, Download, Image as ImageIcon, History, X, Eye, Edit, Trash2, CheckCircle2 } from 'lucide-react';

export const RecordsList = ({ setTab }) => {
  const { token, user } = useAuth();
  const { t } = useLanguage();

  const [activeType, setActiveType] = useState('tempered'); // 'tempered', 'laminated', or 'rollwave'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sgccFilter, setSgccFilter] = useState('');

  const [temperedRecords, setTemperedRecords] = useState([]);
  const [laminatedRecords, setLaminatedRecords] = useState([]);
  const [rollWaveRecords, setRollWaveRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const [auditModal, setAuditModal] = useState({ open: false, logs: [], title: '' });
  const [viewModal, setViewModal] = useState({ open: false, record: null, type: 'tempered' });
  const [editModal, setEditModal] = useState({ open: false, record: null, type: 'tempered' });

  const fetchRecords = () => {
    setLoading(true);
    let params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (sgccFilter) params.append('sgcc_number', sgccFilter);

    if (activeType === 'tempered') {
      fetch(`/api/tempered-tests?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setTemperedRecords(data); })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (activeType === 'rollwave') {
      fetch(`/api/roll-wave-tests?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setRollWaveRecords(data); })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      fetch(`/api/laminated/traceability?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setLaminatedRecords(data); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [activeType, startDate, endDate, sgccFilter, token]);

  const downloadFile = (url, defaultFilename) => {
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Export failed');
        return res.blob();
      })
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = defaultFilename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      })
      .catch(() => {
        window.open(`${url}&token=${encodeURIComponent(token)}`, '_blank');
      });
  };

  const handleExportCsv = () => {
    const exportType = activeType === 'rollwave' ? 'roll_wave' : activeType;
    const url = `/api/export/csv?type=${exportType}&startDate=${startDate}&endDate=${endDate}`;
    downloadFile(url, `${exportType}_test_records.csv`);
  };

  const handleExportPdf = () => {
    const exportType = activeType === 'rollwave' ? 'roll_wave' : activeType;
    const url = `/api/export/pdf?type=${exportType}&startDate=${startDate}&endDate=${endDate}`;
    downloadFile(url, `${exportType}_audit_report.pdf`);
  };

  const openAuditLogs = (entityType, entityId) => {
    fetch(`/api/audit-logs?entity_type=${entityType}&entity_id=${entityId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(logs => {
        setAuditModal({ open: true, logs: Array.isArray(logs) ? logs : [], title: `${entityType} #${entityId}` });
      })
      .catch(() => {});
  };

  const handleDeleteRecord = async (id, type) => {
    if (!window.confirm(t('confirmDeleteAlert'))) return;
    try {
      let url = `/api/tempered-tests/${id}`;
      if (type === 'laminated') url = `/api/laminated/traceability/${id}`;
      if (type === 'rollwave') url = `/api/roll-wave-tests/${id}`;

      const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert(t('recordDeletedSuccess'));
        fetchRecords();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete record');
      }
    } catch (err) {
      alert('Error deleting record');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const { record, type } = editModal;
    try {
      let url = `/api/tempered-tests/${record.id}`;
      if (type === 'laminated') url = `/api/laminated/traceability/${record.id}`;
      if (type === 'rollwave') url = `/api/roll-wave-tests/${record.id}`;

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(record)
      });
      if (res.ok) {
        alert(t('recordUpdatedSuccess'));
        setEditModal({ open: false, record: null, type: 'tempered' });
        fetchRecords();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update record');
      }
    } catch (err) {
      alert('Error updating record');
    }
  };

  return (
    <div>
      {setTab && <BackButton onClick={() => setTab('dashboard')} />}
      <div className="card">
        <div className="card-title" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileSpreadsheet size={24} color="var(--success-text)" />
            <span>{t('recordsList')}</span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" style={{ minHeight: 36, padding: '6px 12px', fontSize: '0.82rem' }} onClick={handleExportCsv}>
              <Download size={14} /> {t('exportCsv')}
            </button>
            <button className="btn btn-primary" style={{ minHeight: 36, padding: '6px 12px', fontSize: '0.82rem' }} onClick={handleExportPdf}>
              <Download size={14} /> {t('exportPdf')}
            </button>
          </div>
        </div>

        {/* Record Type Selector (3 Tabs) */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button
            className={`btn ${activeType === 'tempered' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, minWidth: 140, minHeight: 40, fontSize: '0.85rem' }}
            onClick={() => setActiveType('tempered')}
          >
            {t('newTemperedTest')}
          </button>
          <button
            className={`btn ${activeType === 'laminated' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, minWidth: 140, minHeight: 40, fontSize: '0.85rem' }}
            onClick={() => setActiveType('laminated')}
          >
            {t('newLaminatedTest')}
          </button>
          <button
            className={`btn ${activeType === 'rollwave' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, minWidth: 140, minHeight: 40, fontSize: '0.85rem' }}
            onClick={() => setActiveType('rollwave')}
          >
            {t('newRollWaveTest')}
          </button>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <div className="filter-item">
            <label className="form-label" style={{ fontSize: '0.78rem' }}>{t('startDate')}</label>
            <input
              type="date"
              className="form-input"
              style={{ minHeight: 38, padding: '6px 10px', fontSize: '0.85rem' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="filter-item">
            <label className="form-label" style={{ fontSize: '0.78rem' }}>{t('endDate')}</label>
            <input
              type="date"
              className="form-input"
              style={{ minHeight: 38, padding: '6px 10px', fontSize: '0.85rem' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="filter-item">
            <label className="form-label" style={{ fontSize: '0.78rem' }}>{t('sgccNumber')}</label>
            <input
              type="text"
              className="form-input"
              style={{ minHeight: 38, padding: '6px 10px', fontSize: '0.85rem' }}
              placeholder="Search SGCC #"
              value={sgccFilter}
              onChange={(e) => setSgccFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>{t('loadingRecords')}</div>
        ) : activeType === 'tempered' ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('dateTime')}</th>
                  <th>{t('sgccNumber')}</th>
                  <th>{t('thickness')}</th>
                  <th>{t('maxWt')}</th>
                  <th>{t('pcWt10')}</th>
                  <th>{t('result')}</th>
                  <th>{t('operatorName')}</th>
                  <th>{t('photo')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {temperedRecords.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{t('noTemperedRecords')}</td></tr>
                ) : (
                  temperedRecords.map(r => (
                    <tr key={r.id}>
                      <td>{r.test_date ? r.test_date.substring(0, 10) : ''} {r.test_time}</td>
                      <td style={{ fontWeight: 600 }}>{r.sgcc_number}</td>
                      <td>{r.thickness}</td>
                      <td>{r.max_allowable_particle_weight}g</td>
                      <td style={{ fontWeight: 700 }}>{r.actual_10pc_particle_weight}g</td>
                      <td>
                        <span className={`suggested-badge ${r.confirmed_pass_fail === 'Pass' ? 'badge-pass' : 'badge-fail'}`}>
                          {r.confirmed_pass_fail}
                        </span>
                      </td>
                      <td>{r.operator_name}</td>
                      <td>
                        {r.photo_path ? (
                          <button 
                            className="icon-btn" 
                            style={{ width: 32, height: 32 }}
                            onClick={() => setViewModal({ open: true, record: r, type: 'tempered' })}
                            title="View Specimen Photo"
                          >
                            <ImageIcon size={16} color="var(--accent-primary)" />
                          </button>
                        ) : '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button 
                            className="icon-btn" 
                            style={{ width: 30, height: 30 }}
                            onClick={() => setViewModal({ open: true, record: r, type: 'tempered' })}
                            title="View Log Details & Photo"
                          >
                            <Eye size={15} />
                          </button>

                          {(user?.role === 'QA Rep' || user?.role === 'Admin') && (
                            <button 
                              className="icon-btn" 
                              style={{ width: 30, height: 30 }}
                              onClick={() => openAuditLogs('tempered', r.id)}
                              title="View Audit Trail"
                            >
                              <History size={15} />
                            </button>
                          )}

                          {user?.role === 'Admin' && (
                            <>
                              <button 
                                className="icon-btn" 
                                style={{ width: 30, height: 30, color: 'var(--accent-primary)' }}
                                onClick={() => setEditModal({ open: true, record: { ...r, test_date: r.test_date ? r.test_date.substring(0, 10) : '' }, type: 'tempered' })}
                                title="Edit Record (Admin)"
                              >
                                <Edit size={15} />
                              </button>
                              <button 
                                className="icon-btn" 
                                style={{ width: 30, height: 30, color: 'var(--danger-text)' }}
                                onClick={() => handleDeleteRecord(r.id, 'tempered')}
                                title="Delete Record (Admin)"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : activeType === 'rollwave' ? (
          /* Roll Wave Data Table */
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('dateTime')}</th>
                  <th>{t('sgccNumber')}</th>
                  <th>{t('specimenIdCol')}</th>
                  <th>{t('thickness')}</th>
                  <th>{t('gaugeType')}</th>
                  <th>{t('avgLCol')}</th>
                  <th>{t('maxWCol')}</th>
                  <th>{t('maxDistortionCol')}</th>
                  <th>{t('result')}</th>
                  <th>{t('operatorName')}</th>
                  <th>{t('photo')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {rollWaveRecords.length === 0 ? (
                  <tr><td colSpan={12} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{t('noRollWaveRecords')}</td></tr>
                ) : (
                  rollWaveRecords.map(r => (
                    <tr key={r.id}>
                      <td>{r.test_date ? r.test_date.substring(0, 10) : ''} {r.test_time}</td>
                      <td style={{ fontWeight: 600 }}>{r.sgcc_number}</td>
                      <td>{r.specimen_id}</td>
                      <td>{r.glass_thickness}</td>
                      <td>{r.gauge_type}</td>
                      <td>{r.average_wavelength !== null ? `${r.average_wavelength} ${r.unit === 'mm' ? 'mm' : 'in'}` : 'N/A'}</td>
                      <td>{r.max_depth} {r.unit === 'mm' ? 'mm' : 'in'}</td>
                      <td style={{ fontWeight: 700 }}>{r.max_distortion_mdpt} mdpt</td>
                      <td>
                        <span className={`suggested-badge ${r.confirmed_pass_fail === 'Pass' ? 'badge-pass' : 'badge-fail'}`}>
                          {r.confirmed_pass_fail}
                        </span>
                      </td>
                      <td>{r.operator_name}</td>
                      <td>
                        {r.photo_path ? (
                          <button 
                            className="icon-btn" 
                            style={{ width: 32, height: 32 }}
                            onClick={() => setViewModal({ open: true, record: r, type: 'rollwave' })}
                            title="View Photo"
                          >
                            <ImageIcon size={16} color="var(--accent-primary)" />
                          </button>
                        ) : '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button 
                            className="icon-btn" 
                            style={{ width: 30, height: 30 }}
                            onClick={() => setViewModal({ open: true, record: r, type: 'rollwave' })}
                            title="View Log Details"
                          >
                            <Eye size={15} />
                          </button>

                          {(user?.role === 'QA Rep' || user?.role === 'Admin') && (
                            <button 
                              className="icon-btn" 
                              style={{ width: 30, height: 30 }}
                              onClick={() => openAuditLogs('roll_wave', r.id)}
                              title="View Audit Trail"
                            >
                              <History size={15} />
                            </button>
                          )}

                          {user?.role === 'Admin' && (
                            <>
                              <button 
                                className="icon-btn" 
                                style={{ width: 30, height: 30, color: 'var(--accent-primary)' }}
                                onClick={() => setEditModal({ open: true, record: { ...r, test_date: r.test_date ? r.test_date.substring(0, 10) : '' }, type: 'rollwave' })}
                                title="Edit Record (Admin)"
                              >
                                <Edit size={15} />
                              </button>
                              <button 
                                className="icon-btn" 
                                style={{ width: 30, height: 30, color: 'var(--danger-text)' }}
                                onClick={() => handleDeleteRecord(r.id, 'rollwave')}
                                title="Delete Record (Admin)"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Laminated Data Table */
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('productionDate')}</th>
                  <th>{t('sgccNumber')}</th>
                  <th>{t('interlayerCol')}</th>
                  <th>{t('typeKindCol')}</th>
                  <th>{t('thickness')}</th>
                  <th>{t('week')}</th>
                  <th>{t('testSpecimensCol')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {laminatedRecords.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{t('noLaminatedRecords')}</td></tr>
                ) : (
                  laminatedRecords.map(r => (
                    <tr key={r.id}>
                      <td>{r.production_date ? r.production_date.substring(0, 10) : ''} {r.production_time}</td>
                      <td style={{ fontWeight: 600 }}>{r.sgcc_number || 'N/A'}</td>
                      <td>{r.interlayer_type}</td>
                      <td>{r.glass_type} ({r.glass_kind})</td>
                      <td>{r.nominal_thickness}</td>
                      <td>Wk {r.collection_week}</td>
                      <td>
                        {r.test_results && r.test_results.length > 0 ? (
                          <div style={{ fontSize: '0.8rem' }}>
                            {r.test_results.map(res => (
                              <div key={res.id} style={{ marginBottom: 4 }}>
                                #{res.specimen_number}: {res.test_date ? res.test_date.substring(0, 10) : ''} | {res.drop_height_class} | <strong style={{ color: 'var(--success-text)' }}>Cat {res.confirmed_result}</strong>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t('noSpecimensTested')}</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button 
                            className="icon-btn" 
                            style={{ width: 30, height: 30 }}
                            onClick={() => setViewModal({ open: true, record: r, type: 'laminated' })}
                            title="View Log Details"
                          >
                            <Eye size={15} />
                          </button>

                          {(user?.role === 'QA Rep' || user?.role === 'Admin') && (
                            <button 
                              className="icon-btn" 
                              style={{ width: 30, height: 30 }}
                              onClick={() => openAuditLogs('laminated_traceability', r.id)}
                              title="View Audit Trail"
                            >
                              <History size={15} />
                            </button>
                          )}

                          {user?.role === 'Admin' && (
                            <>
                              <button 
                                className="icon-btn" 
                                style={{ width: 30, height: 30, color: 'var(--accent-primary)' }}
                                onClick={() => setEditModal({ open: true, record: { ...r, production_date: r.production_date ? r.production_date.substring(0, 10) : '' }, type: 'laminated' })}
                                title="Edit Traceability (Admin)"
                              >
                                <Edit size={15} />
                              </button>
                              <button 
                                className="icon-btn" 
                                style={{ width: 30, height: 30, color: 'var(--danger-text)' }}
                                onClick={() => handleDeleteRecord(r.id, 'laminated')}
                                title="Delete Record (Admin)"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail View Modal */}
      {viewModal.open && viewModal.record && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 550, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-title" style={{ justifyContent: 'space-between' }}>
              <span>
                {t('logDetailsTitle')} - {viewModal.type === 'tempered' ? `Tempered #${viewModal.record.id}` : viewModal.type === 'rollwave' ? `Roll Wave #${viewModal.record.id}` : `Laminated #${viewModal.record.id}`}
              </span>
              <button className="icon-btn" onClick={() => setViewModal({ open: false, record: null, type: 'tempered' })}>
                <X size={18} />
              </button>
            </div>

            {viewModal.type === 'tempered' ? (
              <div style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                <div><strong>{t('dateTime')}:</strong> {viewModal.record.test_date ? viewModal.record.test_date.substring(0, 10) : ''} {viewModal.record.test_time}</div>
                <div><strong>{t('sgccNumber')}:</strong> {viewModal.record.sgcc_number}</div>
                <div><strong>{t('glassType')}:</strong> {viewModal.record.glass_type}</div>
                <div><strong>{t('thickness')}:</strong> {viewModal.record.thickness}</div>
                <div><strong>{t('sampleSize')}:</strong> {viewModal.record.sample_size}</div>
                <div><strong>{t('specimenWeightLbs')}:</strong> {viewModal.record.specimen_weight_lbs} lbs</div>
                <div><strong>{t('maxAllowableWeight')}:</strong> {viewModal.record.max_allowable_particle_weight} g</div>
                <div><strong>{t('actual10pcWeight')}:</strong> {viewModal.record.actual_10pc_particle_weight} g</div>
                <div><strong>{t('result')}:</strong> <span className={`suggested-badge ${viewModal.record.confirmed_pass_fail === 'Pass' ? 'badge-pass' : 'badge-fail'}`}>{viewModal.record.confirmed_pass_fail}</span></div>
                <div><strong>{t('operatorName')}:</strong> {viewModal.record.operator_name}</div>
                {viewModal.record.notes && <div><strong>{t('notes')}:</strong> {viewModal.record.notes}</div>}
                
                {viewModal.record.photo_path ? (
                  <div style={{ marginTop: 14, textAlign: 'center' }}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>{t('uploadedPhoto')}:</div>
                    <img src={viewModal.record.photo_path} alt="Specimen Photo" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, border: '1px solid var(--border-color)' }} />
                  </div>
                ) : (
                  <div style={{ marginTop: 10, color: 'var(--text-muted)' }}>{t('noPhoto')}</div>
                )}
              </div>
            ) : viewModal.type === 'rollwave' ? (
              <div style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                <div><strong>{t('dateTime')}:</strong> {viewModal.record.test_date ? viewModal.record.test_date.substring(0, 10) : ''} {viewModal.record.test_time}</div>
                <div><strong>{t('sgccNumber')}:</strong> {viewModal.record.sgcc_number}</div>
                <div><strong>{t('specimenId')}:</strong> {viewModal.record.specimen_id}</div>
                <div><strong>{t('thickness')}:</strong> {viewModal.record.glass_thickness}</div>
                <div><strong>{t('gaugeType')}:</strong> {viewModal.record.gauge_type} ({viewModal.record.unit})</div>
                <div><strong>{t('avgWavelength')}:</strong> {viewModal.record.average_wavelength !== null ? `${viewModal.record.average_wavelength} ${viewModal.record.unit === 'mm' ? 'mm' : 'in'}` : 'N/A'}</div>
                <div><strong>{t('depthRange')}:</strong> W_min={viewModal.record.min_depth}, W_max={viewModal.record.max_depth}, W_avg={viewModal.record.avg_depth} {viewModal.record.unit === 'mm' ? 'mm' : 'in'}</div>
                <div><strong>{t('maxDistortion')}:</strong> D_max = <strong>{viewModal.record.max_distortion_mdpt} mdpt</strong> | D_avg = {viewModal.record.avg_distortion_mdpt} mdpt</div>
                <div><strong>{t('thresholdMdpt')}:</strong> {viewModal.record.distortion_threshold_mdpt ? `${viewModal.record.distortion_threshold_mdpt} mdpt` : 'N/A'}</div>
                <div><strong>{t('result')}:</strong> <span className={`suggested-badge ${viewModal.record.confirmed_pass_fail === 'Pass' ? 'badge-pass' : 'badge-fail'}`}>{viewModal.record.confirmed_pass_fail}</span></div>
                <div><strong>{t('operatorName')}:</strong> {viewModal.record.operator_name}</div>
                {viewModal.record.notes && <div><strong>{t('notes')}:</strong> {viewModal.record.notes}</div>}
                
                {viewModal.record.photo_path ? (
                  <div style={{ marginTop: 14, textAlign: 'center' }}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>{t('uploadedPhoto')}:</div>
                    <img src={viewModal.record.photo_path} alt="Specimen Photo" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, border: '1px solid var(--border-color)' }} />
                  </div>
                ) : (
                  <div style={{ marginTop: 10, color: 'var(--text-muted)' }}>{t('noPhoto')}</div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                <div><strong>{t('productionDate')}:</strong> {viewModal.record.production_date ? viewModal.record.production_date.substring(0, 10) : ''} {viewModal.record.production_time}</div>
                <div><strong>{t('sgccNumber')}:</strong> {viewModal.record.sgcc_number || 'N/A'}</div>
                <div><strong>{t('interlayerType')}:</strong> {viewModal.record.interlayer_type}</div>
                <div><strong>{t('glassType')}:</strong> {viewModal.record.glass_type} ({viewModal.record.glass_kind})</div>
                <div><strong>{t('thickness')}:</strong> {viewModal.record.nominal_thickness}</div>
                <div><strong>{t('collectionWeek')}:</strong> {t('week')} {viewModal.record.collection_week}</div>

                <div style={{ marginTop: 12, fontWeight: 700 }}>{t('testSpecimensCol')}:</div>
                {viewModal.record.test_results && viewModal.record.test_results.length > 0 ? (
                  viewModal.record.test_results.map(res => (
                    <div key={res.id} style={{ border: '1px solid var(--border-color)', borderRadius: 6, padding: 8, marginTop: 6, backgroundColor: 'var(--bg-primary)' }}>
                      <div><strong>{t('specimenNumber')} #{res.specimen_number}:</strong> Tested {res.test_date ? res.test_date.substring(0, 10) : ''}</div>
                      <div>{t('dropClass')}: {res.drop_height_class} | Temp: {res.specimen_temp}°{res.temp_unit} | {t('minThickness')}: {res.measured_min_thickness}"</div>
                      <div>{t('result')}: <strong>Cat {res.confirmed_result}</strong></div>
                      {res.photo_path && (
                        <div style={{ marginTop: 6, textAlign: 'center' }}>
                          <img src={res.photo_path} alt="Specimen Photo" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 6 }} />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('noSpecimensTested')}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal (Admin Only) */}
      {editModal.open && editModal.record && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-title" style={{ justifyContent: 'space-between' }}>
              <span>{t('editLogTitle')}</span>
              <button className="icon-btn" onClick={() => setEditModal({ open: false, record: null, type: 'tempered' })}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              {editModal.type === 'tempered' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">{t('sgccNumber')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editModal.record.sgcc_number || ''}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, sgcc_number: e.target.value } })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('actual10pcWeight')}</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      value={editModal.record.actual_10pc_particle_weight || ''}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, actual_10pc_particle_weight: e.target.value } })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('result')}</label>
                    <select
                      className="form-select"
                      value={editModal.record.confirmed_pass_fail}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, confirmed_pass_fail: e.target.value } })}
                    >
                      <option value="Pass">Pass</option>
                      <option value="Fail">Fail</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('notes')}</label>
                    <textarea
                      className="form-textarea"
                      value={editModal.record.notes || ''}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, notes: e.target.value } })}
                    />
                  </div>
                </>
              ) : editModal.type === 'rollwave' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">{t('sgccNumber')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editModal.record.sgcc_number || ''}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, sgcc_number: e.target.value } })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('specimenId')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editModal.record.specimen_id || ''}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, specimen_id: e.target.value } })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('result')}</label>
                    <select
                      className="form-select"
                      value={editModal.record.confirmed_pass_fail}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, confirmed_pass_fail: e.target.value } })}
                    >
                      <option value="Pass">Pass</option>
                      <option value="Fail">Fail</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('notes')}</label>
                    <textarea
                      className="form-textarea"
                      value={editModal.record.notes || ''}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, notes: e.target.value } })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">{t('sgccNumber')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editModal.record.sgcc_number || ''}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, sgcc_number: e.target.value } })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('interlayerType')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editModal.record.interlayer_type || ''}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, interlayer_type: e.target.value } })}
                    />
                  </div>
                </>
              )}

              <button type="submit" className="btn btn-primary" style={{ marginTop: 10 }}>
                {t('saveChangesAudit')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Audit Logs Modal */}
      {auditModal.open && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 600, maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="card-title" style={{ justifyContent: 'space-between' }}>
              <span>{t('auditTrailTitle')} - {auditModal.title}</span>
              <button className="icon-btn" onClick={() => setAuditModal({ open: false, logs: [], title: '' })}>
                <X size={18} />
              </button>
            </div>
            
            {auditModal.logs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('noAuditLogs')}</p>
            ) : (
              auditModal.logs.map(log => (
                <div key={log.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Action: <strong>{log.action}</strong> by <strong>{log.changed_by_username}</strong> on {new Date(log.changed_at).toLocaleString()}
                  </div>
                  {log.old_values && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      Before: {typeof log.old_values === 'string' ? log.old_values : JSON.stringify(log.old_values)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

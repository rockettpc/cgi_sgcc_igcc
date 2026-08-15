import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Users, ListPlus, Trash2, Plus, Edit, X, KeyRound, Shield } from 'lucide-react';

export const AdminPanel = () => {
  const { token, user: currentUser } = useAuth();
  const { t } = useLanguage();

  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'Operator' });
  const [editUserModal, setEditUserModal] = useState({ open: false, user: null, role: 'Operator', newPassword: '' });

  const [configLists, setConfigLists] = useState({ thickness: [], glass_kind: [], interlayer_type: [] });
  const [newOption, setNewOption] = useState({ category: 'thickness', value: '', sort_order: 1 });

  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  const fetchUsers = () => {
    fetch('/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setUsers(data); })
      .catch(() => {});
  };

  const fetchConfigLists = () => {
    fetch('/api/config-lists', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setConfigLists(data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchUsers();
    fetchConfigLists();
  }, [token]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMsg(null);
    setError(null);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (res.ok) {
        setMsg(`User '${newUser.username}' created successfully as ${newUser.role}.`);
        setNewUser({ username: '', password: '', role: 'Operator' });
        fetchUsers();
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setError('Error creating user');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    const { user, role, newPassword } = editUserModal;
    setMsg(null);
    setError(null);
    try {
      const payload = { role };
      if (newPassword && newPassword.trim() !== '') {
        payload.password = newPassword;
      }
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setMsg(`User '${user.username}' updated successfully.`);
        setEditUserModal({ open: false, user: null, role: 'Operator', newPassword: '' });
        fetchUsers();
      } else {
        setError(data.error || 'Failed to update user');
      }
    } catch (err) {
      setError('Error updating user');
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (id === currentUser?.id) {
      alert('You cannot delete your own logged-in admin account.');
      return;
    }
    if (!window.confirm(`${t('confirmDeleteUser')} '${username}'?`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMsg(`User '${username}' deleted.`);
        fetchUsers();
      } else {
        setError(data.error || 'Failed to delete user');
      }
    } catch (err) {
      setError('Error deleting user');
    }
  };

  const handleAddOption = async (e) => {
    e.preventDefault();
    setMsg(null);
    setError(null);
    try {
      const res = await fetch('/api/config-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newOption)
      });
      if (res.ok) {
        setMsg(`Option '${newOption.value}' added to ${newOption.category}.`);
        setNewOption({ ...newOption, value: '' });
        fetchConfigLists();
      }
    } catch (err) {}
  };

  const handleDeleteOption = async (id) => {
    try {
      const res = await fetch(`/api/config-lists/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchConfigLists();
      }
    } catch (err) {}
  };

  return (
    <div>
      {msg && (
        <div style={{ padding: 12, backgroundColor: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-sm)', marginBottom: 16 }}>
          {msg}
        </div>
      )}

      {error && (
        <div style={{ padding: 12, backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* User Management Section */}
      <div className="card">
        <div className="card-title">
          <Users size={22} color="var(--accent-primary)" />
          <span>{t('manageUsers')}</span>
        </div>

        <form onSubmit={handleCreateUser} style={{ marginBottom: 20 }}>
          <div className="form-row">
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder={t('username')}
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                className="form-input"
                placeholder={t('password')}
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <select
                className="form-select"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                <option value="Operator">Operator</option>
                <option value="QA Rep">QA Rep</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ minHeight: 42 }}>
            <Plus size={16} /> {t('createUser')}
          </button>
        </form>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('username')}</th>
                <th>{t('role')}</th>
                <th>{t('date')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.username}</td>
                  <td>
                    <span className={`role-pill role-${u.role.toLowerCase().replace(/\s+/g, '')}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button 
                        className="icon-btn" 
                        style={{ width: 32, height: 32, color: 'var(--accent-primary)' }}
                        onClick={() => setEditUserModal({ open: true, user: u, role: u.role, newPassword: '' })}
                        title="Edit User Role / Reset Password"
                      >
                        <Edit size={15} />
                      </button>
                      <button 
                        className="icon-btn" 
                        style={{ width: 32, height: 32, color: 'var(--danger-text)' }}
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        title="Delete User"
                        disabled={u.id === currentUser?.id}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User & Role Modal */}
      {editUserModal.open && editUserModal.user && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 450 }}>
            <div className="card-title" style={{ justifyContent: 'space-between' }}>
              <span>{t('editUserTitle')}: {editUserModal.user.username}</span>
              <button className="icon-btn" onClick={() => setEditUserModal({ open: false, user: null, role: 'Operator', newPassword: '' })}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser}>
              <div className="form-group">
                <label className="form-label">{t('role')}</label>
                <select
                  className="form-select"
                  value={editUserModal.role}
                  onChange={(e) => setEditUserModal({ ...editUserModal, role: e.target.value })}
                >
                  <option value="Operator">Operator</option>
                  <option value="QA Rep">QA Rep</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('password')}</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder={t('password')}
                  value={editUserModal.newPassword}
                  onChange={(e) => setEditUserModal({ ...editUserModal, newPassword: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: 10 }}>
                {t('saveChangesAudit')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Configurable Dropdown Lists Section */}
      <div className="card">
        <div className="card-title">
          <ListPlus size={22} color="var(--accent-primary)" />
          <span>{t('manageOptions')}</span>
        </div>

        <form onSubmit={handleAddOption} style={{ marginBottom: 20 }}>
          <div className="form-row">
            <div className="form-group">
              <select
                className="form-select"
                value={newOption.category}
                onChange={(e) => setNewOption({ ...newOption, category: e.target.value })}
              >
                <option value="thickness">Thicknesses</option>
                <option value="glass_kind">Glass Kinds (AN, HS, FT, CS)</option>
                <option value="interlayer_type">Interlayer Types</option>
              </select>
            </div>
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="Option Value (e.g. 7/8'')"
                value={newOption.value}
                onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ minHeight: 42 }}>
            <Plus size={16} /> {t('addOption')}
          </button>
        </form>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {['thickness', 'glass_kind', 'interlayer_type'].map(cat => (
            <div key={cat} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: 12, backgroundColor: 'var(--bg-primary)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', textTransform: 'capitalize', marginBottom: 8 }}>
                {cat.replace('_', ' ')}
              </div>
              <ul style={{ listStyle: 'none' }}>
                {(configLists[cat] || []).map(opt => (
                  <li key={opt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px border var(--border-color)', fontSize: '0.85rem' }}>
                    <span>{opt.value}</span>
                    <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => handleDeleteOption(opt.id)}>
                      <Trash2 size={12} color="var(--danger-text)" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

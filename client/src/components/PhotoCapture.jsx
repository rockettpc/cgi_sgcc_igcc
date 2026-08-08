import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Camera, CheckCircle, Upload, X } from 'lucide-react';

export const PhotoCapture = ({ photoPath, onPhotoUploaded }) => {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(photoPath || null);
  const fileInputRef = useRef(null);

  const compressAndUpload = async (file) => {
    setUploading(true);
    try {
      // Client-side Canvas Image Compression (max 1600px longest edge, 80% quality)
      const imageBitmap = await createImageBitmap(file);
      const MAX_EDGE = 1600;
      let width = imageBitmap.width;
      let height = imageBitmap.height;

      if (width > MAX_EDGE || height > MAX_EDGE) {
        if (width > height) {
          height = Math.round((height * MAX_EDGE) / width);
          width = MAX_EDGE;
        } else {
          width = Math.round((width * MAX_EDGE) / height);
          height = MAX_EDGE;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imageBitmap, 0, 0, width, height);

      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.8);
      });

      const formData = new FormData();
      formData.append('photo', blob, 'specimen_photo.jpg');

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.photo_path) {
        setPreview(data.photo_path);
        onPhotoUploaded(data.photo_path);
      } else {
        alert(data.error || 'Failed to upload photo');
      }
    } catch (err) {
      console.error('Compression/upload error:', err);
      alert('Error compressing or uploading photo');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      compressAndUpload(file);
    }
  };

  return (
    <div className="form-group">
      <label className="form-label">{t('addPhoto')}</label>
      
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {preview ? (
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <img src={preview} alt="Specimen Test Photo" className="photo-preview" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, color: 'var(--success-text)', fontWeight: 600 }}>
            <CheckCircle size={16} />
            <span>{t('photoAdded')}</span>
            <button 
              type="button"
              className="icon-btn" 
              style={{ width: 28, height: 28, marginLeft: 10 }}
              onClick={() => { setPreview(null); onPhotoUploaded(null); }}
              title="Remove Photo"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="photo-box" onClick={() => fileInputRef.current?.click()}>
          <Camera size={32} color="var(--accent-primary)" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
            {uploading ? 'Compressing & Uploading...' : t('addPhoto')}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Direct Camera on Mobile • File Upload on Desktop
          </div>
        </div>
      )}
    </div>
  );
};

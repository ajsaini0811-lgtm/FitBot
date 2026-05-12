import { useState, useEffect, useRef } from 'react';
import { FiUpload, FiTrash2, FiCamera } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './ProgressPhotos.css';

export default function ProgressPhotos() {
  const [photos, setPhotos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState(null);
  const [file, setFile]       = useState(null);
  const [selected, setSelected] = useState(null); // for lightbox
  const fileRef               = useRef();

  async function load() {
    try {
      const { data } = await api.get('/progress-photos');
      setPhotos(data);
    } catch { toast.error('Could not load photos'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function onFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { toast.error('File must be under 10MB'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function upload() {
    if (!file) { toast.error('Please select a photo'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      if (caption) fd.append('caption', caption);
      await api.post('/progress-photos', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Photo uploaded!');
      setFile(null);
      setPreview(null);
      setCaption('');
      load();
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  }

  async function deletePhoto(id) {
    if (!confirm('Delete this photo?')) return;
    try {
      await api.delete(`/progress-photos/${id}`);
      setPhotos(p => p.filter(x => x.id !== id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  }

  function formatDate(d) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  if (loading) return (
    <div className="page-wrapper"><div className="loading-center"><div className="spinner" /></div></div>
  );

  return (
    <div className="page-wrapper">
      <div className="page-content pp-page">

        <div className="pp-header">
          <div>
            <h1 className="heading" style={{ margin: 0 }}>Progress Photos</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>See your transformation visually</p>
          </div>
        </div>

        {/* Upload Card */}
        <div className="card pp-upload-card">
          <div className="pp-upload-zone" onClick={() => fileRef.current?.click()}>
            {preview ? (
              <img src={preview} alt="preview" className="pp-preview-img" />
            ) : (
              <>
                <FiCamera size={32} color="var(--text-muted)" />
                <span>Tap to select photo</span>
                <span className="pp-upload-hint">JPG, PNG — max 10MB</span>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
          </div>

          {preview && (
            <div className="pp-upload-meta">
              <input
                className="form-input"
                type="text"
                placeholder="Add a caption (optional)"
                value={caption}
                onChange={e => setCaption(e.target.value)}
              />
              <div className="pp-upload-actions">
                <button className="btn btn-outline btn-sm" onClick={() => { setFile(null); setPreview(null); setCaption(''); }}>
                  Cancel
                </button>
                <button className="btn btn-primary btn-sm" onClick={upload} disabled={uploading}>
                  <FiUpload size={14} /> {uploading ? 'Uploading…' : 'Upload'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Gallery */}
        {photos.length === 0 ? (
          <div className="card pp-empty">
            <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
            <p>No progress photos yet. Upload your first one to start tracking your visual progress!</p>
          </div>
        ) : (
          <>
            <h2 className="pp-section-title">Your Journey ({photos.length} photos)</h2>
            <div className="pp-grid">
              {photos.map(p => (
                <div key={p.id} className="pp-card">
                  <div className="pp-img-wrap" onClick={() => setSelected(p)}>
                    <img src={p.imageUrl} alt={p.caption || 'Progress'} className="pp-img" />
                    <div className="pp-img-overlay">
                      <span>View</span>
                    </div>
                  </div>
                  <div className="pp-info">
                    <div className="pp-date">{formatDate(p.takenAt)}</div>
                    {p.caption && <div className="pp-caption">{p.caption}</div>}
                    <button className="pp-delete" onClick={() => deletePhoto(p.id)}>
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Lightbox */}
        {selected && (
          <div className="pp-lightbox" onClick={() => setSelected(null)}>
            <div className="pp-lightbox-inner" onClick={e => e.stopPropagation()}>
              <img src={selected.imageUrl} alt={selected.caption || ''} />
              {selected.caption && <div className="pp-lb-caption">{selected.caption}</div>}
              <div className="pp-lb-date">{formatDate(selected.takenAt)}</div>
              <button className="pp-lb-close" onClick={() => setSelected(null)}>✕</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

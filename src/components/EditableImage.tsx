import { useRef, useState } from 'react';
import { useAppState } from '../context/AppContext';
import { useContentState } from '../context/ContentContext';
import './EditableContent.css';

type EditableImageProps = {
  id: string;
  defaultSrc: string;
  alt: string;
  className?: string;
};

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024; // 3MB, comfortably under the server-side 4MB cap

export default function EditableImage({ id, defaultSrc, alt, className }: EditableImageProps) {
  const { isAdmin } = useAppState();
  const { getImage, saveContent, resetContent, content, editMode } = useContentState();
  const [pendingSrc, setPendingSrc] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const value = getImage(id, defaultSrc);
  const hasOverride = typeof content[id] === 'string' && content[id].length > 0;
  const canEdit = isAdmin && editMode;

  if (!canEdit) {
    return <img src={value} alt={alt} className={className} />;
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      setError('Image is too large. Please use an image under 3MB.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      setPendingSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!pendingSrc) return;
    setSaving(true);
    setError('');
    const result = await saveContent(id, pendingSrc);
    setSaving(false);
    if (!result.success) {
      setError(result.error || 'Failed to save image.');
      return;
    }
    setPendingSrc(null);
  };

  const handleReset = async () => {
    setSaving(true);
    setError('');
    const result = await resetContent(id);
    setSaving(false);
    if (!result.success) {
      setError(result.error || 'Failed to reset image.');
    }
  };

  return (
    <div className={`editable-image ${className || ''}`}>
      <img src={pendingSrc || value} alt={alt} className={className} />
      <div className="editable-image-overlay">
        <button type="button" className="editable-image-button" onClick={() => fileInputRef.current?.click()}>
          📷 Change image
        </button>
        {hasOverride && !pendingSrc && (
          <button type="button" className="editable-image-button secondary" onClick={handleReset} disabled={saving}>
            Reset to default
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="editable-image-input"
        onChange={handleFileChange}
      />
      {pendingSrc && (
        <div className="editable-image-confirm">
          <button type="button" className="editable-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save image'}
          </button>
          <button type="button" className="editable-cancel" onClick={() => setPendingSrc(null)} disabled={saving}>
            Cancel
          </button>
        </div>
      )}
      {error && <p className="editable-error editable-error-block">{error}</p>}
    </div>
  );
}

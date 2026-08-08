import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { useAppState } from '../context/AppContext';
import { useContentState } from '../context/ContentContext';
import './EditableContent.css';

type EditableTextProps = {
  id: string;
  defaultValue: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'li';
  className?: string;
  multiline?: boolean;
};

export default function EditableText({
  id,
  defaultValue,
  as = 'span',
  className,
  multiline,
}: EditableTextProps) {
  const { isAdmin } = useAppState();
  const { getText, saveContent, content, editMode } = useContentState();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const value = getText(id, defaultValue);
  const hasOverride = typeof content[id] === 'string' && content[id].length > 0;
  const useTextarea = multiline ?? (as === 'p' || value.length > 60);
  const canEdit = isAdmin && editMode;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
    }
  }, [isEditing]);

  if (!canEdit) {
    const Tag = as;
    return <Tag className={className}>{value}</Tag>;
  }

  const startEditing = () => {
    setDraft(value);
    setError('');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setError('');
  };

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setError('Text cannot be empty.');
      return;
    }
    setSaving(true);
    setError('');
    const result = await saveContent(id, trimmed);
    setSaving(false);
    if (!result.success) {
      setError(result.error || 'Failed to save.');
      return;
    }
    setIsEditing(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEditing();
    } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handleSave();
    } else if (event.key === 'Enter' && !useTextarea) {
      event.preventDefault();
      handleSave();
    }
  };

  if (isEditing) {
    return (
      <span className={`editable-field editable-field-active ${className || ''}`}>
        <textarea
          ref={textareaRef}
          className="editable-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={useTextarea ? Math.min(8, Math.max(2, Math.ceil(draft.length / 40))) : 1}
        />
        <span className="editable-actions">
          <button type="button" className="editable-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className="editable-cancel" onClick={cancelEditing} disabled={saving}>
            Cancel
          </button>
        </span>
        {error && <span className="editable-error">{error}</span>}
      </span>
    );
  }

  const Tag = as;
  return (
    <span className="editable-field">
      <Tag className={className}>{value}</Tag>
      <button
        type="button"
        className={`editable-pencil${hasOverride ? ' editable-pencil-active' : ''}`}
        onClick={startEditing}
        title="Edit this text"
        aria-label="Edit this text"
      >
        ✏️
      </button>
    </span>
  );
}

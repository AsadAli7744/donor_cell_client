import { useState } from 'react';
import axiosInstance from '../../../../utils/axios';
import { DONATION_BOX_FIELD_LABELS } from './donationBoxFieldLabels';

const FIELD_ORDER = [
  'box_id_no',
  'key_no',
  'box_type',
  'shop_name',
  'shopkeeper',
  'cell_no',
  'landmark_marketplace',
  'frequency',
];

const DonationBoxFieldNames = ({ labels, onSaved }) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(labels);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const start = () => {
    setDraft(labels);
    setError('');
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const response = await axiosInstance.put('/tenants/current/donation-box-labels', {
        labels: draft,
      });
      setOpen(false);
      if (onSaved) onSaved(response.data?.data || draft);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save field names');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button type="button" className="btn btn-secondary" onClick={start}>
        Field names
      </button>
    );
  }

  return (
    <div className="filters-section" style={{ marginBottom: 16 }}>
      <h3 className="form-section-heading">Field names for this organization</h3>
      <p style={{ marginTop: 0 }}>
        These names are shown on screens for this organization. The stored data does not change.
      </p>
      <div className="form-grid-2">
        {FIELD_ORDER.map((key) => (
          <label key={key} className="form-group">
            <span className="form-label">{DONATION_BOX_FIELD_LABELS[key]}</span>
            <input
              className="form-input"
              value={draft[key] || ''}
              maxLength={60}
              onChange={(event) =>
                setDraft((current) => ({ ...current, [key]: event.target.value }))
              }
            />
          </label>
        ))}
      </div>
      {error && <div className="status-message status-message--error">{error}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save names'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default DonationBoxFieldNames;

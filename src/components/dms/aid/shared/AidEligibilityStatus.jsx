import React, { useState } from 'react';
import axiosInstance from '../../../../utils/axios';
import FormSelect from '../../../common/FormSelect';
import { AID_BISP_STATUS, AID_NECTA_STATUS } from '../aidConstants';

/**
 * NECTA Status (Clear / Not Clear + attach doc/jpg)
 * BISP Eligible (Eligible / Not Eligible)
 */
const AidEligibilityStatus = ({
  value,
  onChange,
  title = 'NECTA / BISP',
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const patch = (partial) => onChange({ ...value, ...partial });

  const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];
  const ALLOWED_EXT = /\.(jpe?g|png|webp)$/i;

  const uploadNectaDoc = async (file) => {
    if (!file) return;
    const typeOk =
      ALLOWED_IMAGE_TYPES.includes(String(file.type || '').toLowerCase()) ||
      ALLOWED_EXT.test(file.name || '');
    if (!typeOk) {
      setUploadError('Only JPG, JPEG, PNG, or WEBP images are allowed');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('context', 'necta');
      const res = await axiosInstance.post(
        '/aid/applications/documents/upload',
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      const data = res.data?.data || {};
      patch({
        necta_document_url: data.url || '',
        necta_document_name: data.file_name || file.name,
      });
    } catch (err) {
      setUploadError(
        err.response?.data?.message || err.message || 'Upload failed',
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="aid-eligibility-status">
      {title ? <h4 className="aid-family-panel__title">{title}</h4> : null}
      <div className="form-grid-2">
        <FormSelect
          label="NECTA status"
          value={value?.necta_status || ''}
          onChange={(e) => patch({ necta_status: e.target.value })}
          options={[{ value: '', label: '—' }, ...AID_NECTA_STATUS]}
        />
        <FormSelect
          label="BISP eligible"
          value={value?.bisp_status || ''}
          onChange={(e) => patch({ bisp_status: e.target.value })}
          options={[{ value: '', label: '—' }, ...AID_BISP_STATUS]}
        />
      </div>

      <div className="aid-eligibility-status__necta-doc">
        <label className="aid-file-label">
          Attach image (JPG, JPEG, PNG, WEBP)
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadNectaDoc(f);
              e.target.value = '';
            }}
          />
        </label>
        {uploading && (
          <p className="aid-section-hint" style={{ margin: '6px 0 0' }}>
            Uploading…
          </p>
        )}
        {uploadError && (
          <p style={{ color: '#b91c1c', fontSize: 13, margin: '6px 0 0' }}>
            {uploadError}
          </p>
        )}
        {value?.necta_document_url && (
          <p style={{ fontSize: 13, margin: '6px 0 0' }}>
            <a
              href={value.necta_document_url}
              target="_blank"
              rel="noreferrer"
            >
              {value.necta_document_name || 'View attached document'}
            </a>
            <button
              type="button"
              className="aid-mini-btn aid-mini-btn--remove"
              style={{ marginLeft: 8 }}
              onClick={() =>
                patch({ necta_document_url: '', necta_document_name: '' })
              }
            >
              Remove
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default AidEligibilityStatus;

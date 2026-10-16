import React from 'react';
import { AID_APPLICATION_DOC_TYPES } from '../aidConstants';

/**
 * Optional application document uploads (create / edit intake).
 * value: { [context]: { file?: File, name?: string, url?: string } | null }
 */
const AidApplicationDocsIntake = ({
  value = {},
  onChange,
  disabled = false,
}) => {
  const patch = (key, next) => {
    if (disabled || !onChange) return;
    onChange({ ...value, [key]: next });
  };

  return (
    <div className="aid-app-docs">
      <p className="aid-section-hint">
        All document uploads are optional. Attach what is available for this
        case.
      </p>
      <div className="aid-app-docs__grid">
        {AID_APPLICATION_DOC_TYPES.map((doc) => {
          const slot = value[doc.value] || null;
          const label = slot?.name || slot?.file?.name || null;
          return (
            <div key={doc.value} className="aid-app-docs__slot">
              <div className="aid-app-docs__slot-head">
                <strong>{doc.label}</strong>
                <span>Optional</span>
              </div>
              {label ? (
                <div className="aid-app-docs__file">
                  {slot?.url ? (
                    <a href={slot.url} target="_blank" rel="noreferrer">
                      {label}
                    </a>
                  ) : (
                    <span>{label}</span>
                  )}
                  {!disabled ? (
                    <button
                      type="button"
                      className="aid-mini-btn aid-mini-btn--remove"
                      onClick={() => patch(doc.value, null)}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              ) : (
                <label className="aid-app-docs__upload">
                  <span>Choose file</span>
                  <input
                    type="file"
                    disabled={disabled}
                    accept=".pdf,.jpg,.jpeg,.png,.webp,image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        patch(doc.value, { file, name: file.name });
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AidApplicationDocsIntake;

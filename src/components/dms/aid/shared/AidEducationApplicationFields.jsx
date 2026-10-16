import React, { useState } from 'react';
import axiosInstance from '../../../../utils/axios';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import {
  AID_EDUCATION_HISTORY_CLASSES,
  AID_SCHOLARSHIP_CLASS_MODES,
  AID_SCHOLARSHIP_DEGREES,
  calcEducationPercentage,
  emptyEducationHistoryRow,
  emptyScholarshipRow,
} from '../aidConstants';

const labelOf = (options, value) =>
  options.find((o) => o.value === value)?.label || value || '—';

/**
 * Education aid type — Application tab special structure:
 * Education History + Scholarship applied for + income questions
 */
const AidEducationApplicationFields = ({
  value,
  onChange,
  readOnly = false,
}) => {
  const details = value || {};
  const history = details.education_history?.length
    ? details.education_history
    : readOnly
      ? []
      : [emptyEducationHistoryRow()];
  const scholarships = details.scholarships?.length
    ? details.scholarships
    : readOnly
      ? []
      : [emptyScholarshipRow()];
  const [uploadError, setUploadError] = useState('');
  const [uploadingIdx, setUploadingIdx] = useState(null);

  const patch = (partial) => {
    if (readOnly || !onChange) return;
    onChange({ ...details, ...partial });
  };

  const updateHistory = (idx, partial) => {
    const next = history.map((row, i) => {
      if (i !== idx) return row;
      const merged = { ...row, ...partial };
      if (
        partial.marks_obtained !== undefined ||
        partial.total_marks !== undefined
      ) {
        merged.percentage = calcEducationPercentage(
          merged.marks_obtained,
          merged.total_marks,
        );
      }
      return merged;
    });
    patch({ education_history: next });
  };

  const updateScholarship = (idx, partial) => {
    patch({
      scholarships: scholarships.map((row, i) =>
        i === idx ? { ...row, ...partial } : row,
      ),
    });
  };

  const uploadDegree = async (idx, file) => {
    if (!file) return;
    const ok =
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(
        String(file.type || '').toLowerCase(),
      ) || /\.(jpe?g|png|webp)$/i.test(file.name || '');
    if (!ok) {
      setUploadError('Only JPG, JPEG, PNG, or WEBP images are allowed');
      return;
    }
    setUploadingIdx(idx);
    setUploadError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('context', 'education');
      const res = await axiosInstance.post(
        '/aid/applications/documents/upload',
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      const data = res.data?.data || {};
      updateHistory(idx, {
        attachment_url: data.url || '',
        attachment_name: data.file_name || file.name,
      });
    } catch (err) {
      setUploadError(
        err.response?.data?.message || err.message || 'Upload failed',
      );
    } finally {
      setUploadingIdx(null);
    }
  };

  if (readOnly) {
    const hasHistory = history.some(
      (r) =>
        r.class_level ||
        r.board_institute ||
        r.year ||
        r.marks_obtained ||
        r.attachment_url,
    );
    const hasScholarships = scholarships.some(
      (r) => r.current_degree || r.institute_name || r.city || r.annual_fee,
    );
    if (
      !hasHistory &&
      !hasScholarships &&
      !details.income_source_before &&
      !details.continue_education_if_not_approved
    ) {
      return null;
    }
    return (
      <div className="aid-education-application" style={{ marginTop: 12 }}>
        {hasHistory && (
          <div className="aid-family-panel">
            <h4 className="aid-family-panel__title">Education History</h4>
            <div className="aid-children-list">
              {history.map((row, idx) => (
                <div key={`edu-hist-ro-${idx}`} className="aid-child-card">
                  <div className="aid-child-card__title">Record {idx + 1}</div>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                    {[
                      labelOf(AID_EDUCATION_HISTORY_CLASSES, row.class_level),
                      row.board_institute,
                      row.year,
                      row.marks_obtained != null && row.total_marks
                        ? `${row.marks_obtained}/${row.total_marks}`
                        : null,
                      row.percentage ? `${row.percentage}%` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </p>
                  {row.attachment_url && (
                    <p style={{ fontSize: 13, marginTop: 4 }}>
                      <a
                        href={row.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {row.attachment_name || 'View degree'}
                      </a>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {hasScholarships && (
          <div className="aid-family-panel" style={{ marginTop: 12 }}>
            <h4 className="aid-family-panel__title">Scholarship applied for</h4>
            <div className="aid-children-list">
              {scholarships.map((row, idx) => (
                <div key={`sch-ro-${idx}`} className="aid-child-card">
                  <div className="aid-child-card__title">
                    Scholarship {idx + 1}
                  </div>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                    {[
                      labelOf(AID_SCHOLARSHIP_DEGREES, row.current_degree),
                      row.institute_name,
                      row.city,
                      row.annual_fee != null && row.annual_fee !== ''
                        ? `Fee: ${row.annual_fee}`
                        : null,
                      row.start_date || row.end_date
                        ? `${row.start_date || '—'} → ${row.end_date || '—'}`
                        : null,
                      row.total_years ? `${row.total_years} yr` : null,
                      labelOf(AID_SCHOLARSHIP_CLASS_MODES, row.class_mode),
                    ]
                      .filter((x) => x && x !== '—')
                      .join(' · ') || '—'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {(details.income_source_before ||
          details.continue_education_if_not_approved) && (
          <div className="aid-family-panel" style={{ marginTop: 12 }}>
            {details.income_source_before && (
              <p style={{ fontSize: 13, margin: '0 0 8px' }}>
                <strong>Source of income before this:</strong>{' '}
                {details.income_source_before}
              </p>
            )}
            {details.continue_education_if_not_approved && (
              <p style={{ fontSize: 13, margin: 0 }}>
                <strong>If not approved, how continue education:</strong>{' '}
                {details.continue_education_if_not_approved}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="aid-education-application">
      <div className="aid-family-panel" style={{ marginTop: 12 }}>
        <div className="aid-family-panel__head">
          <h4 className="aid-family-panel__title">Education History</h4>
          <button
            type="button"
            className="aid-mini-btn aid-mini-btn--add"
            onClick={() =>
              patch({
                education_history: [...history, emptyEducationHistoryRow()],
              })
            }
          >
            + Add row
          </button>
        </div>
        {uploadError && (
          <p style={{ color: '#b91c1c', fontSize: 13 }}>{uploadError}</p>
        )}
        <div className="aid-children-list">
          {history.map((row, idx) => (
            <div key={`edu-hist-${idx}`} className="aid-child-card">
              <div className="aid-repeat-item__head">
                <div className="aid-child-card__title">Record {idx + 1}</div>
                {history.length > 1 && (
                  <button
                    type="button"
                    className="aid-mini-btn aid-mini-btn--remove"
                    onClick={() =>
                      patch({
                        education_history: history.filter((_, i) => i !== idx),
                      })
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="form-grid-2">
                <FormSelect
                  label="Class"
                  value={row.class_level || ''}
                  onChange={(e) =>
                    updateHistory(idx, { class_level: e.target.value })
                  }
                  options={[
                    { value: '', label: '—' },
                    ...AID_EDUCATION_HISTORY_CLASSES,
                  ]}
                />
                <FormInput
                  label="Board / Institute"
                  value={row.board_institute || ''}
                  onChange={(e) =>
                    updateHistory(idx, { board_institute: e.target.value })
                  }
                />
                <FormInput
                  label="Year"
                  value={row.year || ''}
                  onChange={(e) => updateHistory(idx, { year: e.target.value })}
                  placeholder="e.g. 2022"
                />
                <FormInput
                  label="Mark obtained"
                  type="number"
                  min="0"
                  value={row.marks_obtained ?? ''}
                  onChange={(e) =>
                    updateHistory(idx, { marks_obtained: e.target.value })
                  }
                />
                <FormInput
                  label="Total mark"
                  type="number"
                  min="0"
                  value={row.total_marks ?? ''}
                  onChange={(e) =>
                    updateHistory(idx, { total_marks: e.target.value })
                  }
                />
                <FormInput
                  label="%age"
                  value={row.percentage ?? ''}
                  readOnly
                  placeholder="Auto"
                />
              </div>
              <label className="aid-file-label" style={{ marginTop: 8 }}>
                Attachments (degree)
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  disabled={uploadingIdx === idx}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadDegree(idx, f);
                    e.target.value = '';
                  }}
                />
              </label>
              {uploadingIdx === idx && (
                <p className="aid-section-hint">Uploading…</p>
              )}
              {row.attachment_url && (
                <p style={{ fontSize: 13, marginTop: 6 }}>
                  <a href={row.attachment_url} target="_blank" rel="noreferrer">
                    {row.attachment_name || 'View degree'}
                  </a>
                  <button
                    type="button"
                    className="aid-mini-btn aid-mini-btn--remove"
                    style={{ marginLeft: 8 }}
                    onClick={() =>
                      updateHistory(idx, {
                        attachment_url: '',
                        attachment_name: '',
                      })
                    }
                  >
                    Remove
                  </button>
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="aid-family-panel" style={{ marginTop: 12 }}>
        <div className="aid-family-panel__head">
          <h4 className="aid-family-panel__title">Scholarship applied for</h4>
          <button
            type="button"
            className="aid-mini-btn aid-mini-btn--add"
            onClick={() =>
              patch({
                scholarships: [...scholarships, emptyScholarshipRow()],
              })
            }
          >
            + Add row
          </button>
        </div>
        <div className="aid-children-list">
          {scholarships.map((row, idx) => (
            <div key={`sch-${idx}`} className="aid-child-card">
              <div className="aid-repeat-item__head">
                <div className="aid-child-card__title">Scholarship {idx + 1}</div>
                {scholarships.length > 1 && (
                  <button
                    type="button"
                    className="aid-mini-btn aid-mini-btn--remove"
                    onClick={() =>
                      patch({
                        scholarships: scholarships.filter((_, i) => i !== idx),
                      })
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="form-grid-2">
                <FormSelect
                  label="Current degree"
                  value={row.current_degree || ''}
                  onChange={(e) =>
                    updateScholarship(idx, { current_degree: e.target.value })
                  }
                  options={[
                    { value: '', label: '—' },
                    ...AID_SCHOLARSHIP_DEGREES,
                  ]}
                />
                <FormInput
                  label="Institute name"
                  value={row.institute_name || ''}
                  onChange={(e) =>
                    updateScholarship(idx, { institute_name: e.target.value })
                  }
                />
                <FormInput
                  label="City"
                  value={row.city || ''}
                  onChange={(e) =>
                    updateScholarship(idx, { city: e.target.value })
                  }
                />
                <FormInput
                  label="Annual fee"
                  type="number"
                  min="0"
                  value={row.annual_fee ?? ''}
                  onChange={(e) =>
                    updateScholarship(idx, { annual_fee: e.target.value })
                  }
                />
                <FormInput
                  label="Starting date"
                  type="date"
                  value={row.start_date || ''}
                  onChange={(e) =>
                    updateScholarship(idx, { start_date: e.target.value })
                  }
                />
                <FormInput
                  label="End date"
                  type="date"
                  value={row.end_date || ''}
                  onChange={(e) =>
                    updateScholarship(idx, { end_date: e.target.value })
                  }
                />
                <FormInput
                  label="Total years"
                  type="number"
                  min="0"
                  step="0.5"
                  value={row.total_years ?? ''}
                  onChange={(e) =>
                    updateScholarship(idx, { total_years: e.target.value })
                  }
                />
                <FormSelect
                  label="Class"
                  value={row.class_mode || ''}
                  onChange={(e) =>
                    updateScholarship(idx, { class_mode: e.target.value })
                  }
                  options={[
                    { value: '', label: '—' },
                    ...AID_SCHOLARSHIP_CLASS_MODES,
                  ]}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="aid-family-panel" style={{ marginTop: 12 }}>
        <FormTextarea
          label="What was the source of income before this?"
          value={details.income_source_before || ''}
          onChange={(e) => patch({ income_source_before: e.target.value })}
          rows={2}
        />
        <FormTextarea
          label="If your application has not been approved, how can you continue your education?"
          value={details.continue_education_if_not_approved || ''}
          onChange={(e) =>
            patch({ continue_education_if_not_approved: e.target.value })
          }
          rows={2}
        />
      </div>
    </div>
  );
};

export default AidEducationApplicationFields;

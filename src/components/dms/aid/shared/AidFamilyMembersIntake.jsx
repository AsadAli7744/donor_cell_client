import React from 'react';
import AidRelatedPersonFields from './AidRelatedPersonFields';
import AidApplicantCheckbox from './AidApplicantCheckbox';
import {
  AID_RELATED_PERSON_TYPES,
  emptyRelatedPersonBase,
} from '../aidConstants';

export const emptyFamilyMemberRow = () => ({
  ...emptyRelatedPersonBase(),
  relation_type: '',
  is_applicant: false,
});

/**
 * Generic family-member list for Beneficiary or Family Head.
 * Any relation type (child, sibling, parent, …) — no Brother/Sister-only buttons.
 */
const AidFamilyMembersIntake = ({
  rows = [],
  onChange,
  title = 'Family members',
  hint = 'Add any relative — select Type first (child, sibling, parent, …). Each person is saved and linked by that relation.',
  addLabel = '+ Add family member',
  relationLabel = 'Type (relation)',
  relationOptions = AID_RELATED_PERSON_TYPES,
  onMarkApplicant,
}) => {
  const list = Array.isArray(rows) ? rows : [];

  const addRow = () => onChange([...list, emptyFamilyMemberRow()]);

  const removeRow = (idx) => {
    const removed = list[idx];
    const next = list.filter((_, i) => i !== idx);
    onChange(next);
    if (removed?.is_applicant && onMarkApplicant) {
      onMarkApplicant({ kind: 'beneficiary' });
    }
  };

  const updateRow = (idx, next) =>
    onChange(list.map((row, i) => (i === idx ? { ...row, ...next } : row)));

  return (
    <div className="aid-family-members-intake">
      <div className="aid-family-panel__head">
        <div>
          <h4 className="aid-family-panel__title" style={{ margin: 0 }}>
            {title}
          </h4>
          {hint ? (
            <p className="aid-section-hint" style={{ margin: '0.35rem 0 0' }}>
              {hint}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="aid-mini-btn aid-mini-btn--add"
          onClick={addRow}
        >
          {addLabel}
        </button>
      </div>

      {list.length === 0 ? (
        <p className="aid-empty-note">
          No family members yet. Use &quot;{addLabel.replace(/^\+\s*/, '')}&quot; to
          add children, siblings, parents, or others.
        </p>
      ) : (
        <div className="aid-children-list">
          {list.map((row, idx) => (
            <div key={`fm-${idx}`} className="aid-child-card">
              <div className="aid-repeat-item__head">
                <span className="aid-child-card__title" style={{ margin: 0 }}>
                  Family member {idx + 1}
                  {row.is_applicant ? ' (Applicant)' : ''}
                </span>
                <button
                  type="button"
                  className="aid-mini-btn aid-mini-btn--remove"
                  onClick={() => removeRow(idx)}
                >
                  Remove
                </button>
              </div>
              {onMarkApplicant ? (
                <AidApplicantCheckbox
                  checked={!!row.is_applicant}
                  onChange={(yes) => {
                    if (yes) onMarkApplicant({ kind: 'member', idx, row });
                    else onMarkApplicant({ kind: 'beneficiary' });
                  }}
                  label="This family member is the applicant"
                />
              ) : null}
              <AidRelatedPersonFields
                value={row}
                onChange={(next) =>
                  updateRow(idx, { ...next, is_applicant: row.is_applicant })
                }
                relationOptions={relationOptions}
                relationKey="relation_type"
                relationLabel={relationLabel}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AidFamilyMembersIntake;

import React from 'react';
import FormInput from '../../../common/FormInput';
import AidRelatedPersonFields from './AidRelatedPersonFields';
import { AID_SIBLING_RELATIONS, emptySiblingRow } from '../aidConstants';

/**
 * Single → No. of siblings → standardized related-person cards
 * (Type first + screenshot fields + literacy). Each row becomes a person + kinship link.
 */
const AidSiblingsIntake = ({ siblingRows, onChange, title = 'Siblings' }) => {
  const count = siblingRows?.length || 0;

  const setCount = (n) => {
    const next = Math.max(0, Math.min(20, Number(n) || 0));
    const rows = [...(siblingRows || [])];
    while (rows.length < next) rows.push(emptySiblingRow());
    while (rows.length > next) rows.pop();
    onChange(rows);
  };

  const updateRow = (idx, next) => {
    onChange(
      (siblingRows || []).map((row, i) => (i === idx ? { ...row, ...next } : row)),
    );
  };

  return (
    <div className="aid-children-intake">
      <div className="aid-children-intake__head">
        <h4 className="aid-family-panel__title">{title}</h4>
        <FormInput
          label="No. of siblings"
          type="number"
          min="0"
          max="20"
          value={String(count)}
          onChange={(e) => setCount(e.target.value)}
        />
      </div>

      {count === 0 ? (
        <p className="aid-empty-note">
          If single, enter number of brothers/sisters (leave 0 if none).
        </p>
      ) : (
        <div className="aid-children-list">
          {(siblingRows || []).map((sib, idx) => (
            <div key={`sib-${idx}`} className="aid-child-card">
              <AidRelatedPersonFields
                cardTitle={`Sibling ${idx + 1}`}
                value={sib}
                onChange={(next) => updateRow(idx, next)}
                relationOptions={AID_SIBLING_RELATIONS}
                relationKey="relation_with_beneficiary"
                relationLabel="Type (Brother / Sister / …)"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AidSiblingsIntake;

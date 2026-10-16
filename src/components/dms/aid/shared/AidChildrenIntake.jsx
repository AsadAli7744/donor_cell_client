import React from 'react';
import FormInput from '../../../common/FormInput';
import AidRelatedPersonFields from './AidRelatedPersonFields';
import { AID_CHILD_RELATIONS, emptyChildRow } from '../aidConstants';

/**
 * Married → No. of children → standardized related-person cards
 * (Type first + screenshot fields + literacy). Each child is a person + kinship link.
 */
const AidChildrenIntake = ({ childrenRows, onChange, title = 'Children' }) => {
  const count = childrenRows?.length || 0;

  const setCount = (n) => {
    const next = Math.max(0, Math.min(20, Number(n) || 0));
    const rows = [...(childrenRows || [])];
    while (rows.length < next) rows.push(emptyChildRow());
    while (rows.length > next) rows.pop();
    onChange(rows);
  };

  const updateRow = (idx, next) => {
    onChange(
      (childrenRows || []).map((row, i) => (i === idx ? { ...row, ...next } : row)),
    );
  };

  return (
    <div className="aid-children-intake">
      <div className="aid-children-intake__head">
        <h4 className="aid-family-panel__title">{title}</h4>
        <FormInput
          label="No. of children"
          type="number"
          min="0"
          max="20"
          value={String(count)}
          onChange={(e) => setCount(e.target.value)}
        />
      </div>

      {count === 0 ? (
        <p className="aid-empty-note">
          Enter number of children to add their details (if none, leave 0).
        </p>
      ) : (
        <div className="aid-children-list">
          {(childrenRows || []).map((child, idx) => (
            <div key={`child-${idx}`} className="aid-child-card">
              <AidRelatedPersonFields
                cardTitle={`Child ${idx + 1}`}
                value={child}
                onChange={(next) => updateRow(idx, next)}
                relationOptions={AID_CHILD_RELATIONS}
                relationKey="relation_type"
                relationLabel="Type (Son / Daughter / Child)"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AidChildrenIntake;

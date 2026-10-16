import React from 'react';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import AidRelatedPersonFields from './AidRelatedPersonFields';
import {
  AID_DEPENDENT_RELATIONS,
  AID_YES_NO,
  emptyDependentRow,
} from '../aidConstants';

/**
 * "Others under sponsorship / dependents?" Yes/No → standardized related-person cards.
 * Each dependent is created as a person and linked by Type (relation).
 */
const AidDependentsIntake = ({
  hasDependents,
  onHasDependentsChange,
  rows,
  onChange,
  title = 'Others under sponsorship / dependents',
  relationLabel = 'Type (relation with FAMILY HEAD)',
}) => {
  const count = rows?.length || 0;

  const setCount = (n) => {
    const next = Math.max(0, Math.min(20, Number(n) || 0));
    const list = [...(rows || [])];
    while (list.length < next) list.push(emptyDependentRow());
    while (list.length > next) list.pop();
    onChange(list);
  };

  const updateRow = (idx, next) => {
    onChange(
      (rows || []).map((row, i) => (i === idx ? { ...row, ...next } : row)),
    );
  };

  return (
    <div className="aid-dependents-intake">
      <h4 className="aid-family-panel__title">{title}</h4>
      <FormSelect
        label="If some other under your sponsorship / dependents"
        value={hasDependents ? 'yes' : 'no'}
        onChange={(e) => {
          const yes = e.target.value === 'yes';
          onHasDependentsChange(yes);
          if (!yes) onChange([]);
          else if (!(rows || []).length) onChange([emptyDependentRow()]);
        }}
        options={AID_YES_NO}
      />

      {hasDependents && (
        <>
          <div className="aid-children-intake__head" style={{ marginTop: 12 }}>
            <span className="aid-section-hint" style={{ margin: 0 }}>
              Add each dependent — Type first, then person details. Each is saved
              as a person with a kinship link.
            </span>
            <FormInput
              label="No. of dependents"
              type="number"
              min="1"
              max="20"
              value={String(Math.max(1, count))}
              onChange={(e) => setCount(e.target.value)}
            />
          </div>
          <div className="aid-children-list">
            {(rows || []).map((dep, idx) => (
              <div key={`dep-${idx}`} className="aid-child-card">
                <AidRelatedPersonFields
                  cardTitle={`Dependent ${idx + 1}`}
                  value={dep}
                  onChange={(next) => updateRow(idx, next)}
                  relationOptions={AID_DEPENDENT_RELATIONS}
                  relationKey="relation_with_family_head"
                  relationLabel={relationLabel}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AidDependentsIntake;

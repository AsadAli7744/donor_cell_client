import React from 'react';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import {
  AID_LIVESTOCK_ANIMALS,
  AID_LIVESTOCK_OWNERSHIP,
  AID_YES_NO,
  emptyLivestockRow,
} from '../aidConstants';

/**
 * Livestock: Do you have livestock? Yes/No → rows
 * Type (Goat/Cow/Buffalo), Qty, Ownership (Personal/Sharing), owner if sharing
 */
const AidLivestockIntake = ({
  value,
  onChange,
  title = 'Livestock',
}) => {
  const hasLivestock = !!value?.has_livestock;
  const rows = value?.livestock_entries || [];

  const patch = (partial) => onChange({ ...value, ...partial });

  const setRows = (nextRows) => patch({ livestock_entries: nextRows });

  const updateRow = (idx, partial) => {
    setRows(rows.map((row, i) => (i === idx ? { ...row, ...partial } : row)));
  };

  return (
    <div className="aid-livestock-intake">
      {title ? <h4 className="aid-family-panel__title">{title}</h4> : null}
      <FormSelect
        label="Do you have livestock?"
        value={hasLivestock ? 'yes' : 'no'}
        onChange={(e) => {
          const yes = e.target.value === 'yes';
          patch({
            has_livestock: yes,
            livestock_entries: yes
              ? rows.length
                ? rows
                : [emptyLivestockRow()]
              : [],
          });
        }}
        options={AID_YES_NO}
      />

      {hasLivestock && (
        <>
          <div className="aid-family-panel__head" style={{ marginTop: 12 }}>
            <span className="aid-section-hint" style={{ margin: 0 }}>
              Add each type of animal
            </span>
            <button
              type="button"
              className="aid-mini-btn aid-mini-btn--add"
              onClick={() => setRows([...rows, emptyLivestockRow()])}
            >
              + Add new
            </button>
          </div>
          <div className="aid-children-list">
            {rows.map((row, idx) => (
              <div key={`livestock-${idx}`} className="aid-child-card">
                <div className="aid-repeat-item__head">
                  <div className="aid-child-card__title">Animal {idx + 1}</div>
                  {rows.length > 1 && (
                    <button
                      type="button"
                      className="aid-mini-btn aid-mini-btn--remove"
                      onClick={() =>
                        setRows(rows.filter((_, i) => i !== idx))
                      }
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="form-grid-2">
                  <FormSelect
                    label="Type of animal"
                    value={row.animal_type || 'goat'}
                    onChange={(e) =>
                      updateRow(idx, { animal_type: e.target.value })
                    }
                    options={AID_LIVESTOCK_ANIMALS}
                    required
                  />
                  <FormInput
                    label="Qty"
                    type="number"
                    min="1"
                    max="9999"
                    value={row.quantity === '' || row.quantity == null ? '' : String(row.quantity)}
                    onChange={(e) =>
                      updateRow(idx, { quantity: e.target.value })
                    }
                    required
                  />
                  <FormSelect
                    label="Ownership"
                    value={row.ownership || 'personal'}
                    onChange={(e) => {
                      const ownership = e.target.value;
                      updateRow(idx, {
                        ownership,
                        ...(ownership !== 'sharing'
                          ? { owner_name: '', owner_contact: '' }
                          : {}),
                      });
                    }}
                    options={AID_LIVESTOCK_OWNERSHIP}
                  />
                  {row.ownership === 'sharing' && (
                    <>
                      <FormInput
                        label="If sharing, name of owner"
                        value={row.owner_name || ''}
                        onChange={(e) =>
                          updateRow(idx, { owner_name: e.target.value })
                        }
                      />
                      <FormInput
                        label="Contact no"
                        value={row.owner_contact || ''}
                        onChange={(e) =>
                          updateRow(idx, { owner_contact: e.target.value })
                        }
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AidLivestockIntake;

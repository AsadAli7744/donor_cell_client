import React from 'react';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import { AID_YES_NO, emptyMarriageGiftItem } from '../aidConstants';

/**
 * Marriage Gift aid type — Application tab special structure
 */
const AidMarriageGiftApplicationFields = ({
  value,
  onChange,
  readOnly = false,
}) => {
  const details = value || {};
  const items = details.items?.length
    ? details.items
    : readOnly
      ? []
      : [emptyMarriageGiftItem('Paiti set')];
  const alreadyMarried = details.already_married_nikah === 'yes';

  const patch = (partial) => {
    if (readOnly || !onChange) return;
    onChange({ ...details, ...partial });
  };

  const updateItem = (idx, name) => {
    patch({
      items: items.map((row, i) => (i === idx ? { ...row, name } : row)),
    });
  };

  if (readOnly) {
    const namedItems = items.map((r) => r.name).filter(Boolean);
    const hasAny =
      details.date_of_marriage ||
      details.already_married_nikah ||
      details.bride_groom_relationship ||
      details.earlier_children_marriage_expenses ||
      namedItems.length ||
      details.others;
    if (!hasAny) return null;

    return (
      <div className="aid-marriage-gift-application" style={{ marginTop: 12 }}>
        <div className="aid-family-panel">
          <h4 className="aid-family-panel__title">Marriage Gift</h4>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Date of marriage: {details.date_of_marriage || '—'}
          </p>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Already married (نکاح):{' '}
            {details.already_married_nikah === 'yes'
              ? `Yes${details.nikah_date ? ` · ${details.nikah_date}` : ''}`
              : details.already_married_nikah === 'no'
                ? 'No'
                : '—'}
          </p>
          {details.bride_groom_relationship && (
            <p style={{ fontSize: 13, margin: '8px 0 0' }}>
              <strong>Bride–groom relationship:</strong>{' '}
              {details.bride_groom_relationship}
            </p>
          )}
          {details.earlier_children_marriage_expenses && (
            <p style={{ fontSize: 13, margin: '4px 0 0' }}>
              <strong>Earlier children marriage expenses:</strong>{' '}
              {details.earlier_children_marriage_expenses}
            </p>
          )}
          {namedItems.length > 0 && (
            <p style={{ fontSize: 13, margin: '8px 0 0' }}>
              <strong>Available items:</strong> {namedItems.join(', ')}
            </p>
          )}
          {details.others && (
            <p style={{ fontSize: 13, margin: '4px 0 0' }}>
              <strong>Others:</strong> {details.others}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="aid-marriage-gift-application">
      <div className="aid-family-panel" style={{ marginTop: 12 }}>
        <h4 className="aid-family-panel__title">Marriage Gift</h4>
        <div className="form-grid-2">
          <FormInput
            label="Date of marriage"
            type="date"
            value={details.date_of_marriage || ''}
            onChange={(e) => patch({ date_of_marriage: e.target.value })}
          />
          <FormSelect
            label="Have you already been married? (نکاح)"
            value={details.already_married_nikah || ''}
            onChange={(e) => {
              const next = e.target.value;
              patch({
                already_married_nikah: next,
                ...(next !== 'yes' ? { nikah_date: '' } : {}),
              });
            }}
            options={[{ value: '', label: '—' }, ...AID_YES_NO]}
          />
          {alreadyMarried && (
            <FormInput
              label="If Yes, Date of Marriage (nikah)"
              type="date"
              value={details.nikah_date || ''}
              onChange={(e) => patch({ nikah_date: e.target.value })}
            />
          )}
        </div>
        <FormTextarea
          label="The relationship of the bride with the groom?"
          value={details.bride_groom_relationship || ''}
          onChange={(e) =>
            patch({ bride_groom_relationship: e.target.value })
          }
          rows={2}
        />
        <FormTextarea
          label="How did you arrange marriage expenses of your earlier children?"
          value={details.earlier_children_marriage_expenses || ''}
          onChange={(e) =>
            patch({ earlier_children_marriage_expenses: e.target.value })
          }
          rows={2}
        />
      </div>

      <div className="aid-family-panel" style={{ marginTop: 12 }}>
        <div className="aid-family-panel__head">
          <h4 className="aid-family-panel__title">
            Available items for Marriage
          </h4>
          <button
            type="button"
            className="aid-mini-btn aid-mini-btn--add"
            onClick={() =>
              patch({ items: [...items, emptyMarriageGiftItem()] })
            }
          >
            + Add
          </button>
        </div>
        <div className="aid-children-list">
          {items.map((row, idx) => (
            <div key={`mg-item-${idx}`} className="aid-child-card">
              <div className="aid-repeat-item__head">
                <div className="aid-child-card__title">Item {idx + 1}</div>
                {items.length > 1 && (
                  <button
                    type="button"
                    className="aid-mini-btn aid-mini-btn--remove"
                    onClick={() =>
                      patch({ items: items.filter((_, i) => i !== idx) })
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
              <FormInput
                label="Item name"
                value={row.name || ''}
                onChange={(e) => updateItem(idx, e.target.value)}
                placeholder={idx === 0 ? 'Paiti set' : 'Item name'}
              />
            </div>
          ))}
        </div>
        <FormTextarea
          label="Others"
          value={details.others || ''}
          onChange={(e) => patch({ others: e.target.value })}
          rows={2}
          placeholder="Any other items…"
        />
      </div>
    </div>
  );
};

export default AidMarriageGiftApplicationFields;

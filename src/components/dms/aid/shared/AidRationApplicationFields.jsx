import React from 'react';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import { AID_YES_NO } from '../aidConstants';

/**
 * Ration aid type — Application tab special structure
 * (Monthly Ration Program intake)
 */
const AidRationApplicationFields = ({
  value,
  onChange,
  readOnly = false,
}) => {
  const details = value || {};
  const patch = (partial) => {
    if (readOnly || !onChange) return;
    onChange({ ...details, ...partial });
  };

  const hadWheat = details.family_had_wheat === 'yes';
  const totalPersons = [details.persons_male, details.persons_female, details.persons_kids]
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n) && n >= 0)
    .reduce((a, b) => a + b, 0);

  if (readOnly) {
    const hasAny =
      details.persons_male ||
      details.persons_female ||
      details.persons_kids ||
      details.family_had_wheat ||
      details.how_know_mtjf ||
      details.ration_arrangements_before ||
      details.support_years ||
      details.support_months ||
      details.alternative_if_not_approved;
    if (!hasAny) return null;

    const duration = [
      details.support_years ? `${details.support_years} yr` : null,
      details.support_months ? `${details.support_months} mo` : null,
    ]
      .filter(Boolean)
      .join(' ');

    const wheatLabel =
      details.family_had_wheat === 'yes'
        ? details.wheat_quantity_kg
          ? `Yes · ${details.wheat_quantity_kg} KG`
          : 'Yes'
        : details.family_had_wheat === 'no'
          ? 'No'
          : '—';
    const wheatTone =
      details.family_had_wheat === 'yes'
        ? 'success'
        : details.family_had_wheat === 'no'
          ? 'muted'
          : 'muted';

    return (
      <div className="aid-ration-card">
        <div className="aid-ration-card__banner" aria-hidden />
        <div className="aid-ration-card__head">
          <div>
            <p className="aid-ration-card__eyebrow">Aid type detail</p>
            <h4 className="aid-ration-card__title">Monthly Ration Program</h4>
          </div>
          {duration ? (
            <div className="aid-ration-card__duration">
              <span>Requested duration</span>
              <strong>{duration}</strong>
            </div>
          ) : null}
        </div>

        <div className="aid-ration-card__stats">
          <div className="aid-ration-stat">
            <em>Male</em>
            <strong>{details.persons_male || '0'}</strong>
          </div>
          <div className="aid-ration-stat">
            <em>Female</em>
            <strong>{details.persons_female || '0'}</strong>
          </div>
          <div className="aid-ration-stat">
            <em>Kids</em>
            <strong>{details.persons_kids || '0'}</strong>
          </div>
          <div className="aid-ration-stat aid-ration-stat--total">
            <em>Total persons</em>
            <strong>{totalPersons || '0'}</strong>
          </div>
          <div className={`aid-ration-stat aid-ration-stat--${wheatTone}`}>
            <em>Family had wheat</em>
            <strong>{wheatLabel}</strong>
          </div>
        </div>

        <div className="aid-ration-card__notes">
          {details.how_know_mtjf ? (
            <div className="aid-ration-note">
              <span>How they know about MTJF</span>
              <p>{details.how_know_mtjf}</p>
            </div>
          ) : null}
          {details.ration_arrangements_before ? (
            <div className="aid-ration-note">
              <span>Ration arrangements before MTJF</span>
              <p>{details.ration_arrangements_before}</p>
            </div>
          ) : null}
          {details.alternative_if_not_approved ? (
            <div className="aid-ration-note aid-ration-note--warn">
              <span>If not approved — alternative plan</span>
              <p>{details.alternative_if_not_approved}</p>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="aid-ration-application">
      <div className="aid-family-panel" style={{ marginTop: 12 }}>
        <h4 className="aid-family-panel__title">
          No. of persons benefitted from Ration
        </h4>
        <div className="form-grid-2">
          <FormInput
            label="Male"
            type="number"
            min="0"
            value={details.persons_male ?? ''}
            onChange={(e) => patch({ persons_male: e.target.value })}
          />
          <FormInput
            label="Female"
            type="number"
            min="0"
            value={details.persons_female ?? ''}
            onChange={(e) => patch({ persons_female: e.target.value })}
          />
          <FormInput
            label="Kids"
            type="number"
            min="0"
            value={details.persons_kids ?? ''}
            onChange={(e) => patch({ persons_kids: e.target.value })}
          />
        </div>
        {totalPersons > 0 && (
          <p className="aid-section-hint" style={{ marginTop: 6 }}>
            Total: {totalPersons}
          </p>
        )}
      </div>

      <div className="aid-family-panel" style={{ marginTop: 12 }}>
        <div className="form-grid-2">
          <FormSelect
            label="Did your family have wheat?"
            value={details.family_had_wheat || ''}
            onChange={(e) => {
              const next = e.target.value;
              patch({
                family_had_wheat: next,
                ...(next !== 'yes' ? { wheat_quantity_kg: '' } : {}),
              });
            }}
            options={[{ value: '', label: '—' }, ...AID_YES_NO]}
          />
          {hadWheat && (
            <FormInput
              label="If yes, how much (KG)"
              type="number"
              min="0"
              step="0.1"
              value={details.wheat_quantity_kg ?? ''}
              onChange={(e) => patch({ wheat_quantity_kg: e.target.value })}
            />
          )}
        </div>
      </div>

      <div className="aid-family-panel" style={{ marginTop: 12 }}>
        <FormTextarea
          label="How did you know about MTJF?"
          value={details.how_know_mtjf || ''}
          onChange={(e) => patch({ how_know_mtjf: e.target.value })}
          rows={2}
        />
        <FormTextarea
          label="What were the arrangements of Ration before applying to MTJF?"
          value={details.ration_arrangements_before || ''}
          onChange={(e) =>
            patch({ ration_arrangements_before: e.target.value })
          }
          rows={2}
        />
      </div>

      <div className="aid-family-panel" style={{ marginTop: 12 }}>
        <h4 className="aid-family-panel__title">
          For how long do you want Ration support?
        </h4>
        <div className="form-grid-2">
          <FormInput
            label="Years"
            type="number"
            min="0"
            value={details.support_years ?? ''}
            onChange={(e) => patch({ support_years: e.target.value })}
          />
          <FormInput
            label="Months"
            type="number"
            min="0"
            max="11"
            value={details.support_months ?? ''}
            onChange={(e) => patch({ support_months: e.target.value })}
          />
        </div>
      </div>

      <div className="aid-family-panel" style={{ marginTop: 12 }}>
        <FormTextarea
          label="If your application is not approved, what alternative plans do you have for securing the ration?"
          value={details.alternative_if_not_approved || ''}
          onChange={(e) =>
            patch({ alternative_if_not_approved: e.target.value })
          }
          rows={3}
        />
      </div>
    </div>
  );
};

export default AidRationApplicationFields;

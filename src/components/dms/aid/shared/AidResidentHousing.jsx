import React from 'react';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import { AID_RESIDENT_TYPES } from '../aidConstants';

/**
 * Resident housing:
 * Type: Own House | Rented | Sham Lot
 * Ownership status, Other, Rented amount (if Rented), Total area (Marla), House details
 */
const AidResidentHousing = ({ value, onChange, title = 'Resident' }) => {
  const residentType = value?.resident_type || '';
  const isRented = residentType === 'rented';

  const patch = (partial) => onChange({ ...value, ...partial });

  const onTypeChange = (nextType) => {
    patch({
      resident_type: nextType,
      ...(nextType !== 'rented' ? { rented_amount: '' } : {}),
    });
  };

  return (
    <div className="aid-resident-housing">
      {title ? <h4 className="aid-family-panel__title">{title}</h4> : null}
      <div className="form-grid-2">
        <FormSelect
          label="Type"
          value={residentType}
          onChange={(e) => onTypeChange(e.target.value)}
          options={[{ value: '', label: '—' }, ...AID_RESIDENT_TYPES]}
        />
        <FormInput
          label="Ownership status"
          value={value?.resident_ownership_status || ''}
          onChange={(e) =>
            patch({ resident_ownership_status: e.target.value })
          }
          placeholder="Optional"
        />
        <FormInput
          label="Other"
          value={value?.resident_ownership_other || ''}
          onChange={(e) => patch({ resident_ownership_other: e.target.value })}
          placeholder="Optional"
        />
        {isRented && (
          <FormInput
            label="Rented amount (PKR)"
            type="number"
            min="0"
            value={value?.rented_amount ?? ''}
            onChange={(e) => patch({ rented_amount: e.target.value })}
            placeholder="0"
          />
        )}
        <FormInput
          label="Total area"
          type="number"
          min="0"
          step="0.01"
          value={value?.house_area_marla ?? ''}
          onChange={(e) => patch({ house_area_marla: e.target.value })}
          placeholder="Marla"
        />
      </div>
      <FormTextarea
        label="House details"
        value={value?.house_details || ''}
        onChange={(e) => patch({ house_details: e.target.value })}
        rows={2}
        placeholder="Description / notes"
      />
    </div>
  );
};

export default AidResidentHousing;

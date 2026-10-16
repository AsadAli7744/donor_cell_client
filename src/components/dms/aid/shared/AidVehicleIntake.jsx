import React from 'react';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import { AID_VEHICLE_TYPES, AID_YES_NO } from '../aidConstants';

/**
 * Vehicle: Do you have any vehicle? Yes/No → Type of vehicle (if Yes)
 */
const AidVehicleIntake = ({ value, onChange, title = 'Vehicle' }) => {
  const hasVehicle = !!value?.has_vehicle;
  const knownType = AID_VEHICLE_TYPES.some(
    (t) => t.value === (value?.vehicle_type || ''),
  );
  const selectValue =
    knownType || !value?.vehicle_type
      ? value?.vehicle_type || ''
      : 'other';

  const patch = (partial) => onChange({ ...value, ...partial });

  return (
    <div className="aid-vehicle-intake">
      {title ? <h4 className="aid-family-panel__title">{title}</h4> : null}
      <div className="form-grid-2">
        <FormSelect
          label="Do you have any vehicle?"
          value={hasVehicle ? 'yes' : 'no'}
          onChange={(e) => {
            const yes = e.target.value === 'yes';
            patch({
              has_vehicle: yes,
              vehicle_type: yes ? value?.vehicle_type || '' : '',
            });
          }}
          options={AID_YES_NO}
        />
        {hasVehicle && (
          <>
            <FormSelect
              label="Type of vehicle"
              value={selectValue}
              onChange={(e) => {
                const v = e.target.value;
                patch({
                  vehicle_type: v === 'other' ? '' : v,
                });
              }}
              options={[{ value: '', label: '—' }, ...AID_VEHICLE_TYPES]}
              required
            />
            {selectValue === 'other' && (
              <FormInput
                label="Type of vehicle (specify)"
                value={knownType ? '' : value?.vehicle_type || ''}
                onChange={(e) => patch({ vehicle_type: e.target.value })}
                placeholder="e.g. Rickshaw, Loader"
                required
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AidVehicleIntake;

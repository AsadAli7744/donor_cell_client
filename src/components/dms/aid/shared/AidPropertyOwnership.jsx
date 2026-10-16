import React from 'react';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import { AID_PROPERTY_TYPES, AID_YES_NO } from '../aidConstants';

/**
 * Property ownership:
 * Do you have land? Yes/No → Agri / Commercial Property details + Type
 * (agri | commercial | plot | others)
 */
const AidPropertyOwnership = ({
  value,
  onChange,
  title = 'Property ownership',
}) => {
  const hasLand = !!value?.has_land;

  const patch = (partial) => onChange({ ...value, ...partial });

  return (
    <div className="aid-property-ownership">
      {title ? <h4 className="aid-family-panel__title">{title}</h4> : null}
      <div className="form-grid-2">
        <FormSelect
          label="Do you have land?"
          value={hasLand ? 'yes' : 'no'}
          onChange={(e) => {
            const yes = e.target.value === 'yes';
            patch({
              has_land: yes,
              property_type: yes ? value?.property_type || '' : '',
              property_details: yes ? value?.property_details || '' : '',
            });
          }}
          options={AID_YES_NO}
        />
      </div>

      {hasLand && (
        <div className="aid-property-ownership__details">
          <h4 className="aid-family-panel__title" style={{ marginTop: 12 }}>
            Agri / Commercial Property details
          </h4>
          <div className="form-grid-2">
            <FormSelect
              label="Type"
              value={value?.property_type || ''}
              onChange={(e) => patch({ property_type: e.target.value })}
              options={[{ value: '', label: '—' }, ...AID_PROPERTY_TYPES]}
              required
            />
          </div>
          <FormTextarea
            label="Property details"
            value={value?.property_details || ''}
            onChange={(e) => patch({ property_details: e.target.value })}
            rows={2}
            placeholder="Optional location / size / notes"
          />
        </div>
      )}
    </div>
  );
};

export default AidPropertyOwnership;

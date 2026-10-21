import React from 'react';
import SearchableDropdown from '../../../common/SearchableDropdown';

export const formatAidUserLabel = (user) => {
  if (!user) return '';
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return name || user.email || (user.id != null ? `User #${user.id}` : '');
};

export const toAssignableAidUser = (user) => {
  if (!user?.id) return null;
  return { ...user, name: formatAidUserLabel(user) };
};

const AidUserAssignField = ({
  label = 'Assign to user',
  value,
  onChange,
  hint,
}) => (
  <div className="aid-assign-field">
    {hint ? <p className="aid-section-hint">{hint}</p> : null}
    <SearchableDropdown
      label={label}
      placeholder="Search program users…"
      apiEndpoint="/users/options"
      apiParams={{ department: 'program' }}
      value={value}
      displayKey="name"
      onSelect={(user) => onChange(toAssignableAidUser(user))}
      onClear={() => onChange(null)}
      debounceDelay={400}
      minSearchLength={1}
      allowResearch
      renderOption={(user, index, list) => (
        <div
          key={user.id}
          className="searchable-dropdown__option"
          onClick={() => onChange(toAssignableAidUser(user))}
          style={{
            padding: '10px 12px',
            borderBottom:
              Array.isArray(list) && index < list.length - 1
                ? '1px solid #eee'
                : 'none',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontWeight: 500 }}>{formatAidUserLabel(user)}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{user.email}</div>
        </div>
      )}
    />
  </div>
);

export default AidUserAssignField;

import React from 'react';

/** Role checkbox — Applicant or Beneficiary (parent handles exclusivity). */
const AidApplicantCheckbox = ({
  checked = false,
  onChange,
  label = 'This person is the applicant',
  hint = '',
  variant = 'applicant',
}) => (
  <label
    className={`aid-toggle aid-toggle--block aid-role-check aid-role-check--${variant}${
      checked ? ' is-checked' : ''
    }`}
  >
    <input
      type="checkbox"
      checked={!!checked}
      onChange={(e) => onChange?.(e.target.checked)}
    />
    <span>
      <strong>{label}</strong>
      {hint ? <small className="aid-role-check__hint">{hint}</small> : null}
    </span>
  </label>
);

export default AidApplicantCheckbox;

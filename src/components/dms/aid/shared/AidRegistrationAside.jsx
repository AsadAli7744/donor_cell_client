import React from 'react';

const CheckIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden>
    <path
      fillRule="evenodd"
      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
      clipRule="evenodd"
    />
  </svg>
);

const WarnIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden>
    <path
      fillRule="evenodd"
      d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * Right-rail boxes: registry CNIC match + required-step checklist.
 */
const AidRegistrationAside = ({
  registryMatch = null,
  registryLookingUp = false,
  checklist = [],
  onLinkExisting,
  onRegisterNew,
}) => (
  <aside className="aid-reg-aside">
    {registryLookingUp ? (
      <div className="aid-reg-match aid-reg-match--loading">
        Checking family registry…
      </div>
    ) : null}

    {registryMatch ? (
      <div className="aid-reg-match">
        <div className="aid-reg-match__head">
          <span className="aid-reg-match__icon" aria-hidden>
            <WarnIcon />
          </span>
          <h5 className="aid-reg-match__title">Registry match found</h5>
        </div>
        <p className="aid-reg-match__body">
          This CNIC appears as{' '}
          <strong>{registryMatch.roleLabel || 'member'}</strong> in family{' '}
          <strong>{registryMatch.familyCode || '—'}</strong>
          {registryMatch.headName
            ? ` (head: ${registryMatch.headName})`
            : ''}
          .
        </p>
        {registryMatch.history?.length ? (
          <ul className="aid-reg-match__history">
            {registryMatch.history.map((row) => (
              <li key={`${row.label}-${row.when}`}>
                <span>{row.label}</span>
                <em>{row.when}</em>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="aid-reg-match__actions">
          <button
            type="button"
            className="aid-reg-match__btn aid-reg-match__btn--primary"
            onClick={onLinkExisting}
          >
            Link to existing family
          </button>
          <button
            type="button"
            className="aid-reg-match__btn aid-reg-match__btn--ghost"
            onClick={onRegisterNew}
          >
            Register as new family
          </button>
        </div>
      </div>
    ) : null}

    <div className="aid-reg-checklist">
      <h5 className="aid-reg-checklist__title">
        <span className="aid-reg-checklist__badge">Required</span>
        in this step
      </h5>
      <ul className="aid-reg-checklist__list">
        {checklist.map((item) => (
          <li
            key={item.key}
            className={`aid-reg-checklist__item${
              item.done ? ' is-done' : ''
            }`}
          >
            <span className="aid-reg-checklist__mark" aria-hidden>
              {item.done ? <CheckIcon /> : null}
            </span>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  </aside>
);

export default AidRegistrationAside;

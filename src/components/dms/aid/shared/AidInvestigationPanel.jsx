import React from 'react';

const STATUSES = [
  { value: 'verified', label: 'Verified' },
  { value: 'mismatch', label: 'Mismatch' },
  { value: 'not_checked', label: 'Not checked' },
];

export const AID_RECOMMENDATION_DECISIONS = [
  { value: 'approve_as_requested', label: 'Approve as requested' },
  { value: 'approve_with_changes', label: 'Approve with changes' },
  { value: 'reject', label: 'Reject' },
];

export const AID_RECOMMENDATION_PERIODS = [
  { value: 1, label: '1 month' },
  { value: 3, label: '3 months' },
  { value: 6, label: '6 months' },
  { value: 12, label: '12 months' },
];

export const emptyRecommendation = () => ({
  decision: 'approve_as_requested',
  amount: '',
  period_months: 6,
  remarks: '',
  found_monthly_income: '',
});

export const normalizeInvestigationEntry = (value) => {
  if (value === true || value === 'verified') {
    return {
      status: 'verified',
      note: '',
      attachment_url: '',
      attachment_name: '',
      attachment_id: null,
    };
  }
  if (value === 'mismatch') {
    return {
      status: 'mismatch',
      note: '',
      attachment_url: '',
      attachment_name: '',
      attachment_id: null,
    };
  }
  if (value && typeof value === 'object') {
    const statusRaw = String(value.status || '').toLowerCase();
    const status =
      statusRaw === 'verified' || statusRaw === 'mismatch'
        ? statusRaw
        : value.checked === true
          ? 'verified'
          : 'not_checked';
    return {
      status,
      note: String(value.note || value.notes || value.found || ''),
      attachment_url: String(value.attachment_url || ''),
      attachment_name: String(value.attachment_name || ''),
      attachment_id: value.attachment_id ?? null,
    };
  }
  return {
    status: 'not_checked',
    note: '',
    attachment_url: '',
    attachment_name: '',
    attachment_id: null,
  };
};

export const emptyInvestigationState = (items = []) =>
  Object.fromEntries(
    (items || []).map((item) => [
      item.key,
      normalizeInvestigationEntry(null),
    ]),
  );

export const mergeInvestigationState = (items = [], saved = {}) => {
  const base = emptyInvestigationState(items);
  if (!saved || typeof saved !== 'object') return base;
  for (const item of items) {
    const raw =
      saved[item.key] !== undefined
        ? saved[item.key]
        : item.key === 'site_visit'
          ? saved.home_visited
          : undefined;
    if (raw !== undefined) {
      base[item.key] = normalizeInvestigationEntry(raw);
    }
  }
  return base;
};

export const isInvestigationComplete = (items = [], state = {}) =>
  (items || []).every((item) => {
    const entry = normalizeInvestigationEntry(
      state[item.key] ??
        (item.key === 'site_visit' ? state.home_visited : undefined),
    );
    if (item.accepts_file) {
      return (
        entry.status === 'verified' &&
        String(entry.attachment_url || '').trim().length > 0
      );
    }
    const allowMismatch = item.allow_mismatch !== false && item.kind !== 'process';
    if (!allowMismatch) return entry.status === 'verified';
    if (!item.required) {
      if (entry.status === 'mismatch') {
        return String(entry.note || '').trim().length >= 3;
      }
      return true;
    }
    if (entry.status === 'verified') return true;
    if (entry.status === 'mismatch') {
      return String(entry.note || '').trim().length >= 3;
    }
    return false;
  });

export const isRecommendationComplete = (rec = {}) => {
  const remarks = String(rec.remarks || '').trim();
  if (remarks.length < 3) return false;
  if (rec.decision === 'reject') return true;
  const amount = Number(rec.amount);
  if (!Number.isFinite(amount) || amount <= 0) return false;
  if (rec.decision === 'approve_with_changes') {
    const months = Number(rec.period_months);
    if (!Number.isFinite(months) || months <= 0) return false;
  }
  return true;
};

/** Fallback section when API items omit `section` (older payloads). */
const INVESTIGATION_KEY_SECTION = {
  identity_of_head: 'family',
  identity_of_beneficiary: 'beneficiary',
  identity_of_applicant: 'applicant',
  address: 'beneficiary',
  household_size: 'family',
  monthly_household_income: 'family',
  occupation: 'family',
  monthly_rent: 'family',
  resident_housing: 'family',
  land_property: 'family',
  livestock: 'family',
  vehicle: 'family',
  siblings: 'family',
  children: 'family',
  spouse: 'family',
  brother_lives_separately: 'family',
  spouse_deceased: 'beneficiary',
  disability: 'beneficiary',
  necta_status: 'family',
  bisp_status: 'family',
  aid_request: 'case',
  site_visit: 'case',
  home_visited: 'case',
  need_verified: 'case',
  duplicates_reviewed: 'case',
  eligible_recommended: 'case',
};

const TAB_TO_SECTION = {
  case: 'case',
  beneficiary: 'beneficiary',
  family: 'family',
  writer: 'applicant',
};

export const resolveInvestigationSection = (item) => {
  if (item?.section) return item.section;
  if (item?.kind === 'process') return 'case';
  return INVESTIGATION_KEY_SECTION[item?.key] || 'case';
};

/**
 * Case tab → all items. Other tabs → section-matched claims only (no process).
 * Attachments → none.
 * Beneficiary tab also shows family-head identity when there is no separate
 * beneficiary identity (single-person household).
 */
export const filterInvestigationItemsByTab = (items = [], tab = 'case') => {
  const list = Array.isArray(items) ? items : [];
  if (!tab || tab === 'case') return list;
  if (tab === 'attachments') return [];
  const section = TAB_TO_SECTION[tab];
  if (!section) return list;
  const hasBeneficiaryIdentity = list.some(
    (i) => i.key === 'identity_of_beneficiary',
  );
  return list.filter((item) => {
    if (item.kind === 'process') return false;
    const sec = resolveInvestigationSection(item);
    if (sec === section) return true;
    // Family tab also shows applicant claims (Applicant tab removed from view)
    if (tab === 'family' && sec === 'applicant') return true;
    if (
      tab === 'beneficiary' &&
      !hasBeneficiaryIdentity &&
      item.key === 'identity_of_head'
    ) {
      return true;
    }
    return false;
  });
};

const TAB_INVEST_COPY = {
  case: {
    title: 'Verify what was declared',
    hint: 'Full investigation checklist for this case. A mismatch needs a Found note.',
  },
  beneficiary: {
    title: 'Verify beneficiary claims',
    hint: 'Checks linked to the beneficiary only.',
  },
  family: {
    title: 'Verify family / applicant',
    hint: 'Checks linked to the family head, household, and applicant.',
  },
};

/**
 * Dynamic field investigation — Verified / Mismatch / Not checked per declared claim.
 * Optional sidebar: vulnerability after visit + investigator recommendation.
 */
const AidInvestigationPanel = ({
  items = [],
  value = {},
  onChange,
  disabled = false,
  title,
  hint,
  /** View tab id: case | beneficiary | family | writer | attachments */
  activeTab = 'case',
  vulnerability = null,
  recommendation = null,
  onRecommendationChange,
  onSubmitReport,
  submitDisabled = false,
  submitLabel = 'Submit report for approval',
  showRecommendation,
  /** Special permission: show “mark all verified” for the visible checklist */
  canBulkVerify = false,
  /** Upload handler for items with accepts_file (e.g. Site Visit) */
  onUploadItemFile,
  uploadingKey = null,
}) => {
  const filtered = filterInvestigationItemsByTab(items, activeTab);
  const list = filtered;
  const claims = list.filter((i) => i.kind !== 'process');
  const process = list.filter((i) => i.kind === 'process');
  const copy = TAB_INVEST_COPY[activeTab] || TAB_INVEST_COPY.case;
  const panelTitle = title ?? copy.title;
  const panelHint = hint ?? copy.hint;
  const showRec =
    showRecommendation !== undefined
      ? showRecommendation
      : activeTab === 'case';

  const allVisibleVerified =
    list.length > 0 &&
    list.every(
      (item) => normalizeInvestigationEntry(value[item.key]).status === 'verified',
    );

  const setEntry = (key, next) => {
    onChange({
      ...value,
      [key]: {
        ...normalizeInvestigationEntry(value[key]),
        ...next,
      },
    });
  };

  const setAllVisibleStatus = (status) => {
    if (!list.length || !onChange) return;
    const next = { ...value };
    for (const item of list) {
      const prev = normalizeInvestigationEntry(value[item.key]);
      next[item.key] = {
        ...prev,
        status,
        note: status === 'mismatch' ? prev.note : '',
      };
    }
    onChange(next);
  };

  const setRec = (patch) => {
    if (!onRecommendationChange) return;
    onRecommendationChange({ ...(recommendation || emptyRecommendation()), ...patch });
  };

  const declaredTotal = vulnerability?.declared?.total;
  const afterTotal = vulnerability?.after_visit?.total;
  const deltas = vulnerability?.deltas || [];
  const scoreChanged =
    declaredTotal != null &&
    afterTotal != null &&
    Number(declaredTotal) !== Number(afterTotal);

  const renderRow = (item) => {
    const entry = normalizeInvestigationEntry(value[item.key]);
    const allowMismatch =
      item.allow_mismatch !== false && item.kind !== 'process';
    const statuses = allowMismatch
      ? STATUSES
      : STATUSES.filter((s) => s.value !== 'mismatch');

    return (
      <div
        key={item.key}
        className={`aid-invest-row${
          entry.status === 'mismatch' ? ' aid-invest-row--mismatch' : ''
        }${entry.status === 'verified' ? ' aid-invest-row--ok' : ''}`}
      >
        <div className="aid-invest-row__main">
          <div className="aid-invest-row__label">
            {item.label}
            {item.required ? (
              <span className="aid-invest-row__req"> *</span>
            ) : null}
          </div>
          {item.declared ? (
            <div className="aid-invest-row__declared">
              <span className="aid-invest-row__declared-k">Declared</span>
              {item.declared}
            </div>
          ) : (
            <div className="aid-invest-row__declared aid-invest-row__declared--muted">
              Process check — confirm on site
            </div>
          )}
          {entry.status === 'mismatch' && entry.note ? (
            <div className="aid-invest-row__found">Found: {entry.note}</div>
          ) : null}
          {entry.status === 'mismatch' && !disabled ? (
            <label className="aid-invest-row__note">
              <span>Found (required)</span>
              <textarea
                rows={2}
                value={entry.note}
                disabled={disabled}
                placeholder="What did you find on site?"
                onChange={(e) =>
                  setEntry(item.key, { status: 'mismatch', note: e.target.value })
                }
              />
            </label>
          ) : null}
          {item.accepts_file ? (
            <div className="aid-invest-row__file">
              {entry.attachment_url ? (
                <div className="aid-invest-row__file-current">
                  <a
                    href={entry.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {entry.attachment_name || 'Attached file'}
                  </a>
                  {!disabled ? (
                    <button
                      type="button"
                      className="aid-mini-btn aid-mini-btn--remove"
                      onClick={() =>
                        setEntry(item.key, {
                          attachment_url: '',
                          attachment_name: '',
                          attachment_id: null,
                        })
                      }
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              ) : (
                <label className="aid-invest-row__file-upload">
                  <span>
                    {uploadingKey === item.key
                      ? 'Uploading…'
                      : 'Attach site visit file *'}
                  </span>
                  <input
                    type="file"
                    disabled={disabled || uploadingKey === item.key}
                    accept=".pdf,.jpg,.jpeg,.png,.webp,image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && onUploadItemFile) {
                        onUploadItemFile(item.key, file);
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
          ) : null}
        </div>
        <div className="aid-invest-status" role="group" aria-label={item.label}>
          {statuses.map((s) => (
            <button
              key={s.value}
              type="button"
              disabled={disabled}
              className={`aid-invest-status__btn aid-invest-status__btn--${s.value}${
                entry.status === s.value ? ' is-active' : ''
              }`}
              onClick={() =>
                setEntry(item.key, {
                  status: s.value,
                  note: s.value === 'mismatch' ? entry.note : '',
                })
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const rec = recommendation || emptyRecommendation();

  if (activeTab === 'attachments') return null;
  if (!list.length && !showRec) {
    return (
      <section className="aid-investigation aid-investigation--tab">
        <p className="aid-section-hint">
          No investigation claims for this tab. Open Case details for the full
          checklist.
        </p>
      </section>
    );
  }

  return (
    <section className="aid-investigation aid-investigation--tab">
      <div className="aid-invest-layout">
        <div className="aid-invest-main">
          <div className="aid-investigation__head">
            <div>
              <h3 className="aid-investigation__title">{panelTitle}</h3>
              {panelHint ? (
                <p className="aid-investigation__hint">{panelHint}</p>
              ) : null}
            </div>
            {canBulkVerify && list.length > 0 ? (
              <label
                className={`aid-invest-bulk${
                  allVisibleVerified ? ' is-checked' : ''
                }${disabled ? ' is-disabled' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={allVisibleVerified}
                  disabled={disabled}
                  onChange={(e) =>
                    setAllVisibleStatus(
                      e.target.checked ? 'verified' : 'not_checked',
                    )
                  }
                />
                <span>
                  <strong>Mark all verified</strong>
                  <small>Updates every item on this tab</small>
                </span>
              </label>
            ) : null}
          </div>

          {!list.length ? (
            <p className="aid-section-hint">
              No investigation claims for this tab. Open Case details for the
              full checklist.
            </p>
          ) : (
            <>
              {claims.length > 0 ? (
                <div className="aid-invest-list">{claims.map(renderRow)}</div>
              ) : null}
              {process.length > 0 ? (
                <>
                  <h4 className="aid-investigation__sub">Field process</h4>
                  <div className="aid-invest-list">{process.map(renderRow)}</div>
                </>
              ) : null}
            </>
          )}
        </div>

        {showRec ? (
          <aside className="aid-invest-side">
            <div className="aid-vuln-card">
              <div className="aid-vuln-card__label">Vulnerability after visit</div>
              <div className="aid-vuln-card__score">
                <span className="aid-vuln-card__pct">
                  {afterTotal != null ? `${afterTotal}%` : '—'}
                </span>
                {scoreChanged ? (
                  <span className="aid-vuln-card__old">{declaredTotal}%</span>
                ) : null}
              </div>
              {vulnerability?.after_visit?.band_label ? (
                <div className="aid-vuln-card__band">
                  {vulnerability.after_visit.band_label}
                </div>
              ) : null}
              {deltas.length > 0 ? (
                <ul className="aid-vuln-card__deltas">
                  {deltas.map((d, i) => (
                    <li key={`${d.label}-${i}`}>
                      <span>{d.label}</span>
                      <strong>
                        {d.delta > 0 ? `+${d.delta}` : d.delta}
                      </strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="aid-vuln-card__empty">
                  Score from intake factors (income, category, housing, assets,
                  BISP…).
                </p>
              )}
              {vulnerability?.after_visit?.program_min_score != null ? (
                <p className="aid-vuln-card__threshold">
                  Program min {vulnerability.after_visit.program_code}:{' '}
                  {vulnerability.after_visit.program_min_score} pts
                  {vulnerability.after_visit.meets_program_threshold === false
                    ? ' — below threshold'
                    : vulnerability.after_visit.meets_program_threshold
                      ? ' — meets threshold'
                      : ''}
                </p>
              ) : null}
            </div>

            <div className="aid-rec-card">
              <h4 className="aid-rec-card__title">Recommendation</h4>
              <div className="aid-rec-options">
                {AID_RECOMMENDATION_DECISIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`aid-rec-option${
                      rec.decision === opt.value ? ' is-active' : ''
                    }${
                      opt.value === 'reject' ? ' aid-rec-option--reject' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="aid-rec-decision"
                      value={opt.value}
                      checked={rec.decision === opt.value}
                      disabled={disabled}
                      onChange={() => setRec({ decision: opt.value })}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>

              {rec.decision !== 'reject' ? (
                <div className="aid-rec-grid">
                  <label className="aid-rec-field">
                    <span>Amount (PKR)</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Amount"
                      value={rec.amount}
                      disabled={disabled}
                      onChange={(e) => setRec({ amount: e.target.value })}
                    />
                  </label>
                  <label className="aid-rec-field">
                    <span>Period</span>
                    <select
                      value={rec.period_months}
                      disabled={disabled}
                      onChange={(e) =>
                        setRec({ period_months: Number(e.target.value) })
                      }
                    >
                      {AID_RECOMMENDATION_PERIODS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}

              <label className="aid-rec-field">
                <span>Investigator remarks</span>
                <textarea
                  rows={4}
                  disabled={disabled}
                  placeholder="Family situation, who lives with the head, support from relatives…"
                  value={rec.remarks}
                  onChange={(e) => setRec({ remarks: e.target.value })}
                />
              </label>

              {!disabled && onSubmitReport ? (
                <button
                  type="button"
                  className="aid-rec-submit"
                  disabled={submitDisabled}
                  onClick={onSubmitReport}
                >
                  {submitLabel}
                </button>
              ) : null}
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
};

export default AidInvestigationPanel;

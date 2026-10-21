import React, { useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiPlus, FiX } from 'react-icons/fi';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import {
  AID_EDUCATION_LEVELS,
  AID_GENDERS,
  AID_MARITAL_STATUS,
  AID_RELATED_PERSON_TYPES,
  calcAgeFromDob,
  emptyRelatedPersonBase,
  formatCnicInput,
  formatEducation,
  formatMaritalStatus,
} from '../aidConstants';

const SPOUSE_RELATIONS = new Set(['spouse', 'husband', 'wife']);
const CHILD_RELATIONS = new Set([
  'son',
  'daughter',
  'child',
  'grandchild',
]);
const SIBLING_RELATIONS = new Set([
  'brother',
  'sister',
  'sibling',
  'step_brother',
  'step_sister',
  'half_brother',
  'half_sister',
]);

const ID_TYPE_OPTIONS = [
  { value: 'cnic', label: 'CNIC' },
  { value: 'b_form', label: 'B-Form' },
];

const HEALTH_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'asthma', label: 'Asthma' },
  { value: 'disability', label: 'Disability' },
  { value: 'chronic', label: 'Chronic illness' },
  { value: 'other', label: 'Other' },
];

const GUARDIANSHIP_REASONS = [
  { value: '', label: '—' },
  { value: 'orphan', label: 'Orphan' },
  { value: 'abandoned', label: 'Abandoned' },
  { value: 'parent_incapacity', label: 'Parent incapacity' },
  { value: 'financial', label: 'Financial support' },
  { value: 'other', label: 'Other' },
];

export const emptyFamilyMemberRow = () => ({
  ...emptyRelatedPersonBase(),
  relation_type: '',
  is_applicant: false,
  id_type: 'cnic',
  under_guardianship: false,
  guardianship_reason: '',
  guardianship_since: '',
  health_status: '',
});

const relationOf = (row) =>
  String(
    row?.relation_type ||
      row?.relation_with_family_head ||
      row?.relation_with_beneficiary ||
      '',
  ).toLowerCase();

const categoryOf = (row) => {
  const r = relationOf(row);
  if (SPOUSE_RELATIONS.has(r)) return 'spouse';
  if (CHILD_RELATIONS.has(r)) return 'children';
  if (SIBLING_RELATIONS.has(r)) return 'siblings';
  return 'other';
};

const relationLabelOf = (row, options) =>
  options.find((o) => o.value === relationOf(row))?.label ||
  relationOf(row) ||
  '—';

const formatIncome = (raw) => {
  if (raw === '' || raw == null) return '—';
  const n = Number(String(raw).replace(/,/g, ''));
  if (!Number.isFinite(n)) return String(raw);
  return n.toLocaleString('en-PK');
};

const educationWorkLabel = (row) => {
  const bits = [];
  if (row?.occupation?.trim()) bits.push(row.occupation.trim());
  if (row?.student_class?.trim()) {
    bits.push(
      `Class ${row.student_class.trim()}${
        row.student_class_name?.trim()
          ? `, ${row.student_class_name.trim()}`
          : ''
      }`,
    );
  } else if (row?.education_level) {
    bits.push(formatEducation(row.education_level));
  }
  return bits.length ? bits.join(' · ') : '—';
};

const healthLabel = (row) => {
  if (row?.has_disability || row?.health_status === 'disability') {
    return row?.disability_type?.trim() || 'Disability';
  }
  if (row?.health_status && row.health_status !== 'none') {
    return (
      HEALTH_OPTIONS.find((h) => h.value === row.health_status)?.label ||
      row.health_status
    );
  }
  if (row?.disability_type?.trim()) return row.disability_type.trim();
  return 'None';
};

const isUnderGuardianship = (row) =>
  !!row?.under_guardianship ||
  row?.household_dependency === 'dependent_on_family_head';

/**
 * Family members — table + filter chips + Add/Edit side panel.
 * Same data contract as before (rows / onChange / onMarkApplicant).
 */
const AidFamilyMembersIntake = ({
  rows = [],
  onChange,
  title = 'Family members',
  hint = '',
  addLabel = 'Add member',
  relationLabel = 'Relation to head',
  relationOptions = AID_RELATED_PERSON_TYPES,
  onMarkApplicant,
}) => {
  const list = Array.isArray(rows) ? rows : [];
  const [filter, setFilter] = useState('all');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [draft, setDraft] = useState(emptyFamilyMemberRow());

  const counts = useMemo(() => {
    const c = { all: list.length, spouse: 0, children: 0, siblings: 0, other: 0 };
    list.forEach((row) => {
      c[categoryOf(row)] += 1;
    });
    return c;
  }, [list]);

  const filtered = useMemo(() => {
    if (filter === 'all') return list.map((row, idx) => ({ row, idx }));
    return list
      .map((row, idx) => ({ row, idx }))
      .filter(({ row }) => categoryOf(row) === filter);
  }, [list, filter]);

  const openAdd = () => {
    setEditIdx(null);
    setDraft(emptyFamilyMemberRow());
    setPanelOpen(true);
  };

  const openEdit = (idx) => {
    const row = list[idx] || emptyFamilyMemberRow();
    setEditIdx(idx);
    setDraft({
      ...emptyFamilyMemberRow(),
      ...row,
      id_type: row.id_type || 'cnic',
      under_guardianship: isUnderGuardianship(row),
      health_status:
        row.health_status ||
        (row.has_disability ? 'disability' : row.disability_type ? 'other' : ''),
    });
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setEditIdx(null);
    setDraft(emptyFamilyMemberRow());
  };

  const patchDraft = (partial) => setDraft((p) => ({ ...p, ...partial }));

  const setRelation = (next) => {
    const lower = String(next || '').toLowerCase();
    const partial = {
      relation_type: next,
      relation_with_family_head: next,
      relation_with_beneficiary: next,
    };
    if (!draft.gender) {
      if (
        lower.includes('sister') ||
        lower.includes('daughter') ||
        lower === 'mother' ||
        lower === 'aunt' ||
        lower === 'grandmother' ||
        lower === 'maternal_grandmother' ||
        lower === 'niece' ||
        lower === 'wife'
      ) {
        partial.gender = 'female';
      } else if (
        lower.includes('brother') ||
        lower.includes('son') ||
        lower === 'father' ||
        lower === 'uncle' ||
        lower === 'grandfather' ||
        lower === 'maternal_grandfather' ||
        lower === 'nephew' ||
        lower === 'husband'
      ) {
        partial.gender = 'male';
      }
    }
    patchDraft(partial);
  };

  const saveDraft = () => {
    if (!String(draft.full_name || '').trim()) return;
    if (!String(draft.relation_type || '').trim()) return;

    const health = draft.health_status || '';
    const nextRow = {
      ...draft,
      full_name: draft.full_name.trim(),
      under_guardianship: !!draft.under_guardianship,
      household_dependency: draft.under_guardianship
        ? 'dependent_on_family_head'
        : draft.household_dependency || '',
      has_disability: health === 'disability' || !!draft.has_disability,
      disability_type:
        health === 'disability'
          ? draft.disability_type || 'Disability'
          : health && health !== 'none'
            ? HEALTH_OPTIONS.find((h) => h.value === health)?.label || health
            : '',
      health_status: health,
    };

    if (editIdx == null) {
      onChange([...list, nextRow]);
      if (nextRow.is_applicant && onMarkApplicant) {
        onMarkApplicant({ kind: 'member', idx: list.length, row: nextRow });
      }
    } else {
      onChange(
        list.map((row, i) =>
          i === editIdx ? { ...nextRow, is_applicant: row.is_applicant } : row,
        ),
      );
    }
    closePanel();
  };

  const removeRow = (idx) => {
    const removed = list[idx];
    onChange(list.filter((_, i) => i !== idx));
    if (removed?.is_applicant && onMarkApplicant) {
      onMarkApplicant({ kind: 'beneficiary' });
    }
    if (editIdx === idx) closePanel();
  };

  useEffect(() => {
    if (panelOpen) return undefined;
    return undefined;
  }, [panelOpen]);

  const filters = [
    { key: 'all', label: `All ${counts.all}` },
    { key: 'spouse', label: `Spouse ${counts.spouse}` },
    { key: 'children', label: `Children ${counts.children}` },
    { key: 'siblings', label: `Siblings ${counts.siblings}` },
    { key: 'other', label: `Other dependents ${counts.other}` },
  ];

  return (
    <div
      className={`aid-fm-layout${panelOpen ? ' aid-fm-layout--panel-open' : ''}`}
    >
      <div className="aid-fm-main">
        <div className="aid-fm-main__head">
          <div>
            <h4 className="aid-family-panel__title" style={{ margin: 0 }}>
              {title}
            </h4>
            {hint ? (
              <p className="aid-section-hint" style={{ margin: '0.35rem 0 0' }}>
                {hint}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="aid-fm-add-btn"
            onClick={openAdd}
          >
            <FiPlus aria-hidden />
            {addLabel.replace(/^\+\s*/, '')}
          </button>
        </div>

        <div className="aid-fm-filters" role="tablist">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              className={`aid-fm-filter${filter === f.key ? ' is-active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="aid-fm-table-wrap">
          <table className="aid-fm-table">
            <thead>
              <tr>
                <th>Relation to head</th>
                <th>Name</th>
                <th>CNIC / B-Form</th>
                <th>Age</th>
                <th>Status</th>
                <th>Education / work</th>
                <th>Income</th>
                <th>Health</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="aid-fm-table__empty">
                    No family members in this filter. Use Add member to create one.
                  </td>
                </tr>
              ) : (
                filtered.map(({ row, idx }) => {
                  const age = calcAgeFromDob(row.date_of_birth);
                  const health = healthLabel(row);
                  const healthTone =
                    health === 'None' ? 'muted' : 'alert';
                  return (
                    <tr key={`fm-row-${idx}`}>
                      <td>
                        <div className="aid-fm-rel">
                          <span>{relationLabelOf(row, relationOptions)}</span>
                          {isUnderGuardianship(row) ? (
                            <span className="aid-fm-guard-tag">
                              Under guardianship
                            </span>
                          ) : null}
                          {row.is_applicant ? (
                            <span className="aid-fm-applicant-tag">
                              Applicant
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td>{row.full_name?.trim() || '—'}</td>
                      <td>
                        {row.cnic
                          ? formatCnicInput(row.cnic)
                          : '—'}
                      </td>
                      <td>{age != null ? age : '—'}</td>
                      <td>
                        {row.marital_status
                          ? formatMaritalStatus(row.marital_status)
                          : '—'}
                      </td>
                      <td>{educationWorkLabel(row)}</td>
                      <td>{formatIncome(row.monthly_income)}</td>
                      <td>
                        <span
                          className={`aid-fm-health aid-fm-health--${healthTone}`}
                        >
                          {health}
                        </span>
                      </td>
                      <td className="aid-fm-table__actions">
                        <button
                          type="button"
                          className="aid-fm-icon-btn"
                          title="Edit"
                          aria-label="Edit member"
                          onClick={() => openEdit(idx)}
                        >
                          <FiEdit2 />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <p className="aid-fm-footnote">
          Siblings or other relatives count as dependents only when marked{' '}
          <strong>under guardianship</strong> of the head.
        </p>
      </div>

      {panelOpen ? (
        <aside className="aid-fm-panel" aria-label="Add member">
          <div className="aid-fm-panel__head">
            <h5 className="aid-fm-panel__title">
              {editIdx == null ? 'Add member' : 'Edit member'}
            </h5>
            <button
              type="button"
              className="aid-fm-icon-btn"
              aria-label="Close"
              onClick={closePanel}
            >
              <FiX />
            </button>
          </div>

          <div className="aid-fm-panel__body">
            <FormSelect
              label={relationLabel}
              required
              value={draft.relation_type || ''}
              onChange={(e) => setRelation(e.target.value)}
              options={[
                { value: '', label: 'Select…' },
                ...relationOptions,
              ]}
            />

            <FormInput
              label={
                <>
                  Full name <span className="required-mark">*</span>
                </>
              }
              required
              value={draft.full_name || ''}
              onChange={(e) => patchDraft({ full_name: e.target.value })}
              placeholder="Full name"
            />

            <div className="aid-fm-panel__grid2">
              <FormSelect
                label="ID type"
                value={draft.id_type || 'cnic'}
                onChange={(e) => patchDraft({ id_type: e.target.value })}
                options={ID_TYPE_OPTIONS}
              />
              <FormInput
                label="ID number"
                value={formatCnicInput(draft.cnic || '')}
                onChange={(e) =>
                  patchDraft({ cnic: formatCnicInput(e.target.value) })
                }
                placeholder="00000-0000000-0"
                inputMode="numeric"
              />
            </div>

            <div className="aid-fm-panel__grid2">
              <FormInput
                label="Date of birth"
                type="date"
                value={draft.date_of_birth || ''}
                onChange={(e) => patchDraft({ date_of_birth: e.target.value })}
              />
              <FormSelect
                label="Gender"
                value={draft.gender || ''}
                onChange={(e) => patchDraft({ gender: e.target.value })}
                options={[{ value: '', label: '—' }, ...AID_GENDERS]}
              />
            </div>

            <div className="aid-fm-panel__grid2">
              <FormSelect
                label="Education"
                value={draft.education_level || ''}
                onChange={(e) =>
                  patchDraft({ education_level: e.target.value })
                }
                options={[
                  { value: '', label: '—' },
                  ...AID_EDUCATION_LEVELS,
                ]}
              />
              <FormInput
                label="Class / level"
                value={draft.student_class || ''}
                onChange={(e) => patchDraft({ student_class: e.target.value })}
                placeholder="e.g. 8"
              />
            </div>

            <FormInput
              label="School / institution"
              value={draft.student_class_name || ''}
              onChange={(e) =>
                patchDraft({ student_class_name: e.target.value })
              }
              placeholder="School / institution"
            />

            <div className="aid-fm-panel__grid2">
              <FormInput
                label="Occupation"
                value={draft.occupation || ''}
                onChange={(e) => patchDraft({ occupation: e.target.value })}
                placeholder="Occupation"
              />
              <FormInput
                label="Monthly income"
                type="number"
                min="0"
                value={draft.monthly_income ?? ''}
                onChange={(e) =>
                  patchDraft({ monthly_income: e.target.value })
                }
                placeholder="PKR"
              />
            </div>

            <div className="aid-fm-panel__grid2">
              <FormSelect
                label="Marital status"
                value={draft.marital_status || ''}
                onChange={(e) =>
                  patchDraft({ marital_status: e.target.value })
                }
                options={[
                  { value: '', label: '—' },
                  ...AID_MARITAL_STATUS,
                ]}
              />
              <FormSelect
                label="Health / disability"
                value={draft.health_status || ''}
                onChange={(e) => {
                  const health_status = e.target.value;
                  patchDraft({
                    health_status,
                    has_disability: health_status === 'disability',
                    disability_type:
                      health_status === 'disability'
                        ? draft.disability_type || 'Disability'
                        : '',
                  });
                }}
                options={HEALTH_OPTIONS}
              />
            </div>

            <div className="aid-fm-guard-box">
              <label className="aid-fm-guard-check">
                <input
                  type="checkbox"
                  checked={!!draft.under_guardianship}
                  onChange={(e) =>
                    patchDraft({
                      under_guardianship: e.target.checked,
                      household_dependency: e.target.checked
                        ? 'dependent_on_family_head'
                        : '',
                    })
                  }
                />
                <span>Under the head&apos;s guardianship</span>
              </label>
              {draft.under_guardianship ? (
                <div className="aid-fm-panel__grid2">
                  <FormSelect
                    label="Reason"
                    value={draft.guardianship_reason || ''}
                    onChange={(e) =>
                      patchDraft({ guardianship_reason: e.target.value })
                    }
                    options={GUARDIANSHIP_REASONS}
                  />
                  <FormInput
                    label="Since (year)"
                    value={draft.guardianship_since || ''}
                    onChange={(e) =>
                      patchDraft({ guardianship_since: e.target.value })
                    }
                    placeholder="e.g. 2020"
                    inputMode="numeric"
                  />
                </div>
              ) : null}
            </div>

            {onMarkApplicant ? (
              <label className="aid-fm-applicant-check">
                <input
                  type="checkbox"
                  checked={!!draft.is_applicant}
                  onChange={(e) => {
                    const yes = e.target.checked;
                    patchDraft({ is_applicant: yes });
                    if (editIdx != null) {
                      if (yes) {
                        onMarkApplicant({
                          kind: 'member',
                          idx: editIdx,
                          row: draft,
                        });
                      } else {
                        onMarkApplicant({ kind: 'beneficiary' });
                      }
                    }
                  }}
                />
                <span>This family member is the applicant</span>
              </label>
            ) : null}
          </div>

          <div className="aid-fm-panel__foot">
            {editIdx != null ? (
              <button
                type="button"
                className="aid-fm-panel__btn aid-fm-panel__btn--danger"
                onClick={() => removeRow(editIdx)}
              >
                Remove
              </button>
            ) : (
              <span />
            )}
            <div className="aid-fm-panel__foot-right">
              <button
                type="button"
                className="aid-fm-panel__btn aid-fm-panel__btn--ghost"
                onClick={closePanel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="aid-fm-panel__btn aid-fm-panel__btn--primary"
                onClick={saveDraft}
              >
                {editIdx == null ? 'Add member' : 'Save'}
              </button>
            </div>
          </div>
        </aside>
      ) : null}
    </div>
  );
};

export default AidFamilyMembersIntake;

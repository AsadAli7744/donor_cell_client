import React from 'react';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import { AID_YES_NO } from '../aidConstants';

/**
 * Financial Assistance aid type — Financial Condition on Application tab
 */
const AidFinancialAssistanceFields = ({
  value,
  onChange,
  readOnly = false,
}) => {
  const details = value || {};
  const hasLoans = details.has_loans === 'yes';

  const patch = (partial) => {
    if (readOnly || !onChange) return;
    onChange({ ...details, ...partial });
  };

  if (readOnly) {
    const hasAny =
      details.monthly_household_income ||
      details.income_source ||
      details.monthly_expenses ||
      details.earning_members ||
      details.dependent_members ||
      details.has_loans ||
      details.amount_requested ||
      details.purpose ||
      details.how_managed_so_far ||
      details.alternative_if_not_approved;
    if (!hasAny) return null;

    return (
      <div className="aid-financial-assistance" style={{ marginTop: 12 }}>
        <div className="aid-family-panel">
          <h4 className="aid-family-panel__title">Financial Condition</h4>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            {[
              details.monthly_household_income
                ? `Income PKR ${details.monthly_household_income}`
                : null,
              details.income_source ? `Source: ${details.income_source}` : null,
              details.monthly_expenses
                ? `Expenses PKR ${details.monthly_expenses}`
                : null,
            ]
              .filter(Boolean)
              .join(' · ') || '—'}
          </p>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Earning members: {details.earning_members || '—'} · Dependents:{' '}
            {details.dependent_members || '—'}
          </p>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Loans:{' '}
            {details.has_loans === 'yes'
              ? `Yes${
                  details.loan_amount ? ` · PKR ${details.loan_amount}` : ''
                }${details.loan_details ? ` · ${details.loan_details}` : ''}`
              : details.has_loans === 'no'
                ? 'No'
                : '—'}
          </p>
          {(details.amount_requested || details.support_months) && (
            <p style={{ fontSize: 13, margin: '8px 0 0' }}>
              <strong>Requested:</strong>{' '}
              {[
                details.amount_requested
                  ? `PKR ${details.amount_requested}`
                  : null,
                details.support_months
                  ? `${details.support_months} month(s)`
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
          {details.purpose && (
            <p style={{ fontSize: 13, margin: '4px 0 0' }}>
              <strong>Purpose:</strong> {details.purpose}
            </p>
          )}
          {details.how_managed_so_far && (
            <p style={{ fontSize: 13, margin: '4px 0 0' }}>
              <strong>How managed so far:</strong> {details.how_managed_so_far}
            </p>
          )}
          {details.alternative_if_not_approved && (
            <p style={{ fontSize: 13, margin: '4px 0 0' }}>
              <strong>If not approved:</strong>{' '}
              {details.alternative_if_not_approved}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="aid-financial-assistance">
      <div className="aid-family-panel" style={{ marginTop: 12 }}>
        <h4 className="aid-family-panel__title">Financial Condition</h4>
        <div className="form-grid-2">
          <FormInput
            label="Monthly household income (PKR)"
            type="number"
            min="0"
            value={details.monthly_household_income ?? ''}
            onChange={(e) =>
              patch({ monthly_household_income: e.target.value })
            }
          />
          <FormInput
            label="Source of income"
            value={details.income_source || ''}
            onChange={(e) => patch({ income_source: e.target.value })}
            placeholder="Job, daily wage, pension…"
          />
          <FormInput
            label="Monthly expenses (PKR)"
            type="number"
            min="0"
            value={details.monthly_expenses ?? ''}
            onChange={(e) => patch({ monthly_expenses: e.target.value })}
          />
          <FormInput
            label="Earning members"
            type="number"
            min="0"
            value={details.earning_members ?? ''}
            onChange={(e) => patch({ earning_members: e.target.value })}
          />
          <FormInput
            label="Dependent members"
            type="number"
            min="0"
            value={details.dependent_members ?? ''}
            onChange={(e) => patch({ dependent_members: e.target.value })}
          />
          <FormSelect
            label="Do you have outstanding loans / debts?"
            value={details.has_loans || ''}
            onChange={(e) => {
              const next = e.target.value;
              patch({
                has_loans: next,
                ...(next !== 'yes'
                  ? { loan_amount: '', loan_details: '' }
                  : {}),
              });
            }}
            options={[{ value: '', label: '—' }, ...AID_YES_NO]}
          />
          {hasLoans && (
            <>
              <FormInput
                label="Loan / debt amount (PKR)"
                type="number"
                min="0"
                value={details.loan_amount ?? ''}
                onChange={(e) => patch({ loan_amount: e.target.value })}
              />
              <FormInput
                label="Loan details"
                value={details.loan_details || ''}
                onChange={(e) => patch({ loan_details: e.target.value })}
                placeholder="Bank, shop, relative…"
              />
            </>
          )}
          <FormInput
            label="Amount of assistance requested (PKR)"
            type="number"
            min="0"
            value={details.amount_requested ?? ''}
            onChange={(e) => patch({ amount_requested: e.target.value })}
          />
          <FormInput
            label="For how many months?"
            type="number"
            min="0"
            value={details.support_months ?? ''}
            onChange={(e) => patch({ support_months: e.target.value })}
          />
        </div>
        <FormTextarea
          label="Purpose of financial assistance"
          value={details.purpose || ''}
          onChange={(e) => patch({ purpose: e.target.value })}
          rows={2}
        />
        <FormTextarea
          label="How have you managed so far?"
          value={details.how_managed_so_far || ''}
          onChange={(e) => patch({ how_managed_so_far: e.target.value })}
          rows={2}
        />
        <FormTextarea
          label="If your application is not approved, what alternative plans do you have?"
          value={details.alternative_if_not_approved || ''}
          onChange={(e) =>
            patch({ alternative_if_not_approved: e.target.value })
          }
          rows={2}
        />
      </div>
    </div>
  );
};

export default AidFinancialAssistanceFields;

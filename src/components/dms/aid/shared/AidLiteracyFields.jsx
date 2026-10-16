import React from 'react';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import {
  AID_LITERACY_STATUS,
  AID_STUDENT_CLASSES,
  AID_STUDENT_CLASS_TYPES,
  literacyCategoriesFor,
} from '../aidConstants';

/**
 * Literacy tree (Educated / UnEducated):
 * Educated → Student (Class → type of class → Class Name editable)
 *          → Job (Monthly Income)
 *          → Self Employed | Business | Others
 * UnEducated → Skilled Laborer (Monthly Income)
 *            → Laborer | Self Employed | Others
 */
const AidLiteracyFields = ({ value, onChange, showIncomeAlways = false }) => {
  const status = value?.literacy_status || '';
  const category = value?.literacy_category || '';
  const categories = literacyCategoriesFor(status);
  const categoryAllowed = categories.some((c) => c.value === category);
  const effectiveCategory = categoryAllowed ? category : '';

  const needsIncome =
    showIncomeAlways ||
    effectiveCategory === 'job' ||
    effectiveCategory === 'skilled_laborer';
  const needsStudent = status === 'educated' && effectiveCategory === 'student';

  const patch = (partial) => onChange({ ...value, ...partial });

  const onStatusChange = (nextStatus) => {
    patch({
      literacy_status: nextStatus,
      literacy_category: '',
      student_class: '',
      student_class_type: '',
      student_class_name: '',
      ...(showIncomeAlways ? {} : { monthly_income: '' }),
    });
  };

  const onCategoryChange = (nextCategory) => {
    const incomeNeeded =
      showIncomeAlways ||
      nextCategory === 'job' ||
      nextCategory === 'skilled_laborer';
    patch({
      literacy_category: nextCategory,
      ...(nextCategory !== 'student'
        ? {
            student_class: '',
            student_class_type: '',
            student_class_name: '',
          }
        : {}),
      ...(!incomeNeeded && !showIncomeAlways ? { monthly_income: '' } : {}),
    });
  };

  return (
    <div className="aid-literacy-fields">
      <div className="form-grid-2">
        <FormSelect
          label="Literacy"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          options={[{ value: '', label: '—' }, ...AID_LITERACY_STATUS]}
        />
        <FormSelect
          label={
            status === 'educated'
              ? 'Educated — status'
              : status === 'uneducated'
                ? 'UnEducated — status'
                : 'Status (select Literacy first)'
          }
          value={effectiveCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          options={[{ value: '', label: '—' }, ...categories]}
          disabled={!status}
        />
      </div>

      {needsStudent && (
        <div className="form-grid-2 aid-literacy-student">
          <FormSelect
            label="Class"
            value={value.student_class || ''}
            onChange={(e) => patch({ student_class: e.target.value })}
            options={[{ value: '', label: '—' }, ...AID_STUDENT_CLASSES]}
          />
          <FormSelect
            label="Type of class"
            value={value.student_class_type || ''}
            onChange={(e) => patch({ student_class_type: e.target.value })}
            options={[{ value: '', label: '—' }, ...AID_STUDENT_CLASS_TYPES]}
          />
          <div className="aid-span-2">
            <FormInput
              label="Class Name (editable)"
              value={value.student_class_name || ''}
              onChange={(e) => patch({ student_class_name: e.target.value })}
              placeholder="School / institute / class name"
            />
          </div>
        </div>
      )}

      {needsIncome && (
        <div className="form-grid-2">
          <FormInput
            label="Monthly Income"
            value={value.monthly_income || ''}
            onChange={(e) => patch({ monthly_income: e.target.value })}
            placeholder="PKR"
          />
        </div>
      )}
    </div>
  );
};

export default AidLiteracyFields;

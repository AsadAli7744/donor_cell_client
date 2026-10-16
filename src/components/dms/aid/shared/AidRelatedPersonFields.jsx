import React, { useEffect, useRef, useState } from 'react';
import axiosInstance from '../../../../utils/axios';
import FormSelect from '../../../common/FormSelect';
import AidLiteracyFields from './AidLiteracyFields';
import AidFamilyHeadPersonalFields from './AidFamilyHeadPersonalFields';
import {
  AID_HOUSEHOLD_DEPENDENCY,
  formatCnicInput,
  formatPkPhoneInput,
} from '../aidConstants';

/**
 * Family member card — same personal layout as Family Head / Beneficiary,
 * plus relation type, CNIC lookup, household dependency, and literacy detail.
 */
const AidRelatedPersonFields = ({
  value,
  onChange,
  relationOptions = [],
  relationKey = 'relation_type',
  relationLabel = 'Type (relation)',
  showLiteracy = true,
  cardTitle,
}) => {
  const patch = (partial) => onChange({ ...value, ...partial });
  const [lookupHint, setLookupHint] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const lookupTimer = useRef(null);

  const relationValue =
    value?.[relationKey] ||
    value?.relation_type ||
    value?.relation_with_beneficiary ||
    value?.relation_with_family_head ||
    '';

  const setRelation = (next) => {
    const partial = {
      [relationKey]: next,
      relation_type: next,
    };
    if (relationKey !== 'relation_with_beneficiary') {
      partial.relation_with_beneficiary = next;
    }
    if (relationKey !== 'relation_with_family_head') {
      partial.relation_with_family_head = next;
    }
    const lower = String(next || '').toLowerCase();
    if (!value?.gender) {
      if (
        lower.includes('sister') ||
        lower.includes('daughter') ||
        lower === 'mother' ||
        lower === 'aunt' ||
        lower === 'grandmother' ||
        lower === 'maternal_grandmother' ||
        lower === 'niece'
      ) {
        partial.gender = 'female';
      } else if (
        lower.includes('brother') ||
        lower.includes('son') ||
        lower === 'father' ||
        lower === 'uncle' ||
        lower === 'grandfather' ||
        lower === 'maternal_grandfather' ||
        lower === 'nephew'
      ) {
        partial.gender = 'male';
      }
    }
    patch(partial);
  };

  const applyExistingPerson = (person) => {
    if (!person?.id) return;
    patch({
      existing_person_id: person.id,
      full_name: person.full_name || value.full_name || '',
      father_or_husband_name:
        person.father_or_husband_name || value.father_or_husband_name || '',
      name_urdu: person.name_urdu || value.name_urdu || '',
      cnic: formatCnicInput(person.cnic || value.cnic || ''),
      cnic_expiry: person.cnic_expiry || value.cnic_expiry || '',
      phone: formatPkPhoneInput(person.phone || value.phone || ''),
      phone_alternate: person.phone_alternate || value.phone_alternate || '',
      photo_url: person.photo_url || value.photo_url || '',
      photo_name: person.photo_name || value.photo_name || '',
      gender: person.gender || value.gender || '',
      date_of_birth: person.date_of_birth || value.date_of_birth || '',
      marital_status: person.marital_status || value.marital_status || '',
      occupation: person.occupation || value.occupation || '',
      monthly_income:
        person.monthly_income != null && person.monthly_income !== ''
          ? String(person.monthly_income)
          : value.monthly_income || '',
      education_level: person.education_level || value.education_level || '',
      necta_status: person.necta_status || value.necta_status || '',
      vulnerability: person.vulnerability || value.vulnerability || '',
      household_dependency:
        person.household_dependency || value.household_dependency || '',
      has_disability: !!person.has_disability,
      disability_type: person.disability_type || '',
      literacy_status: person.literacy_status || value.literacy_status || '',
      literacy_category: person.literacy_category || value.literacy_category || '',
      student_class: person.student_class || value.student_class || '',
      student_class_type: person.student_class_type || value.student_class_type || '',
      student_class_name: person.student_class_name || value.student_class_name || '',
      address: person.address || value.address || '',
      city: person.city || person.district || value.city || '',
      province: person.province || value.province || '',
      district: person.district || value.district || '',
      tehsil: person.tehsil || value.tehsil || '',
      union_council: person.union_council || value.union_council || '',
      resident_type: person.resident_type || value.resident_type || '',
      rented_amount:
        person.rented_amount != null && person.rented_amount !== ''
          ? String(person.rented_amount)
          : value.rented_amount || '',
    });
    setLookupHint(`Linked existing person #${person.id} — ${person.full_name}`);
  };

  const lookupByCnic = async (formattedCnic) => {
    const digits = String(formattedCnic || '').replace(/\D/g, '');
    if (digits.length !== 13) {
      setLookupHint('');
      if (value?.existing_person_id) patch({ existing_person_id: null });
      return;
    }
    setLookingUp(true);
    try {
      const res = await axiosInstance.get('/aid/people', {
        params: { search: digits, page: 1, pageSize: 10 },
      });
      const rows = res.data?.data || [];
      const hit = rows.find(
        (p) => String(p.cnic || '').replace(/\D/g, '') === digits,
      );
      if (hit) {
        applyExistingPerson(hit);
      } else {
        if (value?.existing_person_id) patch({ existing_person_id: null });
        setLookupHint('No existing record — a new person will be created on save');
      }
    } catch {
      setLookupHint('');
    } finally {
      setLookingUp(false);
    }
  };

  useEffect(
    () => () => {
      if (lookupTimer.current) clearTimeout(lookupTimer.current);
    },
    [],
  );

  const onCnicChange = (formatted) => {
    patch({ cnic: formatted, existing_person_id: null });
    setLookupHint('');
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    lookupTimer.current = setTimeout(() => lookupByCnic(formatted), 450);
  };

  return (
    <div className="aid-related-person">
      {cardTitle ? (
        <div className="aid-related-person__title">{cardTitle}</div>
      ) : null}

      <AidFamilyHeadPersonalFields
        showTitle={false}
        embedded
        value={value}
        onChange={onChange}
        onCnicChange={onCnicChange}
        cnicLookingUp={lookingUp}
        cnicHint={lookupHint}
        cnicLabel="CNIC NUMBER (FORMAT: 12345-1234567-1)"
        cnicPlaceholder="Enter CNIC to search existing record..."
        beforeFields={
          relationOptions?.length ? (
            <div className="aid-fh-personal__field aid-fh-personal__field--full">
              <FormSelect
                label={relationLabel}
                value={relationValue}
                onChange={(e) => setRelation(e.target.value)}
                options={[
                  { value: '', label: 'Select type…' },
                  ...relationOptions,
                ]}
                required
              />
            </div>
          ) : null
        }
        afterGrid={
          <FormSelect
            label="Household Dependency"
            value={value?.household_dependency || ''}
            onChange={(e) => patch({ household_dependency: e.target.value })}
            options={[
              { value: '', label: '—' },
              ...AID_HOUSEHOLD_DEPENDENCY,
            ]}
          />
        }
      />

      {showLiteracy ? (
        <div className="aid-related-person__literacy">
          <AidLiteracyFields value={value} onChange={onChange} />
        </div>
      ) : null}
    </div>
  );
};

export default AidRelatedPersonFields;

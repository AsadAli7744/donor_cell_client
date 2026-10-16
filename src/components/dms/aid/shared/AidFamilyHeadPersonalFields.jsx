import React, { useEffect, useRef } from 'react';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import {
  AID_GENDERS,
  AID_LITERACY_EDUCATION_OPTIONS,
  AID_MARITAL_STATUS,
  AID_NECTA_STATUS,
  AID_PROFESSIONS,
  AID_RESIDENT_TYPES,
  AID_VULNERABILITY_CHIPS,
  calcAgeFromDob,
  formatCnicInput,
  formatPkPhoneInput,
  joinVulnerabilityList,
  parseVulnerabilityList,
} from '../aidConstants';

const PK_PROVINCES = [
  { value: 'Punjab', label: 'Punjab' },
  { value: 'Sindh', label: 'Sindh' },
  { value: 'Khyber Pakhtunkhwa', label: 'Khyber Pakhtunkhwa' },
  { value: 'Balochistan', label: 'Balochistan' },
  { value: 'Islamabad Capital Territory', label: 'Islamabad Capital Territory' },
  { value: 'Azad Jammu and Kashmir', label: 'Azad Jammu and Kashmir' },
  { value: 'Gilgit-Baltistan', label: 'Gilgit-Baltistan' },
];

const Req = () => <span className="required-mark">*</span>;

/**
 * Identity + Contact cards — Family Head, Beneficiary, and Family Members.
 * Layout matches the registration mock: photo + identity grid, then contact/address.
 */
const AidFamilyHeadPersonalFields = ({
  value,
  onChange,
  title = 'Identity of family head',
  subtitle = 'CNIC is checked against the family registry as you type, to catch repeat or duplicate applications.',
  contactTitle = 'Contact & address',
  contactSubtitle = 'The investigator visits this address; add a landmark.',
  showTitle = true,
  showContact = true,
  showExtended = true,
  showPhoto = true,
  cnicLabel = 'CNIC number',
  cnicPlaceholder = '36103-4459110-2',
  onCnicChange,
  cnicHint = '',
  cnicLookingUp = false,
  beforeFields = null,
  afterGrid = null,
  embedded = false,
}) => {
  const patch = (partial) => onChange({ ...value, ...partial });
  const age = calcAgeFromDob(value?.date_of_birth);
  const selectedVulns = parseVulnerabilityList(value?.vulnerability);
  const photoInputRef = useRef(null);
  const previewUrl = value?._photo_preview || value?.photo_url || '';
  const isRented = value?.resident_type === 'rented';

  useEffect(
    () => () => {
      if (value?._photo_preview?.startsWith?.('blob:')) {
        URL.revokeObjectURL(value._photo_preview);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const toggleVulnerability = (chipValue) => {
    const next = selectedVulns.includes(chipValue)
      ? selectedVulns.filter((v) => v !== chipValue)
      : [...selectedVulns, chipValue];
    patch({ vulnerability: joinVulnerabilityList(next) });
  };

  const handleCnicChange = (raw) => {
    const formatted = formatCnicInput(raw);
    if (onCnicChange) {
      onCnicChange(formatted);
      return;
    }
    patch({ cnic: formatted });
  };

  const onPhotoPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (value?._photo_preview?.startsWith?.('blob:')) {
      URL.revokeObjectURL(value._photo_preview);
    }
    const url = URL.createObjectURL(file);
    patch({
      _photo_file: file,
      _photo_preview: url,
      photo_name: file.name,
    });
  };

  const genderOptions = ['female', 'male']
    .map((v) => AID_GENDERS.find((g) => g.value === v))
    .filter(Boolean);

  return (
    <div
      className={`aid-fh-personal${embedded ? ' aid-fh-personal--embedded' : ''}`}
    >
      <section className="aid-fh-card aid-fh-card--identity">
        {showTitle ? (
          <header className="aid-fh-personal__header">
            <h4 className="aid-fh-personal__title">{title}</h4>
            {subtitle ? (
              <p className="aid-fh-personal__subtitle">{subtitle}</p>
            ) : null}
          </header>
        ) : null}

        {beforeFields}

        <div className="aid-fh-identity__body">
          {showPhoto ? (
            <div className="aid-fh-photo">
              <div
                className={`aid-fh-photo__frame${previewUrl ? ' has-image' : ''}`}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Photo of head" />
                ) : (
                  <>
                    <svg
                      className="aid-fh-photo__icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.118a7.5 7.5 0 0115 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.5-1.632z"
                      />
                    </svg>
                    <span>Photo of head</span>
                  </>
                )}
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="aid-fh-photo__input"
                onChange={onPhotoPick}
              />
              <button
                type="button"
                className="aid-fh-photo__btn"
                onClick={() => photoInputRef.current?.click()}
              >
                Capture / upload
              </button>
            </div>
          ) : null}

          <div className="aid-fh-identity__fields">
            <div className="aid-fh-personal__grid aid-fh-personal__grid--identity">
              <div className="aid-fh-personal__field">
                <FormInput
                  label={
                    <>
                      {cnicLabel} <Req />
                    </>
                  }
                  value={formatCnicInput(value?.cnic || '')}
                  onChange={(e) => handleCnicChange(e.target.value)}
                  placeholder={cnicPlaceholder}
                  inputMode="numeric"
                  autoComplete="off"
                />
                {cnicLookingUp ? (
                  <p className="aid-fh-personal__cnic-hint">Searching…</p>
                ) : cnicHint ? (
                  <p
                    className={`aid-fh-personal__cnic-hint${
                      value?.existing_person_id ? ' is-linked' : ''
                    }`}
                  >
                    {cnicHint}
                  </p>
                ) : null}
              </div>

              <FormInput
                label="CNIC expiry"
                type="date"
                value={value?.cnic_expiry || ''}
                onChange={(e) => patch({ cnic_expiry: e.target.value })}
              />

              <FormInput
                label={
                  <>
                    Full name (as on CNIC) <Req />
                  </>
                }
                required
                value={value?.full_name || ''}
                onChange={(e) => patch({ full_name: e.target.value })}
                placeholder="Nasreen Bibi"
              />

              <FormInput
                label="Name in Urdu"
                value={value?.name_urdu || ''}
                onChange={(e) => patch({ name_urdu: e.target.value })}
                placeholder="نام"
                dir="rtl"
                lang="ur"
              />

              <FormInput
                label={
                  <>
                    Father / husband name <Req />
                  </>
                }
                required
                value={value?.father_or_husband_name || ''}
                onChange={(e) =>
                  patch({ father_or_husband_name: e.target.value })
                }
                placeholder="w/o Muhammad Akram (late)"
              />

              <div className="aid-fh-personal__dob">
                <div className="aid-fh-personal__dob-label-row">
                  <span className="aid-fh-personal__dob-label">
                    Date of birth <Req />
                  </span>
                  {age != null ? (
                    <span className="aid-fh-personal__age">
                      Age: {age} yrs
                    </span>
                  ) : null}
                </div>
                <FormInput
                  label=""
                  type="date"
                  required
                  value={value?.date_of_birth || ''}
                  onChange={(e) => patch({ date_of_birth: e.target.value })}
                />
              </div>

              <div className="aid-fh-gender">
                <span className="aid-fh-gender__label">
                  Gender <Req />
                </span>
                <div className="aid-fh-gender__options" role="radiogroup">
                  {genderOptions.map((opt) => {
                    const active = value?.gender === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`aid-fh-gender__option${
                          active ? ' is-active' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name={`aid-gender-${title}`}
                          value={opt.value}
                          checked={active}
                          onChange={() => patch({ gender: opt.value })}
                        />
                        <span>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <FormSelect
                label="Marital status"
                required
                value={value?.marital_status || ''}
                onChange={(e) => patch({ marital_status: e.target.value })}
                options={[{ value: '', label: '—' }, ...AID_MARITAL_STATUS]}
              />

              {afterGrid}
            </div>
          </div>
        </div>
      </section>

      {showContact ? (
        <section className="aid-fh-card aid-fh-card--contact">
          <header className="aid-fh-personal__header">
            <h4 className="aid-fh-personal__title">{contactTitle}</h4>
            {contactSubtitle ? (
              <p className="aid-fh-personal__subtitle">{contactSubtitle}</p>
            ) : null}
          </header>

          <div className="aid-fh-contact__grid aid-fh-contact__grid--top">
            <FormInput
              label={
                <>
                  Mobile <Req />
                </>
              }
              required
              value={formatPkPhoneInput(value?.phone || '')}
              onChange={(e) =>
                patch({ phone: formatPkPhoneInput(e.target.value) })
              }
              placeholder="0300-0000000"
              inputMode="numeric"
              autoComplete="tel"
            />
            <FormInput
              label="Alternate contact (relation)"
              value={value?.phone_alternate || ''}
              onChange={(e) => patch({ phone_alternate: e.target.value })}
              placeholder="0301-... (son / neighbour)"
            />
            <FormSelect
              label="Province"
              value={value?.province || ''}
              onChange={(e) =>
                patch({
                  province: e.target.value,
                  district: '',
                  tehsil: '',
                })
              }
              options={[{ value: '', label: '—' }, ...PK_PROVINCES]}
            />
            <FormInput
              label={
                <>
                  District <Req />
                </>
              }
              required
              value={value?.district || ''}
              onChange={(e) => {
                const district = e.target.value;
                patch({
                  district,
                  city: district || value?.city || '',
                  tehsil: '',
                });
              }}
              placeholder="Khanewal"
            />
            <FormInput
              label={
                <>
                  Tehsil <Req />
                </>
              }
              required
              value={value?.tehsil || ''}
              onChange={(e) => patch({ tehsil: e.target.value })}
              placeholder="Mian Channu"
            />
          </div>

          <div className="aid-fh-contact__uc">
            <FormInput
              label="Union council / village"
              value={value?.union_council || ''}
              onChange={(e) => patch({ union_council: e.target.value })}
              placeholder="UC / Chak no."
            />
          </div>

          <div className="aid-fh-contact__grid aid-fh-contact__grid--bottom">
            <div className="aid-fh-contact__address">
              <FormTextarea
                label="Full address & landmark"
                required
                value={value?.address || ''}
                onChange={(e) => patch({ address: e.target.value })}
                rows={3}
                placeholder="House no., street, mohalla — near the main mosque"
              />
            </div>
            <FormSelect
              label="Residence"
              value={value?.resident_type || ''}
              onChange={(e) => {
                const nextType = e.target.value;
                patch({
                  resident_type: nextType,
                  ...(nextType !== 'rented' ? { rented_amount: '' } : {}),
                });
              }}
              options={[{ value: '', label: '—' }, ...AID_RESIDENT_TYPES]}
            />
            <FormInput
              label="Monthly rent (PKR)"
              type="number"
              min="0"
              disabled={!isRented}
              value={value?.rented_amount ?? ''}
              onChange={(e) => patch({ rented_amount: e.target.value })}
              placeholder="8,000"
            />
          </div>
        </section>
      ) : null}

      {showExtended ? (
        <section className="aid-fh-card aid-fh-card--extended">
          <header className="aid-fh-personal__header">
            <h4 className="aid-fh-personal__title">Circumstances</h4>
            <p className="aid-fh-personal__subtitle">
              Occupation, literacy, vulnerability, and disability details.
            </p>
          </header>

          <div className="aid-fh-personal__grid">
            <FormSelect
              label="Profession"
              value={value?.occupation || ''}
              onChange={(e) => patch({ occupation: e.target.value })}
              options={[{ value: '', label: '—' }, ...AID_PROFESSIONS]}
            />
            <FormInput
              label="Monthly Income (PKR)"
              type="number"
              min="0"
              value={value?.monthly_income ?? ''}
              onChange={(e) => patch({ monthly_income: e.target.value })}
              placeholder="e.g. 20000"
            />
            <FormSelect
              label="Literacy"
              value={value?.education_level || ''}
              onChange={(e) => patch({ education_level: e.target.value })}
              options={[
                { value: '', label: '—' },
                ...AID_LITERACY_EDUCATION_OPTIONS,
              ]}
            />
            <FormSelect
              label="NACTA Clearance Status"
              value={value?.necta_status || ''}
              onChange={(e) => patch({ necta_status: e.target.value })}
              options={[{ value: '', label: '—' }, ...AID_NECTA_STATUS]}
            />
          </div>

          <div className="aid-fh-personal__vuln">
            <p className="aid-fh-personal__vuln-label">
              Vulnerability Categories (Select all that apply)
            </p>
            <div className="aid-fh-personal__chips" role="group">
              {AID_VULNERABILITY_CHIPS.map((chip) => {
                const active = selectedVulns.includes(chip.value);
                return (
                  <button
                    key={chip.value}
                    type="button"
                    className={`aid-fh-chip${active ? ' is-active' : ''}`}
                    aria-pressed={active}
                    onClick={() => toggleVulnerability(chip.value)}
                  >
                    {active ? '✓ ' : '+ '}
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="aid-fh-personal__disability">
            <label className="aid-fh-personal__disability-check">
              <input
                type="checkbox"
                checked={!!value?.has_disability}
                onChange={(e) =>
                  patch({
                    has_disability: e.target.checked,
                    disability_type: e.target.checked
                      ? value?.disability_type || ''
                      : '',
                  })
                }
              />
              <span className="aid-fh-personal__disability-copy">
                <strong>Has Physical or Mental Disability</strong>
                <small>
                  Enables disability grant evaluation and special equipment
                  distribution
                </small>
              </span>
            </label>
            {value?.has_disability ? (
              <FormInput
                label="Disability Type / Medical Detail"
                value={value?.disability_type || ''}
                onChange={(e) => patch({ disability_type: e.target.value })}
                placeholder="e.g. Physical - Leg Impairment, Visual, Hearing, Spinal"
              />
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default AidFamilyHeadPersonalFields;

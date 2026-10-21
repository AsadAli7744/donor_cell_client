import React, { useEffect, useMemo, useRef, useState } from 'react';
import axiosInstance from '../../../../utils/axios';
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
  formatAidRequestType,
  formatAidStatus,
  formatCnicInput,
  formatPkPhoneInput,
  joinVulnerabilityList,
  parseVulnerabilityList,
} from '../aidConstants';
import AidRegistrationAside from './AidRegistrationAside';

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

const formatShortMonth = (raw) => {
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const roleLabel = (role) => {
  const r = String(role || '').toLowerCase().replace(/_/g, ' ');
  if (!r) return 'member';
  return r;
};

/**
 * Identity + Contact cards — Family Head, Beneficiary, and Family Members.
 * Optional right rail: registry match + required checklist.
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
  showSidebar,
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
  const lookupTimer = useRef(null);
  const previewUrl = value?._photo_preview || value?.photo_url || '';
  const isRented = value?.resident_type === 'rented';
  const sidebarEnabled = showSidebar != null ? !!showSidebar : !embedded;

  const [registryMatch, setRegistryMatch] = useState(null);
  const [registryLookingUp, setRegistryLookingUp] = useState(false);
  const [matchPayload, setMatchPayload] = useState(null);

  useEffect(
    () => () => {
      if (value?._photo_preview?.startsWith?.('blob:')) {
        URL.revokeObjectURL(value._photo_preview);
      }
      if (lookupTimer.current) clearTimeout(lookupTimer.current);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const buildMatchFromDetail = (detail) => {
    const person = detail?.person || detail || {};
    const households = detail?.households || [];
    const hh = households[0] || null;
    const head =
      hh?.head_person ||
      (hh?.members || []).find(
        (m) => String(m.role_in_household || '').toLowerCase() === 'head',
      )?.person ||
      null;
    const familyCode =
      hh?.code ||
      hh?.label ||
      (hh?.id != null ? `FAM-${String(hh.id).padStart(4, '0')}` : null) ||
      (person.id != null ? `P-${person.id}` : '—');
    const apps = (detail?.applications || []).slice(0, 4);
    const history = apps.map((a) => ({
      label: `${formatAidRequestType(a.requested_aid_type)} - ${formatAidStatus(
        a.status,
      ).toLowerCase()}`,
      when: formatShortMonth(a.updated_at || a.created_at),
    }));
    return {
      personId: person.id,
      person,
      roleLabel: roleLabel(hh?.role_in_household || 'member'),
      familyCode,
      headName: head?.full_name
        ? head.is_alive === false
          ? `${head.full_name}, late`
          : head.full_name
        : null,
      history,
      householdId: hh?.id ?? null,
    };
  };

  const applyPersonFields = (person, opts = {}) => {
    if (!person) return;
    patch({
      existing_person_id: opts.link ? person.id : value?.existing_person_id,
      full_name: person.full_name || value?.full_name || '',
      father_or_husband_name:
        person.father_or_husband_name || value?.father_or_husband_name || '',
      name_urdu: person.name_urdu || value?.name_urdu || '',
      cnic: formatCnicInput(person.cnic || value?.cnic || ''),
      cnic_expiry: person.cnic_expiry || value?.cnic_expiry || '',
      phone: formatPkPhoneInput(person.phone || value?.phone || ''),
      phone_alternate: person.phone_alternate || value?.phone_alternate || '',
      photo_url: person.photo_url || value?.photo_url || '',
      photo_name: person.photo_name || value?.photo_name || '',
      gender: person.gender || value?.gender || '',
      date_of_birth: person.date_of_birth || value?.date_of_birth || '',
      marital_status: person.marital_status || value?.marital_status || '',
      address: person.address || value?.address || '',
      city: person.city || person.district || value?.city || '',
      province: person.province || value?.province || '',
      district: person.district || value?.district || '',
      tehsil: person.tehsil || value?.tehsil || '',
      union_council: person.union_council || value?.union_council || '',
      resident_type: person.resident_type || value?.resident_type || '',
      rented_amount:
        person.rented_amount != null && person.rented_amount !== ''
          ? String(person.rented_amount)
          : value?.rented_amount || '',
      occupation: person.occupation || value?.occupation || '',
      monthly_income:
        person.monthly_income != null && person.monthly_income !== ''
          ? String(person.monthly_income)
          : value?.monthly_income || '',
      vulnerability: person.vulnerability || value?.vulnerability || '',
      has_disability: !!person.has_disability,
      disability_type: person.disability_type || '',
    });
  };

  const lookupRegistry = async (formattedCnic) => {
    const digits = String(formattedCnic || '').replace(/\D/g, '');
    if (digits.length !== 13) {
      setRegistryMatch(null);
      setMatchPayload(null);
      return;
    }
    setRegistryLookingUp(true);
    try {
      const res = await axiosInstance.get('/aid/people', {
        params: { search: digits, page: 1, pageSize: 10 },
      });
      const rows = res.data?.data || [];
      const hit = rows.find(
        (p) => String(p.cnic || '').replace(/\D/g, '') === digits,
      );
      if (!hit?.id) {
        setRegistryMatch(null);
        setMatchPayload(null);
        return;
      }
      const detailRes = await axiosInstance.get(`/aid/people/${hit.id}`);
      const detail = detailRes.data?.data || detailRes.data || {};
      const match = buildMatchFromDetail({
        ...detail,
        person: detail.person || hit,
      });
      setMatchPayload(match);
      setRegistryMatch(match);
    } catch {
      setRegistryMatch(null);
      setMatchPayload(null);
    } finally {
      setRegistryLookingUp(false);
    }
  };

  useEffect(() => {
    if (!sidebarEnabled) return undefined;
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    lookupTimer.current = setTimeout(
      () => lookupRegistry(value?.cnic),
      450,
    );
    return () => {
      if (lookupTimer.current) clearTimeout(lookupTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.cnic, sidebarEnabled]);

  const checklist = useMemo(() => {
    const cnicDigits = String(value?.cnic || '').replace(/\D/g, '');
    const phoneDigits = String(value?.phone || '').replace(/\D/g, '');
    return [
      {
        key: 'cnic_name',
        label: 'CNIC & name',
        done: cnicDigits.length === 13 && !!String(value?.full_name || '').trim(),
      },
      {
        key: 'father',
        label: 'Father / husband name',
        done: !!String(value?.father_or_husband_name || '').trim(),
      },
      {
        key: 'mobile',
        label: 'Mobile number',
        done: phoneDigits.length >= 11,
      },
      {
        key: 'geo',
        label: 'District & tehsil',
        done:
          !!String(value?.district || '').trim() &&
          !!String(value?.tehsil || '').trim(),
      },
      {
        key: 'dob',
        label: 'Date of birth',
        done: !!String(value?.date_of_birth || '').trim(),
      },
      {
        key: 'photo',
        label: 'Photo of head',
        done: !!(value?._photo_preview || value?.photo_url),
      },
    ];
  }, [value]);

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
    patch({ cnic: formatted, existing_person_id: null });
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

  const main = (
    <div className="aid-fh-layout__main">
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
                {cnicLookingUp || (sidebarEnabled && registryLookingUp) ? (
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

  return (
    <div
      className={`aid-fh-personal${embedded ? ' aid-fh-personal--embedded' : ''}${
        sidebarEnabled ? ' aid-fh-personal--with-aside' : ''
      }`}
    >
      {sidebarEnabled ? (
        <div className="aid-fh-layout">
          {main}
          <AidRegistrationAside
            registryMatch={registryMatch}
            registryLookingUp={registryLookingUp}
            checklist={checklist}
            onLinkExisting={() => {
              if (!matchPayload?.person) return;
              applyPersonFields(matchPayload.person, { link: true });
            }}
            onRegisterNew={() => {
              setRegistryMatch(null);
              patch({ existing_person_id: null });
            }}
          />
        </div>
      ) : (
        main
      )}
    </div>
  );
};

export default AidFamilyHeadPersonalFields;

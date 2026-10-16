import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import FormTextarea from '../../../../common/FormTextarea';
import { PrimaryButton } from '../../../../common/buttons';
import SearchableDropdown from '../../../../common/SearchableDropdown';
import AidUserAssignField from '../../shared/AidUserAssignField';
import AidLiteracyFields from '../../shared/AidLiteracyFields';
import AidFamilyHeadPersonalFields from '../../shared/AidFamilyHeadPersonalFields';
import AidPropertyOwnership from '../../shared/AidPropertyOwnership';
import AidResidentHousing from '../../shared/AidResidentHousing';
import AidLivestockIntake from '../../shared/AidLivestockIntake';
import AidVehicleIntake from '../../shared/AidVehicleIntake';
import AidEligibilityStatus from '../../shared/AidEligibilityStatus';
import AidEducationApplicationFields from '../../shared/AidEducationApplicationFields';
import AidRationApplicationFields from '../../shared/AidRationApplicationFields';
import AidMarriageGiftApplicationFields from '../../shared/AidMarriageGiftApplicationFields';
import AidFinancialAssistanceFields from '../../shared/AidFinancialAssistanceFields';
import AidZakatPermissionForm from '../../shared/AidZakatPermissionForm';
import AidConsentForm from '../../shared/AidConsentForm';
import AidFamilyMembersIntake from '../../shared/AidFamilyMembersIntake';
import AidApplicantCheckbox from '../../shared/AidApplicantCheckbox';
import AidApplicationDocsIntake from '../../shared/AidApplicationDocsIntake';
import { downloadAsPng } from '../../shared/downloadAsPng';
import {
  AID_REQUEST_TYPES,
  AID_MARITAL_STATUS,
  AID_GENDERS,
  AID_YES_NO,
  emptyLiteracyFields,
  emptyPropertyOwnershipFields,
  emptyResidentHousingFields,
  emptyLivestockFields,
  emptyVehicleFields,
  emptyEligibilityStatusFields,
  emptyEducationDetails,
  emptyRationDetails,
  emptyMarriageGiftDetails,
  emptyFinancialAssistanceDetails,
  emptyZakatPermission,
  emptyConsentForm,
  emptyFamilyHeadRow,
  AID_FAMILY_HEAD_TYPES,
  formatCnicInput,
  formatPkPhoneInput,
  isValidCnic,
  isValidPkPhone,
  resolveRelatedPersonKinship,
} from '../../aidConstants';
import '../../aid.css';

const emptyPerson = {
  full_name: '',
  father_or_husband_name: '',
  name_urdu: '',
  cnic: '',
  cnic_expiry: '',
  phone: '',
  phone_alternate: '',
  photo_url: '',
  photo_name: '',
  city: '',
  address: '',
  province: '',
  district: '',
  tehsil: '',
  union_council: '',
  gender: '',
  date_of_birth: '',
  marital_status: '',
  vulnerability: '',
  is_applicant: false,
  occupation: '',
  monthly_income: '',
  household_dependency: '',
  education_level: '',
  is_alive: true,
  has_disability: false,
  disability_type: '',
  existing_person_id: null,
  ...emptyLiteracyFields(),
  ...emptyPropertyOwnershipFields(),
  ...emptyResidentHousingFields(),
  ...emptyLivestockFields(),
  ...emptyVehicleFields(),
  ...emptyEligibilityStatusFields(),
};

const cleanLivestockEntries = (p) => {
  if (!p?.has_livestock) return { has_livestock: false, livestock_entries: undefined };
  const rows = (p.livestock_entries || [])
    .map((row) => {
      const qty = Number(row.quantity);
      if (!row.animal_type || !Number.isFinite(qty) || qty <= 0) return null;
      const entry = {
        animal_type: row.animal_type,
        quantity: Math.floor(qty),
        ownership: row.ownership || 'personal',
      };
      if (entry.ownership === 'sharing') {
        if (row.owner_name?.trim()) entry.owner_name = row.owner_name.trim();
        if (row.owner_contact?.trim()) {
          entry.owner_contact = row.owner_contact.trim();
        }
      }
      return entry;
    })
    .filter(Boolean);
  return {
    has_livestock: true,
    livestock_entries: rows.length ? rows : undefined,
  };
};

const emptyRelative = () => ({ ...emptyPerson });

const familyHeadTypeLabel = (type) =>
  AID_FAMILY_HEAD_TYPES.find((t) => t.value === type)?.label || type || 'Family head';

/** Map family relation → API writer_relation enum. */
const mapRelationToWriterRelation = (rel) => {
  const r = String(rel || '').toLowerCase();
  if (r === 'self') return 'self';
  if (['father', 'mother', 'spouse', 'guardian', 'relative', 'other'].includes(r)) {
    return r;
  }
  if (
    [
      'brother',
      'sister',
      'step_brother',
      'step_sister',
      'half_brother',
      'half_sister',
      'sibling',
      'son',
      'daughter',
      'child',
      'uncle',
      'aunt',
      'cousin',
      'nephew',
      'niece',
      'grandfather',
      'grandmother',
      'maternal_grandfather',
      'maternal_grandmother',
      'grandchild',
      'husband',
    ].includes(r)
  ) {
    return 'relative';
  }
  if (r === 'custody_holder' || r === 'in_law') return 'other';
  return 'relative';
};

const RelativeFields = ({ title, value, onChange, compact }) => (
  <div
    className={`aid-relative-block${compact ? ' aid-relative-block--compact' : ''}`}
  >
    <AidFamilyHeadPersonalFields
      title={title || 'Identity'}
      subtitle="CNIC is checked against the family registry as you type."
      value={value}
      onChange={onChange}
      afterGrid={
        <label className="aid-toggle" style={{ alignSelf: 'end' }}>
          <input
            type="checkbox"
            checked={value?.is_alive !== false}
            onChange={(e) =>
              onChange({ ...value, is_alive: e.target.checked })
            }
          />
          Alive
        </label>
      }
    />
    <AidLiteracyFields value={value} onChange={onChange} />
  </div>
);

const cleanPersonPayload = (p) => {
  if (!p?.full_name?.trim()) return null;
  return {
    full_name: p.full_name.trim(),
    father_or_husband_name: p.father_or_husband_name?.trim() || undefined,
    name_urdu: p.name_urdu?.trim() || undefined,
    cnic: p.cnic || undefined,
    cnic_expiry: p.cnic_expiry || undefined,
    phone: p.phone || undefined,
    phone_alternate: p.phone_alternate?.trim() || undefined,
    photo_url: p.photo_url || undefined,
    photo_name: p.photo_name || undefined,
    gender: p.gender || undefined,
    date_of_birth: p.date_of_birth || undefined,
    marital_status: p.marital_status || undefined,
    vulnerability: p.vulnerability || undefined,
    occupation: p.occupation || p.literacy_category || undefined,
    monthly_income: p.monthly_income || undefined,
    household_dependency: p.household_dependency || undefined,
    education_level: p.education_level || undefined,
    literacy_status: p.literacy_status || undefined,
    literacy_category: p.literacy_category || undefined,
    student_class: p.student_class || undefined,
    student_class_type: p.student_class_type || undefined,
    student_class_name: p.student_class_name || undefined,
    has_disability: !!p.has_disability,
    disability_type: p.has_disability ? p.disability_type || undefined : undefined,
    has_land: !!p.has_land,
    property_type: p.has_land ? p.property_type || undefined : undefined,
    property_details: p.has_land
      ? p.property_details || undefined
      : undefined,
    resident_type: p.resident_type || undefined,
    resident_ownership_status: p.resident_ownership_status || undefined,
    resident_ownership_other: p.resident_ownership_other || undefined,
    rented_amount:
      p.resident_type === 'rented' && p.rented_amount !== ''
        ? p.rented_amount
        : undefined,
    house_area_marla:
      p.house_area_marla !== '' && p.house_area_marla != null
        ? p.house_area_marla
        : undefined,
    house_details: p.house_details || undefined,
    ...cleanLivestockEntries(p),
    has_vehicle: !!p.has_vehicle,
    vehicle_type:
      p.has_vehicle && p.vehicle_type?.trim()
        ? p.vehicle_type.trim()
        : undefined,
    necta_status: p.necta_status || undefined,
    necta_document_url: p.necta_document_url || undefined,
    necta_document_name: p.necta_document_name || undefined,
    bisp_status: p.bisp_status || undefined,
    is_alive: p.is_alive !== false,
    address: p.address || undefined,
    city: p.city || p.district || undefined,
    province: p.province || undefined,
    district: p.district || undefined,
    tehsil: p.tehsil || undefined,
    union_council: p.union_council || undefined,
  };
};

const AidApplicationAdd = () => {
  const navigate = useNavigate();
  const [beneficiaryMode, setBeneficiaryMode] = useState('new');
  const [beneficiaryId, setBeneficiaryId] = useState(null);
  const [existingBeneficiary, setExistingBeneficiary] = useState(null);
  const [beneficiary, setBeneficiary] = useState({
    ...emptyPerson,
    is_applicant: true,
  });
  const [form, setForm] = useState({
    title: '',
    request_summary: '',
    requested_aid_type: 'health',
  });
  const [educationDetails, setEducationDetails] = useState(
    emptyEducationDetails(),
  );
  const [rationDetails, setRationDetails] = useState(emptyRationDetails());
  const [marriageGiftDetails, setMarriageGiftDetails] = useState(
    emptyMarriageGiftDetails(),
  );
  const [financialAssistanceDetails, setFinancialAssistanceDetails] = useState(
    emptyFinancialAssistanceDetails(),
  );
  const [zakatPermission, setZakatPermission] = useState(emptyZakatPermission());
  const [consentForm, setConsentForm] = useState(emptyConsentForm());
  const [applicationDocs, setApplicationDocs] = useState({});
  const [assignedUser, setAssignedUser] = useState(null);
  const [familyHeads, setFamilyHeads] = useState([
    {
      ...emptyFamilyHeadRow('father'),
      is_applicant: false,
      is_beneficiary: false,
    },
  ]);
  const [spouse, setSpouse] = useState(emptyRelative());
  /** Beneficiary tab — any relatives (children, siblings, parents, …). */
  const [beneficiaryMembers, setBeneficiaryMembers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formTab, setFormTab] = useState('family');
  const applicationCaptureRef = useRef(null);
  const zakatCaptureRef = useRef(null);
  const consentCaptureRef = useRef(null);
  const [pngDownloading, setPngDownloading] = useState(false);

  const handleDownloadPng = async (ref, fileName) => {
    if (!ref?.current || pngDownloading) return;
    setPngDownloading(true);
    try {
      await downloadAsPng(ref.current, fileName);
    } catch (err) {
      toast.error(err?.message || 'Failed to download PNG');
    } finally {
      setPngDownloading(false);
    }
  };

  const FORM_TABS = [
    { id: 'family', label: 'Family Registration', hint: 'Household' },
    { id: 'beneficiary', label: 'Beneficiary', hint: 'Person details' },
    { id: 'request', label: 'Application', hint: 'Need & aid type' },
    { id: 'attachments', label: 'Attachments', hint: 'Docs & forms' },
    { id: 'assignment', label: 'Assignment', hint: 'Case owner' },
  ];
  const stepIndex = FORM_TABS.findIndex((t) => t.id === formTab);
  const stepProgress = ((stepIndex + 1) / FORM_TABS.length) * 100;

  /** Family Head marked as the beneficiary (single-person household). */
  const headAsBeneficiary =
    familyHeads.find((h) => h.is_beneficiary) || null;

  const beneficiaryGender = headAsBeneficiary
    ? headAsBeneficiary.gender || ''
    : beneficiaryMode === 'existing'
      ? existingBeneficiary?.gender || ''
      : beneficiary.gender;
  const beneficiaryMarital = headAsBeneficiary
    ? headAsBeneficiary.marital_status || ''
    : beneficiaryMode === 'existing'
      ? existingBeneficiary?.marital_status || ''
      : beneficiary.marital_status;

  const isMarried = beneficiaryMarital === 'married';
  const spouseLabel =
    beneficiaryGender === 'male'
      ? 'Wife'
      : beneficiaryGender === 'female'
        ? 'Husband'
        : 'Spouse';
  const spouseDefaultGender =
    beneficiaryGender === 'male'
      ? 'female'
      : beneficiaryGender === 'female'
        ? 'male'
        : '';

  /** Exactly one applicant: beneficiary, spouse, family head, or a family member. */
  const markApplicant = (target) => {
    const kind = target?.kind || 'beneficiary';
    if (kind === 'none') {
      setBeneficiary((b) => ({ ...b, is_applicant: false }));
      setSpouse((s) => ({ ...s, is_applicant: false }));
      setFamilyHeads((heads) =>
        heads.map((h) => ({
          ...h,
          is_applicant: false,
          _family_members: (h._family_members || []).map((m) => ({
            ...m,
            is_applicant: false,
          })),
        })),
      );
      setBeneficiaryMembers((list) =>
        list.map((m) => ({ ...m, is_applicant: false })),
      );
      return;
    }
    setBeneficiary((b) => ({
      ...b,
      is_applicant: kind === 'beneficiary',
    }));
    setSpouse((s) => ({
      ...s,
      is_applicant: kind === 'spouse',
    }));
    setFamilyHeads((heads) =>
      heads.map((h, i) => ({
        ...h,
        is_applicant: kind === 'family_head' && target.idx === i,
        _family_members: (h._family_members || []).map((m, mi) => ({
          ...m,
          is_applicant:
            kind === 'head_member' &&
            target.headIdx === i &&
            target.idx === mi,
        })),
      })),
    );
    setBeneficiaryMembers((list) =>
      list.map((m, i) => ({
        ...m,
        is_applicant: kind === 'beneficiary_member' && target.idx === i,
      })),
    );
  };

  /** Exactly one beneficiary source: Beneficiary tab or one Family Head. */
  const markBeneficiary = (target) => {
    const kind = target?.kind || 'form';
    setFamilyHeads((heads) =>
      heads.map((h, i) => ({
        ...h,
        is_beneficiary: kind === 'family_head' && target.idx === i,
      })),
    );
    if (kind === 'family_head') {
      // Family head is beneficiary — clear applicant on the separate beneficiary form
      setBeneficiary((b) => ({ ...b, is_applicant: false }));
    }
  };

  useEffect(() => {
    if (isMarried) {
      setSpouse((p) => ({
        ...p,
        gender: p.gender || spouseDefaultGender,
        marital_status: p.marital_status || 'married',
      }));
    }
  }, [isMarried, spouseDefaultGender]);

  const searchPeople = async (term) => {
    const q = String(term || '').trim();
    if (q.length < 2) return [];
    try {
      const res = await axiosInstance.get('/aid/people', {
        params: { search: q, page: 1, pageSize: 30 },
      });
      return (res.data?.data || []).map((p) => ({
        id: p.id,
        name: p.full_name,
        email: p.cnic || p.phone || '',
        raw: p,
      }));
    } catch {
      return [];
    }
  };

  const pushRelatedMember = (members, row, opts = {}) => {
    const relation =
      opts.relation || resolveRelatedPersonKinship(row) || 'other';
    const notes = opts.notes;
    if (row?.existing_person_id) {
      members.push({
        relation_type: relation,
        existing_person_id: Number(row.existing_person_id),
        notes,
      });
      return;
    }
    const payload = cleanPersonPayload(row);
    if (!payload) return;
    if (!payload.gender && relation === 'sister') payload.gender = 'female';
    if (!payload.gender && relation === 'brother') payload.gender = 'male';
    if (!payload.gender && relation === 'daughter') payload.gender = 'female';
    if (!payload.gender && relation === 'son') payload.gender = 'male';
    if (!payload.gender && relation === 'mother') payload.gender = 'female';
    if (!payload.gender && relation === 'father') payload.gender = 'male';
    members.push({ relation_type: relation, person: payload, notes });
  };

  const buildFamilyMembers = () => {
    const members = [];
    for (const head of familyHeads) {
      const uiType = head._relation_type || 'other';
      const relation = resolveRelatedPersonKinship({
        relation_type: uiType,
      });
      // When Family Head is also the beneficiary (single-person household),
      // do not add them again as a relative of themselves.
      if (!head.is_beneficiary) {
        const payload = cleanPersonPayload(head);
        if (payload) {
          const genderHint = emptyFamilyHeadRow(uiType).gender;
          if (!payload.gender && genderHint) payload.gender = genderHint;
          const roles = [
            head.is_applicant ? 'Applicant' : null,
            'Family head',
          ]
            .filter(Boolean)
            .join(' / ');
          members.push({
            relation_type: relation,
            person: payload,
            notes: `${roles} (${familyHeadTypeLabel(uiType)})`,
          });
        }
      }
      for (const rel of head._family_members || []) {
        pushRelatedMember(members, rel, {
          notes: rel.is_applicant
            ? `Applicant / relative of ${familyHeadTypeLabel(uiType).toLowerCase()} (${rel.relation_type || 'other'})`
            : `Relative of ${familyHeadTypeLabel(uiType).toLowerCase()} (${rel.relation_type || 'other'})`,
        });
      }
    }

    for (const rel of beneficiaryMembers) {
      pushRelatedMember(members, rel, {
        notes: rel.is_applicant
          ? `Applicant / beneficiary family member (${rel.relation_type || 'other'})`
          : `Beneficiary family member (${rel.relation_type || 'other'})`,
      });
    }

    if (isMarried) {
      const spousePayload = cleanPersonPayload(spouse);
      if (spouse.existing_person_id) {
        members.push({
          relation_type: 'spouse',
          existing_person_id: Number(spouse.existing_person_id),
        });
      } else if (spousePayload) {
        if (!spousePayload.gender && spouseDefaultGender) {
          spousePayload.gender = spouseDefaultGender;
        }
        if (!spousePayload.marital_status) {
          spousePayload.marital_status = 'married';
        }
        members.push({ relation_type: 'spouse', person: spousePayload });
      }
    }

    return members;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isMarried && !spouse.full_name.trim()) {
        throw new Error(
          `${spouseLabel} details are required for married beneficiaries`,
        );
      }
      const allGenericMembers = [
        ...beneficiaryMembers,
        ...familyHeads.flatMap((h) => h._family_members || []),
      ];
      for (const m of allGenericMembers) {
        if (!m.full_name?.trim()) {
          throw new Error(
            'Enter a name for every family member row (or remove empty ones)',
          );
        }
        if (!m.relation_type) {
          throw new Error('Select Type for every family member');
        }
        if (m.cnic && !isValidCnic(m.cnic)) {
          throw new Error(
            'Family member CNIC must be 13 digits as 12345-1234567-1',
          );
        }
        if (m.phone && !isValidPkPhone(m.phone)) {
          throw new Error(
            'Family member contact must be 11 digits starting with 03',
          );
        }
      }
      const namedHeads = familyHeads.filter((h) => h.full_name?.trim());
      if (!namedHeads.length) {
        throw new Error(
          'Enter at least one Family Head (Father / Mother / Husband / Son / Brother…)',
        );
      }
      const missingType = namedHeads.find((h) => !h._relation_type);
      if (missingType) {
        throw new Error('Select Type for each Family Head');
      }
      const badCnic = namedHeads.find((h) => h.cnic && !isValidCnic(h.cnic));
      if (badCnic) {
        throw new Error(
          'Family Head CNIC must be 13 digits as 12345-1234567-1',
        );
      }
      const badPhone = namedHeads.find((h) => h.phone && !isValidPkPhone(h.phone));
      if (badPhone) {
        throw new Error(
          'Family Head contact must be 11 digits starting with 03',
        );
      }
      const missingDob = namedHeads.find((h) => !h.date_of_birth);
      if (missingDob) {
        throw new Error('Enter Date of Birth for each Family Head');
      }

      const beneficiaryHead = familyHeads.find((h) => h.is_beneficiary) || null;

      const resolveApplicant = () => {
        // Single-person family: Family Head is both beneficiary and applicant
        if (beneficiaryHead?.is_applicant) {
          return { kind: 'self' };
        }
        if (!beneficiaryHead && beneficiary.is_applicant) {
          return { kind: 'self' };
        }
        if (spouse.is_applicant) {
          return { kind: 'spouse', person: spouse, relation: 'spouse' };
        }
        const headIdx = familyHeads.findIndex((h) => h.is_applicant);
        if (headIdx >= 0) {
          const head = familyHeads[headIdx];
          return {
            kind: 'family_head',
            person: head,
            relation: mapRelationToWriterRelation(head._relation_type),
          };
        }
        const bmIdx = beneficiaryMembers.findIndex((m) => m.is_applicant);
        if (bmIdx >= 0) {
          const m = beneficiaryMembers[bmIdx];
          return {
            kind: 'member',
            person: m,
            relation: mapRelationToWriterRelation(m.relation_type),
          };
        }
        for (let hi = 0; hi < familyHeads.length; hi += 1) {
          const members = familyHeads[hi]._family_members || [];
          const mi = members.findIndex((m) => m.is_applicant);
          if (mi >= 0) {
            const m = members[mi];
            return {
              kind: 'member',
              person: m,
              relation: mapRelationToWriterRelation(m.relation_type),
            };
          }
        }
        return { kind: 'self' };
      };

      const applicant = resolveApplicant();

      const payload = {
        title: form.title || null,
        request_summary: form.request_summary || null,
        requested_aid_type: form.requested_aid_type,
        ...(form.requested_aid_type === 'education'
          ? { education_details: educationDetails }
          : {}),
        ...(form.requested_aid_type === 'ration'
          ? { ration_details: rationDetails }
          : {}),
        ...(form.requested_aid_type === 'marriage_gift'
          ? { marriage_gift_details: marriageGiftDetails }
          : {}),
        ...(form.requested_aid_type === 'financial_assistance'
          ? { financial_assistance_details: financialAssistanceDetails }
          : {}),
        zakat_permission: zakatPermission,
        consent_form: consentForm,
        writer_relation: 'self',
        family_members: buildFamilyMembers(),
        ...(assignedUser?.id
          ? { assigned_to_user_id: Number(assignedUser.id) }
          : {}),
      };

      const validatePerson = (person, label) => {
        if (!person?.full_name?.trim() && !person?.existing_person_id) {
          throw new Error(`${label} name is required`);
        }
        if (!person.gender) throw new Error(`${label} gender is required`);
        if (!person.marital_status) {
          throw new Error(`${label} marital status is required`);
        }
        if (!person.date_of_birth) {
          throw new Error(`${label} date of birth is required`);
        }
        if (person.cnic && !isValidCnic(person.cnic)) {
          throw new Error(
            `${label} CNIC must be 13 digits as 12345-1234567-1`,
          );
        }
        if (person.phone && !isValidPkPhone(person.phone)) {
          throw new Error(
            `${label} contact must be 11 digits starting with 03`,
          );
        }
      };

      if (beneficiaryHead) {
        validatePerson(beneficiaryHead, 'Beneficiary (Family Head)');
        if (beneficiaryHead.existing_person_id) {
          payload.beneficiary_person_id = Number(
            beneficiaryHead.existing_person_id,
          );
        } else {
          payload.beneficiary = {
            ...cleanPersonPayload(beneficiaryHead),
            full_name: beneficiaryHead.full_name.trim(),
          };
        }
      } else if (beneficiaryMode === 'existing') {
        if (!beneficiaryId) throw new Error('Select a beneficiary');
        payload.beneficiary_person_id = Number(beneficiaryId);
      } else {
        validatePerson(beneficiary, 'Beneficiary');
        payload.beneficiary = {
          ...cleanPersonPayload(beneficiary),
          full_name: beneficiary.full_name.trim(),
        };
      }

      if (applicant.kind === 'self') {
        payload.writer_relation = 'self';
      } else {
        const person = applicant.person || {};
        if (!person.full_name?.trim() && !person.existing_person_id) {
          throw new Error(
            'Enter applicant details (name) for the selected applicant',
          );
        }
        if (person.cnic && !isValidCnic(person.cnic)) {
          throw new Error(
            'Applicant CNIC must be 13 digits as 12345-1234567-1',
          );
        }
        if (person.phone && !isValidPkPhone(person.phone)) {
          throw new Error(
            'Applicant contact must be 11 digits starting with 03',
          );
        }
        payload.writer_relation = applicant.relation || 'relative';
        if (person.existing_person_id) {
          payload.writer_person_id = Number(person.existing_person_id);
        } else {
          const writerPayload = cleanPersonPayload(person);
          if (!writerPayload) {
            throw new Error('Applicant name is required');
          }
          payload.writer = writerPayload;
        }
      }

      const res = await axiosInstance.post('/aid/applications', payload);
      const id = res.data?.data?.id;
      if (id) {
        const docEntries = Object.entries(applicationDocs || {}).filter(
          ([, slot]) => slot?.file,
        );
        for (const [context, slot] of docEntries) {
          const fd = new FormData();
          fd.append('file', slot.file);
          fd.append('context', context);
          fd.append('description', context);
          await axiosInstance.post(
            `/aid/applications/${id}/attachments/upload`,
            fd,
            { headers: { 'Content-Type': 'multipart/form-data' } },
          );
        }
      }
      navigate(
        id
          ? `/dms/aid/applications/entry/view/${id}`
          : '/dms/aid/applications/entry/list',
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create application');
    } finally {
      setSaving(false);
    }
  };

  const familyHint = useMemo(() => {
    const base =
      'Add Family Head entries and select type for each (Father / Mother / Husband / Son / Brother / Step Sibling / other blood relations…). Under each head you can add any family members.';
    if (isMarried) {
      return `${base} Also add ${spouseLabel.toLowerCase()} if married.`;
    }
    return base;
  }, [isMarried, spouseLabel]);

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader
          title="New Aid Application"
          backPath="/dms/aid/applications/entry/list"
          onBackClick={() => navigate('/dms/aid/applications/entry/list')}
          showAdd={false}
        />

        {error && (
          <div className="status-message status-message--error">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="form aid-application-form">
          <div className="aid-steps" role="navigation" aria-label="Application steps">
            <div className="aid-steps__meta">
              <span className="aid-steps__meta-label">
                Step {stepIndex + 1} of {FORM_TABS.length}
              </span>
              <span className="aid-steps__meta-pct">
                {Math.round(stepProgress)}% complete
              </span>
            </div>
            <div
              className="aid-steps__track"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={FORM_TABS.length}
              aria-valuenow={stepIndex + 1}
              aria-valuetext={FORM_TABS[stepIndex]?.label}
            >
              <div
                className="aid-steps__fill"
                style={{ width: `${stepProgress}%` }}
              />
            </div>
            <ol className="aid-steps__list">
              {FORM_TABS.map((t, i) => {
                const done = i < stepIndex;
                const active = i === stepIndex;
                return (
                  <li
                    key={t.id}
                    className={[
                      'aid-steps__item',
                      done ? 'aid-steps__item--done' : '',
                      active ? 'aid-steps__item--active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <button
                      type="button"
                      className="aid-steps__btn"
                      aria-current={active ? 'step' : undefined}
                      onClick={() => setFormTab(t.id)}
                    >
                      <span className="aid-steps__marker" aria-hidden="true">
                        {done ? <FiCheck size={11} strokeWidth={3} /> : i + 1}
                      </span>
                      <span className="aid-steps__copy">
                        <span className="aid-steps__label">{t.label}</span>
                        <span className="aid-steps__hint">{t.hint}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {formTab === 'request' && (
          <div className="form-section">
            <div className="aid-section-heading-row">
              <h3 className="form-section-heading">Application</h3>
              <button
                type="button"
                className="aid-png-download-btn"
                title="Download as PNG"
                aria-label="Download Application as PNG"
                disabled={pngDownloading}
                onClick={() =>
                  handleDownloadPng(applicationCaptureRef, 'aid-application')
                }
              >
                <FiDownload size={18} />
              </button>
            </div>
            <div ref={applicationCaptureRef} className="aid-png-capture">
            <div className="form-grid-2">
              <FormInput
                label="Title"
                name="title"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Short need title"
              />
              <FormSelect
                label="Aid type"
                name="requested_aid_type"
                value={form.requested_aid_type}
                onChange={(e) => {
                  const next = e.target.value;
                  setForm((p) => ({ ...p, requested_aid_type: next }));
                  if (next === 'education') {
                    setEducationDetails((prev) =>
                      prev?.education_history?.length
                        ? prev
                        : emptyEducationDetails(),
                    );
                  }
                  if (next === 'ration') {
                    setRationDetails((prev) =>
                      prev?.family_had_wheat != null
                        ? prev
                        : emptyRationDetails(),
                    );
                  }
                  if (next === 'marriage_gift') {
                    setMarriageGiftDetails((prev) =>
                      prev?.items?.length ? prev : emptyMarriageGiftDetails(),
                    );
                  }
                  if (next === 'financial_assistance') {
                    setFinancialAssistanceDetails((prev) =>
                      prev?.monthly_household_income != null
                        ? prev
                        : emptyFinancialAssistanceDetails(),
                    );
                  }
                }}
                options={AID_REQUEST_TYPES}
              />
            </div>
            <div className="aid-field-spaced">
              <FormTextarea
                label={
                  form.requested_aid_type === 'ration'
                    ? 'Application'
                    : 'Application summary'
                }
                name="request_summary"
                value={form.request_summary}
                onChange={(e) =>
                  setForm((p) => ({ ...p, request_summary: e.target.value }))
                }
                rows={form.requested_aid_type === 'ration' ? 6 : 3}
                placeholder="Describe the need…"
              />
            </div>
            {form.requested_aid_type === 'education' && (
              <AidEducationApplicationFields
                value={educationDetails}
                onChange={setEducationDetails}
              />
            )}
            {form.requested_aid_type === 'ration' && (
              <AidRationApplicationFields
                value={rationDetails}
                onChange={setRationDetails}
              />
            )}
            {form.requested_aid_type === 'marriage_gift' && (
              <AidMarriageGiftApplicationFields
                value={marriageGiftDetails}
                onChange={setMarriageGiftDetails}
              />
            )}
            {form.requested_aid_type === 'financial_assistance' && (
              <AidFinancialAssistanceFields
                value={financialAssistanceDetails}
                onChange={setFinancialAssistanceDetails}
              />
            )}
            </div>
          </div>
          )}

          {formTab === 'attachments' && (
          <div className="form-section">
            <h3 className="form-section-heading">Attachments</h3>
            <AidApplicationDocsIntake
              value={applicationDocs}
              onChange={setApplicationDocs}
              disabled={saving}
            />

            <div className="aid-family-panel" style={{ marginTop: 16 }}>
              <div className="aid-section-heading-row">
                <h4 className="aid-family-panel__title">
                  Zakat Permission Letter
                </h4>
                <button
                  type="button"
                  className="aid-png-download-btn"
                  title="Download as PNG"
                  aria-label="Download Zakat form as PNG"
                  disabled={pngDownloading}
                  onClick={() =>
                    handleDownloadPng(zakatCaptureRef, 'zakat-permission-letter')
                  }
                >
                  <FiDownload size={18} />
                </button>
              </div>
              <div ref={zakatCaptureRef} className="aid-png-capture">
                <AidZakatPermissionForm
                  value={zakatPermission}
                  onChange={setZakatPermission}
                />
              </div>
            </div>

            <div className="aid-family-panel" style={{ marginTop: 12 }}>
              <div className="aid-section-heading-row">
                <h4 className="aid-family-panel__title">Consent Form</h4>
                <button
                  type="button"
                  className="aid-png-download-btn"
                  title="Download as PNG"
                  aria-label="Download Consent form as PNG"
                  disabled={pngDownloading}
                  onClick={() =>
                    handleDownloadPng(consentCaptureRef, 'consent-form')
                  }
                >
                  <FiDownload size={18} />
                </button>
              </div>
              <div ref={consentCaptureRef} className="aid-png-capture">
                <AidConsentForm
                  value={consentForm}
                  onChange={setConsentForm}
                />
              </div>
            </div>
          </div>
          )}

          {formTab === 'assignment' && (
          <div className="form-section">
            <h3 className="form-section-heading">Assignment</h3>
            <AidUserAssignField
              value={assignedUser}
              onChange={setAssignedUser}
              hint="Optional — assign a fund-raising staff member to handle this case."
            />
          </div>
          )}

          {formTab === 'beneficiary' && (
          <div className="form-section">
            <h3 className="form-section-heading">Beneficiary</h3>
            {headAsBeneficiary ? (
              <p className="aid-section-hint">
                Beneficiary is set from Family Head (
                {familyHeadTypeLabel(headAsBeneficiary._relation_type)}
                ). Edit their details on the Family Head step. You can still add
                family members below.
              </p>
            ) : (
              <AidApplicantCheckbox
                checked={!!beneficiary.is_applicant}
                onChange={(yes) => {
                  if (yes) markApplicant({ kind: 'beneficiary' });
                }}
                label="Beneficiary is the applicant"
                hint="Uncheck by selecting applicant on Family Head or a family member."
              />
            )}
            {!headAsBeneficiary && (
            <label className="aid-toggle aid-toggle--block">
              <input
                type="checkbox"
                checked={beneficiaryMode === 'existing'}
                onChange={(e) => {
                  setBeneficiaryMode(e.target.checked ? 'existing' : 'new');
                  if (!e.target.checked) setExistingBeneficiary(null);
                }}
              />
              Link existing person in system
            </label>
            )}

            {headAsBeneficiary ? null : beneficiaryMode === 'existing' ? (
              <SearchableDropdown
                label="Search beneficiary"
                placeholder="Name, CNIC, phone…"
                onSearch={searchPeople}
                onSelect={async (item) => {
                  setBeneficiaryId(item.id);
                  try {
                    const res = await axiosInstance.get(`/aid/people/${item.id}`);
                    setExistingBeneficiary(res.data?.data?.person || item.raw || null);
                  } catch {
                    setExistingBeneficiary(item.raw || null);
                  }
                }}
                onClear={() => {
                  setBeneficiaryId(null);
                  setExistingBeneficiary(null);
                }}
                displayKey="name"
                minSearchLength={2}
              />
            ) : (
              <>
                <AidFamilyHeadPersonalFields
                  title="Identity of beneficiary"
                  subtitle="CNIC is checked against the family registry as you type, to catch repeat or duplicate applications."
                  contactTitle="Contact & address"
                  contactSubtitle="The investigator visits this address; add a landmark."
                  value={beneficiary}
                  onChange={(next) =>
                    setBeneficiary({
                      ...next,
                      is_applicant: beneficiary.is_applicant,
                    })
                  }
                />
              </>
            )}

            {!headAsBeneficiary && beneficiaryMode !== 'existing' && (
              <>
                <div className="aid-family-panel" style={{ marginTop: 12 }}>
                  <h4 className="aid-family-panel__title">
                    Literacy (beneficiary / family head)
                  </h4>
                  <AidLiteracyFields
                    value={beneficiary}
                    onChange={setBeneficiary}
                  />
                </div>
                <div className="aid-family-panel" style={{ marginTop: 12 }}>
                  <AidPropertyOwnership
                    value={beneficiary}
                    onChange={setBeneficiary}
                    title="Property ownership (beneficiary)"
                  />
                </div>
                <div className="aid-family-panel" style={{ marginTop: 12 }}>
                  <AidResidentHousing
                    value={beneficiary}
                    onChange={setBeneficiary}
                    title="Resident (beneficiary)"
                  />
                </div>
                <div className="aid-family-panel" style={{ marginTop: 12 }}>
                  <AidLivestockIntake
                    value={beneficiary}
                    onChange={setBeneficiary}
                    title="Livestock (beneficiary)"
                  />
                </div>
                <div className="aid-family-panel" style={{ marginTop: 12 }}>
                  <AidVehicleIntake
                    value={beneficiary}
                    onChange={setBeneficiary}
                    title="Vehicle (beneficiary)"
                  />
                </div>
                <div className="aid-family-panel" style={{ marginTop: 12 }}>
                  <AidEligibilityStatus
                    value={beneficiary}
                    onChange={setBeneficiary}
                    title="NECTA / BISP (beneficiary)"
                  />
                </div>
              </>
            )}

            <div className="aid-family-panel" style={{ marginTop: 12 }}>
              <AidFamilyMembersIntake
                title="Beneficiary — family members"
                hint="Add any relative. Select Type first. Mark one as applicant if they applied."
                rows={beneficiaryMembers}
                onChange={setBeneficiaryMembers}
                relationLabel="Type (relation to beneficiary)"
                onMarkApplicant={(sel) => {
                  if (sel.kind === 'member') {
                    markApplicant({ kind: 'beneficiary_member', idx: sel.idx });
                  } else {
                    markApplicant({ kind: 'beneficiary' });
                  }
                }}
              />
            </div>
          </div>
          )}

          {formTab === 'family' && (
          <div className="form-section">
            <h3 className="form-section-heading">Family Head</h3>
            <p className="aid-section-hint">{familyHint}</p>
            <p className="aid-section-hint">
              For a single-person family, check both Applicant and Beneficiary
              on the Family Head. Otherwise mark Applicant / Beneficiary as
              needed (spouse or family members can also be the applicant).
            </p>

            {isMarried && (
              <div className="aid-family-panel">
                <AidApplicantCheckbox
                  checked={!!spouse.is_applicant}
                  onChange={(yes) => {
                    if (yes) markApplicant({ kind: 'spouse' });
                    else markApplicant({ kind: 'beneficiary' });
                  }}
                  label={`${spouseLabel} is the applicant`}
                />
                <RelativeFields
                  title={`${spouseLabel} (required)`}
                  value={spouse}
                  onChange={(next) =>
                    setSpouse({ ...next, is_applicant: spouse.is_applicant })
                  }
                  compact
                />
              </div>
            )}

            <div className="aid-family-panel">
              <div className="aid-family-panel__head">
                <h4 className="aid-family-panel__title">
                  Family Head <span>(select type for each)</span>
                </h4>
                <button
                  type="button"
                  className="aid-mini-btn aid-mini-btn--add"
                  onClick={() =>
                    setFamilyHeads((p) => [
                      ...p,
                      {
                        ...emptyFamilyHeadRow('guardian'),
                        is_applicant: false,
                        is_beneficiary: false,
                      },
                    ])
                  }
                >
                  + Add family head
                </button>
              </div>
              {familyHeads.map((head, idx) => {
                const typeLabel = familyHeadTypeLabel(head._relation_type);
                return (
                  <div key={`fh-${idx}`} className="aid-repeat-item">
                    <div className="aid-role-check-row aid-role-check-row--inline3">
                      <div className="aid-role-check-row__type">
                        <FormSelect
                          label="Type"
                          value={head._relation_type || 'father'}
                          onChange={(e) => {
                            const type = e.target.value;
                            const preset = emptyFamilyHeadRow(type);
                            setFamilyHeads((list) =>
                              list.map((row, i) =>
                                i === idx
                                  ? {
                                      ...row,
                                      _relation_type: type,
                                      gender: row.gender || preset.gender,
                                    }
                                  : row,
                              ),
                            );
                          }}
                          options={AID_FAMILY_HEAD_TYPES}
                          required
                        />
                        {familyHeads.length > 1 && (
                          <button
                            type="button"
                            className="aid-mini-btn aid-mini-btn--remove"
                            onClick={() => {
                              const wasApplicant =
                                familyHeads[idx]?.is_applicant;
                              const wasBeneficiary =
                                familyHeads[idx]?.is_beneficiary;
                              setFamilyHeads((list) =>
                                list.filter((_, i) => i !== idx),
                              );
                              if (wasApplicant) {
                                markApplicant({ kind: 'beneficiary' });
                              }
                              if (wasBeneficiary) {
                                markBeneficiary({ kind: 'form' });
                              }
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <AidApplicantCheckbox
                        checked={!!head.is_applicant}
                        variant="applicant"
                        onChange={(yes) => {
                          if (yes) markApplicant({ kind: 'family_head', idx });
                          else if (head.is_beneficiary) {
                            // Keep single-person household; clear applicant only
                            markApplicant({ kind: 'none' });
                          } else {
                            markApplicant({ kind: 'beneficiary' });
                          }
                        }}
                        label="Applicant"
                        hint="This Family Head submitted the application"
                      />
                      <AidApplicantCheckbox
                        checked={!!head.is_beneficiary}
                        variant="beneficiary"
                        onChange={(yes) => {
                          if (yes) markBeneficiary({ kind: 'family_head', idx });
                          else markBeneficiary({ kind: 'form' });
                        }}
                        label="Beneficiary"
                        hint="Single-person family — this head is the beneficiary"
                      />
                    </div>
                    <AidFamilyHeadPersonalFields
                      title={`Identity of family head${
                        head.is_beneficiary || head.is_applicant
                          ? ` — ${typeLabel} (${[
                              head.is_beneficiary ? 'Beneficiary' : null,
                              head.is_applicant ? 'Applicant' : null,
                            ]
                              .filter(Boolean)
                              .join(' + ')})`
                          : ` — ${typeLabel}`
                      }`}
                      subtitle="CNIC is checked against the family registry as you type, to catch repeat or duplicate applications."
                      contactTitle="Contact & address"
                      contactSubtitle="The investigator visits this address; add a landmark."
                      value={head}
                      onChange={(next) =>
                        setFamilyHeads((list) =>
                          list.map((row, i) =>
                            i === idx
                              ? {
                                  ...next,
                                  _relation_type: row._relation_type,
                                  _family_members: row._family_members,
                                  is_applicant: row.is_applicant,
                                  is_beneficiary: row.is_beneficiary,
                                }
                              : row,
                          ),
                        )
                      }
                    />
                    <div className="aid-family-panel" style={{ marginTop: 12 }}>
                      <h4 className="aid-family-panel__title">
                        {typeLabel} — literacy detail
                      </h4>
                      <AidLiteracyFields
                        value={head}
                        onChange={(next) =>
                          setFamilyHeads((list) =>
                            list.map((row, i) =>
                              i === idx
                                ? {
                                    ...row,
                                    ...next,
                                    _relation_type: row._relation_type,
                                    _family_members: row._family_members,
                                    is_applicant: row.is_applicant,
                                    is_beneficiary: row.is_beneficiary,
                                  }
                                : row,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="aid-family-panel" style={{ marginTop: 12 }}>
                      <AidPropertyOwnership
                        value={head}
                        onChange={(next) =>
                          setFamilyHeads((list) =>
                            list.map((row, i) =>
                              i === idx
                                ? {
                                    ...row,
                                    ...next,
                                    _relation_type: row._relation_type,
                                    _family_members: row._family_members,
                                    is_applicant: row.is_applicant,
                                    is_beneficiary: row.is_beneficiary,
                                  }
                                : row,
                            ),
                          )
                        }
                        title={`${typeLabel} — property ownership`}
                      />
                    </div>
                    <div className="aid-family-panel" style={{ marginTop: 12 }}>
                      <AidResidentHousing
                        value={head}
                        onChange={(next) =>
                          setFamilyHeads((list) =>
                            list.map((row, i) =>
                              i === idx
                                ? {
                                    ...row,
                                    ...next,
                                    _relation_type: row._relation_type,
                                    _family_members: row._family_members,
                                    is_applicant: row.is_applicant,
                                    is_beneficiary: row.is_beneficiary,
                                  }
                                : row,
                            ),
                          )
                        }
                        title={`${typeLabel} — resident`}
                      />
                    </div>
                    <div className="aid-family-panel" style={{ marginTop: 12 }}>
                      <AidLivestockIntake
                        value={head}
                        onChange={(next) =>
                          setFamilyHeads((list) =>
                            list.map((row, i) =>
                              i === idx
                                ? {
                                    ...row,
                                    ...next,
                                    _relation_type: row._relation_type,
                                    _family_members: row._family_members,
                                    is_applicant: row.is_applicant,
                                    is_beneficiary: row.is_beneficiary,
                                  }
                                : row,
                            ),
                          )
                        }
                        title={`${typeLabel} — livestock`}
                      />
                    </div>
                    <div className="aid-family-panel" style={{ marginTop: 12 }}>
                      <AidVehicleIntake
                        value={head}
                        onChange={(next) =>
                          setFamilyHeads((list) =>
                            list.map((row, i) =>
                              i === idx
                                ? {
                                    ...row,
                                    ...next,
                                    _relation_type: row._relation_type,
                                    _family_members: row._family_members,
                                    is_applicant: row.is_applicant,
                                    is_beneficiary: row.is_beneficiary,
                                  }
                                : row,
                            ),
                          )
                        }
                        title={`${typeLabel} — vehicle`}
                      />
                    </div>
                    <div className="aid-family-panel" style={{ marginTop: 12 }}>
                      <AidEligibilityStatus
                        value={head}
                        onChange={(next) =>
                          setFamilyHeads((list) =>
                            list.map((row, i) =>
                              i === idx
                                ? {
                                    ...row,
                                    ...next,
                                    _relation_type: row._relation_type,
                                    _family_members: row._family_members,
                                    is_applicant: row.is_applicant,
                                    is_beneficiary: row.is_beneficiary,
                                  }
                                : row,
                            ),
                          )
                        }
                        title={`${typeLabel} — NECTA / BISP`}
                      />
                    </div>
                    <div className="aid-family-panel" style={{ marginTop: 12 }}>
                      <AidFamilyMembersIntake
                        title={`${typeLabel} — family members`}
                        hint="Relatives under this family head. Mark one as applicant if they applied."
                        rows={head._family_members || []}
                        onChange={(members) =>
                          setFamilyHeads((list) =>
                            list.map((row, i) =>
                              i === idx
                                ? { ...row, _family_members: members }
                                : row,
                            ),
                          )
                        }
                        relationLabel="Type (relation to family head)"
                        onMarkApplicant={(sel) => {
                          if (sel.kind === 'member') {
                            markApplicant({
                              kind: 'head_member',
                              headIdx: idx,
                              idx: sel.idx,
                            });
                          } else {
                            markApplicant({ kind: 'beneficiary' });
                          }
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          <div className="form-actions aid-form-actions">
            <div className="aid-form-nav">
              {FORM_TABS.findIndex((t) => t.id === formTab) > 0 && (
                <button
                  type="button"
                  className="aid-nav-icon-btn aid-nav-icon-btn--prev"
                  title="Previous"
                  aria-label="Previous"
                  onClick={() => {
                    const idx = FORM_TABS.findIndex((t) => t.id === formTab);
                    setFormTab(FORM_TABS[idx - 1].id);
                  }}
                >
                  <FiChevronLeft size={22} />
                </button>
              )}
              {FORM_TABS.findIndex((t) => t.id === formTab) < FORM_TABS.length - 1 && (
                <button
                  type="button"
                  className="aid-nav-icon-btn aid-nav-icon-btn--next"
                  title="Next"
                  aria-label="Next"
                  onClick={() => {
                    const idx = FORM_TABS.findIndex((t) => t.id === formTab);
                    setFormTab(FORM_TABS[idx + 1].id);
                  }}
                >
                  <FiChevronRight size={22} />
                </button>
              )}
            </div>
            <PrimaryButton type="submit" loading={saving} loadingText="Saving…">
              Submit application
            </PrimaryButton>
          </div>
        </form>
      </div>
    </>
  );
};

export default AidApplicationAdd;

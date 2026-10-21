export const AID_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'ceo_approval_required', label: 'CEO approval required' },
  { value: 'successful', label: 'Successful' },
  { value: 'delivered', label: 'Delivered' },
];

/** Data-entry list pipeline cards (maps to API `stage` filter). Drafts use the Drafts board. */
export const AID_ENTRY_STAGES = [
  { id: 'submitted', label: 'Submitted', hint: 'Awaiting investigator' },
  { id: 'investigation', label: 'Investigation', hint: 'Field visit due' },
  { id: 'pending_approval', label: 'Pending approval', hint: 'With committee' },
  { id: 'approved', label: 'Approved', hint: 'This month' },
  { id: 'returned', label: 'Returned', hint: 'Need correction' },
];

export function formatAidEntryStage(stage) {
  return AID_ENTRY_STAGES.find((s) => s.id === stage)?.label || stage || '—';
}

export function aidEntryStageTone(stage) {
  switch (stage) {
    case 'draft':
      return 'muted';
    case 'submitted':
      return 'info';
    case 'investigation':
      return 'warn';
    case 'pending_approval':
      return 'purple';
    case 'approved':
      return 'success';
    case 'returned':
      return 'danger';
    default:
      return 'muted';
  }
}

export function formatRelativeAidTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} d ago`;
  return d.toLocaleDateString();
}

/** erp_prep has no aid_program catalog — fall back to readable key / request type. */
export function formatAidProgramLabel(programKey) {
  if (!programKey) return '—';
  return String(programKey).replace(/_/g, ' ');
}

export const AID_REQUEST_TYPES = [
  { value: 'health', label: 'Health' },
  { value: 'education', label: 'Education' },
  { value: 'ration', label: 'Ration' },
  { value: 'marriage_gift', label: 'Marriage Gift' },
  { value: 'financial_assistance', label: 'Financial Assistance' },
  { value: 'clean_water', label: 'Clean Water' },
  { value: 'apna_ghar', label: 'Apna Ghar' },
  { value: 'disaster_relief', label: 'Disaster Relief' },
  { value: 'kasb_skill_development', label: 'KASB Skill Development' },
  { value: 'seeds_of_change', label: 'Seeds of Change' },
  { value: 'aas_lab_diagnostics', label: 'AAS Lab & Diagnostics' },
  { value: 'community_services', label: 'Community Services' },
  { value: 'other', label: 'Other' },
];

/** Education History — Class dropdown starting from Matric */
export const AID_EDUCATION_HISTORY_CLASSES = [
  { value: 'matric', label: 'Matric' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'master', label: 'Master' },
  { value: 'mphil', label: 'MPhil' },
  { value: 'phd', label: 'PhD' },
  { value: 'other', label: 'Other' },
];

/** Scholarship — Current Degree starting from Intermediate */
export const AID_SCHOLARSHIP_DEGREES = [
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'master', label: 'Master' },
  { value: 'mphil', label: 'MPhil' },
  { value: 'phd', label: 'PhD' },
  { value: 'other', label: 'Other' },
];

export const AID_SCHOLARSHIP_CLASS_MODES = [
  { value: 'annual', label: 'Annual' },
  { value: 'semester', label: 'Semester' },
];

export const emptyEducationHistoryRow = () => ({
  class_level: '',
  board_institute: '',
  year: '',
  marks_obtained: '',
  total_marks: '',
  percentage: '',
  attachment_url: '',
  attachment_name: '',
});

export const emptyScholarshipRow = () => ({
  current_degree: '',
  institute_name: '',
  city: '',
  annual_fee: '',
  start_date: '',
  end_date: '',
  total_years: '',
  class_mode: '',
});

export const emptyEducationDetails = () => ({
  education_history: [emptyEducationHistoryRow()],
  scholarships: [emptyScholarshipRow()],
  income_source_before: '',
  continue_education_if_not_approved: '',
});

export function calcEducationPercentage(obtained, total) {
  const o = Number(obtained);
  const t = Number(total);
  if (!Number.isFinite(o) || !Number.isFinite(t) || t <= 0) return '';
  return String(Math.round((o / t) * 10000) / 100);
}

/** Monthly Ration Program — Application tab special structure */
export const emptyRationDetails = () => ({
  persons_male: '',
  persons_female: '',
  persons_kids: '',
  family_had_wheat: '',
  wheat_quantity_kg: '',
  how_know_mtjf: '',
  ration_arrangements_before: '',
  support_years: '',
  support_months: '',
  alternative_if_not_approved: '',
});

/** Marriage Gift — default available item */
export const emptyMarriageGiftItem = (name = '') => ({ name });

/** Marriage Gift — Application tab special structure */
export const emptyMarriageGiftDetails = () => ({
  date_of_marriage: '',
  already_married_nikah: '',
  nikah_date: '',
  bride_groom_relationship: '',
  earlier_children_marriage_expenses: '',
  items: [emptyMarriageGiftItem('Paiti set')],
  others: '',
});

/** Financial Assistance — Financial Condition section */
export const emptyFinancialAssistanceDetails = () => ({
  monthly_household_income: '',
  income_source: '',
  monthly_expenses: '',
  earning_members: '',
  dependent_members: '',
  has_loans: '',
  loan_amount: '',
  loan_details: '',
  amount_requested: '',
  support_months: '',
  purpose: '',
  how_managed_so_far: '',
  alternative_if_not_approved: '',
});

/** Zakat Permission Letter — assets / eligibility (all applications) */
export const emptyZakatPermission = () => ({
  form_date: '',
  application_no: '',
  applicant_name: '',
  age: '',
  education: '',
  gold: '',
  silver: '',
  cash: '',
  commercial_goods: '',
  surplus_items: '',
  loan: '',
  zakat_eligible: '',
  declaration_accepted: false,
  /** SecuGen thumb capture — null until device capture succeeds */
  applicant_thumb: null,
  /** ePad VP9801 signature — null until device capture succeeds */
  applicant_signature: null,
  lang: 'ur',
});

export function calcZakatAssetTotal(details) {
  const d = details || {};
  const keys = ['gold', 'silver', 'cash', 'commercial_goods', 'surplus_items'];
  return keys.reduce((sum, k) => {
    const n = Number(d[k]);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
}

export function calcZakatNetAfterLoan(details) {
  const total = calcZakatAssetTotal(details);
  const loan = Number(details?.loan);
  const loanAmt = Number.isFinite(loan) ? loan : 0;
  return Math.max(0, total - loanAmt);
}

/** Media / donor Consent Form (کنسنٹ فارم) — all applications */
export const emptyConsentForm = () => ({
  form_date: '',
  application_no: '',
  full_name: '',
  parentage_or_spouse: '',
  cnic: '',
  sector: '',
  consent_accepted: false,
  applicant_thumb: null,
  applicant_signature: null,
  lang: 'ur',
});

export const AID_WRITER_RELATIONS = [
  { value: 'self', label: 'Self (beneficiary)' },
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'relative', label: 'Relative' },
  { value: 'other', label: 'Other' },
];

export const AID_MARITAL_STATUS = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'separated', label: 'Separated' },
];

/** Beneficiary vulnerability categories */
export const AID_VULNERABILITIES = [
  { value: 'poor', label: 'Poor' },
  { value: 'extreme_poor', label: 'Extreme Poor' },
  { value: 'widow', label: 'Widow' },
  { value: 'widows', label: 'Widows' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'divorced_women', label: 'Divorced Women' },
  { value: 'orphan', label: 'Orphan' },
  { value: 'orphans', label: 'Orphans' },
  { value: 'disable', label: 'Disable' },
  { value: 'people_with_disabilities', label: 'People with Disabilities' },
  { value: 'indigent', label: 'Indigent' },
  { value: 'abandoned_women', label: 'Abandoned Women' },
  { value: 'abandoned', label: 'Abandoned' },
  { value: 'women_headed_households', label: 'Women-Headed Households' },
  { value: 'elderly_no_support', label: 'Elderly with No Support' },
  { value: 'chronic_illness', label: 'Chronic Illness' },
  { value: 'daily_wage_laborers', label: 'Daily Wage Laborers' },
  { value: 'idps', label: 'Internally Displaced Persons (IDPs)' },
  { value: 'religious_minorities', label: 'Religious Minorities in Need' },
  { value: 'desert_area_inhabitants', label: 'Desert Area Inhabitants' },
  { value: 'unemployed_youth', label: 'Unemployed Youth' },
  { value: 'students_ultra_poor', label: 'Students from Ultra-Poor Families' },
  { value: 'malnourished_families', label: 'Malnourished Families' },
  { value: 'natural_disaster_victims', label: 'Victims of Natural Disasters' },
  { value: 'other', label: 'Other' },
];

/** Chip multi-select on Family Head personal card (subset). */
export const AID_VULNERABILITY_CHIPS = [
  { value: 'widow', label: 'Widow' },
  { value: 'orphan', label: 'Orphan' },
  { value: 'disable', label: 'Disabled' },
  { value: 'abandoned', label: 'Abandoned' },
  { value: 'indigent', label: 'Indigent' },
  { value: 'elderly_no_support', label: 'Elderly No Support' },
  { value: 'chronic_illness', label: 'Chronic Illness' },
  { value: 'other', label: 'Other' },
];

export function parseVulnerabilityList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function joinVulnerabilityList(values) {
  if (!Array.isArray(values) || !values.length) return '';
  return values.filter(Boolean).join(',');
}

export function formatVulnerability(value) {
  const list = parseVulnerabilityList(value);
  if (!list.length) return '—';
  return list
    .map(
      (v) =>
        AID_VULNERABILITIES.find((o) => o.value === v)?.label ||
        AID_VULNERABILITY_CHIPS.find((o) => o.value === v)?.label ||
        v,
    )
    .join(', ');
}

/** Profession options (Family Head personal card). */
export const AID_PROFESSIONS = [
  { value: 'labourer', label: 'Labourer' },
  { value: 'skilled_laborer', label: 'Skilled Labourer' },
  { value: 'farmer', label: 'Farmer' },
  { value: 'job', label: 'Job / Employee' },
  { value: 'business', label: 'Business' },
  { value: 'self_employed', label: 'Self Employed' },
  { value: 'housewife', label: 'Housewife' },
  { value: 'student', label: 'Student' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'retired', label: 'Retired' },
  { value: 'other', label: 'Other' },
];

/**
 * Literacy (education) shown on Family Head personal card.
 * Maps to education_level; "Post-Graduate" = masters.
 */
export const AID_LITERACY_EDUCATION_OPTIONS = [
  { value: 'none', label: 'None / Illiterate' },
  { value: 'primary', label: 'Primary' },
  { value: 'middle', label: 'Middle' },
  { value: 'matric', label: 'Matric' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'bachelors', label: 'Graduate' },
  { value: 'masters', label: 'Post-Graduate' },
  { value: 'religious', label: 'Religious education' },
  { value: 'other', label: 'Other' },
];

export const AID_EDUCATION_LEVELS = [
  { value: 'none', label: 'None / illiterate' },
  { value: 'primary', label: 'Primary' },
  { value: 'middle', label: 'Middle' },
  { value: 'matric', label: 'Matric' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'bachelors', label: "Bachelor's" },
  { value: 'masters', label: "Master's+" },
  { value: 'religious', label: 'Religious education' },
  { value: 'other', label: 'Other' },
];

/** Digits only, max 13 → display as 12345-1234567-1 */
export function formatCnicInput(raw) {
  const digits = String(raw || '')
    .replace(/\D/g, '')
    .slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export function isValidCnic(value) {
  if (!value) return true;
  const formatted = formatCnicInput(value);
  return /^\d{5}-\d{7}-\d{1}$/.test(formatted);
}

/** PK mobile: digits only, max 11, prefer 03XXXXXXXXX */
export function formatPkPhoneInput(raw) {
  return String(raw || '')
    .replace(/\D/g, '')
    .slice(0, 11);
}

export function isValidPkPhone(value) {
  if (!value) return true;
  return /^03\d{9}$/.test(String(value).trim());
}

export function calcAgeFromDob(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  return age >= 0 && age < 150 ? age : null;
}

/** Literacy root — Educated / UnEducated (per intake diagram). */
export const AID_LITERACY_STATUS = [
  { value: 'educated', label: 'Educated' },
  { value: 'uneducated', label: 'UnEducated' },
];

/** Educated → Student | Job | Self Employed | Business | Others */
export const AID_LITERACY_CATEGORIES_EDUCATED = [
  { value: 'student', label: 'Student' },
  { value: 'job', label: 'Job' },
  { value: 'self_employed', label: 'Self Employed' },
  { value: 'business', label: 'Business' },
  { value: 'others', label: 'Others' },
];

/** UnEducated → Skilled Laborer | Laborer | Self Employed | Others */
export const AID_LITERACY_CATEGORIES_UNEDUCATED = [
  { value: 'skilled_laborer', label: 'Skilled Laborer' },
  { value: 'laborer', label: 'Laborer' },
  { value: 'self_employed', label: 'Self Employed' },
  { value: 'others', label: 'Others' },
];

/** Student → Class options */
export const AID_STUDENT_CLASSES = [
  { value: 'nursery', label: 'Nursery' },
  { value: 'kg', label: 'KG' },
  { value: '1', label: '1st' },
  { value: '2', label: '2nd' },
  { value: '3', label: '3rd' },
  { value: '4', label: '4th' },
  { value: '5', label: '5th' },
  { value: '6', label: '6th' },
  { value: '7', label: '7th' },
  { value: '8', label: '8th' },
  { value: '9', label: '9th' },
  { value: '10', label: '10th / Matric' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'master', label: 'Master' },
  { value: 'other', label: 'Other' },
];

/** Student → type of class */
export const AID_STUDENT_CLASS_TYPES = [
  { value: 'science', label: 'Science' },
  { value: 'arts', label: 'Arts' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'medical', label: 'Medical' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'general', label: 'General' },
  { value: 'other', label: 'Other' },
];

const LITERACY_CATEGORY_LABELS = Object.fromEntries([
  ...AID_LITERACY_CATEGORIES_EDUCATED,
  ...AID_LITERACY_CATEGORIES_UNEDUCATED,
].map((o) => [o.value, o.label]));

export const AID_YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

/** Property type when Do you have land? = Yes */
export const AID_PROPERTY_TYPES = [
  { value: 'agri', label: 'Agri' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'plot', label: 'Plot' },
  { value: 'others', label: 'Others' },
];

export const emptyPropertyOwnershipFields = () => ({
  has_land: false,
  property_type: '',
  property_details: '',
});

export function formatPropertyOwnershipSummary(person) {
  if (!person || person.has_land == null) return '';
  if (!person.has_land) return 'Land: No';
  const type =
    AID_PROPERTY_TYPES.find((t) => t.value === person.property_type)?.label ||
    person.property_type ||
    '—';
  const parts = [`Land: Yes · Type: ${type}`];
  if (person.property_details) parts.push(person.property_details);
  return parts.join(' · ');
}

/** Resident type: Own House | Rented | Sham Lot */
export const AID_RESIDENT_TYPES = [
  { value: 'own_house', label: 'Own House' },
  { value: 'rented', label: 'Rented' },
  { value: 'sham_lot', label: 'Sham Lot' },
];

export const emptyResidentHousingFields = () => ({
  resident_type: '',
  resident_ownership_status: '',
  resident_ownership_other: '',
  rented_amount: '',
  house_area_marla: '',
  house_details: '',
});

export const AID_LIVESTOCK_ANIMALS = [
  { value: 'goat', label: 'Goat' },
  { value: 'cow', label: 'Cow' },
  { value: 'buffalo', label: 'Buffalo' },
];

export const AID_LIVESTOCK_OWNERSHIP = [
  { value: 'personal', label: 'Personal' },
  { value: 'sharing', label: 'Sharing' },
];

export const emptyLivestockRow = () => ({
  animal_type: 'goat',
  quantity: '',
  ownership: 'personal',
  owner_name: '',
  owner_contact: '',
});

export const emptyLivestockFields = () => ({
  has_livestock: false,
  livestock_entries: [],
});

export const AID_VEHICLE_TYPES = [
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'car', label: 'Car' },
  { value: 'van', label: 'Van / Suzuki' },
  { value: 'truck', label: 'Truck' },
  { value: 'tractor', label: 'Tractor' },
  { value: 'bicycle', label: 'Bicycle' },
  { value: 'other', label: 'Other (specify)' },
];

export const emptyVehicleFields = () => ({
  has_vehicle: false,
  vehicle_type: '',
});

export function formatVehicleSummary(person) {
  if (!person || person.has_vehicle == null) return '';
  if (!person.has_vehicle) return 'Vehicle: No';
  const t = person.vehicle_type || '';
  const label =
    AID_VEHICLE_TYPES.find((x) => x.value === t)?.label || t || '—';
  return `Vehicle: Yes · ${label}`;
}

export const AID_NECTA_STATUS = [
  { value: 'clear', label: 'Clear' },
  { value: 'not_clear', label: 'Not Clear' },
];

export const AID_BISP_STATUS = [
  { value: 'eligible', label: 'Eligible' },
  { value: 'not_eligible', label: 'Not Eligible' },
];

export const emptyEligibilityStatusFields = () => ({
  necta_status: '',
  necta_document_url: '',
  necta_document_name: '',
  bisp_status: '',
});

export function formatEligibilityStatusSummary(person) {
  if (!person) return '';
  const parts = [];
  if (person.necta_status) {
    const n =
      AID_NECTA_STATUS.find((x) => x.value === person.necta_status)?.label ||
      person.necta_status;
    parts.push(`NECTA: ${n}`);
  }
  if (person.necta_document_url) parts.push('NECTA doc attached');
  if (person.bisp_status) {
    const b =
      AID_BISP_STATUS.find((x) => x.value === person.bisp_status)?.label ||
      person.bisp_status;
    parts.push(`BISP: ${b}`);
  }
  return parts.join(' · ');
}

export function formatLivestockSummary(person) {
  if (!person || person.has_livestock == null) return '';
  if (!person.has_livestock) return 'Livestock: No';
  const entries = Array.isArray(person.livestock_entries)
    ? person.livestock_entries
    : [];
  if (!entries.length) return 'Livestock: Yes';
  const animalLabel = (t) =>
    AID_LIVESTOCK_ANIMALS.find((a) => a.value === t)?.label || t;
  const ownLabel = (o) =>
    AID_LIVESTOCK_OWNERSHIP.find((x) => x.value === o)?.label || o;
  return entries
    .map((row) => {
      const bits = [
        `${animalLabel(row.animal_type)} × ${row.quantity ?? '—'}`,
        ownLabel(row.ownership),
      ];
      if (row.ownership === 'sharing' && row.owner_name) {
        bits.push(`Owner: ${row.owner_name}`);
      }
      if (row.ownership === 'sharing' && row.owner_contact) {
        bits.push(row.owner_contact);
      }
      return bits.join(' · ');
    })
    .join('; ');
}

export function formatResidentHousingSummary(person) {
  if (!person?.resident_type) return '';
  const typeLabel =
    AID_RESIDENT_TYPES.find((t) => t.value === person.resident_type)?.label ||
    person.resident_type;
  const parts = [`Resident: ${typeLabel}`];
  if (person.resident_ownership_status) {
    parts.push(`Ownership: ${person.resident_ownership_status}`);
  }
  if (person.resident_ownership_other) {
    parts.push(`Other: ${person.resident_ownership_other}`);
  }
  if (person.resident_type === 'rented' && person.rented_amount != null && person.rented_amount !== '') {
    parts.push(`Rent PKR ${person.rented_amount}`);
  }
  if (person.house_area_marla != null && person.house_area_marla !== '') {
    parts.push(`${person.house_area_marla} Marla`);
  }
  if (person.house_details) parts.push(person.house_details);
  return parts.join(' · ');
}

export const emptyLiteracyFields = () => ({
  literacy_status: '',
  literacy_category: '',
  student_class: '',
  student_class_type: '',
  student_class_name: '',
  monthly_income: '',
  has_disability: false,
  disability_type: '',
});

/** Household dependency (related-person / family member card). */
export const AID_HOUSEHOLD_DEPENDENCY = [
  { value: 'dependent_on_family_head', label: 'Dependent on Family Head' },
  { value: 'dependent_on_beneficiary', label: 'Dependent on Beneficiary' },
  { value: 'self_supporting', label: 'Self Supporting' },
  { value: 'earning_member', label: 'Earning Member' },
  { value: 'other', label: 'Other' },
];

/** Children — Type (relation) options. */
export const AID_CHILD_RELATIONS = [
  { value: 'son', label: 'Son' },
  { value: 'daughter', label: 'Daughter' },
  { value: 'child', label: 'Child' },
  { value: 'grandchild', label: 'Grandchild' },
];

/** Shared empty person fields for related individuals. */
export const emptyRelatedPersonBase = () => ({
  full_name: '',
  father_or_husband_name: '',
  name_urdu: '',
  gender: '',
  date_of_birth: '',
  cnic: '',
  cnic_expiry: '',
  phone: '',
  phone_alternate: '',
  photo_url: '',
  photo_name: '',
  marital_status: '',
  occupation: '',
  monthly_income: '',
  education_level: '',
  necta_status: '',
  vulnerability: '',
  household_dependency: '',
  has_disability: false,
  disability_type: '',
  existing_person_id: null,
  relation_type: '',
  province: '',
  district: '',
  tehsil: '',
  union_council: '',
  city: '',
  address: '',
  ...emptyLiteracyFields(),
  ...emptyResidentHousingFields(),
});

export const emptyChildRow = () => ({
  ...emptyRelatedPersonBase(),
  relation_type: 'child',
  relation_with_beneficiary: 'child',
});

/** Relation with beneficiary — Brothers / Sisters (single marital flow). */
export const AID_SIBLING_RELATIONS = [
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
  { value: 'step_brother', label: 'Step Brother' },
  { value: 'step_sister', label: 'Step Sister' },
  { value: 'half_brother', label: 'Half Brother' },
  { value: 'half_sister', label: 'Half Sister' },
  { value: 'sibling', label: 'Sibling' },
];

export const emptySiblingRow = () => ({
  ...emptyRelatedPersonBase(),
  relation_type: 'brother',
  relation_with_beneficiary: 'brother',
});

export function mapSiblingRelationToKinship(relation) {
  const r = String(relation || '').toLowerCase();
  if (r.includes('sister')) return 'sister';
  if (r.includes('brother')) return 'brother';
  return 'sibling';
}

/** Relation with FAMILY HEAD for sponsored dependents. */
export const AID_DEPENDENT_RELATIONS = [
  { value: 'son', label: 'Son' },
  { value: 'daughter', label: 'Daughter' },
  { value: 'child', label: 'Child' },
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'nephew', label: 'Nephew' },
  { value: 'niece', label: 'Niece' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'in_law', label: 'In-law' },
  { value: 'other', label: 'Other' },
];

/**
 * Full type list for standardized "add any related person" flows
 * (parents / children / siblings / extended).
 */
export const AID_RELATED_PERSON_TYPES = [
  { value: 'father', label: 'Father (Parent)' },
  { value: 'mother', label: 'Mother (Parent)' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'son', label: 'Son (Child)' },
  { value: 'daughter', label: 'Daughter (Child)' },
  { value: 'child', label: 'Child' },
  { value: 'brother', label: 'Brother (Sibling)' },
  { value: 'sister', label: 'Sister (Sibling)' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'step_brother', label: 'Step Brother' },
  { value: 'step_sister', label: 'Step Sister' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'grandfather', label: 'Grandfather' },
  { value: 'grandmother', label: 'Grandmother' },
  { value: 'maternal_grandfather', label: 'Maternal Grandfather' },
  { value: 'maternal_grandmother', label: 'Maternal Grandmother' },
  { value: 'grandchild', label: 'Grandchild' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'in_law', label: 'In-law' },
  { value: 'other', label: 'Other' },
];

export const emptyDependentRow = () => ({
  ...emptyRelatedPersonBase(),
  relation_type: 'other',
  relation_with_family_head: 'other',
  household_dependency: 'dependent_on_family_head',
});

/** Resolve kinship edge type from any related-person row. */
export function resolveRelatedPersonKinship(row) {
  const raw =
    row?.relation_type ||
    row?.relation_with_beneficiary ||
    row?.relation_with_family_head ||
    '';
  const r = String(raw || '').toLowerCase();
  if (r.includes('sister')) return 'sister';
  if (r.includes('brother')) return 'brother';
  if (r === 'nephew' || r === 'niece') return 'cousin';
  if (r === 'son' || r === 'daughter' || r === 'child') return r;
  if (
    [
      'father',
      'mother',
      'spouse',
      'sibling',
      'uncle',
      'aunt',
      'cousin',
      'grandfather',
      'grandmother',
      'maternal_grandfather',
      'maternal_grandmother',
      'grandchild',
      'guardian',
      'custody_holder',
      'in_law',
      'other',
    ].includes(r)
  ) {
    return r;
  }
  return 'other';
}

/** Map dependent relation to kinship edge type (closest supported enum). */
export function mapDependentRelationToKinship(relation) {
  const r = String(relation || '').toLowerCase();
  const allowed = new Set([
    'son',
    'daughter',
    'child',
    'brother',
    'sister',
    'sibling',
    'uncle',
    'aunt',
    'cousin',
    'father',
    'mother',
    'guardian',
    'in_law',
    'other',
  ]);
  if (r === 'nephew' || r === 'niece') return 'cousin';
  if (allowed.has(r)) return r;
  return 'other';
}

export function literacyCategoriesFor(status) {
  if (status === 'educated') return AID_LITERACY_CATEGORIES_EDUCATED;
  if (status === 'uneducated') return AID_LITERACY_CATEGORIES_UNEDUCATED;
  return [];
}

/** Human-readable literacy line for views (Educated → Job → income, etc.). */
export function formatLiteracySummary(person) {
  if (!person) return '';
  const status = String(person.literacy_status || '').toLowerCase();
  if (!status) return '';
  const statusLabel =
    status === 'educated'
      ? 'Educated'
      : status === 'uneducated'
        ? 'UnEducated'
        : status;
  const cat = String(person.literacy_category || '').toLowerCase();
  const catLabel = LITERACY_CATEGORY_LABELS[cat] || cat;
  const parts = [statusLabel];
  if (catLabel) parts.push(catLabel);
  if (status === 'educated' && cat === 'student') {
    const studentBits = [
      person.student_class,
      person.student_class_type,
      person.student_class_name,
    ].filter(Boolean);
    if (studentBits.length) parts.push(studentBits.join(' / '));
  }
  if (
    (cat === 'job' || cat === 'skilled_laborer') &&
    person.monthly_income
  ) {
    parts.push(`Income PKR ${person.monthly_income}`);
  } else if (person.monthly_income && !cat) {
    parts.push(`Income PKR ${person.monthly_income}`);
  }
  return parts.join(' · ');
}

export function ageFromDob(dob) {
  if (!dob) return '';
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 ? String(age) : '';
}

export const AID_KINSHIP_TYPES = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'son', label: 'Son' },
  { value: 'daughter', label: 'Daughter' },
  { value: 'child', label: 'Child' },
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'grandfather', label: 'Grandfather' },
  { value: 'grandmother', label: 'Grandmother' },
  { value: 'maternal_grandfather', label: 'Maternal Grandfather' },
  { value: 'maternal_grandmother', label: 'Maternal Grandmother' },
  { value: 'grandchild', label: 'Grandchild' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'custody_holder', label: 'Custody holder' },
  { value: 'in_law', label: 'In-law' },
  { value: 'other', label: 'Other' },
];

/** Family Head tab — who stands as family head / caretaker relative to beneficiary */
export const AID_FAMILY_HEAD_TYPES = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'spouse', label: 'Husband' },
  { value: 'son', label: 'Son' },
  { value: 'daughter', label: 'Daughter' },
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
  { value: 'step_brother', label: 'Step Brother' },
  { value: 'step_sister', label: 'Step Sister' },
  { value: 'half_brother', label: 'Half Brother' },
  { value: 'half_sister', label: 'Half Sister' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'nephew', label: 'Nephew' },
  { value: 'niece', label: 'Niece' },
  { value: 'grandfather', label: 'Grandfather' },
  { value: 'grandmother', label: 'Grandmother' },
  { value: 'maternal_grandfather', label: 'Maternal Grandfather' },
  { value: 'maternal_grandmother', label: 'Maternal Grandmother' },
  { value: 'grandchild', label: 'Grandchild' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'custody_holder', label: 'Custody holder' },
  { value: 'in_law', label: 'In-law' },
  { value: 'other', label: 'Other' },
];

const FAMILY_HEAD_FEMALE_TYPES = new Set([
  'mother',
  'daughter',
  'sister',
  'step_sister',
  'half_sister',
  'aunt',
  'niece',
  'grandmother',
  'maternal_grandmother',
]);

const FAMILY_HEAD_MALE_TYPES = new Set([
  'father',
  'spouse',
  'son',
  'brother',
  'step_brother',
  'half_brother',
  'uncle',
  'nephew',
  'grandfather',
  'maternal_grandfather',
]);

export const emptyFamilyHeadRow = (relationType = 'father') => ({
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
  gender: FAMILY_HEAD_FEMALE_TYPES.has(relationType)
    ? 'female'
    : FAMILY_HEAD_MALE_TYPES.has(relationType)
      ? 'male'
      : '',
  date_of_birth: '',
  marital_status: '',
  vulnerability: '',
  occupation: '',
  monthly_income: '',
  education_level: '',
  is_alive: true,
  has_disability: false,
  disability_type: '',
  ...emptyLiteracyFields(),
  ...emptyPropertyOwnershipFields(),
  ...emptyResidentHousingFields(),
  ...emptyLivestockFields(),
  ...emptyVehicleFields(),
  ...emptyEligibilityStatusFields(),
  _relation_type: relationType,
  /** Generic relatives of this family head (children, siblings, …). */
  _family_members: [],
});

/** Quick-add family tree sections on person view */
export const AID_FAMILY_SECTIONS = [
  {
    key: 'parents',
    title: 'Parents',
    empty: 'No parents recorded.',
    relations: [
      { value: 'father', label: 'Father' },
      { value: 'mother', label: 'Mother' },
    ],
    defaultRelation: 'father',
  },
  {
    key: 'spouse',
    title: 'Spouse',
    empty: 'No spouse recorded.',
    relations: [{ value: 'spouse', label: 'Spouse' }],
    defaultRelation: 'spouse',
  },
  {
    key: 'children',
    title: 'Children',
    empty: 'No children recorded.',
    relations: [
      { value: 'son', label: 'Son' },
      { value: 'daughter', label: 'Daughter' },
      { value: 'child', label: 'Child' },
    ],
    defaultRelation: 'son',
  },
  {
    key: 'brothers',
    title: 'Brothers',
    empty: 'No brothers recorded.',
    relations: [{ value: 'brother', label: 'Brother' }],
    defaultRelation: 'brother',
  },
  {
    key: 'sisters',
    title: 'Sisters',
    empty: 'No sisters recorded.',
    relations: [{ value: 'sister', label: 'Sister' }],
    defaultRelation: 'sister',
  },
  {
    key: 'grandparents',
    title: 'Grandparents',
    empty: 'No grandparents recorded.',
    relations: [
      { value: 'grandfather', label: 'Grandfather' },
      { value: 'grandmother', label: 'Grandmother' },
      { value: 'maternal_grandfather', label: 'Maternal Grandfather' },
      { value: 'maternal_grandmother', label: 'Maternal Grandmother' },
    ],
    defaultRelation: 'grandfather',
  },
  {
    key: 'grandchildren',
    title: 'Grandchildren',
    empty: 'No grandchildren recorded.',
    relations: [{ value: 'grandchild', label: 'Grandchild' }],
    defaultRelation: 'grandchild',
  },
  {
    key: 'extended',
    title: 'Extended / other',
    empty: 'No extended relatives recorded.',
    relations: [
      { value: 'uncle', label: 'Uncle' },
      { value: 'aunt', label: 'Aunt' },
      { value: 'cousin', label: 'Cousin' },
      { value: 'guardian', label: 'Guardian' },
      { value: 'custody_holder', label: 'Custody holder' },
      { value: 'in_law', label: 'In-law' },
      { value: 'other', label: 'Other' },
    ],
    defaultRelation: 'uncle',
  },
];

export const AID_DELIVERY_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'partial', label: 'Partial' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const AID_CEO_OPTIONS = [
  { value: 'approved', label: 'Approve' },
  { value: 'rejected', label: 'Reject' },
];

export const AID_GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export const AID_ATTACHMENT_CONTEXTS = [
  { value: 'profile', label: 'Profile' },
  { value: 'verification', label: 'Verification' },
  { value: 'delivery', label: 'Delivery / handover' },
  { value: 'site_visit', label: 'Site visit' },
  { value: 'mepco_bill', label: 'Mepco Bill' },
  { value: 'cnic', label: 'CNICs' },
  { value: 'bay_form', label: 'Bay Forms' },
  { value: 'death_certificate', label: 'Death Certificates' },
  { value: 'marriage_certificate', label: 'Marriage Certificates' },
  { value: 'education_certificate', label: 'Education Certificates' },
  { value: 'e_stamp_paper', label: 'E-Stamp Paper' },
  { value: 'zakat', label: 'Zakat form' },
  { value: 'consent', label: 'Consent form' },
];

/** Optional application-intake document slots (create form Attachments tab). */
export const AID_APPLICATION_DOC_TYPES = [
  { value: 'mepco_bill', label: 'Mepco Bill' },
  { value: 'cnic', label: 'CNICs' },
  { value: 'bay_form', label: 'Bay Forms' },
  { value: 'death_certificate', label: 'Death Certificates' },
  { value: 'marriage_certificate', label: 'Marriage Certificates' },
  { value: 'education_certificate', label: 'Education Certificates' },
  { value: 'e_stamp_paper', label: 'E-Stamp Paper' },
];

export const AID_VERIFICATION_CHECKLIST = [
  { key: 'site_visit', label: 'Site Visit', required: true },
  {
    key: 'identity_confirmed',
    label: 'Beneficiary identity confirmed (name / CNIC)',
    required: true,
  },
  {
    key: 'address_confirmed',
    label: 'Residence / address confirmed',
    required: true,
  },
  {
    key: 'family_confirmed',
    label: 'Family composition confirmed (parents / spouse / kids / siblings)',
    required: true,
  },
  { key: 'need_verified', label: 'Aid need verified as genuine', required: true },
  {
    key: 'livelihood_reviewed',
    label: 'Profession / monthly income situation reviewed',
    required: true,
  },
  {
    key: 'duplicates_reviewed',
    label: 'Duplicate / prior-aid flags reviewed',
    required: true,
  },
  {
    key: 'eligible_recommended',
    label: 'Case recommended for CEO approval',
    required: true,
  },
];

export function formatAidStatus(status) {
  return AID_STATUS_OPTIONS.find((o) => o.value === status)?.label || status || '—';
}

export function formatAidRequestType(type) {
  return AID_REQUEST_TYPES.find((o) => o.value === type)?.label || type || '—';
}

export function formatMaritalStatus(status) {
  return AID_MARITAL_STATUS.find((o) => o.value === status)?.label || status || '—';
}

export function formatEducation(level) {
  return AID_EDUCATION_LEVELS.find((o) => o.value === level)?.label || level || '—';
}

export function aidStatusTone(status) {
  switch (status) {
    case 'successful':
    case 'delivered':
      return 'success';
    case 'rejected':
      return 'danger';
    case 'ceo_approval_required':
      return 'warn';
    case 'under_review':
    case 'submitted':
      return 'info';
    case 'draft':
      return 'muted';
    default:
      return 'muted';
  }
}

export function personAge(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

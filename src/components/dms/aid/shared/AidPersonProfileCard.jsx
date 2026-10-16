import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiBookOpen,
  FiBriefcase,
  FiCheckCircle,
  FiCreditCard,
  FiMapPin,
  FiPhone,
  FiUser,
} from 'react-icons/fi';
import {
  formatLiteracySummary,
  formatPropertyOwnershipSummary,
  formatResidentHousingSummary,
  formatLivestockSummary,
  formatVehicleSummary,
  formatEligibilityStatusSummary,
  formatVulnerability,
  personAge as personAgeFromDob,
} from '../aidConstants';

export const personAge = (person) =>
  personAgeFromDob(person?.date_of_birth) ?? null;

const formatMoney = (v) => {
  if (v == null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return `PKR ${n.toLocaleString('en-PK')}`;
};

export const Fact = ({ label, children, icon: Icon }) => (
  <div className="aid-fact">
    <span className="aid-fact__label">
      {Icon ? <Icon aria-hidden className="aid-fact__icon" /> : null}
      {label}
    </span>
    <span className="aid-fact__value">{children ?? '—'}</span>
  </div>
);

const AssetPill = ({ label, active, detail }) => (
  <span
    className={`aid-asset-pill${active ? ' is-yes' : ' is-no'}`}
    title={detail || label}
  >
    <span className="aid-asset-pill__top">
      <em>{label}</em>
      {active ? (
        <FiCheckCircle aria-hidden className="aid-asset-pill__mark" />
      ) : (
        <span className="aid-asset-pill__mark aid-asset-pill__mark--no" aria-hidden>
          —
        </span>
      )}
    </span>
    <strong>{active ? detail || 'Yes' : 'None'}</strong>
  </span>
);

/** Read-only person summary card (beneficiary / applicant / family head). */
const AidPersonProfileCard = ({
  person,
  title,
  badge,
  badges,
  relation,
  roles = {},
}) => {
  if (!person) {
    return (
      <p className="aid-empty-note">
        No {title?.toLowerCase() || 'person'} on file.
      </p>
    );
  }
  const age = personAge(person);
  const literacy = formatLiteracySummary(person);
  const property = formatPropertyOwnershipSummary(person);
  const resident = formatResidentHousingSummary(person);
  const livestock = formatLivestockSummary(person);
  const vehicle = formatVehicleSummary(person);
  const eligibility = formatEligibilityStatusSummary(person);
  const income = formatMoney(person.monthly_income);
  const initials = String(person.full_name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  const roleBadges = [
    ...(Array.isArray(badges) ? badges : badge ? [badge] : []),
    roles.beneficiary ? 'Beneficiary' : null,
    roles.applicant ? 'Applicant' : null,
    roles.familyHead ? 'Family head' : null,
  ].filter(Boolean);
  const uniqueBadges = [...new Set(roleBadges)];

  const metaPills = [
    relation ? String(relation).replace(/_/g, ' ') : null,
    person.gender,
    age != null ? `${age} yrs` : null,
    person.marital_status,
  ].filter(Boolean);

  const hasLand = !!person.has_land;
  const hasLivestock = !!person.has_livestock;
  const hasVehicle = !!person.has_vehicle;
  const isRented = String(person.resident_type || '').toLowerCase() === 'rented';

  return (
    <div className="aid-person-card aid-person-card--rich">
      <div className="aid-person-card__banner" aria-hidden />
      <div className="aid-person-card__head">
        <div className="aid-person-card__avatar" aria-hidden>
          {initials || <FiUser />}
        </div>
        <div className="aid-person-card__intro">
          <div className="aid-person-card__title-row">
            <Link
              className="aid-person-card__name"
              to={`/dms/aid/people/view/${person.id}`}
            >
              {person.full_name}
            </Link>
            {uniqueBadges.map((b) => (
              <span
                key={b}
                className={`aid-person-card__badge aid-person-card__badge--${String(
                  b,
                )
                  .toLowerCase()
                  .replace(/\s+/g, '-')}`}
              >
                {b}
              </span>
            ))}
          </div>
          {metaPills.length ? (
            <div className="aid-person-card__pills">
              {metaPills.map((p) => (
                <span key={p} className="aid-meta-pill">
                  {p}
                </span>
              ))}
            </div>
          ) : null}
          {(person.vulnerability || eligibility || person.has_disability) && (
            <div className="aid-person-card__flags">
              {person.vulnerability ? (
                <div className="aid-person-card__vuln">
                  <span>Vulnerability</span>
                  <strong>{formatVulnerability(person.vulnerability)}</strong>
                </div>
              ) : null}
              {eligibility ? (
                <div className="aid-person-card__vuln aid-person-card__vuln--eligibility">
                  <span>NECTA / BISP</span>
                  <strong>{eligibility}</strong>
                </div>
              ) : null}
              {person.has_disability ? (
                <div className="aid-person-card__vuln aid-person-card__vuln--disability">
                  <span>Disability</span>
                  <strong>{person.disability_type || 'Yes'}</strong>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="aid-person-card__contacts">
        <a
          className={`aid-contact-chip${person.phone ? '' : ' is-empty'}`}
          href={person.phone ? `tel:${person.phone}` : undefined}
          onClick={(e) => {
            if (!person.phone) e.preventDefault();
          }}
        >
          <FiPhone aria-hidden />
          <span>
            <em>Phone</em>
            <strong>{person.phone || '—'}</strong>
          </span>
        </a>
        <div className={`aid-contact-chip${person.cnic ? '' : ' is-empty'}`}>
          <FiCreditCard aria-hidden />
          <span>
            <em>CNIC</em>
            <strong>{person.cnic || '—'}</strong>
          </span>
        </div>
        <div className={`aid-contact-chip${person.city ? '' : ' is-empty'}`}>
          <FiMapPin aria-hidden />
          <span>
            <em>City</em>
            <strong>{person.city || '—'}</strong>
          </span>
        </div>
      </div>

      <div className="aid-person-card__sections">
        <div className="aid-person-card__section">
          <h5 className="aid-person-card__section-title">Livelihood</h5>
          <div className="aid-fact-grid aid-fact-grid--compact">
            <Fact label="Occupation" icon={FiBriefcase}>
              {person.occupation || '—'}
            </Fact>
            <Fact label="Monthly income" icon={FiBriefcase}>
              {income || '—'}
            </Fact>
            <Fact label="Literacy" icon={FiBookOpen}>
              {literacy || '—'}
            </Fact>
          </div>
        </div>

        <div className="aid-person-card__section">
          <h5 className="aid-person-card__section-title">Household & assets</h5>
          <div className="aid-asset-pills">
            <AssetPill
              label="Land"
              active={hasLand}
              detail={
                hasLand
                  ? String(property || '')
                      .replace(/^Land:\s*/i, '')
                      .trim() || 'Yes'
                  : null
              }
            />
            <AssetPill
              label="Housing"
              active={!!person.resident_type || !!resident}
              detail={
                resident
                  ? String(resident).replace(/^Resident:\s*/i, '').trim()
                  : isRented
                    ? 'Rented'
                    : person.resident_type || null
              }
            />
            <AssetPill
              label="Livestock"
              active={hasLivestock}
              detail={
                hasLivestock
                  ? String(livestock || '')
                      .replace(/^Livestock:\s*/i, '')
                      .trim() || 'Yes'
                  : null
              }
            />
            <AssetPill
              label="Vehicle"
              active={hasVehicle}
              detail={
                hasVehicle
                  ? String(vehicle || '')
                      .replace(/^Vehicle:\s*/i, '')
                      .trim() || 'Yes'
                  : null
              }
            />
          </div>
        </div>
      </div>

      {(person.address || person.city) && (
        <div className="aid-person-card__address">
          <FiMapPin aria-hidden />
          <div>
            <span>Address</span>
            <strong>
              {[
                person.address,
                person.city && person.address !== person.city
                  ? person.city
                  : null,
              ]
                .filter(Boolean)
                .join(', ') || person.city}
            </strong>
          </div>
        </div>
      )}

      {person.necta_document_url ? (
        <p className="aid-person-card__doc">
          <a
            href={person.necta_document_url}
            target="_blank"
            rel="noreferrer"
          >
            {person.necta_document_name || 'NECTA document'}
          </a>
        </p>
      ) : null}
    </div>
  );
};

export const AidFamilyMemberLine = ({ person, relation, notes }) => {
  if (!person) return null;
  const age = personAge(person);
  const literacy = formatLiteracySummary(person);
  return (
    <li className="aid-family-member">
      <div className="aid-family-member__main">
        <Link to={`/dms/aid/people/view/${person.id}`}>{person.full_name}</Link>
        <span className="aid-family-member__meta">
          {[
            relation ? String(relation).replace(/_/g, ' ') : null,
            person.gender,
            age != null ? `Age ${age}` : null,
            person.cnic,
            person.marital_status,
            person.has_disability
              ? `Disability${
                  person.disability_type ? `: ${person.disability_type}` : ''
                }`
              : null,
            literacy ? `Literacy: ${literacy}` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </div>
      {notes ? <div className="aid-family-member__notes">{notes}</div> : null}
    </li>
  );
};

export default AidPersonProfileCard;

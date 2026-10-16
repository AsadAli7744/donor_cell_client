import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../../../utils/axios';
import Navbar from '../../../../../Navbar';
import PageHeader from '../../../../../common/PageHeader';
import AidEducationApplicationFields from '../../../shared/AidEducationApplicationFields';
import AidRationApplicationFields from '../../../shared/AidRationApplicationFields';
import AidMarriageGiftApplicationFields from '../../../shared/AidMarriageGiftApplicationFields';
import AidFinancialAssistanceFields from '../../../shared/AidFinancialAssistanceFields';
import AidZakatPermissionForm from '../../../shared/AidZakatPermissionForm';
import AidConsentForm from '../../../shared/AidConsentForm';
import AidPersonProfileCard, {
  AidFamilyMemberLine,
  Fact,
} from '../../../shared/AidPersonProfileCard';
import {
  aidStatusTone,
  formatAidStatus,
  formatAidRequestType,
} from '../../../aidConstants';
import { formatAuditActor } from '../../../../../common/audit/auditHistoryLabels';
import '../../../aid.css';

const isSponsorshipDependent = (notes) =>
  /dependent under (family head|guardian) sponsorship/i.test(
    String(notes || ''),
  );

/**
 * Simple read-only view of entered application data (no investigation workflow).
 */
const AidEntryApplicationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [familyTree, setFamilyTree] = useState(null);
  const [kinship, setKinship] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const appRes = await axiosInstance.get(`/aid/applications/${id}`);
      const payload = appRes.data?.data || null;
      setApp(payload);

      const beneficiaryId =
        payload?.beneficiary?.id || payload?.beneficiary_person_id;
      if (beneficiaryId) {
        try {
          const peopleRes = await axiosInstance.get(
            `/aid/people/${beneficiaryId}`,
          );
          const peopleData = peopleRes.data?.data || {};
          setFamilyTree(peopleData.family_tree || null);
          setKinship(peopleData.kinship || []);
        } catch {
          setFamilyTree(null);
          setKinship([]);
        }
      } else {
        setFamilyTree(null);
        setKinship([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="form-content aid-view">
          <p>Loading…</p>
        </div>
      </>
    );
  }

  if (error || !app) {
    return (
      <>
        <Navbar />
        <div className="form-content aid-view">
          <PageHeader
            title="Application entry"
            backPath="/dms/aid/applications/entry/list"
            onBackClick={() => navigate('/dms/aid/applications/entry/list')}
            showAdd={false}
          />
          <div className="error-message">{error || 'Application not found'}</div>
        </div>
      </>
    );
  }

  const status = app.status;
  const tree = familyTree || {};
  const groups = [
    { key: 'parents', label: 'Parents / Family head' },
    { key: 'spouse', label: 'Spouse' },
    { key: 'children', label: 'Children' },
    { key: 'brothers', label: 'Brothers' },
    { key: 'sisters', label: 'Sisters' },
    { key: 'siblings', label: 'Siblings' },
    { key: 'extended', label: 'Guardians / extended' },
  ];
  const fromTree = groups.flatMap((g) =>
    (tree[g.key] || []).map((row) => ({ ...row, group: g.label })),
  );
  const dependents = (kinship || []).filter((e) =>
    isSponsorshipDependent(e.notes),
  );
  const dependentIds = new Set(
    dependents.map((e) => e.to_person_id || e.to_person?.id),
  );
  const core = fromTree.filter((row) => !dependentIds.has(row.person?.id));
  const hasFamily =
    core.length > 0 ||
    dependents.length > 0 ||
    (app.writer &&
      app.writer.id !== app.beneficiary?.id &&
      String(app.writer_relation || '').toLowerCase() !== 'self');

  return (
    <>
      <Navbar />
      <div className="form-content aid-view aid-entry-view">
        <PageHeader
          title={app.application_no}
          backPath="/dms/aid/applications/entry/list"
          onBackClick={() => navigate('/dms/aid/applications/entry/list')}
          showAdd={false}
        />

        <div className="aid-hero">
          <div>
            <p className="aid-entry-view__eyebrow">Data entry record</p>
            <h2 style={{ margin: '0 0 6px' }}>
              {app.title || 'Aid application'}
            </h2>
            <p style={{ margin: 0, color: '#64748b' }}>
              {app.request_summary || 'No summary'}
            </p>
          </div>
          <div className="aid-entry-view__hero-actions">
            <span
              className={`aid-status-pill aid-status-pill--${aidStatusTone(
                status,
              )}`}
            >
              {formatAidStatus(status)}
            </span>
            <button
              type="button"
              className="secondary-btn"
              onClick={() =>
                navigate(`/dms/aid/applications/view/${app.id}`)
              }
            >
              Open case review
            </button>
          </div>
        </div>

        <section className="aid-entry-section">
          <h3 className="aid-entry-section__title">Application</h3>
          <div className="aid-fact-grid aid-fact-grid--case">
            <Fact label="Aid type">
              {formatAidRequestType(app.requested_aid_type)}
            </Fact>
            <Fact label="Status">{formatAidStatus(status)}</Fact>
            <Fact label="Entered by">
              {app.created_by ? formatAuditActor(app.created_by) : '—'}
            </Fact>
            <Fact label="Applicant">
              {app.writer ? (
                <Link to={`/dms/aid/people/view/${app.writer.id}`}>
                  {app.writer.full_name}
                </Link>
              ) : (
                '—'
              )}
            </Fact>
            <Fact label="Applicant relation">
              {app.writer_relation
                ? String(app.writer_relation).replace(/_/g, ' ')
                : '—'}
            </Fact>
          </div>
        </section>

        <section className="aid-entry-section">
          <h3 className="aid-entry-section__title">Beneficiary</h3>
          <AidPersonProfileCard
            person={app.beneficiary}
            title="Beneficiary"
            roles={{
              beneficiary: true,
              applicant:
                !app.writer ||
                app.writer.id === app.beneficiary?.id ||
                String(app.writer_relation || '').toLowerCase() === 'self',
            }}
          />
        </section>

        {hasFamily ? (
          <section className="aid-entry-section">
            <h3 className="aid-entry-section__title">Family registration</h3>
            {app.writer &&
            app.writer.id !== app.beneficiary?.id &&
            String(app.writer_relation || '').toLowerCase() !== 'self' ? (
              <div className="aid-family-block" style={{ marginBottom: 14 }}>
                <h4 className="aid-family-block__title">Applicant</h4>
                <AidPersonProfileCard
                  person={app.writer}
                  title="Applicant"
                  relation={app.writer_relation}
                  roles={{ applicant: true }}
                />
              </div>
            ) : null}

            <div className="aid-family-groups">
              {groups.map((g) => {
                const rows = core.filter((r) => r.group === g.label);
                if (!rows.length) return null;
                return (
                  <div key={g.key} className="aid-family-block">
                    <h4 className="aid-family-block__title">{g.label}</h4>
                    <ul className="aid-family-list">
                      {rows.map((row) => (
                        <AidFamilyMemberLine
                          key={`fam-${row.edge_id || row.person?.id}`}
                          person={row.person}
                          relation={row.relation_type}
                          notes={row.notes}
                        />
                      ))}
                    </ul>
                  </div>
                );
              })}

              {dependents.length > 0 && (
                <div className="aid-family-block">
                  <h4 className="aid-family-block__title">
                    Others under sponsorship / dependents
                  </h4>
                  <ul className="aid-family-list">
                    {dependents.map((edge) => {
                      const egoId =
                        app.beneficiary?.id || app.beneficiary_person_id;
                      const person =
                        edge.from_person_id === egoId
                          ? edge.to_person
                          : edge.from_person || edge.to_person;
                      return (
                        <AidFamilyMemberLine
                          key={`dep-${edge.id}`}
                          person={person}
                          relation={edge.relation_type}
                          notes={edge.notes}
                        />
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {(app.requested_aid_type === 'education' && app.education_details) ||
        (app.requested_aid_type === 'ration' && app.ration_details) ||
        (app.requested_aid_type === 'marriage_gift' &&
          app.marriage_gift_details) ||
        (app.requested_aid_type === 'financial_assistance' &&
          app.financial_assistance_details) ? (
          <section className="aid-entry-section">
            <h3 className="aid-entry-section__title">Aid type details</h3>
            {app.requested_aid_type === 'education' &&
              app.education_details && (
                <AidEducationApplicationFields
                  value={app.education_details}
                  readOnly
                />
              )}
            {app.requested_aid_type === 'ration' && app.ration_details && (
              <AidRationApplicationFields
                value={app.ration_details}
                readOnly
              />
            )}
            {app.requested_aid_type === 'marriage_gift' &&
              app.marriage_gift_details && (
                <AidMarriageGiftApplicationFields
                  value={app.marriage_gift_details}
                  readOnly
                />
              )}
            {app.requested_aid_type === 'financial_assistance' &&
              app.financial_assistance_details && (
                <AidFinancialAssistanceFields
                  value={app.financial_assistance_details}
                  readOnly
                />
              )}
          </section>
        ) : null}

        {(app.zakat_permission || app.consent_form) && (
          <section className="aid-entry-section">
            <h3 className="aid-entry-section__title">Forms</h3>
            {app.zakat_permission && (
              <div className="aid-detail-block" style={{ borderTop: 'none' }}>
                <h4 className="aid-detail-block__title">
                  Zakat Permission Letter
                </h4>
                <AidZakatPermissionForm
                  value={app.zakat_permission}
                  applicationNo={app.application_no}
                  readOnly
                />
              </div>
            )}
            {app.consent_form && (
              <div className="aid-detail-block">
                <h4 className="aid-detail-block__title">Consent Form</h4>
                <AidConsentForm
                  value={app.consent_form}
                  applicationNo={app.application_no}
                  readOnly
                />
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
};

export default AidEntryApplicationView;

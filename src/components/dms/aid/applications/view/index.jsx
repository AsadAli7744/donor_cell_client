import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../../utils/axios';
import { useAuth } from '../../../../../context/AuthContext';
import {
  hasAidPermission,
  isSuperAdmin,
} from '../../../../../utils/permissions';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormSelect from '../../../../common/FormSelect';
import FormTextarea from '../../../../common/FormTextarea';
import AidUserAssignField, {
  formatAidUserLabel,
  toAssignableAidUser,
} from '../../shared/AidUserAssignField';
import AidEducationApplicationFields from '../../shared/AidEducationApplicationFields';
import AidRationApplicationFields from '../../shared/AidRationApplicationFields';
import AidMarriageGiftApplicationFields from '../../shared/AidMarriageGiftApplicationFields';
import AidFinancialAssistanceFields from '../../shared/AidFinancialAssistanceFields';
import AidZakatPermissionForm from '../../shared/AidZakatPermissionForm';
import AidConsentForm from '../../shared/AidConsentForm';
import AidInvestigationPanel, {
  emptyRecommendation,
  getInvestigationIncompleteReasons,
  isInvestigationComplete,
  isRecommendationComplete,
  mergeInvestigationState,
  normalizeInvestigationEntry,
} from '../../shared/AidInvestigationPanel';
import AidPersonProfileCard, {
  AidFamilyMemberLine,
  Fact,
} from '../../shared/AidPersonProfileCard';
import AidGrantsPanel from '../../shared/AidGrantsPanel';
import {
  AID_CEO_OPTIONS,
  AID_DELIVERY_OPTIONS,
  aidStatusTone,
  formatAidStatus,
  formatAidRequestType,
} from '../../aidConstants';
import { formatAuditActor } from '../../../../common/audit/auditHistoryLabels';
import '../../aid.css';

const isSponsorshipDependent = (notes) =>
  /dependent under (family head|guardian) sponsorship/i.test(String(notes || ''));

const StatusChip = ({ label, value, tone = 'muted' }) => (
  <div className={`aid-status-chip aid-status-chip--${tone}`}>
    <span className="aid-status-chip__label">{label}</span>
    <strong className="aid-status-chip__value">{value || '—'}</strong>
  </div>
);

const AidApplicationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromApprovals = searchParams.get('from') === 'approvals';
  const openCeoAction = searchParams.get('action') === 'approve';
  const { permissions, user } = useAuth();
  const isStaffElevated =
    !!permissions?.super_admin ||
    !!permissions?.program_manager ||
    !!permissions?.fund_raising_manager;
  const canUpdate =
    isStaffElevated ||
    hasAidPermission(permissions, 'aid_verification', 'update') ||
    hasAidPermission(permissions, 'aid_applications', 'update');
  const canCeo =
    isStaffElevated ||
    hasAidPermission(permissions, 'aid_applications', 'ceo_approve');
  const canDeliver =
    isStaffElevated ||
    hasAidPermission(permissions, 'aid_applications', 'deliver');
  /** Mark all complete — also unlocks investigation for non-assignees */
  const hasMarkAllComplete =
    hasAidPermission(permissions, 'aid_verification', 'bulk_verify') ||
    hasAidPermission(permissions, 'aid_applications', 'bulk_verify');
  const canBulkVerify = isSuperAdmin(permissions) || hasMarkAllComplete;

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [panelTab, setPanelTab] = useState('case');
  // Applicant tab removed — keep legacy 'writer' links on Family
  const activePanelTab = panelTab === 'writer' ? 'family' : panelTab;
  const [attachContext, setAttachContext] = useState('verification');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [investigation, setInvestigation] = useState({});
  const [recommendation, setRecommendation] = useState(emptyRecommendation);
  const [leakageOverride, setLeakageOverride] = useState('');
  const [ceoDecision, setCeoDecision] = useState('approved');
  const [ceoReason, setCeoReason] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState('pending');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [assignedUser, setAssignedUser] = useState(null);
  const [assignSaving, setAssignSaving] = useState(false);
  const [familyTree, setFamilyTree] = useState(null);
  const [kinship, setKinship] = useState([]);
  const [uploadingInvestKey, setUploadingInvestKey] = useState(null);
  const [investSaving, setInvestSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const appRes = await axiosInstance.get(`/aid/applications/${id}`);
      const payload = appRes.data?.data || null;
      setApp(payload);
      setAssignedUser(toAssignableAidUser(payload?.assigned_to));
      {
        const items =
          payload?.investigation_items ||
          payload?.verification_checklist_items ||
          [];
        setInvestigation(
          mergeInvestigationState(items, payload?.verification_checklist || {}),
        );
      }
      {
        const saved = payload?.investigation_recommendation;
        if (saved && typeof saved === 'object') {
          setRecommendation({
            ...emptyRecommendation(),
            decision: saved.decision || 'approve_as_requested',
            amount: saved.amount ?? '',
            period_months: saved.period_months ?? 6,
            remarks: saved.remarks || '',
            found_monthly_income: saved.found_monthly_income ?? '',
          });
        } else {
          setRecommendation(emptyRecommendation());
        }
      }
      if (payload?.verification_notes) setVerifyNotes(payload.verification_notes);
      if (payload?.leakage_override_reason) {
        setLeakageOverride(payload.leakage_override_reason);
      } else {
        setLeakageOverride('');
      }

      const beneficiaryId = payload?.beneficiary?.id || payload?.beneficiary_person_id;
      if (beneficiaryId) {
        try {
          const peopleRes = await axiosInstance.get(`/aid/people/${beneficiaryId}`);
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

  const run = async (fn) => {
    setBusy(true);
    setActionError('');
    try {
      await fn();
      await load();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const uploadFile = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('context', attachContext);
    await run(() =>
      axiosInstance.post(`/aid/applications/${id}/attachments/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  };

  const uploadInvestigationFile = async (itemKey, file) => {
    if (!file || !itemKey) return;
    setUploadingInvestKey(itemKey);
    setActionError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('context', itemKey === 'site_visit' ? 'site_visit' : 'verification');
      fd.append('description', itemKey);
      const res = await axiosInstance.post(
        `/aid/applications/${id}/attachments/upload`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      const row = res.data?.data;
      setInvestigation((prev) => ({
        ...prev,
        [itemKey]: {
          ...normalizeInvestigationEntry(prev[itemKey]),
          status: 'verified',
          attachment_url: row?.file_url || '',
          attachment_name: row?.file_name || file.name,
          attachment_id: row?.id ?? null,
        },
      }));
      await load();
    } catch (err) {
      setActionError(
        err.response?.data?.message || err.message || 'Failed to upload file',
      );
    } finally {
      setUploadingInvestKey(null);
    }
  };

  const currentAssignedId = app?.assigned_to_user_id ?? app?.assigned_to?.id ?? null;
  const nextAssignedId = assignedUser?.id ?? null;
  const assignmentDirty =
    String(currentAssignedId || '') !== String(nextAssignedId || '');
  const isAssignee =
    user?.id != null &&
    currentAssignedId != null &&
    Number(user.id) === Number(currentAssignedId);
  /** Investigation: assignee, super admin, or Mark all complete (bulk_verify) */
  const canInvestigate =
    isSuperAdmin(permissions) || hasMarkAllComplete || isAssignee;

  const saveAssignment = async () => {
    setAssignSaving(true);
    setActionError('');
    try {
      await axiosInstance.patch(`/aid/applications/${id}`, {
        assigned_to_user_id: nextAssignedId ? Number(nextAssignedId) : null,
      });
      await load();
    } catch (err) {
      setActionError(
        err.response?.data?.message || err.message || 'Failed to update assignment',
      );
    } finally {
      setAssignSaving(false);
    }
  };

  const status = app?.status;
  const showCeo = canCeo && status === 'ceo_approval_required';

  useEffect(() => {
    if (!openCeoAction || !showCeo || loading || !app) return;
    const t = window.setTimeout(() => {
      document
        .getElementById('aid-ceo-decision')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
    return () => window.clearTimeout(t);
  }, [openCeoAction, showCeo, loading, id, app]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="form-content">Loading…</div>
      </>
    );
  }
  if (error || !app) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <div className="error-message">{error || 'Not found'}</div>
        </div>
      </>
    );
  }

  const attachments = app.attachments || [];
  const flags = app.duplicate_flags || {};
  const history = app.aid_history || {};
  const needsLeakageOverride =
    !!history.requires_override && !history.override_recorded;
  const leakageOverrideOk =
    !needsLeakageOverride || String(leakageOverride || '').trim().length >= 5;
  const investigationItems =
    app.investigation_items?.length > 0
      ? app.investigation_items
      : app.verification_checklist_items || [];
  const checklistComplete = isInvestigationComplete(
    investigationItems,
    investigation,
  );
  const checklistGaps = getInvestigationIncompleteReasons(
    investigationItems,
    investigation,
  );
  const recommendationComplete = isRecommendationComplete(recommendation);

  const saveInvestigationProgress = async () => {
    if (!id || investSaving) return;
    setInvestSaving(true);
    setActionError('');
    try {
      await axiosInstance.patch(`/aid/applications/${id}`, {
        verification_notes: verifyNotes || recommendation.remarks || undefined,
        verification_checklist: investigation,
        investigation_recommendation: {
          decision: recommendation.decision,
          amount:
            recommendation.decision === 'reject'
              ? null
              : recommendation.amount !== '' &&
                  recommendation.amount != null
                ? Number(recommendation.amount)
                : null,
          period_months: Number(recommendation.period_months) || null,
          remarks: recommendation.remarks || '',
          found_monthly_income: recommendation.found_monthly_income
            ? Number(recommendation.found_monthly_income)
            : null,
        },
      });
      await load();
      toast.success('Investigation progress saved');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to save investigation progress';
      setActionError(msg);
      toast.error(msg);
    } finally {
      setInvestSaving(false);
    }
  };
  const showReject =
    canUpdate && !['successful', 'delivered', 'rejected'].includes(status);
  const showVerify =
    canInvestigate && ['submitted', 'under_review'].includes(status);
  const showDelivery = canDeliver && (status === 'successful' || status === 'delivered');
  const tabAtt = attachments.filter((a) => a.context === attachContext);
  const verifiedByName = app.verified_by
    ? [app.verified_by.first_name, app.verified_by.last_name].filter(Boolean).join(' ') ||
      app.verified_by.email
    : null;

  const formatWhen = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleString();
    } catch {
      return String(d);
    }
  };

  return (
    <>
      <Navbar />
      <div className="form-content aid-view">
        <PageHeader
          title={app.application_no}
          backPath={
            fromApprovals
              ? '/dms/aid/applications/approvals'
              : '/dms/aid/applications/list'
          }
          onBackClick={() =>
            navigate(
              fromApprovals
                ? '/dms/aid/applications/approvals'
                : '/dms/aid/applications/list',
            )
          }
          showAdd={false}
        />

        {actionError && <div className="error-message">{actionError}</div>}

        <div className="aid-hero">
          <div>
            <h2 style={{ margin: '0 0 6px' }}>{app.title || 'Aid application'}</h2>
            <p style={{ margin: 0, color: '#64748b' }}>{app.request_summary || 'No summary'}</p>
          </div>
          <span className={`aid-status-pill aid-status-pill--${aidStatusTone(status)}`}>
            {formatAidStatus(status)}
          </span>
        </div>

        {history.requires_override && (
          <div className="aid-leak-banner">
            <strong>Aid history / leakage control</strong>
            {(history.reasons || []).length > 0 && (
              <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13 }}>
                {history.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
            <div className="aid-leak-pills">
              {history.already_received_this_year && (
                <span className="aid-status-pill aid-status-pill--danger">
                  Already received this year ({history.calendar_year})
                </span>
              )}
              {history.within_cooldown && (
                <span className="aid-status-pill aid-status-pill--warn">
                  Within {history.cooldown_days}-day cooldown
                  {history.days_since_last_success != null
                    ? ` · ${history.days_since_last_success}d since last`
                    : ''}
                </span>
              )}
              {history.override_recorded && (
                <span className="aid-status-pill aid-status-pill--info">
                  Override recorded
                </span>
              )}
            </div>
            {(history.person_successful || []).length > 0 && (
              <div className="aid-dup-group">
                <em>Beneficiary prior successful aids</em>
                <ul>
                  {history.person_successful.map((a) => (
                    <li key={`ps-${a.id}`}>
                      <Link to={`/dms/aid/applications/view/${a.id}`}>
                        {a.application_no}
                      </Link>
                      {` · ${formatAidStatus(a.status)} · ${a.requested_aid_type || '—'}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(history.household_successful || []).length > 0 && (
              <div className="aid-dup-group">
                <em>Household prior successful aids</em>
                <ul>
                  {history.household_successful.map((a) => (
                    <li key={`hs-${a.id}`}>
                      <Link to={`/dms/aid/applications/view/${a.id}`}>
                        {a.application_no}
                      </Link>
                      {` · ${a.beneficiary_name || '—'} · ${formatAidStatus(a.status)}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {app.leakage_override_reason && (
              <p style={{ fontSize: 13, marginTop: 8, marginBottom: 0 }}>
                Override reason: {app.leakage_override_reason}
              </p>
            )}
            {needsLeakageOverride && (showVerify || (showCeo && ceoDecision === 'approved')) && (
              <div style={{ marginTop: 12 }}>
                <FormTextarea
                  label="Leakage override reason (required to proceed)"
                  value={leakageOverride}
                  onChange={(e) => setLeakageOverride(e.target.value)}
                  rows={2}
                  placeholder="Explain why this case should proceed despite cooldown / same-year aid…"
                />
              </div>
            )}
          </div>
        )}

        {!history.requires_override &&
          ((history.person_successful || []).length > 0 ||
            (history.household_successful || []).length > 0) && (
            <div className="aid-history-banner">
              <strong>Aid history</strong>
              <p style={{ margin: '6px 0 0', fontSize: 13 }}>
                Prior successful aids found, outside cooldown / same-year block.
              </p>
              <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13 }}>
                {[...(history.person_successful || []), ...(history.household_successful || [])]
                  .slice(0, 8)
                  .map((a) => (
                    <li key={`hist-${a.id}`}>
                      <Link to={`/dms/aid/applications/view/${a.id}`}>
                        {a.application_no}
                      </Link>
                      {a.beneficiary_name ? ` · ${a.beneficiary_name}` : ''}
                      {` · ${formatAidStatus(a.status)}`}
                    </li>
                  ))}
              </ul>
            </div>
          )}

        {flags.has_flags && (
          <div className="aid-dup-banner">
            <strong>Duplicate / prior-aid flags</strong>
            <p style={{ margin: '6px 0 0', fontSize: 13 }}>
              Review these before checking “Duplicate / prior-aid flags reviewed”.
            </p>
            {(flags.cnic_matches || []).length > 0 && (
              <div className="aid-dup-group">
                <em>Same CNIC</em>
                <ul>
                  {flags.cnic_matches.map((p) => (
                    <li key={`cnic-${p.id}`}>
                      <Link to={`/dms/aid/people/view/${p.id}`}>{p.full_name}</Link>
                      {p.cnic ? ` · ${p.cnic}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(flags.phone_matches || []).length > 0 && (
              <div className="aid-dup-group">
                <em>Same phone</em>
                <ul>
                  {flags.phone_matches.map((p) => (
                    <li key={`phone-${p.id}`}>
                      <Link to={`/dms/aid/people/view/${p.id}`}>{p.full_name}</Link>
                      {p.phone ? ` · ${p.phone}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(flags.address_matches || []).length > 0 && (
              <div className="aid-dup-group">
                <em>Similar address</em>
                <ul>
                  {flags.address_matches.map((p) => (
                    <li key={`addr-${p.id}`}>
                      <Link to={`/dms/aid/people/view/${p.id}`}>{p.full_name}</Link>
                      {p.address ? ` · ${p.address}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(flags.prior_applications || []).length > 0 && (
              <div className="aid-dup-group">
                <em>Prior / related applications</em>
                <ul>
                  {flags.prior_applications.map((a) => (
                    <li key={`app-${a.id}`}>
                      <Link to={`/dms/aid/applications/view/${a.id}`}>
                        {a.application_no}
                      </Link>
                      {` · ${formatAidStatus(a.status)}`}
                      {a.beneficiary_name ? ` · ${a.beneficiary_name}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        <div className="aid-panel aid-panel--view">
          <div className="aid-tabs aid-tabs--main" role="tablist">
            {[
              { id: 'case', label: 'Case details' },
              { id: 'beneficiary', label: 'Beneficiary' },
              { id: 'family', label: 'Family' },
              { id: 'attachments', label: 'Attachments' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={activePanelTab === t.id}
                className={`aid-tab ${activePanelTab === t.id ? 'aid-tab--active' : ''}`}
                onClick={() => setPanelTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="aid-panel__body">
            {activePanelTab === 'case' && (
              <section className="aid-section aid-section--flush">
                <AidGrantsPanel
                  beneficiaryPersonId={
                    app.beneficiary?.id || app.beneficiary_person_id
                  }
                  applicationId={app.id}
                  canManage={canUpdate || canDeliver}
                />
                <div className="aid-status-chip-row">
                  <StatusChip
                    label="Aid type"
                    value={formatAidRequestType(app.requested_aid_type)}
                    tone="info"
                  />
                  <StatusChip
                    label="CEO"
                    value={app.ceo_approval_status || '—'}
                    tone={
                      String(app.ceo_approval_status || '').includes('approv')
                        ? 'success'
                        : String(app.ceo_approval_status || '').includes('reject')
                          ? 'danger'
                          : 'muted'
                    }
                  />
                  <StatusChip
                    label="Delivery"
                    value={app.delivery_status || '—'}
                    tone={
                      app.delivery_status === 'delivered'
                        ? 'success'
                        : app.delivery_status === 'pending'
                          ? 'warn'
                          : 'muted'
                    }
                  />
                  <StatusChip
                    label="Status"
                    value={formatAidStatus(status)}
                    tone={aidStatusTone(status) || 'muted'}
                  />
                </div>

                <div className="aid-fact-grid aid-fact-grid--case">
                  <Fact label="Created by">
                    {app.created_by ? formatAuditActor(app.created_by) : '—'}
                  </Fact>
                  <Fact label="Assigned to">
                    {app.assigned_to
                      ? formatAidUserLabel(app.assigned_to)
                      : '—'}
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

                {canUpdate &&
                  status !== 'rejected' &&
                  status !== 'delivered' && (
                  <div className="aid-assign-block">
                    <div className="aid-assign-block__head">
                      <h4>Case assignment</h4>
                      <p>Change who owns this case, then save.</p>
                    </div>
                    <div className="aid-assign-row">
                      <AidUserAssignField
                        value={assignedUser}
                        onChange={setAssignedUser}
                        hint=""
                      />
                      <div className="aid-assign-actions">
                        <button
                          type="button"
                          className="primary-btn"
                          disabled={busy || assignSaving || !assignmentDirty}
                          onClick={saveAssignment}
                        >
                          {assignSaving ? 'Saving…' : 'Save assignment'}
                        </button>
                        {assignedUser && (
                          <button
                            type="button"
                            className="secondary-btn"
                            disabled={busy || assignSaving}
                            onClick={() => setAssignedUser(null)}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {app.rejection_reason && (
                  <p className="aid-alert aid-alert--danger">
                    Rejection: {app.rejection_reason}
                  </p>
                )}
                {app.ceo_rejection_reason && (
                  <p className="aid-alert aid-alert--danger">
                    CEO rejection: {app.ceo_rejection_reason}
                  </p>
                )}
                {app.requested_aid_type === 'education' &&
                  app.education_details && (
                    <div className="aid-detail-block">
                      <AidEducationApplicationFields
                        value={app.education_details}
                        readOnly
                      />
                    </div>
                  )}
                {app.requested_aid_type === 'ration' && app.ration_details && (
                  <div className="aid-detail-block">
                    <AidRationApplicationFields
                      value={app.ration_details}
                      readOnly
                    />
                  </div>
                )}
                {app.requested_aid_type === 'marriage_gift' &&
                  app.marriage_gift_details && (
                    <div className="aid-detail-block">
                      <AidMarriageGiftApplicationFields
                        value={app.marriage_gift_details}
                        readOnly
                      />
                    </div>
                  )}
                {app.requested_aid_type === 'financial_assistance' &&
                  app.financial_assistance_details && (
                    <div className="aid-detail-block">
                      <AidFinancialAssistanceFields
                        value={app.financial_assistance_details}
                        readOnly
                      />
                    </div>
                  )}
                {app.zakat_permission && (
                  <div className="aid-detail-block">
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

            {activePanelTab === 'beneficiary' && (
              <section className="aid-section aid-section--flush">
                <AidPersonProfileCard
                  person={app.beneficiary}
                  title="Beneficiary"
                  roles={{
                    beneficiary: true,
                    applicant:
                      !app.writer ||
                      app.writer.id === app.beneficiary?.id ||
                      String(app.writer_relation || '').toLowerCase() ===
                        'self',
                  }}
                />
              </section>
            )}

            {activePanelTab === 'family' && (
              <section className="aid-section aid-section--flush">
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
                {(() => {
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
                    (tree[g.key] || []).map((row) => ({
                      ...row,
                      group: g.label,
                    })),
                  );
                  const dependents = (kinship || []).filter((e) =>
                    isSponsorshipDependent(e.notes),
                  );
                  const dependentIds = new Set(
                    dependents.map((e) => e.to_person_id || e.to_person?.id),
                  );
                  const core = fromTree.filter(
                    (row) => !dependentIds.has(row.person?.id),
                  );

                  if (!core.length && !dependents.length) {
                    return (
                      <p className="aid-empty-note">
                        No family members linked yet.
                      </p>
                    );
                  }

                  return (
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
                  );
                })()}
              </section>
            )}

            {activePanelTab === 'attachments' && (
              <section className="aid-section aid-section--flush">
                <div className="aid-attach-tabs">
                  {[
                    'verification',
                    'site_visit',
                    'mepco_bill',
                    'cnic',
                    'bay_form',
                    'death_certificate',
                    'marriage_certificate',
                    'education_certificate',
                    'e_stamp_paper',
                    'zakat',
                    'consent',
                    'delivery',
                    'profile',
                  ].map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`aid-attach-tab ${attachContext === t ? 'is-active' : ''}`}
                      onClick={() => setAttachContext(t)}
                    >
                      {String(t).replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
                {canUpdate && (
                  <label className="aid-attach-upload">
                    <span>Upload file</span>
                    <input
                      type="file"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadFile(f);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
                {tabAtt.length === 0 ? (
                  <p className="aid-empty-note">
                    No {attachContext} attachments.
                  </p>
                ) : (
                  <ul className="aid-attach-list">
                    {tabAtt.map((a) => (
                      <li key={a.id}>
                        <a href={a.file_url} target="_blank" rel="noreferrer">
                          {a.file_name}
                        </a>
                        {canUpdate && (
                          <button
                            type="button"
                            className="secondary-btn"
                            style={{ padding: '2px 8px', fontSize: 12 }}
                            onClick={() =>
                              run(() =>
                                axiosInstance.delete(
                                  `/aid/applications/attachments/${a.id}`,
                                ),
                              )
                            }
                          >
                            Delete
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {(showVerify ||
              app.verification_checklist ||
              investigationItems.length > 0) &&
              activePanelTab !== 'attachments' && (
              <section className="aid-section aid-section--flush aid-section--investigation">
                {activePanelTab === 'case' && (app.verified_at || verifiedByName) && (
                  <p style={{ fontSize: 13, color: '#64748b', marginTop: 0 }}>
                    Verified by: {verifiedByName || '—'} · At:{' '}
                    {formatWhen(app.verified_at)}
                  </p>
                )}
                <AidInvestigationPanel
                  items={investigationItems}
                  value={investigation}
                  onChange={setInvestigation}
                  disabled={!showVerify || busy}
                  canBulkVerify={canBulkVerify}
                  onUploadItemFile={uploadInvestigationFile}
                  uploadingKey={uploadingInvestKey}
                  activeTab={activePanelTab}
                  vulnerability={app.vulnerability}
                  recommendation={recommendation}
                  onRecommendationChange={setRecommendation}
                  onSaveProgress={
                    showVerify ? saveInvestigationProgress : undefined
                  }
                  saveProgressBusy={investSaving}
                  saveProgressDisabled={busy || investSaving}
                  submitDisabled={
                    busy ||
                    investSaving ||
                    !checklistComplete ||
                    !recommendationComplete ||
                    !leakageOverrideOk
                  }
                  onSubmitReport={
                    showVerify && activePanelTab === 'case'
                      ? () =>
                          run(() =>
                            axiosInstance.post(`/aid/applications/${id}/verify`, {
                              verification_notes:
                                verifyNotes ||
                                recommendation.remarks ||
                                undefined,
                              verification_checklist: investigation,
                              recommendation: {
                                decision: recommendation.decision,
                                amount:
                                  recommendation.decision === 'reject'
                                    ? null
                                    : Number(recommendation.amount),
                                period_months:
                                  Number(recommendation.period_months) || null,
                                remarks: recommendation.remarks,
                                found_monthly_income:
                                  recommendation.found_monthly_income
                                    ? Number(
                                        recommendation.found_monthly_income,
                                      )
                                    : null,
                              },
                              leakage_override_reason: needsLeakageOverride
                                ? leakageOverride.trim()
                                : undefined,
                            }),
                          )
                      : undefined
                  }
                />
                {(activePanelTab === 'case' ||
                  activePanelTab === 'field_process') &&
                  showVerify &&
                  !checklistComplete && (
                  <div
                    style={{
                      fontSize: 12,
                      color: '#b45309',
                      marginBottom: 0,
                    }}
                  >
                    <p style={{ margin: '0 0 0.35rem' }}>
                      Submit stays disabled until every required check is done.
                      Use <strong>Save progress</strong> anytime.
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                      {checklistGaps.slice(0, 6).map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                      {checklistGaps.length > 6 ? (
                        <li>+{checklistGaps.length - 6} more…</li>
                      ) : null}
                    </ul>
                  </div>
                )}
                {activePanelTab === 'case' &&
                  showVerify &&
                  !recommendationComplete && (
                  <p style={{ fontSize: 12, color: '#b45309', marginBottom: 0 }}>
                    Complete Recommendation (decision, amount if approving, and
                    remarks).
                  </p>
                )}
                {activePanelTab === 'case' &&
                  !showVerify &&
                  app.verification_notes && (
                  <p style={{ fontSize: 13, color: '#64748b' }}>
                    Notes: {app.verification_notes}
                  </p>
                )}
                {activePanelTab === 'case' &&
                  !showVerify &&
                  app.investigation_recommendation?.decision && (
                    <p style={{ fontSize: 13, color: '#166534', marginTop: 8 }}>
                      Recommendation:{' '}
                      {String(app.investigation_recommendation.decision).replace(
                        /_/g,
                        ' ',
                      )}
                      {app.investigation_recommendation.amount != null
                        ? ` · PKR ${app.investigation_recommendation.amount}`
                        : ''}
                      {app.investigation_recommendation.period_months
                        ? ` · ${app.investigation_recommendation.period_months} months`
                        : ''}
                    </p>
                  )}
              </section>
            )}
          </div>
        </div>

        {(showReject || showCeo || showDelivery) && (
          <div
            id="aid-ceo-decision"
            className={`aid-cta-strip${showCeo ? ' aid-ceo-panel' : ''}`}
          >
            {showReject && !showVerify && (
              <button
                type="button"
                className="secondary-btn secondary-btn--danger"
                disabled={busy}
                onClick={() => setRejectOpen(true)}
              >
                Reject
              </button>
            )}
            {showCeo && (
              <>
                <FormSelect
                  label="CEO decision"
                  value={ceoDecision}
                  onChange={(e) => setCeoDecision(e.target.value)}
                  options={AID_CEO_OPTIONS}
                />
                {ceoDecision === 'rejected' ? (
                  <FormTextarea
                    label="CEO rejection reason"
                    value={ceoReason}
                    onChange={(e) => setCeoReason(e.target.value)}
                    rows={2}
                  />
                ) : null}
                <button
                  type="button"
                  className="primary-btn"
                  disabled={
                    busy ||
                    (ceoDecision === 'approved' && !leakageOverrideOk)
                  }
                  onClick={() =>
                    run(() =>
                      axiosInstance.post(`/aid/applications/${id}/ceo-decide`, {
                        decision: ceoDecision,
                        ceo_rejection_reason:
                          ceoDecision === 'rejected'
                            ? ceoReason || 'Rejected by CEO'
                            : undefined,
                        leakage_override_reason:
                          ceoDecision === 'approved' && needsLeakageOverride
                            ? leakageOverride.trim()
                            : undefined,
                      }),
                    )
                  }
                >
                  {ceoDecision === 'approved'
                    ? 'Approve application'
                    : 'Record CEO decision'}
                </button>
              </>
            )}
            {showDelivery && (
              <>
                <FormSelect
                  label="Delivery status"
                  value={deliveryStatus}
                  onChange={(e) => setDeliveryStatus(e.target.value)}
                  options={AID_DELIVERY_OPTIONS}
                />
                <button
                  type="button"
                  className="primary-btn"
                  disabled={busy}
                  onClick={() =>
                    run(() =>
                      axiosInstance.post(`/aid/applications/${id}/delivery`, {
                        delivery_status: deliveryStatus,
                        delivery_notes: deliveryNotes || undefined,
                      }),
                    )
                  }
                >
                  Update delivery
                </button>
              </>
            )}
          </div>
        )}

        {showCeo && ceoDecision === 'rejected' && (
          <FormTextarea
            label="CEO rejection reason"
            value={ceoReason}
            onChange={(e) => setCeoReason(e.target.value)}
            rows={2}
          />
        )}
        {showDelivery && (
          <FormTextarea
            label="Delivery notes"
            value={deliveryNotes}
            onChange={(e) => setDeliveryNotes(e.target.value)}
            rows={2}
          />
        )}
        {rejectOpen && (
          <div className="aid-card" style={{ marginBottom: 16 }}>
            <FormTextarea
              label="Rejection reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              required
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                type="button"
                className="primary-btn aid-btn--danger-solid"
                disabled={busy || !rejectReason.trim()}
                onClick={() => {
                  const reason = rejectReason.trim();
                  setRejectOpen(false);
                  run(() =>
                    axiosInstance.post(`/aid/applications/${id}/reject`, {
                      rejection_reason: reason,
                    }),
                  );
                }}
              >
                Confirm reject
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setRejectOpen(false);
                  setRejectReason('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

    </>
  );
};

export default AidApplicationView;

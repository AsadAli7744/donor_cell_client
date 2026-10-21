import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../../utils/axios';
import { useAuth } from '../../../../../../context/AuthContext';
import {
  canViewModule,
  hasAidPermission,
} from '../../../../../../utils/permissions';
import Navbar from '../../../../../Navbar';
import PageHeader from '../../../../../common/PageHeader';
import Pagination from '../../../../../common/Pagination';
import FormInput from '../../../../../common/FormInput';
import FormSelect from '../../../../../common/FormSelect';
import AidUserAssignField from '../../../shared/AidUserAssignField';
import {
  AID_REQUEST_TYPES,
  formatAidProgramLabel,
  formatAidRequestType,
  formatRelativeAidTime,
  formatAidStatus,
  aidStatusTone,
} from '../../../aidConstants';
import '../../../aid.css';

const emptyFilters = {
  search: '',
  requested_aid_type: '',
  district: '',
};

/**
 * Drafts board — applications saved as draft.
 * Approve requires assigning a program-department user.
 */
const AidDraftsList = () => {
  const navigate = useNavigate();
  const { permissions } = useAuth();

  const isStaffElevated =
    !!permissions?.super_admin ||
    !!permissions?.program_manager ||
    !!permissions?.fund_raising_manager;

  const canList =
    canViewModule(permissions, 'program', 'aid_drafts') ||
    hasAidPermission(permissions, 'aid_drafts', 'list_view') ||
    isStaffElevated;

  const canCreate =
    hasAidPermission(permissions, 'aid_drafts', 'create') ||
    hasAidPermission(permissions, 'aid_applications', 'create') ||
    isStaffElevated;

  const canApprove =
    hasAidPermission(permissions, 'aid_drafts', 'approve_draft') ||
    hasAidPermission(permissions, 'aid_applications', 'approve_draft') ||
    isStaffElevated;

  const [rows, setRows] = useState([]);
  const [approvingId, setApprovingId] = useState(null);
  const [approveRowId, setApproveRowId] = useState(null);
  const [assignUser, setAssignUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [tempFilters, setTempFilters] = useState({ ...emptyFilters });
  const [appliedFilters, setAppliedFilters] = useState({ ...emptyFilters });
  const [districts, setDistricts] = useState([]);

  const handleSortChange = (field, order) => {
    setSortField(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const sortOptions = [
    { value: 'updated_at', label: 'Updated' },
    { value: 'created_at', label: 'Created' },
    { value: 'application_no', label: 'Application Number' },
    { value: 'id', label: 'ID' },
  ];

  const applyFilters = (next) => {
    setTempFilters(next);
    setAppliedFilters(next);
    setCurrentPage(1);
  };

  const fetchRows = async () => {
    if (!canList) {
      setError('You do not have permission to view drafts.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await axiosInstance.get('/aid/applications', {
        params: {
          queue: 'drafts',
          search: appliedFilters.search || undefined,
          requested_aid_type: appliedFilters.requested_aid_type || undefined,
          district: appliedFilters.district || undefined,
          page: currentPage,
          pageSize,
          sortField,
          sortOrder,
        },
      });
      setRows(res.data?.data || []);
      setTotalItems(res.data?.total || 0);
      setTotalPages(res.data?.totalPages || 1);
      setDistricts(res.data?.filter_options?.districts || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  const openApprove = (rowId) => {
    setApproveRowId(rowId);
    setAssignUser(null);
    setError('');
  };

  const cancelApprove = () => {
    setApproveRowId(null);
    setAssignUser(null);
  };

  const confirmApprove = async () => {
    if (!canApprove || !approveRowId) return;
    if (!assignUser?.id) {
      setError('Select a program department user to assign before approving.');
      return;
    }
    try {
      setApprovingId(approveRowId);
      setError('');
      await axiosInstance.post(
        `/aid/applications/${approveRowId}/approve-draft`,
        { assigned_to_user_id: Number(assignUser.id) },
      );
      setApproveRowId(null);
      setAssignUser(null);
      await fetchRows();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to approve draft application',
      );
    } finally {
      setApprovingId(null);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, sortField, sortOrder, appliedFilters]);

  const programOptions = [
    { value: '', label: 'All programs' },
    ...AID_REQUEST_TYPES.map((t) => ({ value: t.value, label: t.label })),
  ];
  const districtOptions = [
    { value: '', label: 'All districts' },
    ...districts.map((d) => ({ value: d, label: d })),
  ];

  const approveRow = rows.find((r) => r.id === approveRowId);

  return (
    <>
      <Navbar />
      <div className="list-wrapper aid-list aid-entry-list">
        <PageHeader
          title="Drafts"
          backPath="/dms"
          showAdd={!!canCreate}
          addPath="/dms/aid/applications/add"
          addTitle="New draft"
        />
        <div className="list-content">
          {error && <div className="error-message">{error}</div>}

          <p className="aid-section-hint" style={{ marginBottom: 12 }}>
            New applications are saved as drafts here. Approve assigns a
            program user and sends the case to Verification Process.
          </p>

          {approveRowId && canApprove ? (
            <div className="aid-panel" style={{ marginBottom: 16, padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>
                Approve draft
                {approveRow?.application_no
                  ? ` — ${approveRow.application_no}`
                  : ''}
              </h3>
              <AidUserAssignField
                label="Assign to program user"
                value={assignUser}
                onChange={setAssignUser}
                hint="Required — pick a user from the program department who will own this case."
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  className="primary-btn"
                  disabled={approvingId === approveRowId || !assignUser?.id}
                  onClick={confirmApprove}
                >
                  {approvingId === approveRowId
                    ? 'Approving…'
                    : 'Approve & assign'}
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  disabled={!!approvingId}
                  onClick={cancelApprove}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          <div className="aid-entry-filters">
            <div className="aid-entry-filters__field aid-entry-filters__field--search">
              <FormInput
                label="Search"
                value={tempFilters.search}
                onChange={(e) =>
                  setTempFilters((p) => ({ ...p, search: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyFilters({ ...tempFilters });
                  }
                }}
                placeholder="Application no., CNIC or family head name"
              />
            </div>
            <div className="aid-entry-filters__field">
              <FormSelect
                label="Program"
                value={tempFilters.requested_aid_type}
                onChange={(e) =>
                  setTempFilters((p) => ({
                    ...p,
                    requested_aid_type: e.target.value,
                  }))
                }
                options={programOptions}
              />
            </div>
            <div className="aid-entry-filters__field">
              <FormSelect
                label="District"
                value={tempFilters.district}
                onChange={(e) =>
                  setTempFilters((p) => ({ ...p, district: e.target.value }))
                }
                options={districtOptions}
              />
            </div>
            <div className="aid-entry-filters__actions">
              <button
                type="button"
                className="primary-btn"
                onClick={() => applyFilters({ ...tempFilters })}
              >
                Search
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => applyFilters({ ...emptyFilters })}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="table-container aid-entry-table-wrap">
            <table className="data-table aid-entry-table">
              <thead>
                <tr>
                  <th>Application</th>
                  <th>Family head</th>
                  <th>Program</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7}>Loading…</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No drafts found.</td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong className="aid-entry-table__app-no">
                          {row.application_no}
                        </strong>
                      </td>
                      <td>
                        <div className="aid-entry-table__head-name">
                          {row.family_head_name ||
                            row.beneficiary?.full_name ||
                            '—'}
                        </div>
                        <div className="aid-entry-table__head-cnic">
                          {row.family_head_cnic ||
                            row.beneficiary?.cnic ||
                            '—'}
                        </div>
                      </td>
                      <td>
                        <div>
                          {formatAidRequestType(row.requested_aid_type)}
                        </div>
                        {row.aid_program ? (
                          <div style={{ fontSize: 12, color: '#64748b' }}>
                            {row.aid_program ? formatAidProgramLabel(row.aid_program) : formatAidRequestType(row.requested_aid_type)}
                          </div>
                        ) : null}
                      </td>
                      <td>{row.location || '—'}</td>
                      <td>
                        <span
                          className={`aid-status-pill aid-status-pill--${aidStatusTone(
                            row.status || 'draft',
                          )}`}
                        >
                          {formatAidStatus(row.status || 'draft')}
                        </span>
                      </td>
                      <td>{formatRelativeAidTime(row.updated_at)}</td>
                      <td>
                        <div className="aid-list-actions">
                          <button
                            type="button"
                            className="aid-text-link aid-entry-open"
                            onClick={() =>
                              navigate(
                                `/dms/aid/applications/drafts/view/${row.id}`,
                              )
                            }
                          >
                            Open
                          </button>
                          <button
                            type="button"
                            className="aid-text-link"
                            onClick={() =>
                              navigate(`/dms/aid/applications/edit/${row.id}`)
                            }
                          >
                            Edit
                          </button>
                          {canApprove ? (
                            <button
                              type="button"
                              className="aid-text-link"
                              disabled={!!approvingId}
                              onClick={() => openApprove(row.id)}
                            >
                              Approve
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalItems > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(n) => {
                setPageSize(n);
                setCurrentPage(1);
              }}
              onSortChange={handleSortChange}
              sortField={sortField}
              sortOrder={sortOrder}
              sortOptions={sortOptions}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default AidDraftsList;

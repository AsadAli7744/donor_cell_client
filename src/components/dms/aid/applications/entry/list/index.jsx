import React, { useEffect, useMemo, useState } from 'react';
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
import {
  AID_REQUEST_TYPES,
  formatAidProgramLabel,
  AID_ENTRY_STAGES,
  formatAidRequestType,
  formatAidEntryStage,
  formatRelativeAidTime,
  aidEntryStageTone,
} from '../../../aidConstants';
import '../../../aid.css';

const emptyFilters = {
  search: '',
  requested_aid_type: '',
  district: '',
  stage: '',
};

/**
 * Data-entry listing — pipeline cards, filters, and case table.
 */
const AidEntryApplicationsList = () => {
  const navigate = useNavigate();
  const { permissions } = useAuth();

  const isStaffElevated =
    !!permissions?.super_admin ||
    !!permissions?.program_manager ||
    !!permissions?.fund_raising_manager;

  const canList =
    canViewModule(permissions, 'program', 'aid_applications') ||
    hasAidPermission(permissions, 'aid_applications', 'create') ||
    isStaffElevated;

  const [rows, setRows] = useState([]);
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
  const [stageCounts, setStageCounts] = useState({});
  const [districts, setDistricts] = useState([]);

  const handleSortChange = (field, order) => {
    setSortField(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const sortOptions = [
    { value: 'updated_at', label: 'Updated' },
    { value: 'created_at', label: 'Created' },
    { value: 'status', label: 'Stage' },
    { value: 'application_no', label: 'Application Number' },
    { value: 'id', label: 'ID' },
  ];

  const applyFilters = (next) => {
    setTempFilters(next);
    setAppliedFilters(next);
    setCurrentPage(1);
  };

  const setStage = (stageId) => {
    const next = {
      ...appliedFilters,
      stage: appliedFilters.stage === stageId ? '' : stageId,
    };
    applyFilters(next);
  };

  const fetchRows = async () => {
    if (!canList) {
      setError('You do not have permission to view aid applications.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await axiosInstance.get('/aid/applications', {
        params: {
          queue: 'entry',
          search: appliedFilters.search || undefined,
          stage: appliedFilters.stage || undefined,
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
      setStageCounts(res.data?.stage_counts || {});
      setDistricts(res.data?.filter_options?.districts || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, sortField, sortOrder, appliedFilters]);

  const districtOptions = useMemo(
    () => [
      { value: '', label: 'All districts' },
      ...districts.map((d) => ({ value: d, label: d })),
    ],
    [districts],
  );

  const programOptions = useMemo(
    () => [{ value: '', label: 'All programs' }, ...AID_REQUEST_TYPES],
    [],
  );

  return (
    <>
      <Navbar />
      <div className="list-wrapper aid-list aid-entry-list">
        <PageHeader
          title="Beneficiary Registration"
          backPath="/dms"
          showAdd={false}
        />
        <div className="list-content">
          {error && <div className="error-message">{error}</div>}

          <div className="aid-entry-stages" role="toolbar" aria-label="Pipeline">
            {AID_ENTRY_STAGES.map((s) => {
              const active = appliedFilters.stage === s.id;
              const count = stageCounts[s.id] ?? 0;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`aid-entry-stage${
                    active ? ' aid-entry-stage--active' : ''
                  }`}
                  onClick={() => setStage(s.id)}
                >
                  <span className="aid-entry-stage__label">{s.label}</span>
                  <span className="aid-entry-stage__value">{count}</span>
                  <span className="aid-entry-stage__hint">{s.hint}</span>
                </button>
              );
            })}
          </div>

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
                  <th>Members</th>
                  <th>Vulnerability</th>
                  <th>Stage</th>
                  <th>Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9}>Loading…</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={9}>No applications found.</td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const stage = row.stage || 'submitted';
                    const pct = Number(row.vulnerability_pct) || 0;
                    return (
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
                            <div
                              style={{ fontSize: 12, color: '#64748b' }}
                            >
                              {row.aid_program ? formatAidProgramLabel(row.aid_program) : formatAidRequestType(row.requested_aid_type)}
                            </div>
                          ) : null}
                        </td>
                        <td>{row.location || '—'}</td>
                        <td>{row.members_count ?? '—'}</td>
                        <td>
                          <div className="aid-vuln-bar" title={`${pct}%`}>
                            <span
                              className={`aid-vuln-bar__track aid-vuln-bar__track--${
                                pct >= 70
                                  ? 'high'
                                  : pct >= 40
                                    ? 'mid'
                                    : 'low'
                              }`}
                            >
                              <i style={{ width: `${Math.min(100, pct)}%` }} />
                            </span>
                            <span className="aid-vuln-bar__pct">{pct}%</span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`aid-stage-pill aid-stage-pill--${aidEntryStageTone(
                              stage,
                            )}`}
                          >
                            {formatAidEntryStage(stage)}
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
                                  `/dms/aid/applications/entry/view/${row.id}`,
                                )
                              }
                            >
                              Open
                            </button>
                            {row.status !== 'rejected' &&
                            row.status !== 'delivered' ? (
                              <button
                                type="button"
                                className="aid-text-link"
                                onClick={() =>
                                  navigate(
                                    `/dms/aid/applications/edit/${row.id}`,
                                  )
                                }
                              >
                                Edit
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
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

export default AidEntryApplicationsList;

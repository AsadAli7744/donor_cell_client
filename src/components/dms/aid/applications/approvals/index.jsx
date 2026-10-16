import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiCheckCircle, FiEye } from 'react-icons/fi';
import axiosInstance from '../../../../../utils/axios';
import { useAuth } from '../../../../../context/AuthContext';
import {
  canViewModule,
  hasAidPermission,
} from '../../../../../utils/permissions';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import Pagination from '../../../../common/Pagination';
import {
  SearchFilter,
  DropdownFilter,
  SearchButton,
  ClearButton,
  CollapsibleFilters,
} from '../../../../common/filters';
import useFiltersPanel from '../../../../../hooks/useFiltersPanel';
import {
  aidStatusTone,
  formatAidStatus,
  formatAidRequestType,
} from '../../aidConstants';
import '../../aid.css';

const CEO_PENDING = 'ceo_approval_required';

const STATUS_FILTERS = [
  { value: '', label: 'All (not rejected)' },
  { value: CEO_PENDING, label: 'Awaiting CEO approval' },
  { value: 'successful', label: 'CEO approved' },
  { value: 'delivered', label: 'Delivered' },
];

const AidApprovalsList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { permissions } = useAuth();
  const { filtersOpen, toggleFilters } = useFiltersPanel();

  const isStaffElevated =
    !!permissions?.super_admin ||
    !!permissions?.program_manager ||
    !!permissions?.fund_raising_manager;

  const canCeo =
    isStaffElevated ||
    hasAidPermission(permissions, 'aid_applications', 'ceo_approve');

  const canList =
    canViewModule(permissions, 'program', 'aid_applications') ||
    canCeo ||
    isStaffElevated;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('verified_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const initialStatus = searchParams.get('status') || CEO_PENDING;
  const [tempFilters, setTempFilters] = useState({
    search: '',
    status: initialStatus,
  });
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: initialStatus,
  });

  const handleSortChange = (field, order) => {
    setSortField(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const sortOptions = [
    { value: 'verified_at', label: 'Verified Date' },
    { value: 'created_at', label: 'Created Date' },
    { value: 'updated_at', label: 'Updated Date' },
    { value: 'status', label: 'Status' },
    { value: 'application_no', label: 'Application Number' },
  ];

  const applyFilters = (next) => {
    setTempFilters(next);
    setAppliedFilters(next);
    setCurrentPage(1);
    const params = new URLSearchParams();
    if (next.status) params.set('status', next.status);
    setSearchParams(params, { replace: true });
  };

  const fetchRows = async () => {
    if (!canList) {
      setError('You do not have permission to view approvals.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await axiosInstance.get('/aid/applications', {
        params: {
          queue: 'approvals',
          search: appliedFilters.search || undefined,
          status: appliedFilters.status || undefined,
          page: currentPage,
          pageSize,
          sortField,
          sortOrder,
        },
      });
      setRows(res.data?.data || []);
      setTotalItems(res.data?.total || 0);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, sortField, sortOrder, appliedFilters]);

  const openView = (id) => {
    navigate(`/dms/aid/applications/view/${id}?from=approvals`);
  };

  const openApprove = (id) => {
    navigate(`/dms/aid/applications/view/${id}?from=approvals&action=approve`);
  };

  return (
    <>
      <Navbar />
      <div className="list-wrapper aid-list">
        <PageHeader
          title="Aid Approvals"
          backPath="/dms/aid/applications/list"
          showAdd={false}
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
        />
        <div className="list-content">
          {error && <div className="error-message">{error}</div>}

          <div className="aid-list-banner">
            Applications that completed investigation and are{' '}
            <strong>not rejected</strong>. Use View or Approve to open the CEO
            decision on the application.
          </div>

          <CollapsibleFilters open={filtersOpen}>
            <div className="filters-row">
              <SearchFilter
                filterKey="search"
                label="Search"
                filters={tempFilters}
                onFilterChange={(k, v) =>
                  setTempFilters((p) => ({ ...p, [k]: v }))
                }
                placeholder="App no, name, CNIC…"
              />
              <DropdownFilter
                filterKey="status"
                label="Status"
                data={STATUS_FILTERS}
                filters={tempFilters}
                onFilterChange={(k, v) =>
                  setTempFilters((p) => ({ ...p, [k]: v }))
                }
                placeholder="All (not rejected)"
              />
              <SearchButton
                onClick={() => {
                  setCurrentPage(1);
                  applyFilters({ ...tempFilters });
                }}
              />
              <ClearButton
                onClick={() =>
                  applyFilters({ search: '', status: CEO_PENDING })
                }
              />
            </div>
          </CollapsibleFilters>

          <div className="aid-list-toolbar">
            <button
              type="button"
              className={`aid-filter-chip${
                appliedFilters.status === CEO_PENDING
                  ? ' aid-filter-chip--active'
                  : ''
              }`}
              onClick={() =>
                applyFilters({
                  ...appliedFilters,
                  status:
                    appliedFilters.status === CEO_PENDING ? '' : CEO_PENDING,
                })
              }
            >
              <FiCheckCircle />
              Awaiting CEO
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application</th>
                  <th>Beneficiary</th>
                  <th>Aid type</th>
                  <th>Recommendation</th>
                  <th>Status</th>
                  <th>Verified</th>
                  <th style={{ width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7}>Loading…</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No approval applications found.</td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const needsCeo = canCeo && row.status === CEO_PENDING;
                    const rec = row.investigation_recommendation;
                    const recLabel = rec?.decision
                      ? String(rec.decision).replace(/_/g, ' ')
                      : '—';
                    return (
                      <tr
                        key={row.id}
                        className={needsCeo ? 'aid-row--ceo-pending' : undefined}
                      >
                        <td>
                          <strong>{row.application_no}</strong>
                          <div style={{ fontSize: 12, color: '#64748b' }}>
                            {row.title || '—'}
                          </div>
                        </td>
                        <td>{row.beneficiary?.full_name || '—'}</td>
                        <td>{formatAidRequestType(row.requested_aid_type)}</td>
                        <td>
                          <div style={{ textTransform: 'capitalize' }}>
                            {recLabel}
                          </div>
                          {rec?.amount != null ? (
                            <div style={{ fontSize: 12, color: '#64748b' }}>
                              PKR {rec.amount}
                              {rec.period_months
                                ? ` · ${rec.period_months} mo`
                                : ''}
                            </div>
                          ) : null}
                        </td>
                        <td>
                          <span
                            className={`aid-status-pill aid-status-pill--${aidStatusTone(row.status)}`}
                          >
                            {formatAidStatus(row.status)}
                          </span>
                        </td>
                        <td style={{ fontSize: 13, color: '#64748b' }}>
                          {row.verified_at
                            ? new Date(row.verified_at).toLocaleDateString()
                            : '—'}
                        </td>
                        <td>
                          <div className="aid-icon-actions">
                            <button
                              type="button"
                              className="aid-icon-btn"
                              title="View application"
                              onClick={() => openView(row.id)}
                            >
                              <FiEye />
                            </button>
                            {needsCeo ? (
                              <button
                                type="button"
                                className="aid-icon-btn aid-icon-btn--approve"
                                title="Approve / decide as CEO"
                                onClick={() => openApprove(row.id)}
                              >
                                <FiCheckCircle />
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

export default AidApprovalsList;

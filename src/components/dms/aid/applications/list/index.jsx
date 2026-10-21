import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiCheckCircle, FiTruck } from 'react-icons/fi';
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
  AID_STATUS_OPTIONS,
  aidStatusTone,
  formatAidStatus,
  formatAidRequestType,
} from '../../aidConstants';
import '../../aid.css';

const CEO_PENDING_STATUS = 'ceo_approval_required';
const DELIVERY_PENDING_STATUSES = new Set(['successful']);

const AidApplicationsList = () => {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const { filtersOpen, toggleFilters } = useFiltersPanel();

  const isStaffElevated =
    !!permissions?.super_admin ||
    !!permissions?.program_manager ||
    !!permissions?.fund_raising_manager;

  const canCeo =
    isStaffElevated ||
    hasAidPermission(permissions, 'aid_applications', 'ceo_approve');

  const canDeliver =
    isStaffElevated ||
    hasAidPermission(permissions, 'aid_applications', 'deliver');

  const canList =
    canViewModule(permissions, 'program', 'aid_verification') ||
    hasAidPermission(permissions, 'aid_verification', 'list_view') ||
    canViewModule(permissions, 'program', 'aid_applications') ||
    canCeo ||
    canDeliver ||
    isStaffElevated;

  const canCreate =
    hasAidPermission(permissions, 'aid_applications', 'create') ||
    isStaffElevated;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [tempFilters, setTempFilters] = useState({ search: '', status: '' });
  const [appliedFilters, setAppliedFilters] = useState({ search: '', status: '' });

  const handleSortChange = (field, order) => {
    setSortField(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const sortOptions = [
    { value: 'created_at', label: 'Created Date' },
    { value: 'updated_at', label: 'Updated Date' },
    { value: 'status', label: 'Status' },
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
      setError('You do not have permission to view aid applications.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await axiosInstance.get('/aid/applications', {
        params: {
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
      setError(err.response?.data?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, sortField, sortOrder, appliedFilters]);

  const ceoFilterActive = appliedFilters.status === CEO_PENDING_STATUS;
  const pendingCeoCount = rows.filter((r) => r.status === CEO_PENDING_STATUS).length;

  return (
    <>
      <Navbar />
      <div className="list-wrapper aid-list">
        <PageHeader
          title="Case Review"
          backPath="/dms"
          showAdd={!!canCreate}
          addPath="/dms/aid/applications/add"
          addTitle="New application"
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
        />
        <div className="list-content">
          {error && <div className="error-message">{error}</div>}

          <CollapsibleFilters open={filtersOpen}>
            <div className="filters-row">
              <SearchFilter
                filterKey="search"
                label="Search"
                filters={tempFilters}
                onFilterChange={(k, v) => setTempFilters((p) => ({ ...p, [k]: v }))}
                placeholder="App no, name, CNIC…"
              />
              <DropdownFilter
                filterKey="status"
                label="Status"
                data={AID_STATUS_OPTIONS}
                filters={tempFilters}
                onFilterChange={(k, v) => setTempFilters((p) => ({ ...p, [k]: v }))}
                placeholder="All"
              />
              <SearchButton
                onClick={() => {
                  setCurrentPage(1);
                  setAppliedFilters({ ...tempFilters });
                }}
              />
              <ClearButton
                onClick={() => {
                  applyFilters({ search: '', status: '' });
                }}
              />
            </div>
          </CollapsibleFilters>

          <div className="aid-list-toolbar">
            <Link to="/dms/aid/people/list" className="secondary-btn">
              People / family registry
            </Link>
            {canCeo && (
              <Link
                to="/dms/aid/applications/approvals"
                className="secondary-btn"
              >
                <FiCheckCircle /> Approvals
              </Link>
            )}

            {canCeo && (
              <button
                type="button"
                className={`aid-filter-chip${ceoFilterActive ? ' aid-filter-chip--active' : ''}`}
                onClick={() =>
                  applyFilters({
                    ...appliedFilters,
                    status: ceoFilterActive ? '' : CEO_PENDING_STATUS,
                  })
                }
              >
                <FiCheckCircle />
                {ceoFilterActive
                  ? 'Showing CEO pending'
                  : 'Awaiting CEO approval'}
                {!ceoFilterActive && pendingCeoCount > 0 ? (
                  <span className="aid-filter-chip__count">{pendingCeoCount}</span>
                ) : null}
              </button>
            )}
          </div>

          {canCeo && ceoFilterActive && (
            <div className="aid-list-banner">
              Showing applications that need <strong>CEO approval</strong>. Use
              Review to approve or reject.
            </div>
          )}

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application</th>
                  <th>Beneficiary</th>
                  <th>Aid type</th>
                  <th>Status</th>
                  <th>Assigned</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>Loading…</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No applications found.</td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const needsCeo =
                      canCeo && row.status === CEO_PENDING_STATUS;
                    const needsDelivery =
                      canDeliver && DELIVERY_PENDING_STATUSES.has(row.status);
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
                          <span
                            className={`aid-status-pill aid-status-pill--${aidStatusTone(row.status)}`}
                          >
                            {formatAidStatus(row.status)}
                          </span>
                        </td>
                        <td>
                          {row.assigned_to
                            ? [row.assigned_to.first_name, row.assigned_to.last_name]
                                .filter(Boolean)
                                .join(' ') || row.assigned_to.email
                            : '—'}
                        </td>
                        <td>
                          <div className="aid-list-actions">
                            <button
                              type="button"
                              className="secondary-btn"
                              onClick={() =>
                                navigate(`/dms/aid/applications/view/${row.id}`)
                              }
                            >
                              <FiEye /> View
                            </button>
                            {needsCeo && (
                              <button
                                type="button"
                                className="primary-btn"
                                onClick={() =>
                                  navigate(`/dms/aid/applications/view/${row.id}`)
                                }
                              >
                                <FiCheckCircle /> CEO Review
                              </button>
                            )}
                            {needsDelivery && (
                              <button
                                type="button"
                                className="primary-btn"
                                onClick={() =>
                                  navigate(`/dms/aid/applications/view/${row.id}`)
                                }
                              >
                                <FiTruck /> Delivery
                              </button>
                            )}
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

export default AidApplicationsList;

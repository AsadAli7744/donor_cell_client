import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Chart, registerables } from 'chart.js';
import { FiDownload } from 'react-icons/fi';
import axiosInstance from '../../../../utils/axios';
import { useAuth } from '../../../../context/AuthContext';
import { canViewModule, hasAidPermission } from '../../../../utils/permissions';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormSelect from '../../../common/FormSelect';
import DateFilter from '../../../common/filters/DateFilter';
import DateRangeFilter from '../../../common/filters/DateRangeFilter';
import { AID_REQUEST_TYPES } from '../aidConstants';
import '../aid.css';
import './overview.css';

Chart.register(...registerables);

const formatMoneyShort = (n) => {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(Math.round(v));
};

const budgetTone = (pct) => {
  if (pct >= 90) return 'danger';
  if (pct >= 75) return 'warn';
  return 'ok';
};

const AidWelfareOverview = () => {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const canView =
    canViewModule(permissions, 'program', 'aid_overview') ||
    hasAidPermission(permissions, 'aid_overview', 'view') ||
    permissions?.super_admin ||
    permissions?.program_manager;

  const [program, setProgram] = useState('all');
  const [dateFilters, setDateFilters] = useState({
    date: '',
    start_date: '',
    end_date: '',
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const programOptions = useMemo(
    () => [
      { value: 'all', label: 'All programs' },
      ...AID_REQUEST_TYPES.filter(
        (t) => !['cash', 'medical', 'other'].includes(t.value),
      ),
    ],
    [],
  );

  const handleDateFilterChange = (key, value) => {
    setDateFilters((prev) => {
      if (key === 'date') {
        return { date: value, start_date: '', end_date: '' };
      }
      // Date range clears single date
      return { ...prev, date: '', [key]: value };
    });
  };

  const load = async () => {
    if (!canView) {
      setError('You do not have permission to view welfare overview.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await axiosInstance.get('/aid/overview', {
        params: {
          date: dateFilters.date || undefined,
          start_date: dateFilters.start_date || undefined,
          end_date: dateFilters.end_date || undefined,
          program: program === 'all' ? undefined : program,
        },
      });
      setData(res.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilters.date, dateFilters.start_date, dateFilters.end_date, program]);

  useEffect(() => {
    if (!chartRef.current || !data?.monthly_apps_vs_approvals?.length) return;
    if (chartInstance.current) chartInstance.current.destroy();
    const rows = data.monthly_apps_vs_approvals;
    chartInstance.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels: rows.map((r) => r.month),
        datasets: [
          {
            label: 'Applications',
            data: rows.map((r) => r.applications),
            backgroundColor: '#c5d4c8',
            borderRadius: 4,
            barPercentage: 0.7,
          },
          {
            label: 'Approved',
            data: rows.map((r) => r.approved),
            backgroundColor: '#1f5c3f',
            borderRadius: 4,
            barPercentage: 0.7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: { boxWidth: 12, usePointStyle: true },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, ticks: { precision: 0 } },
        },
      },
    });
    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [data]);

  const handleExport = () => window.print();

  if (!canView) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <div className="error-message">{error || 'Access denied'}</div>
        </div>
      </>
    );
  }

  const kpis = data?.kpis || {};
  const pipeline = data?.pipeline?.stages || [];
  const pipelineMax = Math.max(...pipeline.map((s) => s.count), 1);
  const age = data?.stuck?.age_of_open_cases || [];
  const ageTotal = age.reduce((s, a) => s + a.count, 0) || 1;
  const attention = data?.management_attention || [];
  const programs = data?.program_performance || [];

  return (
    <>
      <Navbar />
      <div className="aid-welfare-overview">
        <PageHeader
          title="Welfare overview"
          backPath="/dms/aid/applications/list"
          showAdd={false}
        />

        <div className="aid-wo-top">
          <div>
            <div className="aid-wo-crumb">Welfare › Management</div>
            <p className="aid-wo-sub">
              {data?.filters?.range_label || '—'} ·{' '}
              {program === 'all' ? 'all programs' : program.replace(/_/g, ' ')}
            </p>
          </div>
          <div className="aid-wo-filters">
            <DateFilter
              filterKey="date"
              label="Date"
              filters={dateFilters}
              onFilterChange={handleDateFilterChange}
            />
            <DateRangeFilter
              startKey="start_date"
              endKey="end_date"
              label="Date range"
              filters={dateFilters}
              onFilterChange={handleDateFilterChange}
            />
            <FormSelect
              label="Program"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              options={programOptions}
            />
            <button
              type="button"
              className="aid-wo-export"
              onClick={handleExport}
            >
              <FiDownload /> Export PDF
            </button>
          </div>
        </div>

        {error ? <div className="error-message">{error}</div> : null}
        {loading && !data ? (
          <div className="aid-wo-loading">Loading overview…</div>
        ) : null}

        <div className="aid-wo-kpis">
          <div className="aid-wo-kpi">
            <div className="aid-wo-kpi__label">Applications</div>
            <div className="aid-wo-kpi__value">{kpis.applications ?? '—'}</div>
            <div className="aid-wo-kpi__meta">
              {kpis.applications_delta_pct != null ? (
                <span
                  className={
                    kpis.applications_delta_pct >= 0
                      ? 'aid-wo-up'
                      : 'aid-wo-down'
                  }
                >
                  {kpis.applications_delta_pct >= 0 ? '↑' : '↓'}{' '}
                  {Math.abs(kpis.applications_delta_pct)}% vs prior
                </span>
              ) : (
                '—'
              )}
            </div>
          </div>
          <div className="aid-wo-kpi">
            <div className="aid-wo-kpi__label">Approved</div>
            <div className="aid-wo-kpi__value">{kpis.approved ?? '—'}</div>
            <div className="aid-wo-kpi__meta">
              {kpis.approved_of_decisions_pct != null
                ? `${kpis.approved_of_decisions_pct}% of final decisions`
                : '—'}
            </div>
          </div>
          <div className="aid-wo-kpi">
            <div className="aid-wo-kpi__label">Disbursed</div>
            <div className="aid-wo-kpi__value">
              {formatMoneyShort(kpis.disbursed)}
            </div>
            <div className="aid-wo-kpi__meta">
              PKR
              {kpis.budget_used_pct != null
                ? ` · ${kpis.budget_used_pct}% of ${formatMoneyShort(kpis.budget)} budget`
                : ''}
            </div>
          </div>
          <div className="aid-wo-kpi">
            <div className="aid-wo-kpi__label">Families supported</div>
            <div className="aid-wo-kpi__value">
              {(kpis.families_supported ?? 0).toLocaleString()}
            </div>
            <div className="aid-wo-kpi__meta">Active this period</div>
          </div>
          <div className="aid-wo-kpi">
            <div className="aid-wo-kpi__label">Intake → decision</div>
            <div className="aid-wo-kpi__value">
              {kpis.intake_to_decision_days != null
                ? `${kpis.intake_to_decision_days} d`
                : '—'}
            </div>
            <div
              className={`aid-wo-kpi__meta${
                kpis.intake_to_decision_days != null &&
                kpis.intake_to_decision_days > (kpis.intake_target_days || 10)
                  ? ' is-late'
                  : ''
              }`}
            >
              Target {kpis.intake_target_days || 10} days
            </div>
          </div>
          <div className="aid-wo-kpi">
            <div className="aid-wo-kpi__label">Avg vulnerability</div>
            <div className="aid-wo-kpi__value">
              {kpis.avg_vulnerability != null
                ? `${kpis.avg_vulnerability}%`
                : '—'}
            </div>
            <div className="aid-wo-kpi__meta">Of approved cases</div>
          </div>
        </div>

        <div className="aid-wo-grid-2">
          <section className="aid-wo-card">
            <div className="aid-wo-card__head">
              <h3>Pipeline this month</h3>
              <span>From registration to disbursement</span>
            </div>
            <div className="aid-wo-funnel">
              {pipeline.map((stage, idx) => {
                const prev = idx > 0 ? pipeline[idx - 1].count : null;
                const drop =
                  prev != null && prev > 0
                    ? Math.round(((prev - stage.count) / prev) * 100)
                    : null;
                return (
                  <div key={stage.key} className="aid-wo-funnel__row">
                    <div className="aid-wo-funnel__label">{stage.label}</div>
                    <div className="aid-wo-funnel__track">
                      <div
                        className="aid-wo-funnel__bar"
                        style={{
                          width: `${Math.max(8, (stage.count / pipelineMax) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="aid-wo-funnel__count">
                      {stage.count}
                      {drop != null && drop > 0 ? (
                        <span className="aid-wo-funnel__drop">−{drop}%</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="aid-wo-pipeline-foot">
              <span>Decided: {data?.pipeline?.decided ?? 0}</span>
              <span className="is-ok">
                Approved {data?.pipeline?.approved ?? 0}
              </span>
              <span className="is-bad">
                Rejected {data?.pipeline?.rejected ?? 0}
              </span>
              <span className="is-warn">
                Returned {data?.pipeline?.returned ?? 0}
              </span>
            </div>
          </section>

          <section className="aid-wo-card">
            <div className="aid-wo-card__head">
              <h3>Where cases are stuck</h3>
              <span>Open cases past their target time</span>
            </div>
            <div className="aid-wo-stuck">
              <button
                type="button"
                className="aid-wo-stuck__item"
                onClick={() =>
                  navigate('/dms/aid/applications/list?status=under_review')
                }
              >
                <div>
                  <strong>Investigation</strong>
                  <p>No visit report after 7 days</p>
                </div>
                <span>{data?.stuck?.investigation_overdue ?? 0}</span>
              </button>
              <button
                type="button"
                className="aid-wo-stuck__item"
                onClick={() => navigate('/dms/aid/applications/approvals')}
              >
                <div>
                  <strong>Approval</strong>
                  <p>With committee more than 5 days</p>
                </div>
                <span>{data?.stuck?.approval_overdue ?? 0}</span>
              </button>
            </div>
            <div className="aid-wo-age">
              <div className="aid-wo-age__label">Age of open cases</div>
              <div className="aid-wo-age__bar">
                {age.map((bucket, i) => (
                  <div
                    key={bucket.key}
                    className={`aid-wo-age__seg aid-wo-age__seg--${i}`}
                    style={{
                      width: `${(bucket.count / ageTotal) * 100}%`,
                    }}
                    title={`${bucket.label}: ${bucket.count}`}
                  />
                ))}
              </div>
              <div className="aid-wo-age__legend">
                {age.map((bucket, i) => (
                  <span key={bucket.key}>
                    <i className={`aid-wo-age__dot aid-wo-age__seg--${i}`} />
                    {bucket.label} {bucket.count}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="aid-wo-grid-2 aid-wo-grid-2--attention">
          <section className="aid-wo-card">
            <div className="aid-wo-card__head">
              <h3>Needs management attention</h3>
            </div>
            <div className="aid-wo-attention">
              {attention.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`aid-wo-attention__card aid-wo-attention__card--${item.tone}`}
                  onClick={() => {
                    if (item.key === 'awaiting_ceo') {
                      navigate('/dms/aid/applications/approvals');
                    } else {
                      navigate('/dms/aid/applications/list');
                    }
                  }}
                >
                  <div className="aid-wo-attention__count">{item.count}</div>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="aid-wo-card">
            <div className="aid-wo-card__head">
              <h3>Applications vs approvals</h3>
              <span>Last 6 months</span>
            </div>
            <div className="aid-wo-chart">
              <canvas ref={chartRef} />
            </div>
          </section>
        </div>

        <section className="aid-wo-card">
          <div className="aid-wo-card__head">
            <h3>Program performance</h3>
            <span>Budget = monthly allocation per program</span>
          </div>
          <div className="table-container">
            <table className="data-table aid-wo-table">
              <thead>
                <tr>
                  <th>Program</th>
                  <th>Applications</th>
                  <th>Approved</th>
                  <th>Approval rate</th>
                  <th>Disbursed</th>
                  <th>Budget used</th>
                  <th>Avg vulnerability</th>
                </tr>
              </thead>
              <tbody>
                {programs.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No program data for this period.</td>
                  </tr>
                ) : (
                  programs.map((row) => (
                    <tr key={row.program}>
                      <td>
                        <strong>{row.label}</strong>
                      </td>
                      <td>{row.applications}</td>
                      <td>{row.approved}</td>
                      <td>{row.approval_rate}%</td>
                      <td>{formatMoneyShort(row.disbursed)}</td>
                      <td>
                        <div className="aid-wo-budget">
                          <div className="aid-wo-budget__track">
                            <div
                              className={`aid-wo-budget__fill aid-wo-budget__fill--${budgetTone(row.budget_used_pct)}`}
                              style={{
                                width: `${Math.min(100, row.budget_used_pct)}%`,
                              }}
                            />
                          </div>
                          <span>{row.budget_used_pct}%</span>
                        </div>
                      </td>
                      <td>
                        {row.avg_vulnerability != null
                          ? `${row.avg_vulnerability}%`
                          : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="aid-wo-links">
            <Link to="/dms/aid/applications/entry/list">Data entry</Link>
            <Link to="/dms/aid/applications/list">Case review</Link>
            <Link to="/dms/aid/applications/approvals">Approvals queue</Link>
          </div>
        </section>
      </div>
    </>
  );
};

export default AidWelfareOverview;

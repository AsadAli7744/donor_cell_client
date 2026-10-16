import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import SearchableDropdown from '../../../common/SearchableDropdown';
import { formatAidStatus } from '../aidConstants';

const money = (amount, currency) => {
  const n = Number(amount);
  const text = Number.isFinite(n) ? n.toLocaleString('en-PK') : '—';
  return currency ? `${currency} ${text}` : text;
};

/**
 * Links a completed donation to a beneficiary (and optionally one aid case).
 * Pass the ids that are already known on this screen; the rest are picked here.
 */
const AidGrantsPanel = ({
  donationId = null,
  beneficiaryPersonId = null,
  applicationId = null,
  applications = null,
  canManage = false,
  variant = 'aid',
}) => {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [caseId, setCaseId] = useState(applicationId ? String(applicationId) : '');
  const [caseOptions, setCaseOptions] = useState(applications || []);

  const fixedDonation = donationId ? Number(donationId) : null;
  const fixedPerson = beneficiaryPersonId ? Number(beneficiaryPersonId) : null;
  const fixedCase = applicationId ? Number(applicationId) : null;

  const load = useCallback(async () => {
    const params = {};
    if (fixedDonation) params.donation_id = fixedDonation;
    if (fixedPerson) params.beneficiary_person_id = fixedPerson;
    if (fixedCase) params.application_id = fixedCase;
    if (!params.donation_id && !params.beneficiary_person_id && !params.application_id) {
      setRows([]);
      setSummary(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await axiosInstance.get('/aid/grants', { params });
      setRows(res.data?.data || []);
      setSummary(res.data?.summary || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load grants');
    } finally {
      setLoading(false);
    }
  }, [fixedDonation, fixedPerson, fixedCase]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (applications) setCaseOptions(applications);
  }, [applications]);

  useEffect(() => {
    const personId = fixedPerson || Number(selectedPerson?.value);
    if (fixedCase || applications || !personId) return undefined;
    let active = true;
    axiosInstance
      .get('/aid/grants/applications', {
        params: { beneficiary_person_id: personId },
      })
      .then((res) => {
        if (active) setCaseOptions(res.data?.data || []);
      })
      .catch(() => {
        if (active) setCaseOptions([]);
      });
    return () => {
      active = false;
    };
  }, [fixedPerson, fixedCase, applications, selectedPerson]);

  const attach = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await axiosInstance.post('/aid/grants', {
        donation_id: fixedDonation || Number(selectedDonation?.value),
        beneficiary_person_id: fixedPerson || Number(selectedPerson?.value),
        application_id: fixedCase || (caseId ? Number(caseId) : null),
        amount: Number(amount),
        note: note || null,
      });
      setAmount('');
      setNote('');
      setSelectedDonation(null);
      setSelectedPerson(null);
      if (!fixedCase) setCaseId('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not attach this donation');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    setBusy(true);
    setError('');
    try {
      await axiosInstance.delete(`/aid/grants/${id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove this grant');
    } finally {
      setBusy(false);
    }
  };

  const caseSelectOptions = [
    { value: '', label: 'Beneficiary only (no specific case)' },
    ...(caseOptions || [])
      .filter((row) => {
        if (!fixedPerson) return true;
        if (row.beneficiary_person_id == null) return true;
        return Number(row.beneficiary_person_id) === fixedPerson;
      })
      .map((row) => ({
        value: String(row.id),
        label: `${row.application_no} · ${formatAidStatus(row.status)}`,
      })),
  ];

  const shellClass = variant === 'donation' ? 'view-section' : 'aid-section';
  const titleClass = variant === 'donation' ? 'view-section-title' : undefined;

  return (
    <section className={shellClass} style={{ marginTop: variant === 'aid' ? 16 : 0, marginBottom: 16 }}>
      <h3 className={titleClass} style={titleClass ? undefined : { marginTop: 0 }}>
        Grants
      </h3>
      <p style={{ marginTop: 0, color: '#64748b' }}>
        A completed donation can fund this record. The amount cannot exceed what is still ungranted on that donation.
      </p>
      {summary?.pool != null && (
        <p style={{ marginTop: 0 }}>
          Donation pool {money(summary.pool, summary.currency)} · granted{' '}
          {money(summary.allocated, summary.currency)} · left{' '}
          {money(summary.remaining, summary.currency)}
        </p>
      )}
      {summary?.pool == null && summary?.allocated != null && (
        <p style={{ marginTop: 0 }}>Granted so far {money(summary.allocated)}</p>
      )}
      {error && <div className="status-message status-message--error">{error}</div>}
      {loading ? (
        <p style={{ color: '#94a3b8' }}>Loading grants…</p>
      ) : rows.length === 0 ? (
        <p style={{ color: '#94a3b8' }}>No donation is attached yet.</p>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Donation</th>
                <th>Beneficiary</th>
                <th>Case</th>
                <th>Amount</th>
                {canManage && <th />}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    {row.donation ? (
                      <Link to={`/donations/online_donations/view/${row.donation.id}`}>
                        #{row.donation.id}
                        {row.donation.donor_name ? ` · ${row.donation.donor_name}` : ''}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    {row.beneficiary ? (
                      <Link to={`/dms/aid/people/view/${row.beneficiary.id}`}>
                        {row.beneficiary.full_name}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    {row.application ? (
                      <Link to={`/dms/aid/applications/view/${row.application.id}`}>
                        {row.application.application_no}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{money(row.amount, row.currency || row.donation?.currency)}</td>
                  {canManage && (
                    <td>
                      <button
                        type="button"
                        className="secondary-btn"
                        disabled={busy}
                        onClick={() => remove(row.id)}
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canManage && (
        <form onSubmit={attach} style={{ marginTop: 16 }}>
          <div className="form-grid-2">
            {!fixedDonation && (
              <SearchableDropdown
                label="Completed donation"
                apiEndpoint="/donations/lookup"
                searchParamName="search"
                apiParams={{ status: 'completed', limit: 20 }}
                displayKey="label"
                minSearchLength={1}
                value={selectedDonation}
                onSelect={setSelectedDonation}
                onClear={() => setSelectedDonation(null)}
                required
              />
            )}
            {!fixedPerson && (
              <SearchableDropdown
                label="Beneficiary"
                apiEndpoint="/aid/people/lookup"
                searchParamName="search"
                displayKey="label"
                minSearchLength={1}
                value={selectedPerson}
                onSelect={(person) => {
                  setSelectedPerson(person);
                  setCaseId('');
                }}
                onClear={() => {
                  setSelectedPerson(null);
                  setCaseId('');
                  setCaseOptions([]);
                }}
                required
              />
            )}
            {!fixedCase && (
              <FormSelect
                label="Case"
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                options={caseSelectOptions}
              />
            )}
            <FormInput
              label="Amount"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <FormInput
              label="Note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <button type="submit" className="primary-btn" disabled={busy} style={{ marginTop: 8 }}>
            {busy ? 'Saving…' : 'Attach donation'}
          </button>
        </form>
      )}
    </section>
  );
};

export default AidGrantsPanel;

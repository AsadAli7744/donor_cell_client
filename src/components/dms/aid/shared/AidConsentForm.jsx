import React, { useState } from 'react';
import FormInput from '../../../common/FormInput';
import mtjfLogo from '../../../../assets/mtjf_logo.png';
import { emptyConsentForm } from '../aidConstants';

const COPY = {
  ur: {
    org: 'مولانا طارق جمیل فاؤنڈیشن',
    title: 'کنسنٹ فارم',
    date: 'تاریخ',
    appNo: 'درخواست نمبر',
    name: 'نام',
    parentage: 'ولدیت / زوجیت',
    cnic: 'شناختی کارڈ نمبر',
    sector: 'سیکٹر',
    body:
      'میں مولانا طارق جمیل فاؤنڈیشن کو اس عمل کا مکمل اختیار دیتا/دیتی ہوں کہ وہ میری تصاویر، ویڈیوز، انٹرویوز، بیانات اور درخواست فارم میں تحریر شدہ معلومات کو اپنے اشاعتی مواد مثلاً رپورٹس، ویب سائٹس، سوشل، پرنٹ اور الیکٹرانکس میڈیا، اشتہارات وغیرہ میں استعمال کر سکتے ہیں۔ مزید میری مندرجہ بالا معلومات اپنے ڈونرز سے بھی شئیر کر سکتے ہیں۔ جس پر مجھے کوئی اعتراض نہیں ہو گا۔',
    accept: 'میں مذکورہ بالا رضامندی سے اتفاق کرتا / کرتی ہوں',
    thumb: 'انگوٹھا درخواست گزار (SecuGen)',
    sign: 'دستخط درخواست گزار (ePad)',
    signLabel: 'دستخط / انگوٹھا',
    capture: 'کےپچر',
    clear: 'صاف',
    empty: 'ابھی خالی — آلہ منسلک نہیں',
    capturing: 'کےپچر ہو رہا ہے…',
    deviceHint:
      'SecuGen انگوٹھا / ePad VP9801 دستخط — فیلڈز اختیاری ہیں اور null رہ سکتی ہیں۔',
  },
  en: {
    org: 'Maulana Tariq Jameel Foundation',
    title: 'Consent Form',
    date: 'Date',
    appNo: 'Application No.',
    name: 'Name',
    parentage: 'Parentage / Spouse',
    cnic: 'CNIC',
    sector: 'Sector',
    body:
      'I hereby grant Maulana Tariq Jameel Foundation full authority to use my photographs, videos, interviews, statements, and information written in the application form in their publications such as reports, websites, social, print and electronic media, advertisements, etc. Further, they may also share the above information with their donors. I have no objection to this.',
    accept: 'I agree to the consent statement above',
    thumb: 'Applicant thumb (SecuGen)',
    sign: 'Applicant signature (ePad)',
    signLabel: 'Signature / Thumb',
    capture: 'Capture',
    clear: 'Clear',
    empty: 'Empty for now — device not connected',
    capturing: 'Capturing…',
    deviceHint:
      'SecuGen thumb / ePad VP9801 signature — fields are optional and may stay null.',
  },
};

async function captureFromDevice(kind) {
  const api = typeof window !== 'undefined' ? window.mtjfDevices : null;
  if (!api) return null;
  try {
    if (kind === 'thumb' && typeof api.captureThumb === 'function') {
      return await api.captureThumb({ device: 'secugen' });
    }
    if (kind === 'signature' && typeof api.captureSignature === 'function') {
      return await api.captureSignature({ device: 'epad', model: 'VP9801' });
    }
  } catch {
    return null;
  }
  return null;
}

function normalizeCapture(raw, source) {
  if (!raw) return null;
  const dataUrl = raw.dataUrl || raw.data_url || raw.image || null;
  const url = raw.url || null;
  if (!dataUrl && !url) return null;
  return {
    data_url: dataUrl,
    url,
    source,
    captured_at: new Date().toISOString(),
  };
}

const CaptureSlot = ({
  label,
  value,
  onCapture,
  onClear,
  readOnly,
  t,
  busy,
  kind,
}) => {
  const preview = value?.data_url || value?.url || null;
  return (
    <div className={`aid-zakat-capture aid-zakat-capture--${kind}`}>
      <div className="aid-zakat-capture__label">{label}</div>
      <div className="aid-zakat-capture__pad">
        {preview ? (
          <img src={preview} alt={label} className="aid-zakat-capture__img" />
        ) : (
          <span className="aid-zakat-capture__empty">{t.empty}</span>
        )}
      </div>
      {!readOnly && (
        <div className="aid-zakat-capture__actions">
          <button
            type="button"
            className="aid-mini-btn aid-mini-btn--add"
            disabled={busy}
            onClick={onCapture}
          >
            {busy ? t.capturing : t.capture}
          </button>
          {preview && (
            <button
              type="button"
              className="aid-mini-btn aid-mini-btn--remove"
              disabled={busy}
              onClick={onClear}
            >
              {t.clear}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Consent Form (کنسنٹ فارم) — bilingual Urdu / English for every application.
 */
const AidConsentForm = ({
  value,
  onChange,
  readOnly = false,
  applicationNo,
}) => {
  const details = { ...emptyConsentForm(), ...(value || {}) };
  const lang = details.lang === 'en' ? 'en' : 'ur';
  const t = COPY[lang];
  const rtl = lang === 'ur';
  const [busyKey, setBusyKey] = useState(null);
  const [deviceMsg, setDeviceMsg] = useState('');

  const patch = (partial) => {
    if (readOnly || !onChange) return;
    onChange({ ...details, ...partial });
  };

  const runCapture = async (field, kind, source) => {
    setBusyKey(field);
    setDeviceMsg('');
    try {
      const raw = await captureFromDevice(kind);
      const normalized = normalizeCapture(raw, source);
      patch({ [field]: normalized });
      if (!normalized) setDeviceMsg(t.deviceHint);
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div
      className={`aid-consent-form aid-zakat-form ${
        rtl ? 'aid-zakat-form--rtl' : 'aid-zakat-form--ltr'
      }`}
      dir={rtl ? 'rtl' : 'ltr'}
    >
      <div className="aid-zakat-form__lang">
        <button
          type="button"
          className={`aid-zakat-form__lang-btn${lang === 'ur' ? ' is-active' : ''}`}
          onClick={() => patch({ lang: 'ur' })}
          disabled={readOnly}
        >
          اردو
        </button>
        <button
          type="button"
          className={`aid-zakat-form__lang-btn${lang === 'en' ? ' is-active' : ''}`}
          onClick={() => patch({ lang: 'en' })}
          disabled={readOnly}
        >
          English
        </button>
      </div>

      <header className="aid-zakat-form__header">
        <img
          src={mtjfLogo}
          alt="MTJF Logo"
          className="aid-zakat-form__logo"
        />
        <h3 className="aid-zakat-form__org">{t.org}</h3>
        <h4 className="aid-zakat-form__title aid-consent-form__title">
          {t.title}
        </h4>
      </header>

      <div className="aid-zakat-form__meta form-grid-2">
        <FormInput
          label={t.date}
          type="date"
          value={details.form_date || ''}
          onChange={(e) => patch({ form_date: e.target.value })}
          readOnly={readOnly}
        />
        <FormInput
          label={t.appNo}
          value={applicationNo || details.application_no || ''}
          onChange={(e) => patch({ application_no: e.target.value })}
          readOnly={readOnly || !!applicationNo}
          placeholder={applicationNo ? undefined : '—'}
        />
        <FormInput
          label={t.name}
          value={details.full_name || ''}
          onChange={(e) => patch({ full_name: e.target.value })}
          readOnly={readOnly}
        />
        <FormInput
          label={t.parentage}
          value={details.parentage_or_spouse || ''}
          onChange={(e) => patch({ parentage_or_spouse: e.target.value })}
          readOnly={readOnly}
        />
        <FormInput
          label={t.cnic}
          value={details.cnic || ''}
          onChange={(e) => patch({ cnic: e.target.value })}
          readOnly={readOnly}
        />
        <FormInput
          label={t.sector}
          value={details.sector || ''}
          onChange={(e) => patch({ sector: e.target.value })}
          readOnly={readOnly}
        />
      </div>

      <div className="aid-consent-form__body">
        <p>{t.body}</p>
        <label className="aid-zakat-form__check aid-zakat-form__accept">
          <input
            type="checkbox"
            checked={!!details.consent_accepted}
            disabled={readOnly}
            onChange={(e) => patch({ consent_accepted: e.target.checked })}
          />
          {t.accept}
        </label>
      </div>

      <p className="aid-consent-form__sign-heading">{t.signLabel}</p>
      <p className="aid-zakat-form__device-hint">{t.deviceHint}</p>
      {deviceMsg && (
        <p className="aid-zakat-form__device-msg">{deviceMsg}</p>
      )}

      <div className="aid-zakat-form__signs">
        <CaptureSlot
          kind="thumb"
          label={t.thumb}
          value={details.applicant_thumb}
          readOnly={readOnly}
          t={t}
          busy={busyKey === 'applicant_thumb'}
          onCapture={() => runCapture('applicant_thumb', 'thumb', 'secugen')}
          onClear={() => patch({ applicant_thumb: null })}
        />
        <CaptureSlot
          kind="signature"
          label={t.sign}
          value={details.applicant_signature}
          readOnly={readOnly}
          t={t}
          busy={busyKey === 'applicant_signature'}
          onCapture={() =>
            runCapture('applicant_signature', 'signature', 'epad_vp9801')
          }
          onClear={() => patch({ applicant_signature: null })}
        />
      </div>
    </div>
  );
};

export default AidConsentForm;

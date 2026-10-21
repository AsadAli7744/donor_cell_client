import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../../../../utils/axios';

export const DONATION_BOX_FIELD_LABELS = {
  box_id_no: 'Box ID',
  key_no: 'Key Number',
  box_type: 'Box Type',
  shop_name: 'Shop Name',
  shopkeeper: 'Shopkeeper',
  cell_no: 'Cell Number',
  landmark_marketplace: 'Landmark / Marketplace',
  frequency: 'Collection Frequency',
};

let cachedByTenant = {};
let pendingByTenant = {};

export function placeWord(label) {
  return String(label || '').replace(/\s*name$/i, '').trim() || label;
}

function currentTenantKey() {
  try {
    const user = JSON.parse(localStorage.getItem('user_data') || 'null');
    return String(user?.tenant_id || 0);
  } catch {
    return '0';
  }
}

export async function loadDonationBoxLabels(force = false) {
  const tenantKey = currentTenantKey();
  if (cachedByTenant[tenantKey] && !force) return cachedByTenant[tenantKey];
  if (pendingByTenant[tenantKey] && !force) return pendingByTenant[tenantKey];
  pendingByTenant[tenantKey] = axiosInstance
    .get('/tenants/current/donation-box-labels')
    .then((response) => {
      cachedByTenant[tenantKey] = {
        ...DONATION_BOX_FIELD_LABELS,
        ...(response.data?.data || {}),
      };
      return cachedByTenant[tenantKey];
    })
    .catch(() => {
      cachedByTenant[tenantKey] = { ...DONATION_BOX_FIELD_LABELS };
      return cachedByTenant[tenantKey];
    })
    .finally(() => {
      delete pendingByTenant[tenantKey];
    });
  return pendingByTenant[tenantKey];
}

export function useDonationBoxLabels() {
  const [labels, setLabels] = useState(
    cachedByTenant[currentTenantKey()] || DONATION_BOX_FIELD_LABELS,
  );

  const reload = useCallback(async () => {
    const next = await loadDonationBoxLabels(true);
    setLabels(next);
    return next;
  }, []);

  useEffect(() => {
    let active = true;
    loadDonationBoxLabels().then((next) => {
      if (active) setLabels(next);
    });
    return () => {
      active = false;
    };
  }, []);

  return { labels, reload, place: placeWord(labels.shop_name) };
}

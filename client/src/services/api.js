const DEFAULT_DEV_KEY = 'sra_dev_hackathon_demo_key_2026';
const STORAGE_KEY = 'smartroute_api_key';

export function getStoredApiKey() {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_DEV_KEY;
}

export function setStoredApiKey(key) {
  if (key && key.trim()) {
    localStorage.setItem(STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

async function request(endpoint, options = {}) {
  const apiKey = getStoredApiKey();
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
    ...(options.headers || {})
  };

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error?.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.code = data?.error?.code || 'API_ERROR';
    error.status = response.status;
    error.details = data?.error?.details;
    throw error;
  }

  return data;
}

export async function recommendRoutes(source, destination, weights) {
  return request('/api/routes/recommend', {
    method: 'POST',
    body: JSON.stringify({ source, destination, weights })
  });
}

export async function refreshRoutes(source, destination, weights) {
  return request('/api/routes/refresh', {
    method: 'POST',
    body: JSON.stringify({ source, destination, weights })
  });
}

export async function getHealth() {
  const res = await fetch('/api/health');
  return res.json();
}

export async function getDeveloperStatus(customKey) {
  const keyToUse = customKey || getStoredApiKey();
  const res = await fetch('/api/developer/status', {
    headers: {
      'X-API-Key': keyToUse
    }
  });
  return res.json();
}

export async function getTrafficStatus() {
  const res = await fetch('/api/traffic/status');
  return res.json();
}

export async function setTomTomApiKey(apiKey) {
  const res = await fetch('/api/traffic/key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey })
  });
  return res.json();
}

export async function removeTomTomApiKey() {
  const res = await fetch('/api/traffic/key', {
    method: 'DELETE'
  });
  return res.json();
}

export async function searchLocationsApi(query) {
  if (!query || typeof query !== 'string' || query.trim().length < 2) return [];
  try {
    const res = await fetch(`/api/routes/locations/search?q=${encodeURIComponent(query.trim())}`, {
      headers: {
        'X-API-Key': getStoredApiKey()
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.locations || data?.data?.locations || [];
  } catch {
    return [];
  }
}

export async function submitIncidentReport(reportData) {
  return request('/api/reports', {
    method: 'POST',
    body: JSON.stringify(reportData)
  });
}

export async function fetchNearbyIncidents(params = {}) {
  const query = new URLSearchParams();
  const lat = params.lat ?? params.latitude;
  const lng = params.lng ?? params.longitude;
  if (lat != null) query.set('lat', lat);
  if (lng != null) query.set('lng', lng);
  if (params.radiusM != null) query.set('radiusM', params.radiusM);
  if (params.status) query.set('status', params.status);

  const res = await request(`/api/reports/nearby?${query.toString()}`, {
    method: 'GET'
  });
  return res?.reports || [];
}

export async function voteOnIncident(reportId, voteData) {
  return request(`/api/reports/${encodeURIComponent(reportId)}/votes`, {
    method: 'POST',
    body: JSON.stringify(voteData)
  });
}

export async function fetchAuthorityHotspots(windowDays = 7, authorityKey = 'admin') {
  return request(`/api/authority/hotspots?windowDays=${encodeURIComponent(windowDays)}`, {
    method: 'GET',
    headers: {
      'X-Authority-Role': authorityKey
    }
  });
}

export async function resolveAuthorityIncident(reportId, resolvedBy = 'Traffic Authority Officer', authorityKey = 'admin') {
  return request(`/api/authority/reports/${encodeURIComponent(reportId)}/resolve`, {
    method: 'POST',
    headers: {
      'X-Authority-Role': authorityKey
    },
    body: JSON.stringify({ resolvedBy })
  });
}



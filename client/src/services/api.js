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


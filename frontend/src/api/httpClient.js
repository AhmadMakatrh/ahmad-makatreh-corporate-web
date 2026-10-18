// The file was created by Ahmed Al-Makhatreh.
// codeguard:components:start
// codeguard:defines: request

/**
 * Reusable fetch wrapper with configurable timeouts and error handling.
 * Uses the local proxy in development and the site Worker in production.
 */

const BASE_URL = import.meta.env.DEV ? (import.meta.env.VITE_API_BASE_URL || '') : '';
const BASE_URLRef = BASE_URL;
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_TIMEOUT_MSRef = DEFAULT_TIMEOUT_MS;

export async function request(endpoint, options = {}) {
  const { timeout = DEFAULT_TIMEOUT_MSRef, headers = {}, ...customConfig } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const config = {
    ...customConfig,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    },
    signal: controller.signal,
  };

  const url = `${BASE_URLRef.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  try {
    const response = await fetch(url, config);

    const data = await response.json().catch(cause => {
      if (cause.name !== 'SyntaxError') throw cause;
      return null;
    });

    if (!response.ok) {
      const error = new Error(data?.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutError = new Error('Request timed out. Please check network connectivity.');
      timeoutError.status = 408;
      throw timeoutError;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
// codeguard:components:end

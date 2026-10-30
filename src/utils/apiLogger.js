// Central API logging: every request logs the method, endpoint, URL and
// payload, then the HTTP status, timing and response body (or the error).
// Long strings (e.g. base64 images) are truncated so logging never blocks the
// JS thread, and passwords are masked.
const MAX_STRING = 80;
const MASKED_KEYS = ['password', 'new_password', 'confirm_password', 'old_password'];

const sanitize = (key, value) => {
  if (MASKED_KEYS.includes(key)) return '***';
  if (typeof value === 'string' && value.length > MAX_STRING) {
    return `${value.slice(0, MAX_STRING)}...(${value.length} chars)`;
  }
  return value;
};

const toLog = value => {
  if (value === undefined) return undefined;
  if (typeof value === 'string') return sanitize('', value);
  try {
    return JSON.parse(JSON.stringify(value, sanitize));
  } catch (e) {
    return String(value);
  }
};

// Returns a function to call with the outcome, so the elapsed time is included.
export function logApiRequest(method, endpoint, url, payload) {
  const started = Date.now();
  const headers = method === 'POST' ? { 'Content-Type': 'application/json' } : {};
  console.log(`[API ➜] ${method} ${endpoint}`, {
    method,
    url,
    headers,
    payload: toLog(payload),
  });
  return {
    response(status, data) {
      console.log(`[API ✓] ${method} ${endpoint} → HTTP ${status} (${Date.now() - started}ms)`, {
        method,
        url,
        payload: toLog(payload),
        response: toLog(data),
      });
    },
    error(message) {
      console.log(`[API ✗] ${method} ${endpoint} → ${message} (${Date.now() - started}ms)`, {
        method,
        url,
        payload: toLog(payload),
      });
    },
  };
}

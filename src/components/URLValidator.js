import React, { useCallback, useMemo, useState } from 'react';
import './URLValidator.css';

// Robust URL validation helper used by the component and tests.
export function validateUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') return false;

  const trimmed = value.trim();

  // Fast acceptance: the native URL parser is reliable for well-formed URLs
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    // If it fails, try to be forgiving: allow omission of protocol (e.g. example.com)
    // but require at least one dot and no spaces. This avoids false positives.
    if (/\s/.test(trimmed)) return false;
    // domain-like check: must contain a dot and not start or end with a dot
    if (!/^([a-z0-9-]+\.)+[a-z]{2,}(:\d+)?(\/.*)?$/i.test(trimmed)) return false;
    return true;
  }
}

export default function URLValidator() {
  const [value, setValue] = useState('');
  const isValid = useMemo(() => validateUrl(value), [value]);

  const onChange = useCallback((e) => setValue(e.target.value), []);

  return (
    <div className="url-validator">
      <label htmlFor="url-input" className="uv-label">
        Enter URL
      </label>

      <div className="uv-input-row">
        <input
          id="url-input"
          className={`uv-input ${value ? (isValid ? 'valid' : 'invalid') : ''}`}
          value={value}
          onChange={onChange}
          placeholder="https://example.com"
          aria-invalid={!isValid && value !== ''}
          aria-describedby="uv-help uv-status"
          type="text"
          autoComplete="url"
        />

        <div id="uv-status" className={`uv-status ${value ? (isValid ? 'ok' : 'err') : ''}`}>
          {value === '' ? null : isValid ? '✅ Valid URL' : '❌ Invalid URL'}
        </div>
      </div>

      <div id="uv-help" className="uv-help">
        Tips: include protocol (https://) for strict parsing — we also accept domain-only inputs like example.com
      </div>
    </div>
  );
}

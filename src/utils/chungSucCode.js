/**
 * Chung Suc codes are ten character, alphanumeric tokens. Codes are often
 * copied from chat with a lightweight wrapper around them, so keep all of the
 * cleanup in one place for inputs, paste handlers, and order submission.
 */
export const CHUNG_SUC_CODE_LENGTH = 10;
export const CHUNG_SUC_CODE_PATTERN = /^[A-Za-z0-9]{10}$/;

export const isValidChungSucCode = (value) =>
  typeof value === 'string' && CHUNG_SUC_CODE_PATTERN.test(value);

/** Return the token without a supported display wrapper or surrounding space. */
export const normalizeChungSucCode = (value) => {
  if (value == null) return '';
  const text = String(value).trim();
  if (!text) return '';

  // Copying from the game can include a sentence, --CODE--, or [[CODE]].
  // Match a standalone ten-character token so a longer bracketed identifier
  // is not accidentally truncated into an invalid code.
  const match = text.match(/(?:^|[^A-Za-z0-9])([A-Za-z0-9]{10})(?![A-Za-z0-9])/);
  return match ? match[1] : text;
};

/** Extract a normalized code, or an empty string when no token is present. */
export const extractChungSucCode = (value) => {
  const text = String(value ?? '').trim();
  return text.match(/(?:^|[^A-Za-z0-9])([A-Za-z0-9]{10})(?![A-Za-z0-9])/)?.[1] || '';
};

/** Parse one code per line while retaining invalid, non-empty lines. */
export const parseChungSucCodes = (text) => {
  if (Array.isArray(text)) return text.map(normalizeChungSucCode).filter(Boolean);
  return String(text ?? '')
    .split(/\r?\n/)
    .map(normalizeChungSucCode)
    .filter(Boolean);
};

/** Normalize textarea content without dropping invalid lines (validation can report them later). */
export const normalizeChungSucCodesText = (text) =>
  String(text ?? '').split(/\r?\n/).map(normalizeChungSucCode).join('\n');

// Descriptive aliases keep the utility easy to discover from form code.
export const normalizeFriendCode = normalizeChungSucCode;
export const parseBulkCodes = parseChungSucCodes;

export default normalizeChungSucCode;

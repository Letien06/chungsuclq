/**
 * SieuCap5s Result Parser
 *
 * Parses the output from sieucap5s tool:
 * - Success: "taikhoan|Matkhau|machungsuc||THƯỞNG: 25 Bỉ"
 * - Failed:  "taikhoan|matkhau| hết lượt giúp"
 */

/**
 * Parse the success textarea content from sieucap5s
 * @param {string} text - Raw text from "Account Success" textarea
 * @returns {Array<{username: string, password: string, code: string, biEarned: number}>}
 */
function parseSuccessResults(text) {
  if (!text || !text.trim()) return [];

  return text
    .trim()
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const trimmed = line.trim();

      // Pattern: taikhoan|Matkhau|machungsuc||THƯỞNG: 25 Bỉ
      const biMatch = trimmed.match(/THƯỞNG:\s*(\d+)\s*B[ỉi]/i);
      const biEarned = biMatch ? parseInt(biMatch[1], 10) : 0;

      const parts = trimmed.split('|');
      return {
        username: (parts[0] || '').trim(),
        password: (parts[1] || '').trim(),
        code: (parts[2] || '').trim(),
        biEarned,
        raw: trimmed,
      };
    });
}

/**
 * Parse the failed textarea content from sieucap5s
 * @param {string} text - Raw text from "Account Failed" textarea
 * @returns {Array<{username: string, password: string, reason: string}>}
 */
function parseFailedResults(text) {
  if (!text || !text.trim()) return [];

  return text
    .trim()
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const trimmed = line.trim();
      const parts = trimmed.split('|');

      return {
        username: (parts[0] || '').trim(),
        password: (parts[1] || '').trim(),
        reason: (parts[2] || '').trim(),
        raw: trimmed,
      };
    });
}

/**
 * Parse the account count display: "Có : X Account"
 * @param {string} text
 * @returns {number}
 */
function parseAccountCount(text) {
  const match = (text || '').match(/(\d+)\s*Account/i);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Parse progress counters: "X / Y"
 * @param {string} text
 * @returns {{done: number, total: number}}
 */
function parseProgressCounter(text) {
  const match = (text || '').match(/(\d+)\s*\/\s*(\d+)/);
  if (match) {
    return {
      done: parseInt(match[1], 10),
      total: parseInt(match[2], 10),
    };
  }
  return { done: 0, total: 0 };
}

/**
 * Format account list for sieucap5s textarea input
 * Cách 1: dùng chung 1 mã → chỉ cần acc|pass
 * Cách 2: mỗi acc 1 mã → acc|pass|mã
 * @param {Array<{username: string, password: string}>} accounts
 * @param {string|null} sharedCode - If provided, uses Cách 1 (shared code)
 * @returns {string}
 */
function formatAccountInput(accounts, sharedCode = null) {
  return accounts
    .map((acc) => {
      if (sharedCode) {
        // Cách 1: shared code goes in the separate input field
        return `${acc.username}|${acc.password}`;
      }
      // Cách 2: each acc has its own code
      return `${acc.username}|${acc.password}|${acc.code || ''}`;
    })
    .join('\n');
}

module.exports = {
  parseSuccessResults,
  parseFailedResults,
  parseAccountCount,
  parseProgressCounter,
  formatAccountInput,
};

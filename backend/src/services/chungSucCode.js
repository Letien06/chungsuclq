function normalizeChungSucCode(input) {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  const match = value.match(/(?:^|[^A-Za-z0-9])([A-Za-z0-9]{10})(?![A-Za-z0-9])/);
  return match ? match[1] : null;
}

module.exports = { normalizeChungSucCode };

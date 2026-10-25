/** Common VietQR bank codes supported by the image endpoint. */
export const VIETQR_BANKS = [
  { code: 'MB', name: 'MB Bank' },
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'ICB', name: 'VietinBank' },
  { code: 'ACB', name: 'ACB' },
  { code: 'TCB', name: 'Techcombank' },
  { code: 'VPB', name: 'VPBank' },
  { code: 'STB', name: 'Sacombank' },
  { code: 'TPB', name: 'TPBank' },
  { code: 'VIB', name: 'VIB' },
  { code: 'MSB', name: 'MSB' },
  { code: 'HDB', name: 'HDBank' },
  { code: 'OCB', name: 'OCB' },
  { code: 'SHB', name: 'SHB' },
  { code: 'EIB', name: 'Eximbank' },
  { code: 'NAB', name: 'Nam A Bank' },
  { code: 'BAB', name: 'Bac A Bank' },
  { code: 'VAB', name: 'VietABank' },
  { code: 'BVB', name: 'BaoViet Bank' },
  { code: 'PGB', name: 'PGBank' },
  { code: 'PVCB', name: 'PVcomBank' },
  { code: 'NCB', name: 'NCB' },
  { code: 'SEAB', name: 'SeABank' },
  { code: 'CIMB', name: 'CIMB Việt Nam' },
];

/**
 * Build a VietQR image URL for a bank transfer.
 *
 * VietQR identifies the destination by the bank's short BIN/code and account
 * number. The amount and transfer description are query parameters so the
 * generated code always reflects the values currently shown in the modal.
 */
export function buildVietQrUrl({
  bankCode,
  accountNumber,
  amount,
  description,
  // `addInfo` is the name used by the VietQR API. Keep it as an alias so this
  // helper can also consume payment data received directly from an API.
  addInfo,
  accountName,
  template = 'compact2',
} = {}) {
  const bank = String(bankCode ?? '').trim();
  const account = String(accountNumber ?? '').trim();
  if (!bank || !account) return '';

  const path = `${encodeURIComponent(bank)}-${encodeURIComponent(account)}-${encodeURIComponent(template)}`;
  const query = [];
  const numericAmount = Number(amount);
  if (Number.isFinite(numericAmount) && numericAmount > 0) {
    query.push(`amount=${encodeURIComponent(String(Math.round(numericAmount)))}`);
  }

  const transferDescription = description ?? addInfo;
  if (transferDescription != null && String(transferDescription).trim()) {
    query.push(`addInfo=${encodeURIComponent(String(transferDescription).trim())}`);
  }
  if (accountName != null && String(accountName).trim()) {
    query.push(`accountName=${encodeURIComponent(String(accountName).trim())}`);
  }

  return `https://img.vietqr.io/image/${path}.png${query.length ? `?${query.join('&')}` : ''}`;
}


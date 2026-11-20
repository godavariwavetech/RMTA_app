// Shop details printed on invoices and job sheets, so each document carries the
// shop's own name, contact number and GST/RC number rather than RMTA's.
// `member` is the shop owner's record: useMemberProfile() gives it for both
// owner (admin) and staff logins.

const firstValue = (record, keys) => {
  if (!record) return '';
  const key = keys.find(k => record[k] !== undefined && record[k] !== null && String(record[k]).trim() !== '');
  return key ? String(record[key]).trim() : '';
};

export const GST_KEYS = ['gst_number', 'gst_no', 'gstin', 'gst', 'rc_number', 'rc_no'];

export function shopInfoFrom(member) {
  const m = member || {};
  return {
    name: firstValue(m, ['shop_name', 'business_name']),
    owner: firstValue(m, ['full_name', 'member_name']),
    mobile: firstValue(m, ['mobile', 'mobile_number', 'phone_number', 'phone']),
    address: [firstValue(m, ['address', 'shop_address']), m.city, m.state]
      .map(v => (v == null ? '' : String(v).trim()))
      .filter(Boolean)
      .join(', '),
    gst: firstValue(m, GST_KEYS),
  };
}

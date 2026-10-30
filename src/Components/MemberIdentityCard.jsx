import React from 'react';
import { Image, Linking, StyleSheet, Text, View } from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import { Colors } from '../Constants/Colors';
import { BASE_URL } from '../Constants/config';

const imageUrl = path => {
  if (!path || typeof path !== 'string') return null;
  if (/^(https?:|data:)/.test(path)) return path;
  return path.length > 300
    ? `data:image/jpeg;base64,${path}`
    : `${BASE_URL}${path.replace(/^\//, '')}`;
};

const first = (...values) =>
  values.find(v => v !== undefined && v !== null && String(v).trim() !== '');

const fmtDate = v => {
  if (!v) return '';
  const dt = new Date(v);
  return Number.isNaN(dt.getTime())
    ? String(v)
    : dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

// Member identity card (name, role, phone numbers, union id, blood group, shop,
// validity, address). Used for the logged-in member (My Digital ID) and for a
// scanned member (QR result). `member` can use either naming style: the
// login-style fields (full_name, mobile, …) or the shorter ones (name,
// phone_number, …). A row with no value is hidden.
export default function MemberIdentityCard({ member = {} }) {
  const m = member || {};
  const name = first(m.full_name, m.name);
  const shop = first(m.shop_name, m.shop);
  const designation =
    first(m.designation, m.position, m.role_name, m.member_role) ||
    (m.role ? cap(String(m.role)) : '');
  const address = first(m.address)
    ? [m.address, m.city, m.state].filter(Boolean).join(', ')
    : [m.city, m.state].filter(Boolean).join(', ');

  const rows = [
    { label: 'Name', value: name },
    { label: 'Phone Number', value: first(m.mobile, m.phone_number, m.mobile_number, m.phone), call: true },
    {
      label: 'Alternate Number',
      value: first(m.alternate_mobile, m.alternate_number, m.alternate_phone),
      call: true,
    },
    { label: 'Union ID', value: first(m.union_id, m.member_code) },
    { label: 'Blood Group', value: first(m.blood_group, m.bloodgroup) },
    { label: 'Shop Name', value: shop },
    { label: 'Valid Date', value: fmtDate(first(m.valid_until, m.valid_date)) },
    { label: 'Role', value: designation },
    { label: 'Address', value: address },
  ].filter(row => row.value !== undefined && row.value !== null && String(row.value).trim() !== '');

  const personPhoto = imageUrl(first(m.person_image, m.photo, m.profile_image));
  const shopPhoto = imageUrl(m.shop_image);
  const initials = String(name || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View>
      <View style={styles.card}>
        <View style={styles.banner}>
          {shopPhoto ? <Image source={{ uri: shopPhoto }} style={styles.bannerImage} /> : null}
        </View>
        <View style={styles.avatarWrap}>
          {personPhoto ? (
            <Image source={{ uri: personPhoto }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
        </View>

        <Text style={styles.name}>{name || '—'}</Text>
        {!!shop && <Text style={styles.shop}>{shop}</Text>}
        {!!designation && (
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>{designation}</Text>
          </View>
        )}

        <View style={styles.rows}>
          {rows.map(row => (
            <View key={row.label} style={styles.row}>
              <Text style={styles.label}>{row.label}</Text>
              {row.call ? (
                <Text
                  style={[styles.value, styles.link]}
                  onPress={() => Linking.openURL(`tel:${row.value}`)}
                >
                  {row.value}
                </Text>
              ) : (
                <Text style={styles.value}>{String(row.value)}</Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>DIGITAL MEMBER IDENTITY</Text>
        </View>
      </View>
      <Text style={styles.hint}>Tap the phone number to make a call.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    marginTop: hp('2.5%'),
    marginHorizontal: wp('1%'),
    overflow: 'hidden',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  banner: { width: '100%', height: 96, backgroundColor: Colors.primary },
  bannerImage: { width: '100%', height: '100%', resizeMode: 'cover', opacity: 0.9 },
  avatarWrap: {
    marginTop: -52,
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  avatar: { width: 98, height: 98, borderRadius: 49 },
  avatarFallback: { backgroundColor: '#E8F0FE', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 34, fontWeight: '800', color: Colors.secondary },
  name: { fontSize: 24, fontWeight: '800', color: '#172033', marginTop: 14, textAlign: 'center', paddingHorizontal: 16 },
  shop: { fontSize: 15, color: '#6B7280', marginTop: 6, textAlign: 'center', paddingHorizontal: 16 },
  rolePill: {
    backgroundColor: '#EAF2FB',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 22,
    marginTop: 14,
  },
  roleText: { fontSize: 14, fontWeight: '700', color: '#1456B8' },
  rows: { width: '100%', paddingHorizontal: 24, marginTop: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEF1F5',
  },
  label: { width: '40%', fontSize: 14, color: '#6B7280', paddingRight: 8 },
  value: { flex: 1, fontSize: 15, fontWeight: '600', color: '#172033', lineHeight: 22 },
  link: { color: '#1456B8' },
  footer: {
    width: '100%',
    marginTop: 6,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#F6F8FC',
  },
  footerText: { fontSize: 12, letterSpacing: 2.5, color: '#6B7280', fontWeight: '600' },
  hint: { textAlign: 'center', fontSize: 13, color: '#8A94A6', marginTop: 16 },
});

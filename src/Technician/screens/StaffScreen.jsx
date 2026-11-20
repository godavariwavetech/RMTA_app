import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { Colors } from '../../Constants/Colors';
import { ENDPOINTS } from '../../Constants/config';
import { getJson, postJson } from '../../redux/slices/authSlice';
import { isValidIndianMobileNumber, normalizeMobileNumber } from '../../utils/mobileValidation';
import { useFieldNav, FieldNavBar } from '../../Components/FieldNav';
import { SkeletonUserList } from '../../Components/Skeleton';
import BottomNav from '../../Components/BottomNav';

// Staff: lists the technicians added under this member and, from a button at the
// top, opens the form to add another. Tapping a staff member opens their details,
// where modules (the app menus) can be assigned.
//   list:    POST /public_app/gettechniciansdata         { member_id }
//   add:     POST /public_app/createtechniciansdata      { member_id, tech_name, mobile_number, aadhar_number, password }
//   menus:   GET  /public_app/geappmenu                  -> { data: [{ id, menu_name, d_in }] }
//   assign:  POST /public_app/posttechinicianspermissions { member_id, tech_id, menu_id: [ids] }
//            (one call; menu_id is the complete list the staff member should have)
//   saved:   POST /public_app/gettechicianspeermissionsdata { member_id, tech_id }
//            -> { data: [{ id, tech_name, ..., menu_ids: [3, 4, 2] }] }  (rows for every staff
//            member of the member, so the one with the matching id is picked out)
// The modules a staff member already has are filled in when the details open.

// menu_ids may arrive as an array, a JSON string or a comma-separated string.
const toIdList = value => {
  let list = value;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch (e) {
      list = list.split(',');
    }
  }
  if (!Array.isArray(list)) return [];
  return list.map(Number).filter(n => !Number.isNaN(n));
};
export default function StaffScreen({ onNavigate }) {
  const handleNavigation = screen => {
    if (onNavigate) onNavigate(screen);
  };
  const nav = useFieldNav();
  const user = useSelector(state => state.auth?.user) || {};
  const [mode, setMode] = useState('list'); // 'list' | 'form' | 'detail'

  // Staff details + module assignment.
  const [selected, setSelected] = useState(null);
  const [menus, setMenus] = useState([]);
  const [menusLoading, setMenusLoading] = useState(false);
  const [menusError, setMenusError] = useState('');
  const [assigned, setAssigned] = useState([]); // menu ids the server has
  const [selection, setSelection] = useState([]); // menu ids ticked on screen
  const [savingMenus, setSavingMenus] = useState(false);

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tried, setTried] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadStaff = useCallback(async () => {
    if (!user.member_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { response, data } = await postJson(ENDPOINTS.GET_TECHNICIANS_DATA, {
        member_id: user.member_id,
      });
      const rows = Array.isArray(data) ? data : data && data.data;
      if (!response.ok || !Array.isArray(rows)) {
        setError((data && (data.message || data.msg)) || 'Could not load staff. Pull down to retry.');
      } else {
        setStaff(rows.filter(r => r && !Number(r.d_in)));
      }
    } catch (e) {
      setError('Could not load staff. Pull down to retry.');
    }
    setLoading(false);
  }, [user.member_id]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const loadMenus = useCallback(async () => {
    setMenusLoading(true);
    setMenusError('');
    try {
      const { response, data } = await getJson(ENDPOINTS.GET_APP_MENU);
      const rows = Array.isArray(data) ? data : data && data.data;
      if (!response.ok || !Array.isArray(rows)) {
        setMenusError('Could not load the modules. Tap to retry.');
      } else {
        setMenus(rows.filter(r => r && !Number(r.d_in)));
      }
    } catch (e) {
      setMenusError('Could not load the modules. Tap to retry.');
    }
    setMenusLoading(false);
  }, []);

  // Modules this staff member already has, from the server.
  const loadAssigned = useCallback(
    async member => {
      try {
        const { response, data } = await postJson(ENDPOINTS.GET_TECHNICIAN_PERMISSIONS, {
          member_id: user.member_id,
          tech_id: member.id,
        });
        const rows = Array.isArray(data) ? data : data && data.data;
        if (!response.ok || !Array.isArray(rows)) return;
        const row = rows.find(r => r && String(r.id) === String(member.id));
        const list = row ? toIdList(row.menu_ids) : [];
        setAssigned(list);
        setSelection(list); // tick what the server has; the user can then change it
        return list;
      } catch (e) {
        // leave nothing pre-filled if the lookup fails
      }
      return null;
    },
    [user.member_id],
  );

  const openDetail = member => {
    setSelected(member);
    setSelection([]);
    setAssigned([]);
    setMode('detail');
    loadMenus();
    loadAssigned(member);
  };

  const togglePick = id => {
    setSelection(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const sameSet = (a, b) => a.length === b.length && a.every(x => b.includes(x));

  const handleSaveMenus = async () => {
    if (!selected || savingMenus) return;
    setSavingMenus(true);
    try {
      const { response, data } = await postJson(ENDPOINTS.POST_TECHNICIAN_PERMISSIONS, {
        member_id: user.member_id,
        tech_id: selected.id,
        menu_id: selection,
      });
      setSavingMenus(false);
      if (!response.ok || (data && data.success === false)) {
        Alert.alert(
          'Could not assign modules',
          (data && (data.message || data.msg)) || 'Please try again.',
        );
        return;
      }
      const wanted = selection;
      // Show exactly what the server holds now.
      const saved = await loadAssigned(selected);
      if (saved && !sameSet(saved, wanted)) {
        Alert.alert(
          'Not fully saved',
          'The server did not apply every change (for example, removed modules may still be assigned). The list now shows what is saved.',
        );
      } else {
        Alert.alert('Modules updated', `${selected.tech_name || 'Staff member'}'s modules were saved.`);
      }
    } catch (err) {
      setSavingMenus(false);
      Alert.alert('Could not assign modules', err.message);
    }
  };

  // Delete a staff member: POST /public_app/deletetechenician { member_id, mobile_number, tech_id }
  const [deletingId, setDeletingId] = useState(null);
  const deleteStaff = async member => {
    setDeletingId(member.id);
    try {
      const { response, data } = await postJson(ENDPOINTS.DELETE_TECHNICIAN, {
        member_id: user.member_id,
        mobile_number: member.mobile_number,
        tech_id: member.id,
      });
      setDeletingId(null);
      if (!response.ok || (data && data.success === false)) {
        Alert.alert(
          'Could not delete staff',
          (data && (data.message || data.msg)) || 'Please try again.',
        );
        return;
      }
      setStaff(prev => prev.filter(s => String(s.id) !== String(member.id)));
      loadStaff();
      Alert.alert('Staff deleted', `${member.tech_name || 'Staff member'} has been removed.`);
    } catch (err) {
      setDeletingId(null);
      Alert.alert('Could not delete staff', err.message);
    }
  };

  const confirmDelete = member => {
    if (deletingId) return;
    Alert.alert(
      'Delete staff',
      `Remove ${member.tech_name || 'this staff member'} from your staff? They will no longer be able to log in.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteStaff(member) },
      ],
    );
  };

  const openForm = () => {
    setName('');
    setMobile('');
    setAadhaar('');
    setPassword('');
    setShowPassword(false);
    setTried(false);
    setMode('form');
  };

  const handleBack = () => {
    if (mode === 'form' || mode === 'detail') {
      setMode('list');
    } else {
      onNavigate('goBack');
    }
  };

  // The screen stack only knows about the "staff" entry, not this in-screen
  // mode, so the Android back gesture would otherwise skip straight past the
  // list and exit the screen while adding/viewing a staff member.
  useEffect(() => {
    if (mode === 'list') return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setMode('list');
      return true;
    });
    return () => subscription.remove();
  }, [mode]);

  const handleSave = async () => {
    setTried(true);
    if (submitting) return;
    if (!name.trim() || !mobile.trim() || !password) {
      Alert.alert('Missing details', 'Please enter the staff name, mobile number and password.');
      return;
    }
    if (!/^[a-zA-Z\s.]+$/.test(name.trim())) {
      Alert.alert('Invalid name', 'Name should only contain letters.');
      return;
    }
    const mobileDigits = normalizeMobileNumber(mobile);
    if (!isValidIndianMobileNumber(mobileDigits)) {
      Alert.alert('Invalid mobile number', 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    const aadhaarDigits = aadhaar.replace(/\D/g, '');
    if (aadhaarDigits && aadhaarDigits.length !== 12) {
      Alert.alert('Invalid Aadhaar number', 'Please enter a valid 12-digit Aadhaar number.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const { response, data } = await postJson(ENDPOINTS.CREATE_TECHNICIANS_DATA, {
        member_id: user.member_id,
        tech_name: name.trim(),
        mobile_number: mobileDigits,
        aadhar_number: aadhaarDigits,
        password,
      });
      setSubmitting(false);
      if (!response.ok || (data && data.success === false)) {
        Alert.alert(
          'Could not add staff',
          (data && (data.message || data.msg)) || 'Please try again.',
        );
        return;
      }
      const added = name.trim();
      setMode('list');
      loadStaff();
      Alert.alert('Staff added', `${added} has been added to your staff.`);
    } catch (err) {
      setSubmitting(false);
      Alert.alert('Could not add staff', err.message);
    }
  };

  const renderForm = () => (
    <>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Add staff</Text>
        <Text style={styles.subheading}>Add a technician who works with you.</Text>

        <Text style={styles.label}>
          Name {/* <Text style={styles.required}>*</Text> */}
        </Text>
        <TextInput
          {...nav.props(0)}
          style={[styles.input, tried && !name.trim() && styles.inputError]}
          value={name}
          onChangeText={text => setName(text.replace(/[^a-zA-Z\s.]/g, ''))}
          placeholder="Enter staff name"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="words"
        />

        <Text style={styles.label}>
          Mobile number {/* <Text style={styles.required}>*</Text> */}
        </Text>
        <TextInput
          {...nav.props(1)}
          style={[styles.input, tried && !mobile.trim() && styles.inputError]}
          value={mobile}
          onChangeText={text => setMobile(normalizeMobileNumber(text))}
          placeholder="Enter mobile number"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          maxLength={10}
        />

        <Text style={styles.label}>Aadhaar number</Text>
        <TextInput
          {...nav.props(2)}
          style={styles.input}
          value={aadhaar}
          onChangeText={text => setAadhaar(text.replace(/\D/g, ''))}
          placeholder="Optional"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          maxLength={12}
        />

        <Text style={styles.label}>
          Password {/* <Text style={styles.required}>*</Text> */}
        </Text>
        <View style={[styles.passwordRow, tried && !password && styles.inputError]}>
          <TextInput
            {...nav.props(3)}
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            placeholder="Minimum 6 characters"
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={8}>
            <Text style={styles.passwordToggle}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveText}>Add staff</Text>
          )}
        </TouchableOpacity>
      </View>
      <FieldNavBar nav={nav} />
    </>
  );

  const renderDetail = () => {
    const aadhaar = String(selected?.aadhar_number || '');
    return (
      <>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.detailCard}>
            <View style={[styles.avatar, styles.avatarLarge]}>
              <Text style={[styles.avatarText, styles.avatarTextLarge]}>
                {String(selected?.tech_name || '#').trim().charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.detailName}>{selected?.tech_name || 'Unnamed'}</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mobile</Text>
              <Text style={styles.detailValue}>{selected?.mobile_number || '—'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Aadhaar</Text>
              <Text style={styles.detailValue}>
                {aadhaar ? `•••• •••• ${aadhaar.slice(-4)}` : '—'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Added on</Text>
              <Text style={styles.detailValue}>{String(selected?.i_ts || '—').slice(0, 10)}</Text>
            </View>
          </View>

          <Text style={styles.heading}>Assign modules</Text>
          <Text style={styles.subheading}>
            The modules already assigned are ticked. Tap a module to tick or untick it, then save.
          </Text>

          {menusLoading ? (
            <ActivityIndicator style={styles.menuLoader} color={Colors.secondary} />
          ) : menusError ? (
            <TouchableOpacity onPress={loadMenus}>
              <Text style={styles.empty}>{menusError}</Text>
            </TouchableOpacity>
          ) : (
            menus.map(menu => {
              const on = selection.includes(menu.id);
              return (
                <TouchableOpacity
                  key={menu.id}
                  style={[styles.menuRow, on && styles.menuRowOn]}
                  onPress={() => togglePick(menu.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkBox, on && styles.checkBoxOn]}>
                    {on && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                  <Text style={[styles.menuName, on && styles.menuNameOn]}>{menu.menu_name}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveMenus}
            disabled={savingMenus}
          >
            {savingMenus ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveText}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </>
    );
  };

  const renderList = () => (
    <>
      <View style={styles.listTop}>
        <Text style={styles.listCount}>
          {staff.length} {staff.length === 1 ? 'staff member' : 'staff members'}
        </Text>
        <TouchableOpacity style={styles.addButton} onPress={openForm} activeOpacity={0.85}>
          <Text style={styles.addButtonText}>+ Add staff</Text>
        </TouchableOpacity>
      </View>

      {loading && !staff.length ? (
        <SkeletonUserList />
      ) : (
        <FlatList
          data={staff}
          keyExtractor={(item, index) => String(item.id ?? index)}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={loadStaff}
          ListEmptyComponent={
            <Text style={styles.empty}>{error || 'No staff added yet. Tap "+ Add staff" to add one.'}</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => openDetail(item)} activeOpacity={0.8}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {String(item.tech_name || '#').trim().charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.rowText}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.tech_name || 'Unnamed'}
                </Text>
                {!!item.mobile_number && <Text style={styles.mobile}>{item.mobile_number}</Text>}
              </View>
              {!!item.i_ts && <Text style={styles.added}>{String(item.i_ts).slice(0, 10)}</Text>}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => confirmDelete(item)}
                disabled={!!deletingId}
                hitSlop={8}
              >
                {String(deletingId) === String(item.id) ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <Text style={styles.deleteText}>Delete</Text>
                )}
              </TouchableOpacity>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </>
  );

  return (
    <>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.back}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {mode === 'form' ? 'Add staff' : mode === 'detail' ? 'Staff details' : 'Staff'}
          </Text>
        </View>
        {mode === 'form' ? renderForm() : mode === 'detail' ? renderDetail() : renderList()}
        {mode === 'list' && <BottomNav selectedItem="staff" onNavigate={handleNavigation} />}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#FFFFFF', fontSize: 30, lineHeight: 34, includeFontPadding: false },
  title: { flex: 1, color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginLeft: 6 },

  listTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  listCount: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  addButton: {
    backgroundColor: '#2F5DDC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  list: { padding: 14, paddingBottom: 130, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8ECF3',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: Colors.secondary },
  rowText: { flex: 1, marginHorizontal: 12 },
  name: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  mobile: { fontSize: 12, color: '#64748B', marginTop: 2 },
  added: { fontSize: 11, color: '#94A3B8' },
  chevron: { fontSize: 22, color: '#CBD5E1', marginLeft: 8 },
  deleteButton: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    minWidth: 56,
    alignItems: 'center',
  },
  deleteText: { color: '#DC2626', fontSize: 12, fontWeight: '700' },

  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8ECF3',
    padding: 16,
    marginBottom: 20,
  },
  avatarLarge: { width: 64, height: 64, borderRadius: 32, alignSelf: 'center' },
  avatarTextLarge: { fontSize: 26 },
  detailName: { textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#1F2937', marginVertical: 10 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  detailLabel: { fontSize: 13, color: '#9CA3AF' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#1F2937' },

  menuLoader: { marginTop: 30 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  menuRowOn: { borderColor: '#16A34A', backgroundColor: '#F0FDF4' },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkBoxOn: { borderColor: '#16A34A', backgroundColor: '#16A34A' },
  checkMark: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', lineHeight: 18 },
  menuName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#374151' },
  menuNameOn: { color: '#15803D' },
  empty: { textAlign: 'center', color: '#94A3B8', marginTop: 40, fontSize: 13, paddingHorizontal: 20 },

  content: { padding: 20 },
  heading: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  subheading: { fontSize: 13, color: '#9CA3AF', marginTop: 4, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 6 },
  required: { color: '#EF4444' },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#1F2937',
  },
  inputError: { borderColor: '#EF4444' },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
  },
  passwordInput: { flex: 1, paddingVertical: 13, fontSize: 15, color: '#1F2937' },
  passwordToggle: { fontSize: 13, fontWeight: '700', color: '#2F5DDC', paddingLeft: 10 },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#2F5DDC',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: { backgroundColor: '#9CA3AF' },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

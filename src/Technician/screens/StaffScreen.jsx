import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { postJson } from '../../redux/slices/authSlice';
import { isValidIndianMobileNumber, normalizeMobileNumber } from '../../utils/mobileValidation';
import { useFieldNav, FieldNavBar } from '../../Components/FieldNav';

// Staff: adds a technician under this member.
// POST /public_app/createtechniciansdata { member_id, tech_name, mobile_number, aadhar_number }
export default function StaffScreen({ onNavigate }) {
  const nav = useFieldNav();
  const user = useSelector(state => state.auth?.user) || {};
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [tried, setTried] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    setTried(true);
    if (submitting) return;
    if (!name.trim() || !mobile.trim()) {
      Alert.alert('Missing details', 'Please enter the staff name and mobile number.');
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

    setSubmitting(true);
    try {
      const { response, data } = await postJson(ENDPOINTS.CREATE_TECHNICIANS_DATA, {
        member_id: user.member_id,
        tech_name: name.trim(),
        mobile_number: mobileDigits,
        aadhar_number: aadhaarDigits,
      });
      setSubmitting(false);
      if (!response.ok || (data && data.success === false)) {
        Alert.alert(
          'Could not add staff',
          (data && (data.message || data.msg)) || 'Please try again.',
        );
        return;
      }
      setName('');
      setMobile('');
      setAadhaar('');
      setTried(false);
      Alert.alert('Staff added', `${name.trim()} has been added to your staff.`);
    } catch (err) {
      setSubmitting(false);
      Alert.alert('Could not add staff', err.message);
    }
  };

  return (
    <>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => onNavigate('goBack')} style={styles.back}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Staff</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Add staff</Text>
          <Text style={styles.subheading}>Add a technician who works with you.</Text>

          <Text style={styles.label}>
            Name <Text style={styles.required}>*</Text>
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
            Mobile number <Text style={styles.required}>*</Text>
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
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

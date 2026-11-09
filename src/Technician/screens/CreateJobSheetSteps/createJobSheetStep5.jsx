import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  Modal,
  PanResponder,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../../utils/responsive';
import { useDispatch, useSelector } from 'react-redux';

import { Colors } from '../../../Constants/Colors';
import { updateJobDraft } from '../../../redux/slices/jobSheetSlice';
import StepNav from '../../../Components/StepNav';

// 3x3 pattern-lock geometry (fixed size so we can compute dot centres without
// measuring layout). Index layout: 0 1 2 / 3 4 5 / 6 7 8.
const GRID = 280;
const CELL = GRID / 3;
const HIT_RADIUS = 30;
const dotCenter = i => ({
  x: (i % 3) * CELL + CELL / 2,
  y: Math.floor(i / 3) * CELL + CELL / 2,
});

const LOCK_OPTIONS = [
  { id: 'none', title: 'No lock', subtitle: 'Device opens without a secret' },
  { id: 'password', title: 'Password', subtitle: "Enter the device's password / PIN" },
  { id: 'pattern', title: 'Pattern', subtitle: 'Draw the unlock pattern' },
  { id: 'unknown', title: 'Unknown', subtitle: "Customer's unlock method is unknown" },
];

export default function CreateJobSheetStep5({ onNavigate }) {
  const [tried, setTried] = useState(false);
  const dispatch = useDispatch();
  // Pre-fill from the saved draft so navigating back keeps what was entered.
  const draftAccess = useSelector(state => state.jobSheet.draft.access) || {};
  const initialLockType = draftAccess.lock_type || 'none';
  const initialPattern =
    initialLockType === 'pattern' && draftAccess.unlock_value
      ? draftAccess.unlock_value.split('-').map(Number).filter(n => !Number.isNaN(n))
      : [];

  const [lockType, setLockType] = useState(initialLockType);
  const [devicePassword, setDevicePassword] = useState(
    initialLockType === 'password' ? draftAccess.unlock_value || '' : '',
  );
  const [pattern, setPattern] = useState(initialPattern);
  const [patternModalVisible, setPatternModalVisible] = useState(false);

  // Keep the live pattern in a ref so the PanResponder callbacks aren't stale.
  const patternRef = useRef(initialPattern);

  const addDotAt = (x, y) => {
    for (let i = 0; i < 9; i++) {
      if (patternRef.current.indexOf(i) !== -1) continue;
      const c = dotCenter(i);
      if (Math.hypot(x - c.x, y - c.y) <= HIT_RADIUS) {
        patternRef.current = [...patternRef.current, i];
        setPattern(patternRef.current);
        break;
      }
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: evt => {
        patternRef.current = [];
        setPattern([]);
        const { locationX, locationY } = evt.nativeEvent;
        addDotAt(locationX, locationY);
      },
      onPanResponderMove: evt => {
        const { locationX, locationY } = evt.nativeEvent;
        addDotAt(locationX, locationY);
      },
    }),
  ).current;

  const clearPattern = () => {
    patternRef.current = [];
    setPattern([]);
  };

  const buildAccess = () => {
    let unlockValue = '';
    if (lockType === 'password') {
      unlockValue = devicePassword;
    } else if (lockType === 'pattern') {
      unlockValue = pattern.join('-');
    } else if (lockType === 'unknown') {
      unlockValue = 'Unknown';
    }

    return {
      lock_type: lockType,
      mode:
        lockType === 'password' || lockType === 'pattern'
          ? 'temporary_pin'
          : 'customer_unlocks',
      unlock_value: unlockValue,
    };
  };

  const handleBackPress = () => {
    // Persist current edits so they're kept when navigating back.
    dispatch(updateJobDraft({ access: buildAccess() }));
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const handleContinue = () => {
    setTried(true);
    const access = buildAccess();
    dispatch(updateJobDraft({ access }));
    console.log('[JobSheet][Step5] access captured →', access);
    if (onNavigate) {
      onNavigate('createJobSheetStep7');
    }
  };

  // Line segments between consecutive selected dots (drawn as rotated views).
  const renderPatternLines = () =>
    pattern.slice(1).map((dot, idx) => {
      const a = dotCenter(pattern[idx]);
      const b = dotCenter(dot);
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      return (
        <View
          key={`line-${idx}`}
          style={{
            position: 'absolute',
            left: midX - length / 2,
            top: midY - 1.5,
            width: length,
            height: 3,
            backgroundColor: '#2F5DDC',
            borderRadius: 2,
            transform: [{ rotate: `${angle}deg` }],
          }}
        />
      );
    });

  return (
    <>
      <StatusBar
        backgroundColor={Colors.primary}
        barStyle="light-content"
        translucent={true}
      />
      <SafeAreaView style={styles.container}>
        {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Device Security</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>STEP 5 OF 7 · SECURITY</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '71.43%' }]} />
          </View>

          {/* Content Section */}
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Device lock</Text>
            <Text style={styles.sectionDescription}>
              How does the customer's device unlock?
            </Text>

            {/* Lock type options */}
            <View style={styles.optionsList}>
              {LOCK_OPTIONS.map(option => {
                const selected = lockType === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.optionRow, selected && styles.optionRowSelected]}
                    onPress={() => setLockType(option.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.radioOuter}>
                      {selected && <View style={styles.radioInner} />}
                    </View>
                    <View style={styles.optionTextWrap}>
                      <Text style={styles.optionTitle}>{option.title}</Text>
                      <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Password input — only for the Password option */}
            {lockType === 'password' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Device password / PIN {/* <Text style={styles.required}>*</Text> */}</Text>
                <TextInput
                  style={[styles.input, tried && !String(devicePassword).trim() && styles.inputError]}
                  placeholder="Enter the device password"
                  placeholderTextColor="#D1D5DB"
                  value={devicePassword}
                  onChangeText={setDevicePassword}
                  secureTextEntry
                />
              </View>
            )}

            {/* Pattern entry — only for the Pattern option */}
            {lockType === 'pattern' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Unlock pattern {/* <Text style={styles.required}>*</Text> */}</Text>
                <TouchableOpacity
                  style={styles.patternOpenButton}
                  onPress={() => setPatternModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.patternOpenText}>
                    {pattern.length > 0
                      ? `Pattern set (${pattern.length} dots) · Tap to change`
                      : 'Tap to draw the pattern'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Security Notice */}
            <View style={styles.noticeContainer}>
              <Image
                source={require('../../../Assets/icons/lockIcon.png')}
                style={styles.noticeIcon}
              />
              <Text style={styles.noticeText}>
                Record unlock details only with customer consent, and remove them
                after handover.
              </Text>
            </View>

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <StepNav onPrev={handleBackPress}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Next</Text>
          </TouchableOpacity>
          </StepNav>
        </View>

        {/* Pattern lock modal */}
        <Modal
          visible={patternModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPatternModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Draw unlock pattern</Text>
              <Text style={styles.modalSubtitle}>
                Connect the dots the same way the customer unlocks the phone.
              </Text>

              <View
                style={styles.patternGrid}
                {...panResponder.panHandlers}
              >
                {renderPatternLines()}
                {Array.from({ length: 9 }).map((_, i) => {
                  const c = dotCenter(i);
                  const order = pattern.indexOf(i);
                  const active = order !== -1;
                  return (
                    <View
                      key={`dot-${i}`}
                      style={[
                        styles.patternDot,
                        { left: c.x - 18, top: c.y - 18 },
                        active && styles.patternDotActive,
                      ]}
                      pointerEvents="none"
                    >
                      {active && <Text style={styles.patternDotOrder}>{order + 1}</Text>}
                    </View>
                  );
                })}
              </View>

              <Text style={styles.patternValue}>
                {pattern.length > 0 ? pattern.join(' → ') : 'No pattern yet'}
              </Text>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalClearButton]}
                  onPress={clearPattern}
                >
                  <Text style={styles.modalClearText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalSaveButton]}
                  onPress={() => setPatternModalVisible(false)}
                >
                  <Text style={styles.modalSaveText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  required: {
    color: '#EF4444',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    flexDirection: 'column',
  },
  header: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp('4%'),
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9e9e9ff',
    borderRadius: wp('4%'),
  },
  backButtonText: {
    fontSize: wp('10%'),
    color: Colors.primary,
    fontWeight: '300',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  placeholderButton: {
    width: 44,
  },
  stepIndicator: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2F5DDC',
    letterSpacing: 0.5,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: wp('5%'),
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: hp('2%'),
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2F5DDC',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  optionsList: {
    gap: 12,
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionRowSelected: {
    borderColor: '#2F5DDC',
    backgroundColor: '#F5F8FF',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2F5DDC',
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  patternOpenButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#2F5DDC',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  patternOpenText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2F5DDC',
  },
  noticeContainer: {
    backgroundColor: '#EAF1FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 4,
  },
  noticeIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginTop: 2,
  },
  noticeText: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 24,
  },
  buttonContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  continueButton: {
    backgroundColor: '#2F5DDC',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* Pattern modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('6%'),
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  patternGrid: {
    width: GRID,
    height: GRID,
    position: 'relative',
  },
  patternDot: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patternDotActive: {
    borderColor: '#2F5DDC',
    backgroundColor: '#2F5DDC',
  },
  patternDotOrder: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  patternValue: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 16,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClearButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalClearText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalSaveButton: {
    backgroundColor: '#2F5DDC',
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

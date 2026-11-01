import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
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
import DatePickerModal, { formatDisplayDate } from '../../../Components/DatePickerModal';
import { sanitizeAmount, useFieldNav, FieldNavBar } from '../../../Components/FieldNav';
import StepNav from '../../../Components/StepNav';

export default function CreateJobSheetStep4({ onNavigate }) {
  const nav = useFieldNav();
  const [tried, setTried] = useState(false);
  const dispatch = useDispatch();
  // Pre-fill from the saved draft so navigating back keeps what was entered.
  const draftRepair = useSelector(state => state.jobSheet.draft.repair) || {};
  // Several categories can be picked (e.g. Display + Battery). Restored from the draft;
  // older drafts only have a single `category` string.
  const [selectedCategories, setSelectedCategories] = useState(() => {
    if (Array.isArray(draftRepair.categories)) return draftRepair.categories;
    return draftRepair.category ? String(draftRepair.category).split(',').map(c => c.trim()).filter(Boolean) : [];
  });
  const toggleCategory = category =>
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category],
    );
  const [problemDescription, setProblemDescription] = useState(
    draftRepair.problem_description || '',
  );
  const [estimatedCost, setEstimatedCost] = useState(draftRepair.estimated_cost || '');
  // Stored as "YYYY-MM-DD".
  const [estimatedDelivery, setEstimatedDelivery] = useState(
    draftRepair.estimated_delivery_text || '',
  );
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const buildRepair = () => ({
    // create_job_sheets takes repair_category as one string: "Display, Battery".
    category: selectedCategories.join(', '),
    categories: selectedCategories,
    problem_description: problemDescription,
    estimated_cost: estimatedCost,
    // estimated_delivery stays null (free-text isn't a parseable datetime for
    // the backend); keep the raw text separately so this step can restore it.
    estimated_delivery: null,
    estimated_delivery_text: estimatedDelivery,
  });

  const handleBackPress = () => {
    // Persist current edits so they're kept when navigating back.
    dispatch(updateJobDraft({ repair: buildRepair() }));
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const handleContinue = () => {
    setTried(true);
    // All fields are required before moving on.
    if (
      selectedCategories.length === 0 ||
      !problemDescription.trim() ||
      !estimatedCost.trim() ||
      !estimatedDelivery.trim()
    ) {
      Alert.alert(
        'Incomplete',
        'Please select a repair category and fill in the problem description, estimated cost and delivery.',
      );
      return;
    }
    const repair = buildRepair();
    dispatch(updateJobDraft({ repair }));
    console.log('[JobSheet][Step4] repair captured →', repair);
    if (onNavigate) {
      onNavigate('createJobSheetStep5');
    }
  };

  const repairCategories = ['Display', 'Battery', 'Charging', 'Software', 'Camera', 'Other'];

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
            <Text style={styles.headerTitle}>Repair Details</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>STEP 4 OF 7 · REPAIR</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '57.14%' }]} />
          </View>

          {/* Content Section */}
          <View style={styles.content}>
            {/* Title */}
            <Text style={styles.sectionTitle}>What needs fixing?</Text>

            {/* Repair Category */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Repair Category <Text style={styles.required}>*</Text></Text>
              <Text style={styles.multiHint}>Select all that apply</Text>
              <View style={styles.categoryContainer}>
                {repairCategories.map((category) => {
                  const on = selectedCategories.includes(category);
                  return (
                    <TouchableOpacity
                      key={category}
                      style={[styles.categoryButton, on && styles.categoryButtonSelected]}
                      onPress={() => toggleCategory(category)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.categoryText, on && styles.categoryTextSelected]}>
                        {on ? '✓  ' : ''}
                        {category}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Problem Description */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Problem Description <Text style={styles.required}>*</Text></Text>
              <TextInput {...nav.props(0)}
                style={[styles.input, styles.descriptionInput, tried && !String(problemDescription).trim() && styles.inputError]}
                placeholder="Describe the problem"
                placeholderTextColor="#D1D5DB"
                value={problemDescription}
                onChangeText={setProblemDescription}
                multiline={true}
                numberOfLines={4}
              />
            </View>

            {/* Estimated Repair Cost */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Estimated Repair Cost <Text style={styles.required}>*</Text></Text>
              <TextInput {...nav.props(1)}
                style={[styles.input, tried && !String(estimatedCost).trim() && styles.inputError]}
                placeholder="Enter estimated cost"
                placeholderTextColor="#D1D5DB"
                value={estimatedCost}
                onChangeText={t => setEstimatedCost(sanitizeAmount(t))}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Estimated Delivery */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Estimated Delivery <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={[styles.input, styles.dateInput]}
                activeOpacity={0.7}
                onPress={() => setDatePickerVisible(true)}
              >
                <Text
                  style={[
                    styles.dateInputText,
                    !estimatedDelivery && styles.dateInputPlaceholder,
                  ]}
                >
                  {formatDisplayDate(estimatedDelivery) || 'Select delivery date'}
                </Text>
              </TouchableOpacity>
              <DatePickerModal
                visible={datePickerVisible}
                value={estimatedDelivery}
                onConfirm={date => {
                  setEstimatedDelivery(date);
                  setDatePickerVisible(false);
                }}
                onClose={() => setDatePickerVisible(false)}
              />
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
      <FieldNavBar nav={nav} />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  multiHint: { fontSize: 12, color: '#9CA3AF', marginTop: -2, marginBottom: 8 },
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
    // backgroundColor: '#FFFFFF',
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
    paddingVertical: wp('0%'),
    padding: 8,
    // width: 44,
    // height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9e9e9ff',
    borderRadius: wp('4%')
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
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: wp('3%'),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryButtonSelected: {
    backgroundColor: '#2F5DDC',
    borderColor: '#2F5DDC',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },
  dateInput: {
    justifyContent: 'center',
  },
  dateInputText: {
    fontSize: 14,
    color: '#1F2937',
  },
  dateInputPlaceholder: {
    color: '#D1D5DB',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  descriptionInput: {
    paddingVertical: 12,
    textAlignVertical: 'top',
    minHeight: 100,
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
});

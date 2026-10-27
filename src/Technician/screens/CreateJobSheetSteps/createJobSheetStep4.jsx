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
} from 'react-native-responsive-screen';
import { useDispatch, useSelector } from 'react-redux';

import { Colors } from '../../../Constants/Colors';
import { updateJobDraft } from '../../../redux/slices/jobSheetSlice';

export default function CreateJobSheetStep4({ onNavigate }) {
  const dispatch = useDispatch();
  // Pre-fill from the saved draft so navigating back keeps what was entered.
  const draftRepair = useSelector(state => state.jobSheet.draft.repair) || {};
  const [selectedCategory, setSelectedCategory] = useState(draftRepair.category || '');
  const [problemDescription, setProblemDescription] = useState(
    draftRepair.problem_description || '',
  );
  const [estimatedCost, setEstimatedCost] = useState(draftRepair.estimated_cost || '');
  const [estimatedDelivery, setEstimatedDelivery] = useState(
    draftRepair.estimated_delivery_text || '',
  );

  const buildRepair = () => ({
    category: selectedCategory,
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
    // All fields are required before moving on.
    if (
      !selectedCategory ||
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
            <Text style={styles.stepText}>STEP 4 OF 8 · REPAIR</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '50%' }]} />
          </View>

          {/* Content Section */}
          <View style={styles.content}>
            {/* Title */}
            <Text style={styles.sectionTitle}>What needs fixing?</Text>

            {/* Repair Category */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Repair Category</Text>
              <View style={styles.categoryContainer}>
                {repairCategories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category && styles.categoryButtonSelected,
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        selectedCategory === category && styles.categoryTextSelected,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Problem Description */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Problem Description</Text>
              <TextInput
                style={[styles.input, styles.descriptionInput]}
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
              <Text style={styles.label}>Estimated Repair Cost</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter estimated cost"
                placeholderTextColor="#D1D5DB"
                value={estimatedCost}
                onChangeText={setEstimatedCost}
              />
            </View>

            {/* Estimated Delivery */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Estimated Delivery</Text>
              <TextInput
                style={styles.input}
                placeholder="Select delivery date and time"
                placeholderTextColor="#D1D5DB"
                value={estimatedDelivery}
                onChangeText={setEstimatedDelivery}
              />
            </View>

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
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

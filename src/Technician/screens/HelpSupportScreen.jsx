import React, { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../utils/responsive';
import { Colors } from '../../Constants/Colors';
import { useI18n } from '../../i18n';

export default function HelpSupportScreen({ onNavigate }) {
  const { t } = useI18n();
  const [problem, setProblem] = useState('');
  const [submittedProblems, setSubmittedProblems] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const submitProblem = () => {
    const description = problem.trim();
    if (!description) return;
    setSubmittedProblems(current => [...current, description]);
    setProblem('');
    setIsFormVisible(false);
  };

  return (
    <>
      <StatusBar
        backgroundColor={Colors.primary}
        barStyle="light-content"
        translucent={true}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => onNavigate && onNavigate('goBack')}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('helpSupport')}</Text>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => setIsFormVisible(current => !current)}
            accessibilityRole="button"
            accessibilityLabel={isFormVisible ? 'Cancel report' : 'Report a problem'}
          >
            <Text style={styles.headerActionText}>
              {isFormVisible ? 'Cancel' : '+ Report'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isFormVisible ? (
            <>
              <Text style={styles.description}>
                Tell us about the problem you are facing.
              </Text>
              <View style={styles.formCard}>
                <Text style={styles.fieldLabel}>Problem description</Text>
                <TextInput
                  value={problem}
                  onChangeText={setProblem}
                  placeholder="Describe your problem..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                  style={styles.problemInput}
                  accessibilityLabel="Problem description"
                />
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    !problem.trim() && styles.submitButtonDisabled,
                  ]}
                  onPress={submitProblem}
                  disabled={!problem.trim()}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : submittedProblems.length > 0 ? (
            <View style={styles.submissionsSection}>
              <Text style={styles.sectionTitle}>Submitted problems</Text>
              {submittedProblems.map((description, index) => (
                <View key={`${index}-${description}`} style={styles.submittedCard}>
                  <View style={styles.submittedHeader}>
                    <Text style={styles.submittedLabel}>Problem report</Text>
                    <Text style={styles.submittedStatus}>Submitted</Text>
                  </View>
                  <Text style={styles.submittedDescription}>{description}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No problems submitted</Text>
              <Text style={styles.emptyDescription}>
                Tap “+ Report” to tell us about an issue.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  header: {
    minHeight: hp('7%'),
    paddingHorizontal: wp('4%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
  },
  backButton: {
    width: wp('10%'),
    height: hp('5%'),
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: wp('10%'),
    lineHeight: hp('5%'),
  },
  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: wp('5%'),
    fontWeight: '700',
    textAlign: 'center',
  },
  headerAction: {
    minWidth: wp('18%'),
    minHeight: hp('5%'),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('2%'),
  },
  headerActionText: {
    color: '#FFFFFF',
    fontSize: wp('3.5%'),
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: wp('5%'),
    paddingTop: hp('3%'),
    paddingBottom: hp('3%'),
  },
  description: {
    color: '#4B5563',
    fontSize: wp('4%'),
    marginBottom: hp('2%'),
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: wp('4%'),
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  fieldLabel: {
    color: '#1F2937',
    fontSize: wp('4%'),
    fontWeight: '700',
    marginBottom: hp('1%'),
  },
  problemInput: {
    minHeight: hp('18%'),
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1.2%'),
    color: '#1F2937',
    fontSize: wp('3.8%'),
  },
  submitButton: {
    marginTop: hp('2%'),
    minHeight: hp('6%'),
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: wp('4%'),
    fontWeight: '700',
  },
  submissionsSection: {
    marginTop: hp('3%'),
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: wp('5%'),
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  emptyTitle: {
    color: '#1F2937',
    fontSize: wp('4%'),
    fontWeight: '700',
    marginBottom: hp('0.8%'),
  },
  emptyDescription: {
    color: '#6B7280',
    fontSize: wp('3.5%'),
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#1F2937',
    fontSize: wp('4.5%'),
    fontWeight: '700',
    marginBottom: hp('1.5%'),
  },
  submittedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    borderLeftWidth: 4,
    borderLeftColor: '#16A34A',
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  submittedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('1%'),
  },
  submittedLabel: {
    color: '#15803D',
    fontSize: wp('3.5%'),
    fontWeight: '700',
  },
  submittedStatus: {
    color: '#15803D',
    fontSize: wp('3.2%'),
    fontWeight: '700',
    // backgroundColor: '#DCFCE7',
    // borderRadius: wp('4%'),
    // paddingHorizontal: wp('3%'),
    // paddingVertical: hp('0.5%'),
    // overflow: 'hidden',
  },
  submittedDescription: {
    color: '#1F2937',
    fontSize: wp('3.8%'),
    lineHeight: hp('2.8%'),
  },
});

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
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
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../utils/responsive';
import { Colors } from '../../Constants/Colors';
import { BASE_URL, ENDPOINTS } from '../../Constants/config';
import { postJson } from '../../redux/slices/authSlice';
import { useI18n } from '../../i18n';

export default function HelpSupportScreen({ onNavigate }) {
  const { t } = useI18n();
  const user = useSelector(state => state.auth.user) || {};
  const [problem, setProblem] = useState('');
  const [submittedProblems, setSubmittedProblems] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [loadingReports, setLoadingReports] = useState(true);
  const [reportsError, setReportsError] = useState('');

  const loadReports = useCallback(async () => {
    if (!user.member_id) {
      setSubmittedProblems([]);
      setLoadingReports(false);
      setReportsError('Your member ID is missing. Please sign in again.');
      return false;
    }

    setLoadingReports(true);
    setReportsError('');
    try {
      const endpointUrl = `${BASE_URL}${ENDPOINTS.GET_SUPPORT_REPORTS}`;
      console.log('[HelpSupport] getsupport POST endpoint:', endpointUrl);
      const { response, data } = await postJson(ENDPOINTS.GET_SUPPORT_REPORTS, {
        member_id: user.member_id,
      });
      console.log('[HelpSupport] getsupport response:', {
        status: response.status,
        success: data && data.success,
        message: data && data.message,
      });
      if (!response.ok || (data && data.success === false)) {
        throw new Error((data && data.message) || 'Could not load support reports.');
      }

      const reports = Array.isArray(data)
        ? data
        : Array.isArray(data && data.data)
        ? data.data
        : Array.isArray(data && data.reports)
        ? data.reports
        : [];
      console.log('[HelpSupport] submitted problems:', reports);
      setSubmittedProblems(reports);
      return true;
    } catch (error) {
      const message = error.message || '';
      setReportsError(
        /Cannot (GET|POST)\s+\/public_app\/getsupport/i.test(message) ||
          /<!doctype html/i.test(message)
          ? 'The server report-history endpoint is unavailable. You can still view reports submitted during this session.'
          : message || 'Could not load support reports.',
      );
      return false;
    } finally {
      setLoadingReports(false);
    }
  }, [user.member_id]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const submitProblem = async () => {
    const description = problem.trim();
    if (submitting) return;
    if (!description) {
      setValidationError('Please enter a problem description.');
      return;
    }
    if (!user.member_id) {
      Alert.alert('Cannot submit report', 'Your member ID is missing. Please sign in again.');
      return;
    }

    setValidationError('');
    setSubmitting(true);
    try {
      const { response, data } = await postJson(ENDPOINTS.SUBMIT_SUPPORT, {
        member_id: user.member_id,
        description,
      });
      if (!response.ok || (data && data.success === false)) {
        Alert.alert(
          'Could not submit report',
          (data && data.message) || 'Please try again.',
        );
        return;
      }

      const result =
        data && data.data && !Array.isArray(data.data) ? data.data : {};
      console.log('[HelpSupport] report submitted:', result.description || description);
      setSubmittedProblems(current => [
        {
          ...result,
          id: result.id || result.support_id || `local-${Date.now()}`,
          description: result.description || description,
          status: result.status === undefined || result.status === null ? 0 : result.status,
          created_at: result.created_at || result.submitted_at || new Date().toISOString(),
        },
        ...current,
      ]);
      setProblem('');
      setIsFormVisible(false);
      await loadReports();
    } catch (error) {
      Alert.alert('Could not submit report', error.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const reportStatus = status => {
    const statusCode = Number(status);
    if (statusCode === 0) return { label: 'New issue', color: '#2563EB', bg: '#DBEAFE' };
    if (statusCode === 1) return { label: 'Ongoing', color: '#D97706', bg: '#FEF3C7' };
    if (statusCode === 2) return { label: 'Completed', color: '#15803D', bg: '#DCFCE7' };
    if (statusCode === 3) return { label: 'Rejected', color: '#B91C1C', bg: '#FEE2E2' };
    return { label: 'Unknown', color: '#64748B', bg: '#F1F5F9' };
  };

  const formatReportDate = report => {
    const rawDate =
      report.created_at ||
      report.submitted_at ||
      report.created_date ||
      report.report_date ||
      report.date;
    if (!rawDate) return '';
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return String(rawDate);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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
            onPress={() => {
              if (submitting) return;
              setValidationError('');
              setIsFormVisible(current => !current);
            }}
            disabled={submitting}
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
                  onChangeText={value => {
                    setProblem(value);
                    if (value.trim()) setValidationError('');
                  }}
                  placeholder="Describe your problem..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                  style={[
                    styles.problemInput,
                    validationError && styles.problemInputError,
                  ]}
                  accessibilityLabel="Problem description"
                />
                {!!validationError && (
                  <Text style={styles.validationError}>{validationError}</Text>
                )}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    submitting && styles.submitButtonDisabled,
                  ]}
                  onPress={submitProblem}
                  disabled={submitting}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : loadingReports ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.loadingText}>Loading reports...</Text>
            </View>
          ) : reportsError && submittedProblems.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Could not load reports</Text>
              <Text style={styles.emptyDescription}>{reportsError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadReports}>
                <Text style={styles.retryButtonText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : submittedProblems.length > 0 ? (
            <View style={styles.submissionsSection}>
              <Text style={styles.sectionTitle}>Submitted problems</Text>
              {!!reportsError && (
                <View style={styles.reportWarning}>
                  <Text style={styles.reportWarningText}>{reportsError}</Text>
                  <TouchableOpacity onPress={loadReports} accessibilityRole="button">
                    <Text style={styles.reportWarningAction}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}
              {submittedProblems.map((report, index) => {
                const description =
                  report.description || report.support_description || report.problem || '';
                const status = reportStatus(report.status);
                const submittedDate = formatReportDate(report);
                return (
                  <View
                    key={report.id || report.support_id || `${index}-${description}`}
                    style={styles.submittedCard}
                  >
                    <View style={styles.submittedHeader}>
                      <Text style={styles.submittedLabel}>Problem report</Text>
                      <Text
                        style={[
                          styles.submittedStatus,
                          { color: status.color, backgroundColor: status.bg },
                        ]}
                      >
                        {status.label}
                      </Text>
                    </View>
                    <Text style={styles.submittedDescription}>{description}</Text>
                    {!!submittedDate && (
                      <Text style={styles.submittedDate}>Submitted: {submittedDate}</Text>
                    )}
                  </View>
                );
              })}
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
  problemInputError: {
    borderColor: '#DC2626',
  },
  validationError: {
    color: '#DC2626',
    fontSize: wp('3.3%'),
    marginTop: hp('0.7%'),
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
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: wp('5%'),
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: wp('3.5%'),
    marginTop: hp('1%'),
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
    fontSize: wp('3.2%'),
    fontWeight: '700',
    borderRadius: wp('4%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.5%'),
    overflow: 'hidden',
  },
  retryButton: {
    marginTop: hp('1.5%'),
    backgroundColor: Colors.primary,
    borderRadius: 9,
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1%'),
  },
  retryButtonText: { color: '#FFFFFF', fontSize: wp('3.5%'), fontWeight: '700' },
  reportWarning: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: wp('3%'),
    marginBottom: hp('1.5%'),
  },
  reportWarningText: { color: '#92400E', fontSize: wp('3.3%') },
  reportWarningAction: {
    color: Colors.primary,
    fontSize: wp('3.3%'),
    fontWeight: '700',
    marginTop: hp('0.8%'),
  },
  submittedDescription: {
    color: '#1F2937',
    fontSize: wp('3.8%'),
    lineHeight: hp('2.8%'),
  },
  submittedDate: {
    color: '#6B7280',
    fontSize: wp('3.2%'),
    marginTop: hp('1%'),
  },
});

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import { Colors } from '../../../Constants/Colors';

export default function ExportReport({ onNavigate }) {
  const [exportProgress] = useState(new Animated.Value(0));
  const [isExporting, setIsExporting] = useState(true);

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('reports');
    }
  };

  const handleBackToReports = () => {
    if (onNavigate) {
      onNavigate('reports');
    }
  };

  // Simulate export animation
  useEffect(() => {
    if (isExporting) {
      Animated.timing(exportProgress, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      }).start(() => {
        setIsExporting(false);
      });
    }
  }, []);

  const progressWidth = exportProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Mock export data
  const exportData = {
    fileName: 'RMTA_Weekly_Report.pdf',
    period: '7-13 October 2026',
    size: '2.4 MB',
  };

  return (
    <>
      <StatusBar
        backgroundColor="#F7F9FC"
        barStyle="dark-content"
        translucent={true}
      />
      <SafeAreaView style={styles.container}>
        {/* Header */}
          <View style={styles.headerSection}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Export Confirmation</Text>
          </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >


          {/* Main Content */}
          <View style={styles.mainContent}>
            {/* Export Ready Section */}
            <View style={styles.exportReadyCard}>
              <View style={styles.checkmarkContainer}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <Text style={styles.exportReadyTitle}>Export is ready</Text>
              <Text style={styles.exportReadySubtitle}>
                Your selected report is prepared as a PDF in this prototype.
              </Text>
            </View>

            {/* Record Saved Section */}
            <View style={styles.recordSavedCard}>
              <View style={styles.recordIconContainer}>
                <Image
                  source={require('../../../Assets/icons/circle-check.png')}
                  style={styles.recordIcon}
                />
              </View>
              <View style={styles.recordContent}>
                <Text style={styles.recordTitle}>Record saved</Text>
                <Text style={styles.recordSubtitle}>
                  Your receipt and transaction details are ready.
                </Text>
              </View>
            </View>

            {/* Export Progress (if still exporting) */}
            {isExporting && (
              <View style={styles.progressSection}>
                <Text style={styles.progressLabel}>Exporting...</Text>
                <View style={styles.progressBar}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      { width: progressWidth },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>Please wait</Text>
              </View>
            )}

            {/* File Information */}
            <View style={styles.fileInfoCard}>
              <View style={styles.fileIconContainer}>
                <Image
                  source={require('../../../Assets/icons/pending.png')}
                  style={styles.fileIcon}
                />
              </View>
              <View style={styles.fileContent}>
                <Text style={styles.fileName}>{exportData.fileName}</Text>
                <Text style={styles.filePeriod}>{exportData.period}</Text>
                <Text style={styles.fileSize}>{exportData.size}</Text>
              </View>
            </View>

            {/* Additional Info */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>What's included in your export?</Text>
              <View style={styles.infoItems}>
                <View style={styles.infoItem}>
                  <View style={styles.infoDot} />
                  <Text style={styles.infoItemText}>Weekly repair statistics</Text>
                </View>
                <View style={styles.infoItem}>
                  <View style={styles.infoDot} />
                  <Text style={styles.infoItemText}>Job completion data</Text>
                </View>
                <View style={styles.infoItem}>
                  <View style={styles.infoDot} />
                  <Text style={styles.infoItemText}>Revenue breakdown</Text>
                </View>
                <View style={styles.infoItem}>
                  <View style={styles.infoDot} />
                  <Text style={styles.infoItemText}>Performance metrics</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Back Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.backButton2}
            onPress={handleBackToReports}
          >
            <Text style={styles.backButtonText2}>Back to reports</Text>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: hp('2%'),
  },

  /* Header */
  headerSection: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    marginBottom: hp('2%'),
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: wp('2%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: wp('7%'),
    fontWeight: '300',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  pageTitle: {
    fontSize: wp('5%'),
    fontWeight: '700',
    color: '#1F2937',
  },

  /* Main Content */
  mainContent: {
    paddingHorizontal: wp('4%'),
  },

  /* Export Ready Card */
  exportReadyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('4%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('3%'),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: hp('2%'),
  },
  checkmarkContainer: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: '#DDD6FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  checkmark: {
    fontSize: wp('7%'),
    fontWeight: '700',
    color: Colors.primary,
  },
  exportReadyTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('0.5%'),
    textAlign: 'center',
  },
  exportReadySubtitle: {
    fontSize: wp('2.8%'),
    color: '#9CA3AF',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: wp('4%'),
  },

  /* Record Saved Card */
  recordSavedCard: {
    backgroundColor: '#DCFCE7',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.5%'),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
    marginBottom: hp('2%'),
  },
  recordIconContainer: {
    width: wp('10%'),
    height: wp('10%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordIcon: {
    width: wp('6%'),
    height: wp('6%'),
    resizeMode: 'contain',
    tintColor: '#10B981',
  },
  recordContent: {
    flex: 1,
  },
  recordTitle: {
    fontSize: wp('3.2%'),
    fontWeight: '700',
    color: '#047857',
    marginBottom: hp('0.2%'),
  },
  recordSubtitle: {
    fontSize: wp('2.6%'),
    color: '#059669',
    fontWeight: '400',
  },

  /* Progress Section */
  progressSection: {
    marginBottom: hp('2%'),
  },
  progressLabel: {
    fontSize: wp('3%'),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: hp('0.8%'),
  },
  progressBar: {
    width: '100%',
    height: hp('0.8%'),
    backgroundColor: '#E5E7EB',
    borderRadius: wp('1%'),
    overflow: 'hidden',
    marginBottom: hp('0.8%'),
  },
  progressFill: {
    backgroundColor: Colors.primary,
    height: '100%',
    borderRadius: wp('1%'),
  },
  progressText: {
    fontSize: wp('2.4%'),
    color: '#9CA3AF',
    fontWeight: '500',
    textAlign: 'center',
  },

  /* File Info Card */
  fileInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.5%'),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: hp('2%'),
  },
  fileIconContainer: {
    width: wp('10%'),
    height: wp('10%'),
    backgroundColor: '#EDE9FE',
    borderRadius: wp('2%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileIcon: {
    width: wp('5%'),
    height: wp('5%'),
    resizeMode: 'contain',
    tintColor: Colors.primary,
  },
  fileContent: {
    flex: 1,
  },
  fileName: {
    fontSize: wp('3.2%'),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('0.2%'),
  },
  filePeriod: {
    fontSize: wp('2.6%'),
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: hp('0.2%'),
  },
  fileSize: {
    fontSize: wp('2.4%'),
    color: '#D1D5DB',
    fontWeight: '400',
  },

  /* Info Box */
  infoBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.5%'),
    marginBottom: hp('2%'),
  },
  infoTitle: {
    fontSize: wp('3.2%'),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('1%'),
  },
  infoItems: {
    gap: hp('0.8%'),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  infoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  infoItemText: {
    fontSize: wp('2.8%'),
    color: '#6B7280',
    fontWeight: '500',
  },

  /* Button Container */
  buttonContainer: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  backButton2: {
    backgroundColor: '#2F5DDC',
    paddingVertical: hp('1.8%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('2.5%'),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText2: {
    color: '#FFFFFF',
    fontSize: wp('3.2%'),
    fontWeight: '600',
  },

  bottomSpacer: {
    height: hp('2%'),
  },
});

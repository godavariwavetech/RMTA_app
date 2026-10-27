import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import { Colors } from '../../Constants/Colors';
import { ENDPOINTS } from '../../Constants/config';
import { postJson } from '../../redux/slices/authSlice';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import { showAppModal } from '../../utils/appModal';

export default function AdminReports({ onNavigate }) {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [report, setReport] = useState(null);

  // Load the association-wide repair report (re-fetch when the period changes).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { response, data } = await postJson(ENDPOINTS.ADMIN_REPAIR_REPORT, {
          period: selectedPeriod === 'month' ? 'month' : 'week',
        });
        if (active && response.ok && data && data.success !== false) {
          setReport(data.data);
        }
      } catch (e) {
        // leave previous data on failure
      }
    })();
    return () => {
      active = false;
    };
  }, [selectedPeriod]);

  const handleExportReport = async () => {
    try {
      const rows = reportData.weekRepairs.map(row => `<tr><td>${row.day}</td><td>${row.value}</td></tr>`).join('');
      const file = await RNHTMLtoPDF.convert({
        fileName: `RMTA_Admin_Repair_Report_${Date.now()}`,
        base64: false,
        html: `<html><body style="font-family:Arial;padding:28px;color:#1f2937"><h1>RMTA Association Repair Report</h1><p>${reportData.period}</p><h2>Summary</h2><p>Repair revenue: ${reportData.repairRevenue}</p><p>Jobs closed: ${reportData.jobsClosed}</p><p>${reportData.repairsCompleted} repairs completed (${reportData.weekGrowth >= 0 ? '+' : ''}${reportData.weekGrowth}%)</p><h2>Daily repairs</h2><table style="width:100%;border-collapse:collapse" border="1" cellpadding="8"><tr><th>Day</th><th>Repairs</th></tr>${rows}</table></body></html>`,
      });
      if (!file?.filePath) throw new Error('PDF file was not created.');
      await Share.open({ title: 'RMTA Association Repair Report', url: file.filePath.startsWith('file://') ? file.filePath : `file://${file.filePath}`, type: 'application/pdf', failOnCancel: false });
    } catch (error) {
      if (error?.message !== 'User did not share') showAppModal('Export failed', error?.message || 'Could not create or share the report. Please try again.');
    }
  };

  // Build the last-7-days chart (weekday labels), filling missing days with 0.
  const buildWeek = rows => {
    const map = {};
    (rows || []).forEach(r => { map[r.d] = Number(r.c) || 0; });
    const out = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      out.push({ day: dt.toLocaleDateString('en-US', { weekday: 'short' }), value: map[key] || 0 });
    }
    return out;
  };

  const weekRepairs = buildWeek(report && report.chart_rows);
  const peak = Math.max(...weekRepairs.map(r => r.value));
  const repairsCompleted = weekRepairs.reduce((s, r) => s + r.value, 0);
  const prevWeek = (report && report.prev_week_closed) || 0;
  const weekGrowth = prevWeek > 0
    ? Math.round(((repairsCompleted - prevWeek) / prevWeek) * 100)
    : (repairsCompleted > 0 ? 100 : 0);

  const fmtRange = () => {
    const today = new Date();
    const fmt = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const spanDays = selectedPeriod === 'month' ? 29 : 6;
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - spanDays);
    return `${fmt(start)} – ${fmt(today)} ${today.getFullYear()}`;
  };

  const reportData = {
    period: fmtRange(),
    type: 'Live data',
    repairRevenue: `₹${Number((report && report.repair_revenue) || 0).toLocaleString('en-IN')}`,
    jobsClosed: (report && report.jobs_closed) || 0,
    weekRepairs,
    repairsCompleted,
    weekGrowth,
  };

  const periodOptions = [
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'custom', label: 'Custom' },
  ];

  const reportOptions = [
    {
      id: 1,
      icon: require('../../Assets/icons/clipboard.png'),
      title: 'Repair performance',
      subtitle: 'Completion, turnaround and revenue',
    },
    {
      id: 2,
      icon: require('../../Assets/icons/wallet.png'),
      title: 'Trade summary',
      subtitle: 'Purchases and sales',
    },
  ];

  const handleReportOptionClick = (reportId) => {
    if (onNavigate) {
      if (reportId === 2) {
        // Trade summary - navigate to PurchaseAndSaleMonitoring
        onNavigate('purchaseAndSaleMonitoring');
      } else {
        // Repair performance - navigate to report details
        onNavigate('reportDetails', { reportType: reportId });
      }
    }
  };

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  // Calculate max value for chart scaling (min 1 to avoid divide-by-zero).
  const maxValue = Math.max(1, ...reportData.weekRepairs.map(r => r.value));

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
            <TouchableOpacity onPress={handleBackPress}>
              <Image source={require('../../Assets/icons/back.png')} style={{height: wp('5%'), width: wp('5%')}} />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Admin Reports</Text>
          </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >


          {/* Your Shop at a Glance Section */}
          <View style={styles.section}>
            <View style={styles.shopHeader}>
              <View>
                <Text style={styles.shopTitle}>Association performance</Text>
                <Text style={styles.shopSubtitle}>
                  {reportData.period} · {reportData.type}
                </Text>
              </View>
            </View>

            {/* Period Selection */}
            <View style={styles.periodContainer}>
              {periodOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.periodButton,
                    selectedPeriod === option.id && styles.periodButtonActive,
                  ]}
                  onPress={() => setSelectedPeriod(option.id)}
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      selectedPeriod === option.id && styles.periodButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Stats Cards */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Repair revenue</Text>
                <Text style={styles.statValue}>{reportData.repairRevenue}</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Jobs closed</Text>
                <Text style={styles.statValue}>{reportData.jobsClosed}</Text>
              </View>
            </View>
          </View>

          {/* Repairs This Week Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Repairs this week</Text>

            {/* Bar Chart */}
            <View style={styles.chartContainer}>
              <View style={styles.chartBars}>
                {reportData.weekRepairs.map((item, index) => (
                  <View key={index} style={styles.barWrapper}>
                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${(item.value / maxValue) * 100}%`,
                            backgroundColor: item.value === peak && peak > 0 ? '#FCD34D' : Colors.secondary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{item.day}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Chart Footer Info */}
            <View style={styles.chartFooter}>
              <Text style={styles.chartFooterText}>
                <Text style={styles.repairsText}>{reportData.repairsCompleted} repairs completed</Text>
                <Text style={styles.growthText}> · {reportData.weekGrowth >= 0 ? '+' : ''}{reportData.weekGrowth}% this week</Text>
              </Text>
            </View>
          </View>

          {/* Report Options */}
          <View style={styles.section}>
            {reportOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.reportOption}
                onPress={() => handleReportOptionClick(option.id)}
              >
                <View style={styles.optionIconContainer}>
                  <Image
                    source={option.icon}
                    style={styles.optionIcon}
                  />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                </View>
                <Text style={styles.optionChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Export Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExportReport}
          >
            <Text style={styles.exportButtonText}>Export report</Text>
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
    marginBottom: hp('1%'),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('6%')
  },
  pageTitle: {
    fontSize: wp('6%'),
    fontWeight: '700',
    color: '#1F2937',
  },

  /* Sections */
  section: {
    paddingHorizontal: wp('4%'),
    marginBottom: hp('2.5%'),
  },
  sectionTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('1.5%'),
  },

  /* Shop Header */
  shopHeader: {
    marginBottom: hp('1.5%'),
  },
  shopTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('0.3%'),
  },
  shopSubtitle: {
    fontSize: wp('2.6%'),
    color: '#9CA3AF',
    fontWeight: '500',
  },

  /* Period Selection */
  periodContainer: {
    flexDirection: 'row',
    gap: wp('2%'),
    marginBottom: hp('2%'),
  },
  periodButton: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    borderRadius: wp('2%'),
    backgroundColor: '#E5E7EB',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: Colors.secondary,
  },
  periodButtonText: {
    fontSize: wp('3%'),
    fontWeight: '600',
    color: '#9CA3AF',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },

  /* Stats Cards */
  statsGrid: {
    flexDirection: 'row',
    gap: wp('2%'),
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.5%'),
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statLabel: {
    fontSize: wp('2.6%'),
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: hp('0.5%'),
  },
  statValue: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: '#1F2937',
  },

  /* Chart */
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('5%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: hp('1.5%'),
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: hp('20%'),
    gap: wp('1%'),
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barContainer: {
    width: '70%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: wp('1%'),
    minHeight: wp('3%'),
  },
  barLabel: {
    fontSize: wp('2.4%'),
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: hp('0.8%'),
  },

  /* Chart Footer */
  chartFooter: {
    paddingTop: hp('1%'),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  chartFooterText: {
    fontSize: wp('2.6%'),
    color: '#9CA3AF',
    fontWeight: '500',
  },
  repairsText: {
    color: '#10B981',
    fontWeight: '600',
  },
  growthText: {
    color: '#10B981',
    fontWeight: '600',
  },

  /* Report Options */
  reportOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.5%'),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
    marginBottom: hp('1.5%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionIconContainer: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('2%'),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIcon: {
    width: wp('5%'),
    height: wp('5%'),
    resizeMode: 'contain',
    tintColor: Colors.secondary,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: wp('3.2%'),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('0.3%'),
  },
  optionSubtitle: {
    fontSize: wp('2.6%'),
    color: '#9CA3AF',
    fontWeight: '500',
  },
  optionChevron: {
    fontSize: wp('5%'),
    color: '#D1D5DB',
    fontWeight: '300',
  },

  /* Export Button */
  buttonContainer: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  exportButton: {
    backgroundColor: Colors.secondary,
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
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: wp('3.2%'),
    fontWeight: '600',
  },

  bottomSpacer: {
    height: hp('2%'),
  },
});

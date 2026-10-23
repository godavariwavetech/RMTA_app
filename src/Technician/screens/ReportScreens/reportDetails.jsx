import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useSelector } from 'react-redux';

import { Colors } from '../../../Constants/Colors';
import { ENDPOINTS } from '../../../Constants/config';
import { postJson } from '../../../redux/slices/authSlice';

export default function ReportDetails({ onNavigate, reportType }) {
  const user = useSelector(state => state.auth.user) || {};
  const isAdmin = user.role === 'admin';
  const [report, setReport] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      // Admin sees the association-wide aggregate; a technician sees their own.
      if (!isAdmin && !user.member_id) return;
      try {
        const endpoint = isAdmin ? ENDPOINTS.ADMIN_REPAIR_REPORT : ENDPOINTS.REPAIR_REPORT;
        const payload = isAdmin
          ? { period: 'week' }
          : { member_id: user.member_id, period: 'week' };
        const { response, data } = await postJson(endpoint, payload);
        if (active && response.ok && data && data.success !== false) {
          setReport(data.data);
        }
      } catch (e) {
        // leave empty on failure
      }
    })();
    return () => {
      active = false;
    };
  }, [isAdmin, user.member_id]);

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  // Share the repair-performance report as text via the native share sheet.
  const handleExportReport = async () => {
    try {
      const s = reportData.summary;
      const lines = [
        'RMTA — Repair Performance',
        user.shop_name ? `Shop: ${user.shop_name}` : null,
        `Period: ${reportData.period}`,
        '',
        'Summary:',
        `  Completed: ${s.completed} jobs`,
        `  In progress: ${s.inProgress} jobs`,
        `  Ready for pickup: ${s.readyForPickup} jobs`,
        `  Revenue: ${s.revenue}`,
        '',
        'Repairs this week:',
        ...reportData.weekRepairs.map(r => `  ${r.day}: ${r.value}`),
        '',
        `${reportData.repairsCompleted} repairs completed · ${reportData.weekGrowth >= 0 ? '+' : ''}${reportData.weekGrowth}% this week`,
      ].filter(l => l !== null);

      await Share.share({
        message: lines.join('\n'),
        title: 'RMTA Repair Performance',
      });
    } catch (e) {
      Alert.alert('Export failed', 'Could not share the report. Please try again.');
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

  const statusCounts = (report && report.status_counts) || {};
  const fmtRange = () => {
    const today = new Date();
    const fmt = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
    return `${fmt(start)} – ${fmt(today)} ${today.getFullYear()}`;
  };

  const reportData = {
    title: 'Repair performance',
    period: fmtRange(),
    weekRepairs,
    repairsCompleted,
    weekGrowth,
    summary: {
      completed: statusCounts.ready || 0,            // "Completed" = status 'ready'
      inProgress: statusCounts.in_progress || 0,     // "In progress" = status 'in_progress'
      readyForPickup: statusCounts.ready || 0,       // same as Completed = status 'ready'
      revenue: `₹${Number((report && report.repair_revenue) || 0).toLocaleString('en-IN')}`,
    },
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Header */}
          <View style={styles.headerSection}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Image source={require('../../../Assets/icons/back.png')} style={{height: wp('5%'), width: wp('5%')}} />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Report Detail</Text>
          </View>

          {/* Report Title and Period */}
          <View style={styles.section}>
            <Text style={styles.reportTitle}>{reportData.title}</Text>
            <Text style={styles.reportPeriod}>{reportData.period}</Text>
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
                    <Text style={styles.barValue}>{item.value}</Text>
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

          {/* Summary Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Completed</Text>
                <Text style={styles.summaryValue}>{reportData.summary.completed} jobs</Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>In progress</Text>
                <Text style={styles.summaryValue}>{reportData.summary.inProgress} jobs</Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Ready for pickup</Text>
                <Text style={styles.summaryValue}>{reportData.summary.readyForPickup} jobs</Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Revenue</Text>
                <Text style={styles.summaryValue}>{reportData.summary.revenue}</Text>
              </View>
            </View>
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
  backButton: {
    height: wp('4%'),
    width: wp('4%'),
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: wp('7%'),
    fontWeight: '300',
  },
  pageTitle: {
    fontSize: wp('5%'),
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
  reportTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('0.5%'),
  },
  reportPeriod: {
    fontSize: wp('2.8%'),
    color: '#9CA3AF',
    fontWeight: '500',
  },

  /* Chart */
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('2%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: hp('1.5%'),
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: hp('22%'),
    gap: wp('1%'),
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barContainer: {
    width: '70%',
    height: '85%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: wp('1%'),
    minHeight: wp('3%'),
  },
  barValue: {
    fontSize: wp('2.4%'),
    color: '#1F2937',
    fontWeight: '700',
    marginTop: hp('0.5%'),
  },
  barLabel: {
    fontSize: wp('2.2%'),
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: hp('0.3%'),
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

  /* Summary Grid */
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('2%'),
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.5%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryLabel: {
    fontSize: wp('2.6%'),
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: hp('0.5%'),
  },
  summaryValue: {
    fontSize: wp('3.6%'),
    fontWeight: '700',
    color: '#1F2937',
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

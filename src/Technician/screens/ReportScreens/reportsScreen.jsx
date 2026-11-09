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
} from '../../../utils/responsive';

import { useSelector } from 'react-redux';

import { ENDPOINTS } from '../../../Constants/config';
import { Colors } from '../../../Constants/Colors';
import CalendarPicker from '../../components/CalendarPicker';
import { postJson } from '../../../redux/slices/authSlice';
import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import { showAppModal } from '../../../utils/appModal';
import useRefresh from '../../../utils/useRefresh';

// Last N months as { label, from, to } (YYYY-MM-DD). The current month runs up to today.
const lastMonths = n => {
  const today = new Date();
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const first = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
    const end = i === 0 ? today : last;
    out.push({
      label: first.toLocaleDateString('en-GB', { month: 'short' }),
      from: ymd(first),
      to: ymd(end),
    });
  }
  return out;
};

// Dates are YYYY-MM-DD strings, which is the format the getreports API takes.
const pad2 = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseYmd = s => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getMonth() === Number(m[2]) - 1 ? d : null;
};
const rangeFor = id => {
  const today = new Date();
  if (id === 'week') {
    return { from: ymd(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)), to: ymd(today) };
  }
  // Default and 'month': 1st of the current month up to today.
  return { from: ymd(new Date(today.getFullYear(), today.getMonth(), 1)), to: ymd(today) };
};

export default function ReportsScreen({ onNavigate }) {
  const { tick, refreshControl } = useRefresh();
  const user = useSelector(state => state.auth.user) || {};
  // Opens on the current month. Week / Month set the range; Custom lets the user type one.
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [range, setRange] = useState(() => rangeFor('month'));
  const [customFrom, setCustomFrom] = useState(range.from);
  const [customTo, setCustomTo] = useState(range.to);
  const [selectedNavItem, setSelectedNavItem] = useState('reports');
  const [report, setReport] = useState(null);

  // Load the report for the selected date range (re-fetch when it changes).
  useEffect(() => {
    let active = true;
    (async () => {
      if (!user.member_id) return;
      try {
        const { response, data } = await postJson(ENDPOINTS.GET_REPORTS, {
          member_id: user.member_id,
          from_date: range.from,
          to_date: range.to,
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
  }, [user.member_id, range.from, range.to, tick]);

  // Monthly overview: one getreports call per month for the last 6 months, in parallel.
  const [monthly, setMonthly] = useState([]);
  useEffect(() => {
    let active = true;
    if (!user.member_id) return undefined;
    Promise.all(
      lastMonths(6).map(async m => {
        try {
          const { response, data } = await postJson(ENDPOINTS.GET_REPORTS, {
            member_id: user.member_id,
            from_date: m.from,
            to_date: m.to,
          });
          const ok = response.ok && data && data.success !== false;
          return { label: m.label, value: ok ? Number(data.data && data.data.total_job_sheets) || 0 : 0 };
        } catch (e) {
          return { label: m.label, value: 0 };
        }
      }),
    ).then(rows => {
      if (active) setMonthly(rows);
    });
    return () => {
      active = false;
    };
  }, [user.member_id, tick]);

  const monthMax = Math.max(1, ...monthly.map(m => m.value));
  const monthTicks = [monthMax, Math.round(monthMax * 0.75), Math.round(monthMax * 0.5), Math.round(monthMax * 0.25), 0];
  const bestMonth = monthly.reduce((best, m) => (m.value > 0 && (!best || m.value > best.value) ? m : best), null);
  const bestLabel = bestMonth ? bestMonth.label : '';

  const handlePeriodPress = id => {
    setSelectedPeriod(id);
    if (id !== 'custom') setRange(rangeFor(id));
  };

  const applyCustomRange = () => {
    const from = parseYmd(customFrom);
    const to = parseYmd(customTo);
    if (!from || !to) {
      showAppModal('Invalid date', 'Enter both dates as YYYY-MM-DD, for example 2026-11-01.');
      return;
    }
    if (from > to) {
      showAppModal('Invalid range', 'The from date must be on or before the to date.');
      return;
    }
    setRange({ from: customFrom.trim(), to: customTo.trim() });
  };

  const handleNavigation = (screen) => {
    setSelectedNavItem(screen);
    if (onNavigate) {
      onNavigate(screen);
    }
  };

  // Share the current report as text via the native share sheet.
  const handleExportReport = async () => {
    try {
      const chartRows = reportData.statusBars.map(r => `<tr><td>${r.day}</td><td>${r.value}</td></tr>`).join('');
      const file = await generatePDF({
        fileName: `RMTA_Repair_Report_${Date.now()}`,
        base64: false,
        html: `<html><body style="font-family:Arial;padding:28px;color:#1f2937"><h1>RMTA Repair Report</h1><p>${user.shop_name || 'RMTA'} - ${reportData.period}</p><h2>Summary</h2><p>Total jobs: ${reportData.totalJobs}</p><p>Jobs closed: ${reportData.jobsClosed}</p><h2>Jobs by status</h2><table style="width:100%;border-collapse:collapse" border="1" cellpadding="8"><tr><th>Status</th><th>Jobs</th></tr>${chartRows}</table></body></html>`,
      });
      if (!file?.filePath) throw new Error('PDF file was not created.');
      await Share.open({ title: 'RMTA Repair Report', url: file.filePath.startsWith('file://') ? file.filePath : `file://${file.filePath}`, type: 'application/pdf', failOnCancel: false });
    } catch (e) {
      if (e?.message !== 'User did not share') showAppModal('Export failed', e?.message || 'Could not create or share the report. Please try again.');
    }
  };

  // getreports returns counts for the range (no per-day rows), so the bars are job
  // statuses: New, Working, Completed, Delivered.
  const count = v => Number(v) || 0;
  const statusBars = [
    { day: 'New', value: count(report && report.new_jobs) },
    { day: 'Working', value: count(report && report.working_jobs) },
    { day: 'Completed', value: count(report && report.completed_jobs) },
    { day: 'Delivered', value: count(report && report.delivered_jobs) },
  ];
  const peak = Math.max(...statusBars.map(r => r.value));
  const totalJobs = count(report && report.total_job_sheets);

  const fmtRange = () => {
    const from = parseYmd(range.from);
    const to = parseYmd(range.to);
    if (!from || !to) return '';
    const fmt = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    return `${fmt(from)} – ${fmt(to)} ${to.getFullYear()}`;
  };

  const reportData = {
    period: fmtRange(),
    totalJobs,
    jobsClosed: count(report && report.completed_jobs),
    statusBars,
    peak,
  };

  const periodOptions = [
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'custom', label: 'Custom' },
  ];

  const reportOptions = [
    {
      id: 1,
      icon: require('../../../Assets/bottomTabIcons/reports.png'),
      title: 'Repair performance',
      subtitle: `${count(report && report.completed_jobs)} completed · ${count(report && report.working_jobs)} working`,
    },
    {
      id: 2,
      icon: require('../../../Assets/icons/wallet.png'),
      title: 'Trade summary',
      subtitle: `${count(report && report.total_purchases)} purchases · ${count(report && report.total_sales)} sales`,
    },
  ];

  const handleReportOptionClick = (reportId) => {
    if (onNavigate) {
      if (reportId === 2) {
        // Trade summary - show Purchase and Sale History
        onNavigate('purchaseAndSaleHistory', { initialTab: 'purchases' });
      } else {
        // Repair performance
        onNavigate('reportDetails', { reportType: reportId });
      }
    }
  };

  // Calculate max value for chart scaling (min 1 to avoid divide-by-zero).
  const maxValue = Math.max(1, ...reportData.statusBars.map(r => r.value));

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
            <TouchableOpacity onPress={() => onNavigate('home')}>
              <Image source={require('../../../Assets/icons/back.png')} style={{height: wp('5%'), width: wp('5%')}} />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Reports</Text>
          </View>
        <ScrollView refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >


          {/* Your Shop at a Glance Section */}
          <View style={styles.section}>
            <View style={styles.shopHeader}>
              <View>
                <Text style={styles.shopTitle}>Your shop at a glance</Text>
                <Text style={styles.shopSubtitle}>
                  {reportData.period}
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
                  onPress={() => handlePeriodPress(option.id)}
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

            {/* Custom date range */}
            {selectedPeriod === 'custom' && (
              <View style={styles.customRange}>
                <CalendarPicker label="From" value={customFrom} onChange={setCustomFrom} />
                <CalendarPicker label="To" value={customTo} onChange={setCustomTo} />
                <TouchableOpacity style={styles.customApply} onPress={applyCustomRange} activeOpacity={0.85}>
                  <Text style={styles.customApplyText}>Apply</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Stats Cards */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total jobs</Text>
                <Text style={styles.statValue}>{reportData.totalJobs}</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Jobs closed</Text>
                <Text style={styles.statValue}>{reportData.jobsClosed}</Text>
              </View>
            </View>
          </View>

          {/* Repairs This Week Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Jobs by status</Text>

            {/* Bar Chart */}
            <View style={styles.chartContainer}>
              <View style={styles.chartBars}>
                {reportData.statusBars.map((item, index) => (
                  <View key={index} style={styles.barWrapper}>
                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${(item.value / maxValue) * 100}%`,
                            backgroundColor: item.value === peak && peak > 0 ? '#FCD34D' : '#2F5DDC',
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
                <Text style={styles.repairsText}>{reportData.totalJobs} jobs in this period</Text>
              </Text>
            </View>
          </View>

          {/* Monthly overview: jobs per month for the last 6 months, from getreports */}
          <View style={styles.section}>
            <View style={styles.mvHeader}>
              <Text style={styles.sectionTitle}>Monthly overview</Text>
            </View>
            <Text style={styles.mvSub}>Jobs created each month, last 6 months</Text>

            <View style={styles.mvCard}>
              <View style={styles.mvPlot}>
                {/* Y axis labels and grid lines */}
                <View style={styles.mvAxis}>
                  {monthTicks.map((tick, i) => (
                    <Text key={`${tick}-${i}`} style={styles.mvTick}>
                      {tick}
                    </Text>
                  ))}
                </View>
                <View style={styles.mvBarsArea}>
                  <View style={styles.mvGrid} pointerEvents="none">
                    {monthTicks.map((tick, i) => (
                      <View key={`${tick}-${i}`} style={styles.mvGridLine} />
                    ))}
                  </View>
                  <View style={styles.mvBars}>
                    {monthly.map(item => {
                      const best = item.value > 0 && item.value === monthMax;
                      return (
                        <View key={item.label} style={styles.mvBarCol}>
                          <Text style={[styles.mvValue, best && styles.mvValueBest]}>{item.value}</Text>
                          <View style={styles.mvBarTrack}>
                            <View
                              style={[
                                styles.mvBar,
                                { height: `${(item.value / monthMax) * 100}%` },
                                best && styles.mvBarBest,
                              ]}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
              {/* X axis labels */}
              <View style={styles.mvXRow}>
                <View style={styles.mvAxisSpacer} />
                <View style={styles.mvXLabels}>
                  {monthly.map(item => (
                    <Text key={item.label} style={styles.mvXLabel}>
                      {item.label}
                    </Text>
                  ))}
                </View>
              </View>

              <View style={styles.mvLegend}>
                <View style={styles.mvLegendItem}>
                  <View style={[styles.mvLegendDot, { backgroundColor: '#2F5DDC' }]} />
                  <Text style={styles.mvLegendText}>Jobs</Text>
                </View>
                <View style={styles.mvLegendItem}>
                  <View style={[styles.mvLegendDot, { backgroundColor: '#FCD34D' }]} />
                  <Text style={styles.mvLegendText}>{bestLabel ? `Best month (${bestLabel})` : 'Best month'}</Text>
                </View>
              </View>
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

        {/* Bottom Navigation */}
        {/* <BottomNav selectedItem={selectedNavItem} onNavigate={handleNavigation} /> */}
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
  customRange: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: wp('2%'),
    marginBottom: hp('1.5%'),
  },
  customApply: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    borderRadius: wp('2%'),
    backgroundColor: Colors.secondary,
  },
  customApplyText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: wp('3.5%'),
  },
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
    backgroundColor: '#2F5DDC',
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
    tintColor: '#2F5DDC',
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
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: wp('3.2%'),
    fontWeight: '600',
  },

  bottomSpacer: {
    height: hp('2%'),
  },
  // ---- Monthly overview (static graph)
  mvHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mvBadge: { backgroundColor: '#EEF2FF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  mvBadgeText: { fontSize: 11, fontWeight: '700', color: '#4F46E5' },
  mvSub: { fontSize: 12, color: '#94A3B8', marginTop: 2, marginBottom: 12 },
  mvCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8ECF3',
    padding: 14,
  },
  mvPlot: { flexDirection: 'row', height: 190 },
  mvAxis: { width: 30, justifyContent: 'space-between', paddingBottom: 0 },
  mvTick: { fontSize: 10, color: '#94A3B8', textAlign: 'right', paddingRight: 6, lineHeight: 12 },
  mvBarsArea: { flex: 1 },
  mvGrid: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', paddingVertical: 6 },
  mvGridLine: { height: StyleSheet.hairlineWidth, backgroundColor: '#E2E8F0' },
  mvBars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
  mvBarCol: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  mvValue: { fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 3 },
  mvValueBest: { color: '#B45309' },
  mvBarTrack: { width: '58%', height: '88%', justifyContent: 'flex-end' },
  mvBar: { width: '100%', backgroundColor: '#2F5DDC', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  mvBarBest: { backgroundColor: '#FCD34D' },
  mvXRow: { flexDirection: 'row', marginTop: 8 },
  mvAxisSpacer: { width: 30 },
  mvXLabels: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  mvXLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: '#64748B' },
  mvLegend: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  mvLegendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10 },
  mvLegendDot: { width: 9, height: 9, borderRadius: 5, marginRight: 6 },
  mvLegendText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
});

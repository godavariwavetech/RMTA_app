import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PdfSizeModal from '../../../Components/PdfSizeModal';
import { convertToPdf, pdfBodyStyle, pdfHeadStyle } from '../../../utils/pdfSizes';
import FileShare from 'react-native-share';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import { Colors } from '../../../Constants/Colors';
import StepNav from '../../../Components/StepNav';

const esc = v =>
  String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export default function CreateJobSheetStep8({ onNavigate, job, summary, pdfOnly = false }) {
  // `summary` carries everything entered in the steps; `job` is the server's
  // record (job code, id, ...) and wins where both have a field.
  const j = { ...(summary || {}), ...(job || {}) };
  const [sharing, setSharing] = useState(false);
  const [sizeModalVisible, setSizeModalVisible] = useState(false);
  const jobId = j.job_id || j.job_sheet_id || j.id || j.insertId || '';
  const jobCode = j.job_code || j.job_number || (jobId ? `Job #${jobId}` : 'Job Sheet');
  const deviceName =
    [j.device_brand, j.device_model].filter(Boolean).join(' ') || 'Device';
  const customerName = j.customer_name || '';
  const jobInfo = [j.customer_name, j.problem_description].filter(Boolean).join(' · ');
  const price =
    j.estimated_cost != null && j.estimated_cost !== ''
      ? `₹${Number(j.estimated_cost).toLocaleString('en-IN')}`
      : '';

  const buildHtml = sizeKey => {
    const row = (label, value) =>
      value !== null && value !== undefined && value !== ''
        ? `<tr><th>${esc(label)}</th><td>${esc(value)}</td></tr>`
        : '';
    const created = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    return `
      <html>
        <head>${pdfHeadStyle(sizeKey)}<style>
          *{box-sizing:border-box} body{font-family:Helvetica,Arial,sans-serif;color:#17243A;background:#fff}
          .brand{background:#071A3D;color:#fff;padding:22px 24px;border-radius:12px;margin-bottom:22px}
          .brand small{color:#9CCBFF;font-size:10px;letter-spacing:2px;font-weight:bold}
          h1{font-size:24px;margin:8px 0 4px;color:#fff} .meta{font-size:11px;color:#D4DFEF;margin:0}
          h2{font-size:13px;color:#173B82;margin:18px 0 8px;padding-bottom:6px;border-bottom:1px solid #DCE5F1}
          table{width:100%;border-collapse:collapse} tr:nth-child(even){background:#F6F8FB}
          th,td{padding:8px 10px;text-align:left;font-size:11px;border-bottom:1px solid #E8EDF4}
          th{width:36%;color:#64748B;font-weight:normal} td{color:#17243A;font-weight:bold;word-break:break-word}
          .footer{margin-top:24px;padding-top:10px;border-top:1px solid #DCE5F1;color:#64748B;font-size:9px;text-align:center}
          ${sizeKey === 'thermal' ? '.brand{padding:10px;border-radius:6px;margin-bottom:12px}h1{font-size:16px}h2{font-size:11px;margin:10px 0 4px}th,td{font-size:9px;padding:5px 4px}' : ''}
        </style></head>
        <body style="${pdfBodyStyle(sizeKey)}">
          <header class="brand"><small>RMTA · SERVICE RECORD</small><h1>Job Sheet</h1><p class="meta">${esc(jobCode)} · ${esc(created)}</p></header>
          <h2 style="border-bottom:1px solid #E5E7EB;padding-bottom:8px;">Customer</h2>
          <table style="width:100%;border-collapse:collapse;">
            ${row('Job ID', jobId)}
            ${row('Job reference', j.job_code || j.job_number)}
            ${row('Name', j.customer_name)}
            ${row('Mobile', j.customer_mobile)}
          </table>
          <h2 style="border-bottom:1px solid #E5E7EB;padding-bottom:8px;">Device</h2>
          <table style="width:100%;border-collapse:collapse;">
            ${row('Device', deviceName)}
            ${row('Storage', j.storage)}
            ${row('Color', j.color)}
            ${row('IMEI 1', j.imei1)}
            ${row('IMEI 2', j.imei2)}
          </table>
          <h2 style="border-bottom:1px solid #E5E7EB;padding-bottom:8px;">Condition</h2>
          <table style="width:100%;border-collapse:collapse;">
            ${row('Screen', j.screen)}
            ${row('Body', j.body)}
            ${row('Camera', j.camera)}
            ${row('Speaker', j.speaker)}
            ${row('Charging port', j.chargingpoint)}
            ${row('Battery', j.batterey)}
          </table>
          <h2 style="border-bottom:1px solid #E5E7EB;padding-bottom:8px;">Repair</h2>
          <table style="width:100%;border-collapse:collapse;">
            ${row('Category', j.repair_category)}
            ${row('Problem', j.problem_description)}
            ${row('Estimated cost', price)}
            ${row('Estimated delivery', j.estimated_delivery)}
          </table>
          <p class="footer">Thank you for choosing RMTA · Keep this sheet for your service records</p>
        </body>
      </html>`;
  };

  // Generates the job sheet PDF and opens the system share sheet, which lists
  // WhatsApp, Gmail, Drive and any other installed app.
  const handleSharePdf = async sizeKey => {
    if (sharing) return;
    setSharing(true);
    try {
      const file = await convertToPdf({
        html: buildHtml(sizeKey),
        fileName: `JobSheet-${jobCode}`.replace(/[^A-Za-z0-9_-]/g, '_'),
        sizeKey,
      });
      const url = file.filePath.startsWith('file://') ? file.filePath : `file://${file.filePath}`;
      try {
        await FileShare.open({
          title: `Job Sheet ${jobCode}`,
          message: `Job Sheet ${jobCode} - ${deviceName}`,
          url,
          type: 'application/pdf',
          failOnCancel: false,
        });
      } catch (shareErr) {
        Alert.alert('PDF saved', `Saved to:\n${file.filePath}`);
      }
    } catch (err) {
      Alert.alert('Could not create PDF', err.message || 'Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const handleBackPress = () => {
    // Job is already created — go back to the jobs list, not the review step.
    if (onNavigate) {
      onNavigate('resetTo', { target: 'jobs' });
    }
  };

  const handleViewJobDetails = () => {
    // Pass the created job's id so the details screen can fetch it.
    if (onNavigate) {
      onNavigate('jobDetails', { jobId: j.job_id });
    }
  };

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
            <Text style={styles.headerTitle}>{pdfOnly ? 'Job Sheet PDF' : 'Job Created'}</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Content Section */}
          <View style={styles.content}>
            {pdfOnly ? (
              <View style={styles.pdfReadyCard}>
                <Text style={styles.pdfReadyTitle}>Your job sheet is ready</Text>
                <Text style={styles.pdfReadyText}>{jobCode}{deviceName ? ` · ${deviceName}` : ''}</Text>
                <Text style={styles.pdfReadyText}>Create a shareable PDF for this repair record.</Text>
              </View>
            ) : (
              <>
            {/* Success Card */}
            <View style={styles.successCard}>
              <View style={styles.checkmarkContainer}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <Text style={styles.successTitle}>Job sheet created</Text>
              <Text style={styles.successMessage}>
                {jobCode} is ready. Your customer has been notified.
              </Text>
            </View>

            {/* Record Saved Notice */}
            <View style={styles.noticeContainer}>
              <View style={styles.noticeIconContainer}>
                <Image
                  source={require('../../../Assets/icons/shieldTick.png')}
                  style={styles.noticeIcon}
                />
              </View>
              <View style={styles.noticeContent}>
                <Text style={styles.noticeTitle}>Record saved</Text>
                <Text style={styles.noticeSubtitle}>
                  Your receipt and transaction details are ready.
                </Text>
              </View>
            </View>

            {/* Job Details Card */}
            <View style={styles.jobDetailsCard}>
              <Text style={styles.jobId}>{jobCode}</Text>
              <Text style={styles.deviceName}>{deviceName}</Text>
              <Text style={styles.jobInfo}>{jobInfo || customerName}</Text>
              <View style={styles.jobFooter}>
                <Text style={styles.price}>{price}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Active</Text>
                </View>
              </View>
            </View>

            <View style={styles.bottomSpacer} />
              </>
            )}
          </View>
        </ScrollView>

        {/* View Job Details Button */}
        <View style={styles.buttonContainer}>
          <StepNav onPrev={handleBackPress}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => setSizeModalVisible(true)}
            disabled={sharing}
          >
            {sharing ? (
              <ActivityIndicator color="#2F5DDC" />
            ) : (
              <Text style={styles.shareButtonText}>Share PDF (WhatsApp, email…)</Text>
            )}
          </TouchableOpacity>
          {!pdfOnly && (
            <TouchableOpacity style={styles.viewDetailsButton} onPress={handleViewJobDetails}>
              <Text style={styles.viewDetailsButtonText}>View job details</Text>
            </TouchableOpacity>
          )}
          </StepNav>
        </View>
        <PdfSizeModal
          visible={sizeModalVisible}
          onSelect={sizeKey => {
            setSizeModalVisible(false);
            handleSharePdf(sizeKey);
          }}
          onClose={() => setSizeModalVisible(false)}
        />
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
  content: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
  },
  pdfReadyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5EAF2',
    padding: 22,
    marginTop: 8,
  },
  pdfReadyTitle: { color: '#17243A', fontSize: 20, fontWeight: '800', marginBottom: 10 },
  pdfReadyText: { color: '#64748B', fontSize: 14, lineHeight: 21, marginTop: 3 },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkmarkContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkmark: {
    fontSize: 48,
    fontWeight: '700',
    color: '#2F5DDC',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  noticeContainer: {
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
  },
  noticeIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  noticeIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803D',
    marginBottom: 2,
  },
  noticeSubtitle: {
    fontSize: 12,
    color: '#8f8f8fff',
    lineHeight: 16,
  },
  jobDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  jobId: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
    marginBottom: 8,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  jobInfo: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
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
  shareButton: {
    borderWidth: 1.5,
    borderColor: '#2F5DDC',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F5DDC',
  },
  viewDetailsButton: {
    backgroundColor: '#2F5DDC',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewDetailsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

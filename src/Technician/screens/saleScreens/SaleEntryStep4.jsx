import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PdfSizeModal from '../../../Components/PdfSizeModal';
import { convertToPdf, pdfBodyStyle, pdfHeadStyle } from '../../../utils/pdfSizes';
import FileShare from 'react-native-share';
import RNPrint from 'react-native-print';
import ReactNativeBlobUtil from 'react-native-blob-util';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../../utils/responsive';
import { useSelector } from 'react-redux';

import { Colors } from '../../../Constants/Colors';
import StepNav from '../../../Components/StepNav';

export default function SaleEntryStep4({ onNavigate, buyerData, deviceData, saleData, sale: saleResult }) {
  const user = useSelector(state => state.auth.user) || {};
  // The sale flow saves every step into sale.draft; use it as the source of
  // truth so the invoice survives param resets (reloads / back-and-forth).
  const draft = useSelector(state => state.sale.draft) || {};
  const buyer = buyerData || draft.buyer || {};
  const device = deviceData || draft.device || {};
  const sale = saleData || draft.sale || {};

  const [invoiceId] = useState('INV-20261007-001'); // Mock invoice ID
  const [invoiceDate] = useState(new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: '2-digit'
  }));
  const [storeName] = useState(user.shop_name || 'Your Store');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [printing, setPrinting] = useState(false);

  const buildInvoiceHtml = sizeKey => `
    <html>
      <head>${pdfHeadStyle(sizeKey)}</head>
      <body style="${pdfBodyStyle(sizeKey)}">
        <h1 style="margin-bottom: 4px;">${invoiceId}</h1>
        <p style="color: #6B7280; margin-top: 0;">${invoiceDate} · ${storeName}</p>
        <h2 style="border-bottom: 1px solid #E5E7EB; padding-bottom: 8px;">Invoice</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #6B7280;">Buyer</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${buyer.buyerName || 'N/A'}</td></tr>
          <tr><td style="padding: 8px 0; color: #6B7280;">Device</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${deviceTitle}</td></tr>
          <tr><td style="padding: 8px 0; color: #6B7280;">IMEI</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${device.imei || 'N/A'}</td></tr>
          <tr><td style="padding: 8px 0; color: #6B7280;">Sale Amount</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">₹${sale.salePrice || '0'}</td></tr>
          <tr><td style="padding: 8px 0; color: #6B7280;">Payment</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${paymentMethodDisplay}</td></tr>
          ${sale.transactionId ? `<tr><td style="padding: 8px 0; color: #6B7280;">Transaction ID</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${sale.transactionId}</td></tr>` : ''}
          ${sale.warranty ? `<tr><td style="padding: 8px 0; color: #6B7280;">Warranty</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${sale.warranty}</td></tr>` : ''}
        </table>
      </body>
    </html>
  `;

  const generateInvoicePdf = sizeKey =>
    convertToPdf({ html: buildInvoiceHtml(sizeKey), fileName: invoiceId, sizeKey });

  const toFileUrl = path => (path.startsWith('file://') ? path : `file://${path}`);
  const toPlainPath = path => path.replace(/^file:\/\//, '');

  // Download / Print first ask which paper size to make the PDF for.
  const [pdfAction, setPdfAction] = useState(null); // 'download' | 'print' | null
  const [sharing, setSharing] = useState(false);
  const handlePdfSizeSelected = sizeKey => {
    const action = pdfAction;
    setPdfAction(null);
    if (action === 'download') handleDownloadPDF(sizeKey);
    else if (action === 'print') handlePrint(sizeKey);
  };

  // Saves the PDF onto the phone: Android -> Downloads folder,
  // iOS -> the "Save to Files" picker.
  const saveToDevice = async (srcPath, fileName) => {
    if (Platform.OS === 'ios') {
      await FileShare.open({
        url: toFileUrl(srcPath),
        type: 'application/pdf',
        filename: fileName,
        saveToFiles: true,
        failOnCancel: false,
      });
      return null;
    }

    if (Platform.Version >= 29) {
      // Android 10+: MediaStore Downloads collection, no permission needed.
      await ReactNativeBlobUtil.media.copyToMediaStore(
        { name: `${fileName}.pdf`, parentFolder: '', mime: 'application/pdf' },
        'Download',
        srcPath,
      );
      return `Downloads/${fileName}.pdf`;
    }

    // Android 9 and below: write to the public Download folder directly.
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new Error('Storage permission is needed to save the PDF.');
    }
    const dest = `${ReactNativeBlobUtil.fs.dirs.LegacyDownloadDir}/${fileName}.pdf`;
    if (await ReactNativeBlobUtil.fs.exists(dest)) {
      await ReactNativeBlobUtil.fs.unlink(dest);
    }
    await ReactNativeBlobUtil.fs.cp(srcPath, dest);
    await ReactNativeBlobUtil.media.addDownload({
      title: `${fileName}.pdf`,
      description: 'Sale invoice',
      mime: 'application/pdf',
      path: dest,
      notification: true,
    });
    return dest;
  };

  const handleDownloadPDF = async sizeKey => {
    if (generatingPdf) return;
    setGeneratingPdf(true);
    try {
      const file = await generateInvoicePdf(sizeKey);
      const srcPath = toPlainPath(file.filePath);
      const savedTo = await saveToDevice(srcPath, invoiceId);
      if (savedTo) {
        Alert.alert('Invoice downloaded', `Saved to ${savedTo}`, [
          { text: 'OK' },
          {
            text: 'Open',
            onPress: () =>
              ReactNativeBlobUtil.open
                .file(srcPath, { mime: 'application/pdf' })
                .catch(() => Alert.alert('No PDF viewer', 'Install a PDF viewer app to open the invoice.')),
          },
        ]);
      }
    } catch (err) {
      Alert.alert('Could not download PDF', err.message || 'Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Sends the invoice PDF (A4) with a text summary to WhatsApp, email, etc.
  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const invoiceText = `
Invoice: ${invoiceId}
Date: ${invoiceDate}
Store: ${storeName}

Buyer: ${buyer.buyerName || 'N/A'}
Device: ${deviceTitle}
Sale Amount: ₹${sale.salePrice || '0'}
Payment: ${paymentMethodDisplay}
      `.trim();

      const file = await generateInvoicePdf('a4');
      await FileShare.open({
        title: `Sale Invoice ${invoiceId}`,
        url: toFileUrl(file.filePath),
        type: 'application/pdf',
        filename: invoiceId,
        message: invoiceText,
        failOnCancel: false,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share invoice');
    } finally {
      setSharing(false);
    }
  };

  // Opens the system print dialog (Android print service / iOS AirPrint).
  const handlePrint = async sizeKey => {
    if (printing) return;
    setPrinting(true);
    try {
      const file = await generateInvoicePdf(sizeKey);
      await RNPrint.print({
        filePath: toPlainPath(file.filePath),
        jobName: `Invoice ${invoiceId}`,
      });
    } catch (err) {
      Alert.alert('Could not print', err.message || 'Please try again.');
    } finally {
      setPrinting(false);
    }
  };

  // The sale is already saved to the DB at step 3 (Create invoice); this just
  // shows the completion screen — no separate OTP confirmation call.
  const handleComplete = () => {
    if (onNavigate) {
      onNavigate('replaceStack', {
        target: 'saleCompleted',
        screenParams: {
          buyerData: buyer,
          deviceData: device,
          saleData: sale,
          invoiceId: invoiceId,
          sale: saleResult,
        },
      });
    }
  };

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const completedSteps = 4;
  const deviceTitle = `${device.brand || 'Device'} ${device.model || ''}`.trim();
  const paymentMethodDisplay =
    sale.paymentMode === 'cash' ? 'Cash' :
    sale.paymentMode === 'upi' ? 'UPI' :
    'Bank transfer';

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
            <Text style={styles.headerTitle}>Invoice</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>STEP {completedSteps} OF 6 · INVOICE</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '66.67%' }]} />
          </View>

          {/* Form Content */}
          <View style={styles.content}>
            {/* Invoice Header */}
            <View style={styles.invoiceHeader}>
              <Text style={styles.invoiceId}>{invoiceId}</Text>
              <Text style={styles.invoiceDate}>
                {invoiceDate} - {storeName}
              </Text>
            </View>

            {/* Invoice Card */}
            <View style={styles.invoiceCard}>
              <Text style={styles.invoiceCardTitle}>Invoice</Text>

              {/* Invoice Details */}
              <View style={styles.invoiceDetailRow}>
                <Text style={styles.invoiceLabel}>Buyer</Text>
                <Text style={styles.invoiceValue}>{buyer.buyerName || 'N/A'}</Text>
              </View>

              <View style={styles.invoiceDetailRow}>
                <Text style={styles.invoiceLabel}>Device</Text>
                <Text style={styles.invoiceValue}>{deviceTitle}</Text>
              </View>

              <View style={styles.invoiceDetailRow}>
                <Text style={styles.invoiceLabel}>IMEI</Text>
                <Text style={styles.invoiceValue}>{device.imei || 'N/A'}</Text>
              </View>

              <View style={styles.invoiceDetailRow}>
                <Text style={styles.invoiceLabel}>Sale Amount</Text>
                <Text style={styles.invoiceValue}>₹{sale.salePrice || '0'}</Text>
              </View>

              <View style={styles.invoiceDetailRow}>
                <Text style={styles.invoiceLabel}>Payment</Text>
                <Text style={styles.invoiceValue}>{paymentMethodDisplay}</Text>
              </View>

              {/* Transaction ID if applicable */}
              {sale.transactionId ? (
                <View style={styles.invoiceDetailRow}>
                  <Text style={styles.invoiceLabel}>Transaction ID</Text>
                  <Text style={styles.invoiceValue}>{sale.transactionId}</Text>
                </View>
              ) : null}

              {/* Warranty/Notes if available */}
              {sale.warranty ? (
                <View style={styles.invoiceDetailRowLarge}>
                  <Text style={styles.invoiceLabel}>Warranty</Text>
                  <Text style={styles.invoiceValueLarge}>{sale.warranty}</Text>
                </View>
              ) : null}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setPdfAction('download')}
                disabled={generatingPdf}
              >
                {generatingPdf ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <>
                    <Text style={styles.actionButtonTextPrimary}>Download</Text>
                    <Text style={styles.actionButtonTextSecondary}>PDF</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShare}
                disabled={sharing}
              >
                {sharing ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <Text style={styles.actionButtonText}>Share</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setPdfAction('print')}
                disabled={printing}
              >
                {printing ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <Text style={styles.actionButtonText}>Print</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        {/* Complete Sale Button */}
        <View style={styles.buttonContainer}>
          <StepNav onPrev={handleBackPress}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleComplete}
          >
            <Text style={styles.confirmButtonText}>Complete sale</Text>
          </TouchableOpacity>
          </StepNav>
        </View>
        <PdfSizeModal
          visible={pdfAction !== null}
          onSelect={handlePdfSizeSelected}
          onClose={() => setPdfAction(null)}
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
  invoiceHeader: {
    marginBottom: hp('2%'),
  },
  invoiceId: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('0.5%'),
  },
  invoiceDate: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '400',
  },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('2.5%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  invoiceCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('1.5%'),
    paddingBottom: hp('1%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  invoiceDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp('1%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  invoiceDetailRowLarge: {
    paddingVertical: hp('1%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  invoiceLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  invoiceValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
  },
  invoiceValueLarge: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
    marginTop: hp('0.5%'),
  },
  actionButtons: {
    flexDirection: 'row',
    gap: wp('3%'),
    marginBottom: hp('2%'),
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: wp('2.5%'),
    paddingVertical: hp('1.4%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionButtonTextPrimary: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  actionButtonTextSecondary: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  bottomSpacer: {
    height: hp('2%'),
  },
  buttonContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  confirmButton: {
    backgroundColor: '#2F5DDC',
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

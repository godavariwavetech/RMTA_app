import React, { useState } from 'react';
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
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RNHTMLtoPDF from 'react-native-html-to-pdf';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useSelector } from 'react-redux';

import { Colors } from '../../../Constants/Colors';

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

  const buildInvoiceHtml = () => `
    <html>
      <body style="font-family: Helvetica, Arial, sans-serif; padding: 24px; color: #1F2937;">
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

  const generateInvoicePdf = () =>
    RNHTMLtoPDF.convert({
      html: buildInvoiceHtml(),
      fileName: invoiceId,
      base64: false,
    });

  const handleDownloadPDF = async () => {
    if (generatingPdf) return;
    setGeneratingPdf(true);
    try {
      const file = await generateInvoicePdf();
      try {
        // Best-effort share sheet (works reliably on iOS; some Android
        // versions restrict sharing raw file:// paths).
        await Share.share({
          title: `Sale Invoice ${invoiceId}`,
          url: Platform.OS === 'ios' ? file.filePath : `file://${file.filePath}`,
          message: Platform.OS === 'android' ? `Invoice saved to ${file.filePath}` : undefined,
        });
      } catch (shareErr) {
        Alert.alert('PDF saved', `Saved to:\n${file.filePath}`);
      }
    } catch (err) {
      Alert.alert('Could not create PDF', err.message || 'Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleShare = async () => {
    try {
      const invoiceText = `
Invoice: ${invoiceId}
Date: ${invoiceDate}
Store: ${storeName}

SALE INVOICE DETAILS:
Buyer: ${buyer.buyerName || 'N/A'}
Device: ${deviceTitle}
IMEI: ${device.imei || 'N/A'}
Sale Amount: ₹${sale.salePrice || '0'}
Payment: ${paymentMethodDisplay}${sale.transactionId ? `\nTransaction ID: ${sale.transactionId}` : ''}${sale.warranty ? `\nNotes: ${sale.warranty}` : ''}
      `.trim();

      await Share.share({
        message: invoiceText,
        title: `Sale Invoice ${invoiceId}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share invoice');
    }
  };

  // No dedicated print library — generate the same PDF and hand it to the
  // share sheet, where most Android print services accept a PDF directly.
  const handlePrint = async () => {
    if (printing) return;
    setPrinting(true);
    try {
      const file = await generateInvoicePdf();
      try {
        await Share.share({
          title: `Print Invoice ${invoiceId}`,
          url: Platform.OS === 'ios' ? file.filePath : `file://${file.filePath}`,
          message: Platform.OS === 'android' ? `Open this PDF and choose Print: ${file.filePath}` : undefined,
        });
      } catch (shareErr) {
        Alert.alert('PDF saved', `Open this file and print from there:\n${file.filePath}`);
      }
    } catch (err) {
      Alert.alert('Could not prepare for printing', err.message || 'Please try again.');
    } finally {
      setPrinting(false);
    }
  };

  // The sale is already saved to the DB at step 3 (Create invoice); this just
  // shows the completion screen — no separate OTP confirmation call.
  const handleComplete = () => {
    if (onNavigate) {
      onNavigate('saleCompleted', {
        buyerData: buyer,
        deviceData: device,
        saleData: sale,
        invoiceId: invoiceId,
        sale: saleResult,
      });
    }
  };

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('saleEntryStep3');
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
                onPress={handleDownloadPDF}
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
              >
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handlePrint}
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
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleComplete}
          >
            <Text style={styles.confirmButtonText}>Complete sale</Text>
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

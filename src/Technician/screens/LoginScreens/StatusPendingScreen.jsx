import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../../utils/responsive';
import { Colors } from '../../../Constants/Colors';

// Shown after a successful registration whose membership_status is 'pending'.
// Communicates that the account is submitted and awaiting admin approval.
export default function StatusPendingScreen({ onNavigate }) {
  const handleBackToLogin = () => {
    if (onNavigate) {
      // Registration here is for the Admin login flow, so preselect the
      // Admin login tab on the Login screen.
      onNavigate('login', { loginMode: 'admin' });
    }
  };

  return (
    <>
      <StatusBar
        backgroundColor="#F5F5F5"
        barStyle="dark-content"
        translucent={true}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Image
            source={require('../../../Assets/images/appLogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Status badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>⏳</Text>
          </View>

          <Text style={styles.title}>Registration submitted</Text>

          <Text style={styles.message}>
            Thank you for registering with RMTA. Your details have been submitted
            successfully and are currently pending review. Our team will verify
            your information and approve your account shortly.
          </Text>

          <Text style={styles.subMessage}>
            You'll be able to sign in once an administrator approves your
            membership.
          </Text>

          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusPillText}>Awaiting admin approval</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleBackToLogin}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Back to login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    paddingHorizontal: wp('8%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: wp('24%'),
    height: hp('10%'),
    marginBottom: hp('3%'),
  },
  badge: {
    width: wp('22%'),
    height: wp('22%'),
    borderRadius: wp('11%'),
    backgroundColor: '#FFF7E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('3%'),
    borderWidth: 1,
    borderColor: '#FDE4B8',
  },
  badgeIcon: {
    fontSize: wp('10%'),
  },
  title: {
    fontSize: wp('5.5%'),
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: hp('1.5%'),
  },
  message: {
    fontSize: wp('3.8%'),
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: hp('3%'),
    marginBottom: hp('1.5%'),
  },
  subMessage: {
    fontSize: wp('3.5%'),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: hp('2.7%'),
    marginBottom: hp('3%'),
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('6%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusDot: {
    width: wp('2.2%'),
    height: wp('2.2%'),
    borderRadius: wp('1.1%'),
    backgroundColor: '#F59E0B',
    marginRight: wp('2%'),
  },
  statusPillText: {
    fontSize: wp('3.3%'),
    fontWeight: '600',
    color: '#92400E',
  },
  footer: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  primaryButton: {
    paddingVertical: hp('1.6%'),
    borderRadius: wp('2.5%'),
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  primaryButtonText: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

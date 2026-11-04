import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../../utils/responsive';
import { Colors } from '../../../Constants/Colors';
import { useI18n, LANGUAGES } from '../../../i18n';

export default function IntroScreen({ onNavigate }) {
  const { t, language } = useI18n();
  const handleGetStarted = () => {
    if (onNavigate) {
      onNavigate('login'); // Navigate to login screen
    }
  };

  const handleFlowAccountLock = () => {
    // Handle Flow / Account Lock navigation if needed
    console.log('Flow / Account Lock tapped');
  };

  return (
    <>
      <StatusBar
        backgroundColor={Colors.primary}
        barStyle="light-content"
        translucent={true}
      />
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.languageButton} onPress={() => onNavigate && onNavigate('language')}>
          <Text style={styles.languageButtonText}>
            {t('language')} · {LANGUAGES.find(item => item.code === language)?.label || 'English'}
          </Text>
        </TouchableOpacity>
        
          {/* Content Container */}
          <View style={styles.contentContainer}>
            {/* Logo Section */}
            <View style={styles.logoSection}>
              <Image
                source={require('../../../Assets/images/appLogo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Tagline Section */}
            <View style={styles.taglineSection}>
              <Text style={styles.taglineMain}>{t('taglineMain')}</Text>
              <Text style={styles.taglineSecondary}>{t('taglineSecondary')}</Text>
            </View>

            {/* Organization Section */}
            <View style={styles.organizationSection}>
              <Text style={styles.organizationName}>Rajamahendravaram</Text>
              <Text style={styles.organizationSubtitle}>
                Mobile Trade Association
              </Text>
            </View>

            {/* Badge Section */}
            <View style={styles.badgeSection}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  Trusted • Connected • Verified
                </Text>
              </View>
            </View>

            {/* Spacer */}
            <View style={styles.spacer} />

            {/* Get Started Button */}
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={handleGetStarted}
            >
              <Text style={styles.getStartedButtonText}>{t('getStarted')}</Text>
            </TouchableOpacity>

            {/* Flow / Account Lock Link */}
            {/* <TouchableOpacity
              style={styles.flowAccountLockButton}
              onPress={handleFlowAccountLock}
            >
              <Text style={styles.flowAccountLockText}>Flow / Account Lock</Text>
            </TouchableOpacity> */}
          </View>
        {/* </ImageBackground> */}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  languageButton: {
    alignSelf: 'flex-end',
    marginTop: hp('1%'),
    marginRight: wp('5%'),
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  languageButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
    paddingTop: hp('5%'),
    paddingBottom: hp('5%'),
  },
  logoSection: {
    alignItems: 'center',
    marginTop: hp('8%'),
  },
  logo: {
    width: wp('40%'),
    height: hp('20%'),
  },
  taglineSection: {
    alignItems: 'center',
    marginTop: hp('1%'),
  },
  taglineMain: {
    fontSize: wp('7%'),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    // lineHeight: hp('5%'),
  },
  taglineSecondary: {
    fontSize: wp('7%'),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    // lineHeight: hp('5%'),
  },
  organizationSection: {
    alignItems: 'center',
    marginTop: hp('3%'),
  },
  organizationName: {
    fontSize: wp('4%'),
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  organizationSubtitle: {
    fontSize: wp('3.8%'),
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: hp('0.5%'),
  },
  badgeSection: {
    marginTop: hp('3%'),
  },
  badge: {
    backgroundColor: '#FCA311',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    borderRadius: wp('6%'),
    alignItems: 'center',
  },
  badgeText: {
    fontSize: wp('3%'),
    fontWeight: '600',
    color: '#363636ff',
    textAlign: 'center',
  },
  spacer: {
    flex: 1,
  },
  getStartedButton: {
    backgroundColor: '#FCA311',
    width: '100%',
    paddingVertical: hp('1.5%'),
    borderRadius: wp('3%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('2%'),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  getStartedButtonText: {
    fontSize: wp('4.5%'),
    fontWeight: '600',
    color: '#272727ff',
  },
  flowAccountLockButton: {
    paddingVertical: hp('1.5%'),
  },
  flowAccountLockText: {
    fontSize: wp('3.5%'),
    color: '#FFFFFF',
    textAlign: 'center',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});

import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  StatusBar,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../utils/responsive';
import { useDispatch, useSelector } from 'react-redux';
import { Colors } from '../../Constants/Colors';
import { fetchTechnicians } from '../../redux/slices/techniciansSlice';
import useRefresh from '../../utils/useRefresh';

export default function AdminHomeScreen({ onNavigate }) {
  const { tick, refreshControl } = useRefresh();
  const dispatch = useDispatch();
  // Active/inactive technician counts for the dashboard stat cards.
  const { counts } = useSelector(state => state.technicians);

  // Refresh the counts whenever the dashboard is shown.
  useEffect(() => {
    dispatch(fetchTechnicians());
  }, [dispatch, tick]);

  const handleReviewApprovals = () => {
    if (onNavigate) {
      onNavigate('memberApproval');
    }
  };

  const handleTechnicians = () => {
    if (onNavigate) {
      onNavigate('technicianList');
    }
  };

  const handleJobMonitoring = () => {
    if (onNavigate) {
      onNavigate('adminJobMonitoring');
    }
  };

  const handlePurchaseSaleMonitoring = () => {
    if (onNavigate) {
      onNavigate('purchaseAndSaleMonitoring');
    }
  };

  const handleReports = () => {
    if (onNavigate) {
      onNavigate('adminReports');
    }
  };

  const menuItems = [
    {
      id: 1,
      icon: require('../../Assets/icons/profile.png'),
      title: 'Technicians',
      subtitle: 'Review membership and access',
      onPress: handleTechnicians,
    },
    {
      id: 2,
      icon: require('../../Assets/icons/clipboard.png'),
      title: 'Job monitoring',
      subtitle: 'Display progress across members',
      onPress: handleJobMonitoring,
    },
    {
      id: 3,
      icon: require('../../Assets/icons/wallet.png'),
      title: 'Purchase & sale monitoring',
      subtitle: 'Association transaction overview',
      onPress: handlePurchaseSaleMonitoring,
    },
    {
      id: 4,
      icon: require('../../Assets/bottomTabIcons/reports.png'),
      title: 'Reports',
      subtitle: 'Performance and exports',
      onPress: handleReports,
    },
  ];

  return (
    <>
      <StatusBar
        backgroundColor="#F5F5F5"
        barStyle="dark-content"
        translucent={true}
      />
      <SafeAreaView style={styles.container}>
        {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <TouchableOpacity
              onPress={() => onNavigate('adminProfile')}
              style={styles.profileButton}
            >
              <Image
                source={require('../../Assets/icons/profile.png')}
                style={styles.profileIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        <ScrollView refreshControl={refreshControl} showsVerticalScrollIndicator={false}>


          {/* Association Overview Card */}
          <View style={styles.overviewCard}>
            <ImageBackground
              source={require('../../Assets/images/LoginBgImg.png')}
              style={styles.overviewCardContent}
              resizeMode="cover"
            >
              <View style={styles.overviewCardOverlay} />

              <View style={styles.overviewCardTextContainer}>
                <Image
                  source={require('../../Assets/images/appLogo.png')}
                  style={styles.overviewLogo}
                  resizeMode="contain"
                />
                <Text style={styles.overviewTitle}>Association overview</Text>
                <Text style={styles.overviewSubtitle}>
                  Keep members verified and operations moving.
                </Text>
              </View>
            </ImageBackground>
          </View>

          {/* Stats Cards — driven by the technicians list (technician_status) */}
          <View style={styles.statsContainer}>
            <TouchableOpacity
              style={styles.statCard}
              onPress={handleTechnicians}
              activeOpacity={0.8}
            >
              <Text style={styles.statNumber}>{counts.active}</Text>
              <Text style={styles.statLabel}>Active members</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statCard}
              onPress={handleTechnicians}
              activeOpacity={0.8}
            >
              <Text style={styles.statNumber}>{counts.inactive}</Text>
              <Text style={styles.statLabel}>Inactive members</Text>
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View style={styles.menuItemIconContainer}>
                  <Image
                    source={item.icon}
                    style={styles.menuItemIcon}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
                <Text style={styles.menuItemChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Review Approvals Button */}
          {/* <View style={styles.actionButtonContainer}>
            <TouchableOpacity
              style={styles.reviewApprovalsButton}
              onPress={handleReviewApprovals}
            >
              <Text style={styles.reviewApprovalsButtonText}>
                Review approvals
              </Text>
            </TouchableOpacity>
          </View> */}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: wp('6%'),
    fontWeight: '700',
    color: '#1F2937',
  },
  profileButton: {
    width: wp('11%'),
    height: wp('11%'),
    borderRadius: wp('5.5%'),
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  profileIcon: {
    width: wp('6%'),
    height: wp('6%'),
    tintColor: Colors.primary,
  },
  overviewCard: {
    marginHorizontal: wp('4%'),
    marginVertical: hp('2%'),
    borderRadius: wp('4%'),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  overviewCardContent: {
    paddingVertical: hp('3%'),
    paddingHorizontal: wp('4%'),
    position: 'relative',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  overviewCardOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(7, 26, 61, 0.6)',
  },
  overviewCardTextContainer: {
    zIndex: 1,
    paddingVertical: hp('1%'),
  },
  overviewLogo: {
    width: wp('15%'),
    height: hp('8%'),
    marginBottom: hp('1%'),
  },
  overviewTitle: {
    fontSize: wp('6%'),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: hp('0.5%'),
  },
  overviewSubtitle: {
    fontSize: wp('3.5%'),
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: hp('2.3%'),
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: wp('4%'),
    marginVertical: hp('2%'),
    gap: wp('3%'),
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  statNumber: {
    fontSize: wp('6%'),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('0.5%'),
  },
  statLabel: {
    fontSize: wp('3%'),
    fontWeight: '500',
    color: '#6B7280',
  },
  menuContainer: {
    marginHorizontal: wp('4%'),
    marginVertical: hp('1%'),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    paddingVertical: hp('1.8%'),
    paddingHorizontal: wp('3%'),
    marginVertical: hp('1%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  menuItemIconContainer: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('3%'),
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  menuItemIcon: {
    width: wp('6%'),
    height: wp('6%'),
    tintColor: '#5B8DEE',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: hp('0.3%'),
  },
  menuItemSubtitle: {
    fontSize: wp('3%'),
    fontWeight: '400',
    color: '#6B7280',
  },
  menuItemChevron: {
    fontSize: wp('6%'),
    color: '#D1D5DB',
    marginLeft: wp('2%'),
  },
  actionButtonContainer: {
    marginHorizontal: wp('4%'),
    marginVertical: hp('3%'),
  },
  reviewApprovalsButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  reviewApprovalsButtonText: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: hp('2%'),
  },
});

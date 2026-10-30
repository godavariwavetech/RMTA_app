import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import { Colors } from '../../Constants/Colors';

export default function JobTimelineScreen({ onNavigate, initialTab = 'timeline' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('jobDetails');
    }
  };

  const handleViewRepairProgress = () => {
    // Navigate to quality check screen
    if (onNavigate) {
      onNavigate('qualityCheck');
    }
  };

  const tabs = ['Overview', 'Repair', 'Timeline'];

  const timelineEvents = [
    {
      id: 1,
      title: 'Job created',
      time: 'Today, 09:20 AM',
      status: 'completed',
    },
    {
      id: 2,
      title: 'Repair in progress',
      time: 'Today, 10:15 AM',
      status: 'completed',
    },
    {
      id: 3,
      title: 'Quality check',
      time: 'Pending',
      status: 'pending',
    },
  ];

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
            <Text style={styles.headerTitle}>Job Timeline</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Tab Navigation */}
          {/* <View style={styles.tabContainer}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.toLowerCase()}
                style={[
                  styles.tab,
                  activeTab === tab.toLowerCase() && styles.tabActive,
                ]}
                onPress={() => {
                  const tabType = tab.toLowerCase();
                  if (tabType === 'overview') {
                    console.log('🚀 Overview tab clicked, navigating to jobDetails');
                    onNavigate('jobDetails');
                  } else if (tabType === 'repair') {
                    console.log('🚀 Repair tab clicked, navigating to repairProgress');
                    onNavigate('repairProgress', { initialTab: 'repair' });
                  } else if (tabType === 'timeline') {
                    setActiveTab('timeline');
                  }
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.toLowerCase() && styles.tabTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View> */}

          {/* Status Badge */}
          <View style={styles.statusContainer}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>In progress</Text>
            </View>
          </View>

          {/* Content Section */}
          <View style={styles.content}>
            <>
              <Text style={styles.sectionTitle}>Every step, recorded</Text>
              <View style={styles.timelineCard}>
                {timelineEvents.map((event, index) => (
                  <View key={event.id}>
                    <View style={styles.timelineItem}>
                      <View style={styles.timelineMarker}>
                        {event.status === 'completed' ? (
                          <Text style={styles.timelineCheckmark}>✓</Text>
                        ) : (
                          <Text style={styles.timelineClockIcon}>🕐</Text>
                        )}
                      </View>
                      <View style={styles.timelineInfo}>
                        <Text style={styles.timelineTitle}>{event.title}</Text>
                        <Text
                          style={[
                            styles.timelineTime,
                            event.status === 'pending' && styles.timelineTimePending,
                          ]}
                        >
                          {event.time}
                        </Text>
                      </View>
                    </View>
                    {index < timelineEvents.length - 1 && (
                      <View style={styles.timelineLine} />
                    )}
                  </View>
                ))}
              </View>
            </>

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        {/* Send to Quality Check Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.viewProgressButton}
            onPress={handleViewRepairProgress}
          >
            <Text style={styles.viewProgressButtonText}>Send to quality check</Text>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F7F9FC',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1.5%'),
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabActive: {
    backgroundColor: '#2F5DDC',
    borderColor: '#2F5DDC',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  statusContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1.5%'),
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  content: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 24,
  },
  tabContent: {
    marginBottom: 24,
  },
  tabContentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineMarker: {
    width: 40,
    alignItems: 'center',
    paddingTop: 2,
  },
  timelineCheckmark: {
    fontSize: 18,
    color: '#10B981',
    fontWeight: '600',
  },
  timelineClockIcon: {
    fontSize: 18,
  },
  timelineLine: {
    marginLeft: 20,
    width: 2,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  timelineInfo: {
    flex: 1,
    paddingVertical: 8,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  timelineTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  timelineTimePending: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  overviewLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  overviewValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  repairCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  repairRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  repairLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  repairValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
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
  viewProgressButton: {
    backgroundColor: '#2F5DDC',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewProgressButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

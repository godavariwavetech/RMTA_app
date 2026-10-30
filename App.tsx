import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Alert, AppState, BackHandler, KeyboardAvoidingView, Platform, View, useWindowDimensions } from 'react-native';
import { Colors } from './src/Constants/Colors';
import { APP_MAX_WIDTH } from './src/utils/responsive';
import { AppModalHost, installAppModalAlerts } from './src/utils/appModal';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { I18nProvider, useI18n } from './src/i18n';
import LanguageScreen from './src/Technician/screens/LanguageScreen';
import { useState, useEffect, useRef } from 'react';
import { initNotifications, getFcmToken, onFcmTokenRefresh } from './src/services/notifications';
import { ENDPOINTS } from './src/Constants/config';
import { postJson, logoutUser } from './src/redux/slices/authSlice';
import { store } from './src/redux/store';
import { hydrateUser } from './src/redux/slices/authSlice';
import { loadUser, clearUser } from './src/utils/authStorage';
import IntroScreen from './src/Technician/screens/LoginScreens/IntroScreen';
import LoginScreen from './src/Technician/screens/LoginScreens/LoginScreen';
import RegisterScreen from './src/Technician/screens/LoginScreens/RegisterScreen';
import StatusPendingScreen from './src/Technician/screens/LoginScreens/StatusPendingScreen';
import TechnicianList from './src/Admin/screens/TechnicianList';
import AddTechnician from './src/Admin/screens/AddTechnician';
import AdminProfileScreen from './src/Admin/screens/AdminProfileScreen';
import AdminJobMonitoring from './src/Admin/screens/AdminJobMonitoring';
import PurchaseAndSaleMonitoring from './src/Admin/screens/PurchaseAndSaleMonitoring';
import AdminReports from './src/Admin/screens/AdminReports';
import MemberApproval from './src/Admin/screens/MemberApproval';
import TechnicianDetails from './src/Admin/screens/TechnicianDetails';
import ForgotPassStep1 from './src/Admin/screens/forgotPassStep1';
import ForgotPassStep2 from './src/Admin/screens/forgotPassStep2';
import ForgotPassStep3 from './src/Admin/screens/forgotPassStep3';
import TechnicianHomeScreen from './src/Technician/screens/TechnicianHomeScreen';
import NotificationsScreen from './src/Technician/screens/NotificationsScreen';
import TechnicianProfileScreen from './src/Technician/screens/TechnicianProfileScreen';
import TechnicianSettingsScreen from './src/Technician/screens/TechnicianSettingsScreen';
import JobSheetList from './src/Technician/screens/jobSheetList';
import JobDetailsScreen from './src/Technician/screens/jobDetailsScreen';
import RepairProgressScreen from './src/Technician/screens/repairProgressScreen';
import QualityCheckScreen from './src/Technician/screens/qualityCheckScreen';
import HandoverOTPScreen from './src/Technician/screens/handoverOTPScreen';
import HandoverCompleted from './src/Technician/screens/handoverCompleted';
import CreateJobSheetStep1 from './src/Technician/screens/CreateJobSheetSteps/createJobSheetStep1';
import VerifyMobileNumber from './src/Technician/screens/verifyMobileNumber';
import CreateJobSheetStep2 from './src/Technician/screens/CreateJobSheetSteps/createJobSheetStep2';
import CreateJobSheetStep3 from './src/Technician/screens/CreateJobSheetSteps/createJobSheetStep3';
import CreateJobSheetStep4 from './src/Technician/screens/CreateJobSheetSteps/createJobSheetStep4';
import CreateJobSheetStep5 from './src/Technician/screens/CreateJobSheetSteps/createJobSheetStep5';
import CreateJobSheetStep7 from './src/Technician/screens/CreateJobSheetSteps/createJobSheetStep7';
import CreateJobSheetStep8 from './src/Technician/screens/CreateJobSheetSteps/createJobSheetStep8';
import JobTimelineScreen from './src/Technician/screens/jobTimeline';
import PurchaseEntryStep1 from './src/Technician/screens/purchaseScreens/purchaseEntryStep1';
import VerifySellerMobileNumber from './src/Technician/screens/purchaseScreens/VerifySellerMobileNumber';
import PurchaseEntryStep2 from './src/Technician/screens/purchaseScreens/purchaseEntryStep2';
import PurchaseEntryStep3 from './src/Technician/screens/purchaseScreens/purchaseEntryStep3';
import PurchaseEntryStep5 from './src/Technician/screens/purchaseScreens/purchaseEntryStep5';
import PurchaseEntryStep6 from './src/Technician/screens/purchaseScreens/purchaseEntryStep6';
import PurchaseEntryStep7 from './src/Technician/screens/purchaseScreens/purchaseEntryStep7';
import PurchaseEntryStep8 from './src/Technician/screens/purchaseScreens/purchaseEntryStep8';
import PurchaseAndSaleHistory from './src/Technician/screens/purchaseScreens/PurchaseAndSaleHistory';
import TransactionDetails from './src/Technician/screens/purchaseScreens/TransactionDetails';
import SaleEntryStep1 from './src/Technician/screens/saleScreens/SaleEntryStep1';
import VerifyBuyerMobileNumber from './src/Technician/screens/saleScreens/VerifyBuyerMobileNumber';
import SaleEntryStep2 from './src/Technician/screens/saleScreens/SaleEntryStep2';
import SaleEntryStep3 from './src/Technician/screens/saleScreens/SaleEntryStep3';
import SaleEntryStep4 from './src/Technician/screens/saleScreens/SaleEntryStep4';
import BuyerConfirmationOTP from './src/Technician/screens/saleScreens/BuyerConfirmationOTP';
import SaleCompleted from './src/Technician/screens/saleScreens/SaleCompleted';
// import PurchaseAndSaleHistory from './src/Technician/screens/purchaseScreens/PurchaseAndSaleHistory';
import MyDigitalId from './src/Technician/screens/IdentityVerification/MyDegitalId';
import ScanNFC from './src/Technician/screens/IdentityVerification/ScanNFC';
import NFCVerified from './src/Technician/screens/IdentityVerification/NFCVerified';
import MemberDetails from './src/Technician/screens/IdentityVerification/MemberDetails';
import ReportsScreen from './src/Technician/screens/ReportScreens/reportsScreen';
import ReportDetails from './src/Technician/screens/ReportScreens/reportDetails';
import ExportReport from './src/Technician/screens/ReportScreens/exportReport';
import ScanQR from './src/Technician/screens/ScanQrScreens/ScanQR';
import ValidQR from './src/Technician/screens/ScanQrScreens/ValidQR';
import InvalidQR from './src/Technician/screens/ScanQrScreens/InvalidQR';
import DeviceVerification from './src/Technician/screens/DeviceVerification/DeviceVerification';
import IMEIResult from './src/Technician/screens/DeviceVerification/IMEIResult';
import CEIRResult from './src/Technician/screens/DeviceVerification/CEIRResult';
import SupportUsersScreen from './src/Technician/screens/SupportUsersScreen';
import NotesScreen from './src/Technician/screens/NotesScreen';
import ChatScreen from './src/Technician/screens/ChatScreen';
import CustomerDirectoryScreen from './src/Technician/screens/CustomerDirectoryScreen';

installAppModalAlerts();

const keyboardAwareScreens = new Set([
  'createJobSheetStep1', 'createJobSheetStep2', 'createJobSheetStep3',
  'createJobSheetStep4', 'createJobSheetStep5',
  'createJobSheetStep7', 'createJobSheetStep8', 'verifyMobileNumber',
  'purchaseEntryStep1', 'verifySellerMobileNumber', 'purchaseEntryStep2',
  'purchaseEntryStep3', 'purchaseEntryStep5',
  'purchaseEntryStep6', 'purchaseEntryStep7', 'purchaseEntryStep8',
  'saleEntryStep1', 'verifyBuyerMobileNumber', 'saleEntryStep2',
  'saleEntryStep3', 'saleEntryStep4', 'buyerConfirmationOTP',
  'deviceVerification', 'supportUsers', 'notes', 'chat', 'customerDirectory',
]);

const screensWithTheirOwnKeyboardAvoider = new Set([
  'login', 'register', 'forgotPassStep1', 'forgotPassStep2', 'forgotPassStep3',
  'addTechnician',
]);

// Edge-to-edge: screens pad their content below the status bar, which leaves a
// light strip behind the (white) status-bar icons. Paint that strip in the app's
// header colour so the time/battery icons stay readable.
function StatusBarBackdrop() {
  const insets = useSafeAreaInsets();
  if (!insets.top) {
    return null;
  }
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: insets.top,
        backgroundColor: Colors.primary,
      }}
    />
  );
}


// Registers this device for push notifications on the server: every time the
// app opens with a logged-in member (restored session or fresh login), and again
// whenever Firebase issues a new token, send { player_id, member_id }.
function PlayerIdSync() {
  const memberId = useSelector((state: any) => state.auth?.user?.member_id);

  useEffect(() => {
    if (!memberId) {
      return undefined;
    }
    const send = async (token?: string) => {
      const playerId = token || (await getFcmToken());
      if (!playerId) {
        return;
      }
      try {
        await postJson(ENDPOINTS.POST_PLAYER_ID, { player_id: playerId, member_id: memberId });
      } catch (e: any) {
        console.warn('[FCM] player id sync failed', e?.message);
      }
    };
    send();
    const off = onFcmTokenRefresh(send);
    return () => off();
  }, [memberId]);

  return null;
}

// Account status check: POST { member_id } to loginstatusdata every time the Home
// screen is shown (app open, login, coming back from any other screen) and every
// time the app returns to the foreground.
// A status of 0 or 2 means the account is no longer allowed in, so the session is
// cleared and the member is sent to the login screen.
function pickStatus(data: any) {
  const row = Array.isArray(data?.data) ? data.data[0] : data?.data ?? data;
  const value = row?.status ?? row?.login_status ?? row?.membership_status ?? row?.member_status;
  if (value === undefined || value === null || value === '' || typeof value === 'boolean') {
    return undefined;
  }
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

function LoginStatusWatcher({ onLogout, isHome }: { onLogout: () => void; isHome: boolean }) {
  const dispatch = useDispatch<any>();
  const memberId = useSelector((state: any) => state.auth?.user?.member_id);
  const logoutRef = useRef(onLogout);
  logoutRef.current = onLogout;

  useEffect(() => {
    if (!memberId) {
      return undefined;
    }
    let loggingOut = false;
    const check = async () => {
      if (loggingOut) {
        return;
      }
      try {
        const { response, data } = await postJson(ENDPOINTS.LOGIN_STATUS_DATA, { member_id: memberId });
        if (!response.ok) {
          return;
        }
        const status = pickStatus(data);
        console.log('[loginStatus] status →', status);
        if (status === 0 || status === 2) {
          loggingOut = true;
          await dispatch(logoutUser());
          logoutRef.current();
          Alert.alert(
            'Signed out',
            'Your account is not active right now, so you have been logged out. Please contact your admin.',
          );
        }
      } catch (e: any) {
        // offline or server error: keep the session and try again next time
        console.warn('[loginStatus] check failed', e?.message);
      }
    };
    if (isHome) {
      check();
    }
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        check();
      }
    });
    return () => sub.remove();
  }, [memberId, dispatch, isHome]);

  return null;
}

function AppContent() {
  const { ready: i18nReady } = useI18n();
  // Tablets: draw the app in a centred phone-width column instead of stretching
  // every screen across the whole display.
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTabletScreen = Math.min(windowWidth, windowHeight) >= 600;
  const [currentScreen, setCurrentScreen] = useState<string>('intro');
  const [navigationParams, setNavigationParams] = useState<any>({});
  const [navigationHistory, setNavigationHistory] = useState<string[]>(['intro']);
  // Params each screen in the history was opened with, by history index, so
  // Back returns to the screen exactly as it was (e.g. Sales vs Purchases).
  const savedParams = useRef<Record<number, any>>({});
  // Block the first render until we've checked for a persisted session, so we
  // don't flash the IntroScreen before restoring a logged-in admin/technician.
  const [booting, setBooting] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      const user = await loadUser();
      if (user) {
        const active =
          Number(user.membership_status) === 1 ||
          String(user.membership_status).toLowerCase() === 'active';
        if (active) {
          const normalizedUser = { ...user };
          store.dispatch(hydrateUser(normalizedUser));
          setCurrentScreen('home');
          setNavigationHistory(['home']);
        } else {
          await clearUser();
        }
      }
      setBooting(false);
    })();
  }, []);

  // Push notifications (FCM shown through notifee) once the session is restored.
  useEffect(() => {
    if (booting) return undefined;
    let off: undefined | (() => void);
    initNotifications({
      onOpen: data => console.log('[FCM] notification opened', JSON.stringify(data)),
    })
      .then(fn => {
        off = fn;
      })
      .catch(e => console.warn('[FCM] init failed', e?.message));
    return () => off && off();
  }, [booting]);

  // The app uses a custom screen stack instead of a navigation library, so
  // Android's system back gesture must pop that stack explicitly.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navigationHistory.length <= 1) {
        return false;
      }

      const previousHistory = navigationHistory.slice(0, -1);
      setNavigationHistory(previousHistory);
      setCurrentScreen(previousHistory[previousHistory.length - 1]);
      setNavigationParams(savedParams.current[previousHistory.length - 1] || {});
      return true;
    });

    return () => subscription.remove();
  }, [navigationHistory]);

  const handleScreenNavigation = (screen: string, params?: any) => {
    if (screen === 'logout') {
      // A signed-out session must not retain authenticated screens in Back history.
      setNavigationParams({});
      setCurrentScreen('login');
      setNavigationHistory(['login']);
      return;
    }
    console.log('🔄 Navigation called:', screen, params);
    
    // Handle goBack action
    if (screen === 'goBack') {
      if (navigationHistory.length > 1) {
        const newHistory = navigationHistory.slice(0, -1);
        const previousScreen = newHistory[newHistory.length - 1];
        setNavigationHistory(newHistory);
        setCurrentScreen(previousScreen);
        setNavigationParams(savedParams.current[newHistory.length - 1] || {});
      }
      return;
    }

    const screenMap: Record<string, string> = {
      intro: 'intro',
      language: 'language',
      login: 'login',
      register: 'register',
      statusPending: 'statusPending',
      forgotPassword: 'forgotPassStep1',
      forgotPassStep2: 'forgotPassStep2',
      forgotPassStep3: 'forgotPassStep3',
      home: 'home',
      adminHome: 'home',
      technicianList: 'technicianList',
      addTechnician: 'addTechnician',
      adminProfile: 'adminProfile',
      technicianDetails: 'technicianDetails',
      adminJobMonitoring: 'adminJobMonitoring',
      purchaseAndSaleMonitoring: 'purchaseAndSaleMonitoring',
      adminReports: 'adminReports',
      memberApproval: 'memberApproval',
      jobs: 'jobs',
      add: 'add',
      reports: 'reports',
      profile: 'profile',
      notifications: 'notifications',
      settings: 'settings',
      jobDetails: 'jobDetails',
      repairProgress: 'repairProgress',
      jobTimeline: 'jobTimeline',
      qualityCheck: 'qualityCheck',
      handoverOTP: 'handoverOTP',
      handoverCompleted: 'handoverCompleted',
      createJobSheetStep1: 'createJobSheetStep1',
      verifyMobileNumber: 'verifyMobileNumber',
      createJobSheetStep2: 'createJobSheetStep2',
      createJobSheetStep3: 'createJobSheetStep3',
      createJobSheetStep4: 'createJobSheetStep4',
      createJobSheetStep5: 'createJobSheetStep5',
      createJobSheetStep7: 'createJobSheetStep7',
      createJobSheetStep8: 'createJobSheetStep8',
      purchaseEntryStep1: 'purchaseEntryStep1',
      verifySellerMobileNumber: 'verifySellerMobileNumber',
      purchaseEntryStep2: 'purchaseEntryStep2',
      purchaseEntryStep3: 'purchaseEntryStep3',
      purchaseEntryStep5: 'purchaseEntryStep5',
      purchaseEntryStep6: 'purchaseEntryStep6',
      purchaseEntryStep7: 'purchaseEntryStep7',
      purchaseEntryStep8: 'purchaseEntryStep8',
      viewPurchaseHistory: 'viewPurchaseHistory',
      saleEntryStep1: 'saleEntryStep1',
      verifyBuyerMobileNumber: 'verifyBuyerMobileNumber',
      saleEntryStep2: 'saleEntryStep2',
      saleEntryStep3: 'saleEntryStep3',
      saleEntryStep4: 'saleEntryStep4',
      buyerConfirmationOTP: 'buyerConfirmationOTP',
      saleCompleted: 'saleCompleted',
      viewSaleHistory: 'viewSaleHistory',
      myDigitalId: 'myDigitalId',
      scanNFC: 'scanNFC',
      nfcVerified: 'nfcVerified',
      memberDetails: 'memberDetails',
      reportDetails: 'reportDetails',
      exportReport: 'exportReport',
      purchaseAndSaleHistory: 'purchaseAndSaleHistory',
      transactionDetails: 'transactionDetails',
      scanQR: 'scanQR',
      validQR: 'validQR',
      invalidQR: 'invalidQR',
      deviceVerification: 'deviceVerification',
      imeiResult: 'imeiResult',
      ceirResult: 'ceirResult',
      supportUsers: 'supportUsers',
      notes: 'notes',
      chat: 'chat',
      customerDirectory: 'customerDirectory',
    };
    const newScreen = screenMap[screen] || 'home';
    const isPush =
      screen !== 'goBackTo' &&
      screen !== 'resetTo' &&
      screen !== 'replaceStack' &&
      navigationHistory[navigationHistory.length - 1] !== newScreen;
    if (isPush) {
      // Remember the screen we're leaving, with the params it was opened with.
      savedParams.current[navigationHistory.length - 1] = navigationParams;
    }
    setNavigationParams(params || {});
    if (screen === 'goBackTo' || screen === 'resetTo' || screen === 'replaceStack') {
      const targetScreen = screenMap[params?.target] || params?.target;
      if (!targetScreen) return;
      setCurrentScreen(targetScreen);
      setNavigationParams(params?.screenParams || {});
      if (screen === 'replaceStack') {
        // After submitting a form: drop the whole flow from history and keep
        // only `base` (default Home) under the result screen, so Back never
        // returns to the submitted form.
        savedParams.current = {};
        setNavigationHistory([...(params?.base || ['home']), targetScreen]);
      } else if (screen === 'resetTo') {
        savedParams.current = {};
        // Keep Home underneath so Back from e.g. the job list goes Home
        // instead of closing the app.
        setNavigationHistory(targetScreen === 'home' ? [targetScreen] : ['home', targetScreen]);
      } else {
        const targetIndex = navigationHistory.lastIndexOf(targetScreen);
        setNavigationHistory(
          targetIndex >= 0
            ? navigationHistory.slice(0, targetIndex + 1)
            : [targetScreen],
        );
      }
      return;
    }
    console.log('✅ Current screen changed to:', newScreen);
    setCurrentScreen(newScreen);
    if (
      newScreen === 'home' &&
      (currentScreen === 'login' || currentScreen === 'register')
    ) {
      // Authentication establishes a new root so Back cannot reopen login.
      setNavigationHistory(['home']);
      return;
    }
    // Add to navigation history if it's a new screen
    if (navigationHistory[navigationHistory.length - 1] !== newScreen) {
      setNavigationHistory([...navigationHistory, newScreen]);
    }
  };

  // Wait for the session check before rendering any screen.
  if (booting || !i18nReady) {
    return null;
  }

  return (
    <Provider store={store}>
    <SafeAreaProvider>
      <AppModalHost />
      <View style={{ flex: 1, alignItems: 'center', backgroundColor: isTabletScreen ? '#E5E9F0' : undefined }}>
      <View style={{ flex: 1, width: '100%', maxWidth: isTabletScreen ? APP_MAX_WIDTH : undefined, overflow: 'hidden' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          keyboardAwareScreens.has(currentScreen) &&
          !screensWithTheirOwnKeyboardAvoider.has(currentScreen)
            ? (Platform.OS === 'ios' ? 'padding' : 'height')
            : undefined
        }
        keyboardVerticalOffset={0}
      >
      {currentScreen === 'language' ? (
        <LanguageScreen onNavigate={handleScreenNavigation} fromSettings={!!navigationParams.fromSettings} />
      ) : currentScreen === 'intro' ? (
        <IntroScreen onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'login' ? (
        <LoginScreen
          onNavigate={handleScreenNavigation}
          initialMode={navigationParams.loginMode}
        />
      ) : currentScreen === 'register' ? (
        <RegisterScreen
          onNavigate={handleScreenNavigation}
          userInd={navigationParams.user_ind}
        />
      ) : currentScreen === 'statusPending' ? (
        <StatusPendingScreen onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'forgotPassStep1' ? (
        <ForgotPassStep1 onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'forgotPassStep2' ? (
        <ForgotPassStep2
          onNavigate={handleScreenNavigation}
          mobile={navigationParams.mobile}
        />
      ) : currentScreen === 'forgotPassStep3' ? (
        <ForgotPassStep3
          onNavigate={handleScreenNavigation}
          mobile={navigationParams.mobile}
          otp={navigationParams.otp}
        />
      ) : currentScreen === 'home' ? (
        <TechnicianHomeScreen onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'technicianList' ? (
        <TechnicianList onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'addTechnician' ? (
        <AddTechnician onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'adminProfile' ? (
        <AdminProfileScreen onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'technicianDetails' ? (
        <TechnicianDetails
          onNavigate={handleScreenNavigation}
          technician={navigationParams.technician}
        />
      ) : currentScreen === 'adminJobMonitoring' ? (
        <AdminJobMonitoring onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'purchaseAndSaleMonitoring' ? (
        <PurchaseAndSaleMonitoring onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'adminReports' ? (
        <AdminReports onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'memberApproval' ? (
        <MemberApproval onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'notifications' ? (
        <NotificationsScreen onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'profile' ? (
        <TechnicianProfileScreen onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'settings' ? (
        <TechnicianSettingsScreen onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'jobs' ? (
        <JobSheetList onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'jobDetails' ? (
        <JobDetailsScreen
          onNavigate={handleScreenNavigation}
          jobId={navigationParams.jobId}
          jobSummary={navigationParams.jobSummary}
        />
      ) : currentScreen === 'repairProgress' ? (
        <RepairProgressScreen key={`repair-${navigationParams.initialTab}`} onNavigate={handleScreenNavigation} initialTab={navigationParams.initialTab} />
      ) : currentScreen === 'jobTimeline' ? (
        <JobTimelineScreen key={`timeline-${navigationParams.initialTab}`} onNavigate={handleScreenNavigation} initialTab={navigationParams.initialTab} />
      ) : currentScreen === 'qualityCheck' ? (
        <QualityCheckScreen onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'handoverOTP' ? (
        <HandoverOTPScreen onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'handoverCompleted' ? (
        <HandoverCompleted onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'createJobSheetStep1' ? (
        <CreateJobSheetStep1 onNavigate={handleScreenNavigation} fresh={navigationParams.fresh} />
      ) : currentScreen === 'verifyMobileNumber' ? (
        <VerifyMobileNumber onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'createJobSheetStep2' ? (
        <CreateJobSheetStep2 onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'createJobSheetStep3' ? (
        <CreateJobSheetStep3 onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'createJobSheetStep4' ? (
        <CreateJobSheetStep4 onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'createJobSheetStep5' ? (
        <CreateJobSheetStep5 onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'createJobSheetStep7' ? (
        <CreateJobSheetStep7 onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'createJobSheetStep8' ? (
        <CreateJobSheetStep8
          onNavigate={handleScreenNavigation}
          job={navigationParams.job}
          summary={navigationParams.summary}
          pdfOnly={!!navigationParams.pdfOnly}
        />
      ) : currentScreen === 'purchaseEntryStep1' ? (
        <PurchaseEntryStep1 onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'verifySellerMobileNumber' ? (
        <VerifySellerMobileNumber onNavigate={handleScreenNavigation} sellerData={navigationParams.sellerData} />
      ) : currentScreen === 'purchaseEntryStep2' ? (
        <PurchaseEntryStep2 onNavigate={handleScreenNavigation} sellerData={navigationParams.sellerData} />
      ) : currentScreen === 'purchaseEntryStep3' ? (
        <PurchaseEntryStep3 onNavigate={handleScreenNavigation} sellerData={navigationParams.sellerData} deviceData={navigationParams.deviceData} />
      ) : currentScreen === 'purchaseEntryStep5' ? (
        <PurchaseEntryStep5 onNavigate={handleScreenNavigation} sellerData={navigationParams.sellerData} deviceData={navigationParams.deviceData} imeiData={navigationParams.imeiData} ceirVerified={navigationParams.ceirVerified} />
      ) : currentScreen === 'purchaseEntryStep6' ? (
        <PurchaseEntryStep6 onNavigate={handleScreenNavigation} sellerData={navigationParams.sellerData} deviceData={navigationParams.deviceData} imeiData={navigationParams.imeiData} ceirVerified={navigationParams.ceirVerified} conditionData={navigationParams.conditionData} />
      ) : currentScreen === 'purchaseEntryStep7' ? (
        <PurchaseEntryStep7 onNavigate={handleScreenNavigation} sellerData={navigationParams.sellerData} deviceData={navigationParams.deviceData} imeiData={navigationParams.imeiData} ceirVerified={navigationParams.ceirVerified} conditionData={navigationParams.conditionData} priceData={navigationParams.priceData} />
      ) : currentScreen === 'purchaseEntryStep8' ? (
        <PurchaseEntryStep8 onNavigate={handleScreenNavigation} sellerData={navigationParams.sellerData} deviceData={navigationParams.deviceData} imeiData={navigationParams.imeiData} ceirVerified={navigationParams.ceirVerified} conditionData={navigationParams.conditionData} priceData={navigationParams.priceData} />
      ) : currentScreen === 'viewPurchaseHistory' ? (
        <PurchaseAndSaleHistory onNavigate={handleScreenNavigation} initialTab="purchases" singleTab />
      ) : currentScreen === 'saleEntryStep1' ? (
        <SaleEntryStep1 onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'verifyBuyerMobileNumber' ? (
        <VerifyBuyerMobileNumber onNavigate={handleScreenNavigation} buyerData={navigationParams.buyerData} />
      ) : currentScreen === 'saleEntryStep2' ? (
        <SaleEntryStep2 onNavigate={handleScreenNavigation} buyerData={navigationParams.buyerData} />
      ) : currentScreen === 'saleEntryStep3' ? (
        <SaleEntryStep3 onNavigate={handleScreenNavigation} buyerData={navigationParams.buyerData} deviceData={navigationParams.deviceData} />
      ) : currentScreen === 'saleEntryStep4' ? (
        <SaleEntryStep4 onNavigate={handleScreenNavigation} buyerData={navigationParams.buyerData} deviceData={navigationParams.deviceData} saleData={navigationParams.saleData} sale={navigationParams.sale} />
      ) : currentScreen === 'buyerConfirmationOTP' ? (
        <BuyerConfirmationOTP onNavigate={handleScreenNavigation} buyerData={navigationParams.buyerData} deviceData={navigationParams.deviceData} saleData={navigationParams.saleData} invoiceId={navigationParams.invoiceId} />
      ) : currentScreen === 'saleCompleted' ? (
        <SaleCompleted onNavigate={handleScreenNavigation} buyerData={navigationParams.buyerData} deviceData={navigationParams.deviceData} saleData={navigationParams.saleData} invoiceId={navigationParams.invoiceId} sale={navigationParams.sale} />
      ) : currentScreen === 'viewSaleHistory' ? (
        <PurchaseAndSaleHistory onNavigate={handleScreenNavigation} initialTab="sales" singleTab />
      ) : currentScreen === 'myDigitalId' ? (
        <MyDigitalId onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'scanNFC' ? (
        <ScanNFC onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'nfcVerified' ? (
        <NFCVerified onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'memberDetails' ? (
        <MemberDetails onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'reports' ? (
        <ReportsScreen onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'reportDetails' ? (
        <ReportDetails onNavigate={handleScreenNavigation} reportType={navigationParams.reportType} />
      ) : currentScreen === 'exportReport' ? (
        <ExportReport onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'purchaseAndSaleHistory' ? (
        <PurchaseAndSaleHistory onNavigate={handleScreenNavigation} initialTab={navigationParams.initialTab || 'purchases'} singleTab={!!navigationParams.singleTab} />
      ) : currentScreen === 'transactionDetails' ? (
        <TransactionDetails onNavigate={handleScreenNavigation} type={navigationParams.type} item={navigationParams.item} />
      ) : currentScreen === 'scanQR' ? (
        <ScanQR onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'validQR' ? (
        <ValidQR onNavigate={handleScreenNavigation} scannedCode={navigationParams.scannedCode} />
      ) : currentScreen === 'invalidQR' ? (
        <InvalidQR onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'deviceVerification' ? (
        <DeviceVerification onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'imeiResult' ? (
        <IMEIResult onNavigate={handleScreenNavigation} imeiNumber={navigationParams.imeiNumber} />
      ) : currentScreen === 'ceirResult' ? (
        <CEIRResult onNavigate={handleScreenNavigation} imeiNumber={navigationParams.imeiNumber} />
      ) : currentScreen === 'customerDirectory' ? (
        <CustomerDirectoryScreen onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'chat' ? (
        <ChatScreen onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'notes' ? (
        <NotesScreen onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'supportUsers' ? (
        <SupportUsersScreen onNavigate={handleScreenNavigation} />
      ) : (
        <TechnicianHomeScreen onNavigate={handleScreenNavigation} />
      )}
      </KeyboardAvoidingView>
      </View>
      </View>
      <StatusBarBackdrop />
      <PlayerIdSync />
      <LoginStatusWatcher onLogout={() => handleScreenNavigation('logout')} isHome={currentScreen === 'home'} />
    </SafeAreaProvider>
    </Provider>
  );
}

function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}

export default App;

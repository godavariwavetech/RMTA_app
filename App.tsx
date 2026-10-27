import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BackHandler } from 'react-native';
import { AppModalHost, installAppModalAlerts } from './src/utils/appModal';
import { Provider } from 'react-redux';
import { useState, useEffect } from 'react';
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
import CreateJobSheetStep6 from './src/Technician/screens/CreateJobSheetSteps/createJobSheetStep6';
import CreateJobSheetStep7 from './src/Technician/screens/CreateJobSheetSteps/createJobSheetStep7';
import CreateJobSheetStep8 from './src/Technician/screens/CreateJobSheetSteps/createJobSheetStep8';
import JobTimelineScreen from './src/Technician/screens/jobTimeline';
import PurchaseEntryStep1 from './src/Technician/screens/purchaseScreens/purchaseEntryStep1';
import VerifySellerMobileNumber from './src/Technician/screens/purchaseScreens/VerifySellerMobileNumber';
import PurchaseEntryStep2 from './src/Technician/screens/purchaseScreens/purchaseEntryStep2';
import PurchaseEntryStep3 from './src/Technician/screens/purchaseScreens/purchaseEntryStep3';
import PurchaseEnterStep4 from './src/Technician/screens/purchaseScreens/purchaseEnterStep4';
import PurchaseEntryStep5 from './src/Technician/screens/purchaseScreens/purchaseEntryStep5';
import PurchaseEntryStep6 from './src/Technician/screens/purchaseScreens/purchaseEntryStep6';
import PurchaseEntryStep7 from './src/Technician/screens/purchaseScreens/purchaseEntryStep7';
import PurchaseEntryStep8 from './src/Technician/screens/purchaseScreens/purchaseEntryStep8';
import PurchaseAndSaleHistory from './src/Technician/screens/purchaseScreens/PurchaseAndSaleHistory';
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

installAppModalAlerts();

function App() {
  const [currentScreen, setCurrentScreen] = useState<string>('intro');
  const [navigationParams, setNavigationParams] = useState<any>({});
  const [navigationHistory, setNavigationHistory] = useState<string[]>(['intro']);
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
      setNavigationParams({});
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
      }
      return;
    }

    const screenMap: Record<string, string> = {
      intro: 'intro',
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
      createJobSheetStep6: 'createJobSheetStep6',
      createJobSheetStep7: 'createJobSheetStep7',
      createJobSheetStep8: 'createJobSheetStep8',
      purchaseEntryStep1: 'purchaseEntryStep1',
      verifySellerMobileNumber: 'verifySellerMobileNumber',
      purchaseEntryStep2: 'purchaseEntryStep2',
      purchaseEntryStep3: 'purchaseEntryStep3',
      purchaseEnterStep4: 'purchaseEnterStep4',
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
      scanQR: 'scanQR',
      validQR: 'validQR',
      invalidQR: 'invalidQR',
      deviceVerification: 'deviceVerification',
      imeiResult: 'imeiResult',
      ceirResult: 'ceirResult',
    };
    if (params) {
      setNavigationParams(params);
    } else {
      setNavigationParams({});
    }
    const newScreen = screenMap[screen] || 'home';
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
  if (booting) {
    return null;
  }

  return (
    <Provider store={store}>
    <SafeAreaProvider>
      <AppModalHost />
      {currentScreen === 'intro' ? (
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
      ) : currentScreen === 'createJobSheetStep6' ? (
        <CreateJobSheetStep6 onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'createJobSheetStep7' ? (
        <CreateJobSheetStep7 onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'createJobSheetStep8' ? (
        <CreateJobSheetStep8
          onNavigate={handleScreenNavigation}
          job={navigationParams.job}
        />
      ) : currentScreen === 'purchaseEntryStep1' ? (
        <PurchaseEntryStep1 onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'verifySellerMobileNumber' ? (
        <VerifySellerMobileNumber onNavigate={handleScreenNavigation} sellerData={navigationParams.sellerData} />
      ) : currentScreen === 'purchaseEntryStep2' ? (
        <PurchaseEntryStep2 onNavigate={handleScreenNavigation} sellerData={navigationParams.sellerData} />
      ) : currentScreen === 'purchaseEntryStep3' ? (
        <PurchaseEntryStep3 onNavigate={handleScreenNavigation} sellerData={navigationParams.sellerData} deviceData={navigationParams.deviceData} />
      ) : currentScreen === 'purchaseEnterStep4' ? (
        <PurchaseEnterStep4 onNavigate={handleScreenNavigation} sellerData={navigationParams.sellerData} deviceData={navigationParams.deviceData} imeiData={navigationParams.imeiData} />
      ) : currentScreen === 'purchaseEntryStep5' ? (
        <PurchaseEntryStep5 onNavigate={handleScreenNavigation} sellerData={navigationParams.sellerData} deviceData={navigationParams.deviceData} imeiData={navigationParams.imeiData} ceirVerified={navigationParams.ceirVerified} />
      ) : currentScreen === 'purchaseEntryStep6' ? (
        <PurchaseEntryStep6 onNavigate={handleScreenNavigation} sellerData={navigationParams.sellerData} deviceData={navigationParams.deviceData} imeiData={navigationParams.imeiData} ceirVerified={navigationParams.ceirVerified} conditionData={navigationParams.conditionData} />
      ) : currentScreen === 'purchaseEntryStep7' ? (
        <PurchaseEntryStep7 onNavigate={handleScreenNavigation} sellerData={navigationParams.sellerData} deviceData={navigationParams.deviceData} imeiData={navigationParams.imeiData} ceirVerified={navigationParams.ceirVerified} conditionData={navigationParams.conditionData} priceData={navigationParams.priceData} />
      ) : currentScreen === 'purchaseEntryStep8' ? (
        <PurchaseEntryStep8 onNavigate={handleScreenNavigation} sellerData={navigationParams.sellerData} deviceData={navigationParams.deviceData} imeiData={navigationParams.imeiData} ceirVerified={navigationParams.ceirVerified} conditionData={navigationParams.conditionData} priceData={navigationParams.priceData} />
      ) : currentScreen === 'viewPurchaseHistory' ? (
        <PurchaseAndSaleHistory onNavigate={handleScreenNavigation} initialTab="purchases" />
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
        <PurchaseAndSaleHistory onNavigate={handleScreenNavigation} initialTab="sales" />
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
        <PurchaseAndSaleHistory onNavigate={handleScreenNavigation} initialTab={navigationParams.initialTab || 'purchases'} />
      ) : currentScreen === 'scanQR' ? (
        <ScanQR onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'validQR' ? (
        <ValidQR onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'invalidQR' ? (
        <InvalidQR onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'deviceVerification' ? (
        <DeviceVerification onNavigate={handleScreenNavigation} />
      ) : currentScreen === 'imeiResult' ? (
        <IMEIResult onNavigate={handleScreenNavigation} imeiNumber={navigationParams.imeiNumber} />
      ) : currentScreen === 'ceirResult' ? (
        <CEIRResult onNavigate={handleScreenNavigation} imeiNumber={navigationParams.imeiNumber} />
      ) : (
        <TechnicianHomeScreen onNavigate={handleScreenNavigation} />
      )}
    </SafeAreaProvider>
    </Provider>
  );
}

export default App;

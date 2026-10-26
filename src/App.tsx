import React, { useState } from 'react';
import { LeaveProvider, useLeave } from './context/LeaveContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { FloatingApplyButton } from './components/FloatingApplyButton';
import { Toast } from './components/Toast';
import { ApplyLeaveModal } from './components/ApplyLeaveModal';
import { PublicHolidaysModal } from './components/PublicHolidaysModal';
import { CompOffModal } from './components/CompOffModal';
import { AddSpecialHolidayModal } from './components/AddSpecialHolidayModal';
import { EditCycleModal } from './components/EditCycleModal';
import { OnboardingModal } from './components/OnboardingModal';
import { HomeScreen } from './screens/HomeScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { OfflineIndicator } from './components/OfflineIndicator';
import { UpdateAvailableModal } from './components/UpdateAvailableModal';
import { UpToDateModal } from './components/UpToDateModal';
import { InstallAppPrompt } from './components/InstallAppPrompt';
import { profileError } from './utils/profile';
import { useAppUpdate } from './hooks/useAppUpdate';

const MainAppContent: React.FC = () => {
  const { currentTab, isEditCycleModalOpen, setIsEditCycleModalOpen, settings, todayDateStr, showToast } = useLeave();
  const { hasUpdate, updateInfo, currentVersion, applyUpdate, dismissUpdate, checkForUpdate, isChecking } = useAppUpdate();
  const [isUpToDateModalOpen, setIsUpToDateModalOpen] = useState(false);

  const needsProfile = !!profileError(settings, todayDateStr);
  const handleCheckForUpdate = async () => {
    const result = await checkForUpdate(true);
    if (result.error) { showToast(result.error); return; }
    if (!result.hasUpdate) {
      setIsUpToDateModalOpen(true);
    }
  };

  return (
    <>
    <div inert={needsProfile ? true : undefined} className="bg-surface text-on-surface font-body-md text-body-md min-h-screen flex flex-col antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Top Application Header with Android status bar & sync details */}
      <Header />

      {/* Main Screen Content with responsive container padding */}
      <main className="flex-1 flex flex-col relative w-full pt-20 pb-32 bg-surface min-h-screen">
        {/* Suggest Install as App when accessing via URL (auto-suppressed once installed) */}
        <InstallAppPrompt />

        {currentTab === 'home' && <HomeScreen />}
        {currentTab === 'calendar' && <CalendarScreen />}
        {currentTab === 'history' && <HistoryScreen />}
        {currentTab === 'settings' && <SettingsScreen onCheckForUpdate={handleCheckForUpdate} isCheckingUpdate={isChecking} currentVersion={currentVersion} />}
      </main>

      {/* Floating Action Button (+ Apply Leave) */}
      <FloatingApplyButton />

      {/* Material Design 3 Bottom Navigation Bar */}
      <BottomNav />

      {/* Interactive Global Modals and Sheets */}
      <ApplyLeaveModal />
      <PublicHolidaysModal />
      <CompOffModal />
      <AddSpecialHolidayModal />
      <EditCycleModal
        isOpen={isEditCycleModalOpen}
        onClose={() => setIsEditCycleModalOpen(false)}
      />



      {/* Offline Connectivity Status Badge */}
      <OfflineIndicator />

      {/* Cloud & PWA Deployment Update Notification Modal */}
      <UpdateAvailableModal
        isOpen={hasUpdate && !needsProfile}
        updateInfo={updateInfo}
        currentVersion={currentVersion}
        onUpdate={applyUpdate}
        onDismiss={dismissUpdate}
      />

      {/* Up-to-Date Confirmation Modal */}
      <UpToDateModal
        isOpen={isUpToDateModalOpen}
        onClose={() => setIsUpToDateModalOpen(false)}
        version={currentVersion}
      />

      {/* Universal Floating Toast Banner */}
      <Toast />
    </div>
    <OnboardingModal />
    </>
  );
};

export default function App() {
  return (
    <LeaveProvider>
      <MainAppContent />
    </LeaveProvider>
  );
}

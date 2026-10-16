import React from 'react';
import { LeaveProvider, useLeave } from './context/LeaveContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { FloatingApplyButton } from './components/FloatingApplyButton';
import { Toast } from './components/Toast';
import { ApplyLeaveModal } from './components/ApplyLeaveModal';
import { PublicHolidaysModal } from './components/PublicHolidaysModal';
import { CompOffModal } from './components/CompOffModal';
import { NotificationsModal } from './components/NotificationsModal';
import { AddSpecialHolidayModal } from './components/AddSpecialHolidayModal';
import { EditCycleModal } from './components/EditCycleModal';
import { OnboardingModal } from './components/OnboardingModal';
import { HomeScreen } from './screens/HomeScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { OfflineIndicator } from './components/OfflineIndicator';

const MainAppContent: React.FC = () => {
  const { currentTab, isEditCycleModalOpen, setIsEditCycleModalOpen } = useLeave();

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md min-h-screen flex flex-col antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Top Application Header with Android status bar & sync details */}
      <Header />

      {/* Main Screen Content with responsive container padding */}
      <main className="flex-1 flex flex-col relative w-full pt-28 pb-32 bg-surface min-h-screen">
        {currentTab === 'home' && <HomeScreen />}
        {currentTab === 'calendar' && <CalendarScreen />}
        {currentTab === 'history' && <HistoryScreen />}
        {currentTab === 'settings' && <SettingsScreen />}
      </main>

      {/* Floating Action Button (+ Apply Leave) */}
      <FloatingApplyButton />

      {/* Material Design 3 Bottom Navigation Bar */}
      <BottomNav />

      {/* Interactive Global Modals and Sheets */}
      <ApplyLeaveModal />
      <PublicHolidaysModal />
      <CompOffModal />
      <NotificationsModal />
      <AddSpecialHolidayModal />
      <EditCycleModal
        isOpen={isEditCycleModalOpen}
        onClose={() => setIsEditCycleModalOpen(false)}
      />
      <OnboardingModal />

      {/* Offline Connectivity Status Badge */}
      <OfflineIndicator />

      {/* Universal Floating Toast Banner */}
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <LeaveProvider>
      <MainAppContent />
    </LeaveProvider>
  );
}

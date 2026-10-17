import React, { useState } from 'react';
import { getInitialAppData } from './utils/defaultData';
import { AppData, BreakdownSelection } from './types/nutrition';
import { HeaderModule } from './components/HeaderModule';
import { UploadDownloadModule } from './components/UploadDownloadModule';
import { FoodLogEntryModule } from './components/FoodLogEntryModule';
import { NutrientBreakdownModule } from './components/NutrientBreakdownModule';
import { FooterModule } from './components/FooterModule';
import { TutorialModal } from './components/TutorialModal';
import { DisclaimerModal } from './components/DisclaimerModal';

export default function App() {
  const [appData, setAppData] = useState<AppData>(() => getInitialAppData());

  // Default date formatted as YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  // Nutrient breakdown selection
  const [breakdownSelection, setBreakdownSelection] = useState<BreakdownSelection>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return {
      type: 'food_log',
      date: `${y}-${m}-${d}`,
      itemName: '',
      quantity: 1,
      unit: 'servings',
    };
  });

  // Modal controls
  // Guarantee disclaimer popup appears when user initially loads the application
  const [showInitialDisclaimer, setShowInitialDisclaimer] = useState<boolean>(true);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showDisclaimerPopup, setShowDisclaimerPopup] = useState<boolean>(false);

  // When date is changed in Food Log Entry Date Picker:
  // "When the user selects a new date for the Food Log Entry Date Picker,
  // 'Food Log' is automatically selected for the Nutrient Breakdown Dropdown
  // and the same date is automatically selected for this date picker."
  const handleFoodLogDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setBreakdownSelection((prev) => ({
      ...prev,
      type: 'food_log',
      date: newDate,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. Header Module */}
      <HeaderModule />

      {/* 2. Upload and Download Module */}
      <UploadDownloadModule appData={appData} onUpdateAppData={setAppData} />

      {/* 3. Food Log Entry Module */}
      <FoodLogEntryModule
        appData={appData}
        onUpdateAppData={setAppData}
        selectedDate={selectedDate}
        onDateChange={handleFoodLogDateChange}
      />

      {/* 4. Nutrient Breakdown Module */}
      <main className="flex-1 w-full">
        <NutrientBreakdownModule
          appData={appData}
          breakdownSelection={breakdownSelection}
          onBreakdownSelectionChange={setBreakdownSelection}
        />
      </main>

      {/* 5. Footer Module */}
      <FooterModule
        onOpenTutorial={() => setShowTutorial(true)}
        onOpenDisclaimer={() => setShowDisclaimerPopup(true)}
      />

      {/* Initial Mandatory Disclaimer Popup on first load */}
      <DisclaimerModal
        isOpen={showInitialDisclaimer}
        onClose={() => setShowInitialDisclaimer(false)}
        showDismissOnly={false}
      />

      {/* Re-opened Disclaimer Popup from footer */}
      <DisclaimerModal
        isOpen={showDisclaimerPopup}
        onClose={() => setShowDisclaimerPopup(false)}
        showDismissOnly={true}
      />

      {/* Tutorial Popup from footer */}
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  );
}

import React from 'react';
import { X, BookOpen, Upload, Download, Calendar, Layers, Activity } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Vitaminarian Tutorial & Guide</h2>
              <p className="text-xs text-slate-500">Comprehensive overview of system features</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm leading-relaxed">
          {/* Crucial Notice regarding sample data */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-1">
              <span>Notice Concerning Sample Data Files</span>
            </h3>
            <p className="text-xs leading-normal">
              Please note: The sample <strong>Foods</strong>, <strong>Meals</strong>, and <strong>Daily Values</strong> files provided out-of-the-box contain limited, demonstration-only nutritional data that is likely irrelevant or incomplete for your unique dietary requirements.
            </p>
            <p className="text-xs mt-2 leading-normal">
              You are strongly encouraged to modify and expand these files! Use the <strong>Download Data</strong> button to export your current files, customize them with your personal foods, recipes, and dietary targets in your preferred spreadsheet program, and upload them back into the app using <strong>Upload Data</strong>.
            </p>
          </div>

          {/* Module 1: Upload and Download */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-700" />
              <span>1. Upload and Download Module</span>
            </h3>
            <p className="text-xs text-slate-600">
              Easily import or export the 4 core CSV datasets that drive the app:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
              <li>
                <strong>Foods.csv:</strong> Defines food items, their logging unit (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded">g</code> or <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">servings</code>), serving size in grams, calories, and any number of customizable nutrient columns formatted as <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">&lt;Nutrient Name&gt; (&lt;Unit&gt;)</code>.
              </li>
              <li>
                <strong>Meals.csv:</strong> Defines recipe compositions made up of foods or previously defined meals.
              </li>
              <li>
                <strong>Daily Values.csv:</strong> Single row defining your personal target intake (or limits) for calories and every tracked nutrient.
              </li>
              <li>
                <strong>Food Log.csv:</strong> Daily records of food and meal intake by date.
              </li>
            </ul>
            <p className="text-xs text-slate-600 mt-2">
              When uploading files, <strong>Initial Validations</strong> verify file structure in real time. Validated files allow you to choose between <strong>Merge with existing</strong> and <strong>Replace existing</strong>. When you click <strong>Accept Changes</strong>, <strong>Final Validations</strong> verify that references and columns remain harmonious.
            </p>
          </div>

          {/* Module 2: Food Log Entry */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>2. Food Log Entry Module</span>
            </h3>
            <p className="text-xs text-slate-600">
              Log foods and meals for any date from <strong>January 1, 2000</strong> to the present and into the future:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
              <li>
                <strong>Smart Auto-Population:</strong> Selecting a food whose default logging unit is <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">g</code> automatically populates its serving size in grams and sets the unit to <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">g</code>. Other foods and meals default to <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">1 serving</code>.
              </li>
              <li>
                <strong>Units:</strong> Foods can be logged in grams (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded">g</code>) or servings. Meals are exclusively measured in servings. Entering 1 automatically changes &ldquo;servings&rdquo; to the singular &ldquo;serving&rdquo;.
              </li>
            </ul>
          </div>

          {/* Module 3: Nutrient Breakdown */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>3. Nutrient Breakdown Module</span>
            </h3>
            <p className="text-xs text-slate-600">
              Inspect the exact nutrient profile of an entire day&rsquo;s Food Log, or drill into any specific Food or Meal:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
              <li>
                <strong>Food Breakdown Tree:</strong> Decomposes complex meals hierarchically down to whole food ingredients in grams. When expanded, exact calories for each visible node appear aligned on the right.
              </li>
              <li>
                <strong>Calorie Progress Bar:</strong> Monitors total intake against your daily goal.
              </li>
              <li>
                <strong>Macronutrient Dashboard:</strong> Features an interactive Pie Chart showing caloric proportions from Carbohydrates (4 kcal/g), Protein (4 kcal/g), and Fat (9 kcal/g), alongside indented progress bars for Saturated Fat, Trans Fat, Dietary Fiber, Sugars, and Added Sugars. Nutrients to limit are clearly highlighted.
              </li>
              <li>
                <strong>Micronutrient Dashboard:</strong> Displays progress bars for vitamins, minerals, and trace elements, with Sodium highlighted as a limit nutrient.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

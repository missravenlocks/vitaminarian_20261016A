import React, { useRef, useState } from 'react';
import {
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck,
  Check,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { AppData, ValidationError } from '../types/nutrition';
import {
  validateDailyValuesInitial,
  validateFoodLogInitial,
  validateFoodsInitial,
  validateMealsInitial,
  runFinalValidations,
} from '../utils/validations';
import { mergeDailyValues, mergeGridFile, mergeMeals } from '../utils/merge';
import {
  exportDailyValuesToCSV,
  exportFoodLogToCSV,
  exportFoodsToCSV,
  exportMealsToCSV,
  parseDailyValuesData,
  parseFoodLogData,
  parseFoodsData,
  parseMealsData,
} from '../utils/defaultData';

interface UploadDownloadModuleProps {
  appData: AppData;
  onUpdateAppData: (newAppData: AppData) => void;
}

type FileType = 'Foods' | 'Meals' | 'Daily Values' | 'Food Log';

interface StagedFile {
  type: FileType;
  fileName: string;
  rawCsv: string;
  mergeMode: 'merge' | 'replace';
}

export const UploadDownloadModule: React.FC<UploadDownloadModuleProps> = ({
  appData,
  onUpdateAppData,
}) => {
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // Staged files for upload menu
  const [stagedFiles, setStagedFiles] = useState<Record<FileType, StagedFile | null>>({
    Foods: null,
    Meals: null,
    'Daily Values': null,
    'Food Log': null,
  });

  // Modal dialog states
  const [initialErrorModal, setInitialErrorModal] = useState<{
    open: boolean;
    errors: ValidationError[];
    fileName: string;
  }>({ open: false, errors: [], fileName: '' });

  const [finalErrorModal, setFinalErrorModal] = useState<{
    open: boolean;
    errors: ValidationError[];
  }>({ open: false, errors: [] });

  const [successModal, setSuccessModal] = useState<{
    open: boolean;
    warnings: string[];
  }>({ open: false, warnings: [] });

  // Hidden file inputs
  const fileInputRefs = {
    Foods: useRef<HTMLInputElement>(null),
    Meals: useRef<HTMLInputElement>(null),
    'Daily Values': useRef<HTMLInputElement>(null),
    'Food Log': useRef<HTMLInputElement>(null),
  };

  const handleTriggerUpload = (type: FileType) => {
    if (fileInputRefs[type].current) {
      fileInputRefs[type].current!.value = '';
      fileInputRefs[type].current!.click();
    }
  };

  const handleFileSelected = async (type: FileType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const text = await file.text();

    // Run Initial Validations
    let validationResult;
    switch (type) {
      case 'Foods':
        validationResult = validateFoodsInitial(text);
        break;
      case 'Meals':
        validationResult = validateMealsInitial(text);
        break;
      case 'Daily Values':
        validationResult = validateDailyValuesInitial(text);
        break;
      case 'Food Log':
        validationResult = validateFoodLogInitial(text);
        break;
    }

    if (!validationResult.valid) {
      setInitialErrorModal({
        open: true,
        errors: validationResult.errors,
        fileName,
      });
    } else {
      // Succeeded: row highlighted green, name appears, radio buttons default to "Merge with existing"
      setStagedFiles((prev) => ({
        ...prev,
        [type]: {
          type,
          fileName,
          rawCsv: text,
          mergeMode: 'merge',
        },
      }));
    }
  };

  const handleAcceptChanges = () => {
    // Check if at least one file was staged
    const hasAnyStaged = Object.values(stagedFiles).some((f) => f !== null);
    if (!hasAnyStaged) {
      setShowUploadMenu(false);
      return;
    }

    // Determine candidate CSV contents after merge/replace
    let candidateFoodsCsv = appData.foodsRawCsv;
    let candidateMealsCsv = appData.mealsRawCsv;
    let candidateDvCsv = appData.dailyValuesRawCsv;
    let candidateLogCsv = appData.foodLogRawCsv;

    const accumulatedWarnings: string[] = [];
    let foodsWasMerged = false;

    // 1. Process Foods
    if (stagedFiles.Foods) {
      if (stagedFiles.Foods.mergeMode === 'merge') {
        const mergeRes = mergeGridFile(appData.foodsRawCsv, stagedFiles.Foods.rawCsv, 0, true);
        candidateFoodsCsv = mergeRes.mergedCsv;
        accumulatedWarnings.push(...mergeRes.warnings);
        foodsWasMerged = true;
      } else {
        candidateFoodsCsv = stagedFiles.Foods.rawCsv;
      }
    }

    // 2. Process Meals
    if (stagedFiles.Meals) {
      if (stagedFiles.Meals.mergeMode === 'merge') {
        const mergeRes = mergeMeals(appData.mealsRawCsv, stagedFiles.Meals.rawCsv);
        candidateMealsCsv = mergeRes.mergedCsv;
      } else {
        candidateMealsCsv = stagedFiles.Meals.rawCsv;
      }
    }

    // 3. Process Daily Values
    if (stagedFiles['Daily Values']) {
      if (stagedFiles['Daily Values'].mergeMode === 'merge') {
        const mergeRes = mergeDailyValues(appData.dailyValuesRawCsv, stagedFiles['Daily Values'].rawCsv);
        candidateDvCsv = mergeRes.mergedCsv;
      } else {
        candidateDvCsv = stagedFiles['Daily Values'].rawCsv;
      }
    }

    // 4. Process Food Log
    if (stagedFiles['Food Log']) {
      if (stagedFiles['Food Log'].mergeMode === 'merge') {
        const mergeRes = mergeGridFile(appData.foodLogRawCsv, stagedFiles['Food Log'].rawCsv, 0, false);
        candidateLogCsv = mergeRes.mergedCsv;
      } else {
        candidateLogCsv = stagedFiles['Food Log'].rawCsv;
      }
    }

    // Run Final Validations
    const finalValidation = runFinalValidations(
      candidateFoodsCsv,
      candidateMealsCsv,
      candidateDvCsv,
      candidateLogCsv,
      appData.foodsRawCsv,
      foodsWasMerged
    );

    if (!finalValidation.valid) {
      setFinalErrorModal({
        open: true,
        errors: finalValidation.errors,
      });
    } else {
      // Succeeded!
      const { foods, headers: foodHeaders } = parseFoodsData(candidateFoodsCsv);
      const meals = parseMealsData(candidateMealsCsv);
      const { dailyValues, headers: dailyValueHeaders } = parseDailyValuesData(candidateDvCsv);
      const foodLog = parseFoodLogData(candidateLogCsv);

      onUpdateAppData({
        foodsRawCsv: candidateFoodsCsv,
        mealsRawCsv: candidateMealsCsv,
        dailyValuesRawCsv: candidateDvCsv,
        foodLogRawCsv: candidateLogCsv,
        foods,
        meals,
        dailyValues,
        foodLog,
        foodHeaders,
        dailyValueHeaders,
      });

      // Clear staged files and close upload menu
      setStagedFiles({
        Foods: null,
        Meals: null,
        'Daily Values': null,
        'Food Log': null,
      });
      setShowUploadMenu(false);

      // Show Success dialog box
      setSuccessModal({
        open: true,
        warnings: accumulatedWarnings,
      });
    }
  };

  const handleDownloadFile = (type: FileType) => {
    let content = '';
    let fileName = '';

    switch (type) {
      case 'Foods':
        content = exportFoodsToCSV(appData.foods, appData.foodHeaders);
        fileName = 'Foods.csv';
        break;
      case 'Meals':
        content = exportMealsToCSV(appData.meals);
        fileName = 'Meals.csv';
        break;
      case 'Daily Values':
        content = exportDailyValuesToCSV(appData.dailyValues, appData.dailyValueHeaders);
        fileName = 'Daily Values.csv';
        break;
      case 'Food Log':
        content = exportFoodLogToCSV(appData.foodLog);
        fileName = 'Food Log.csv';
        break;
    }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const fileTypes: FileType[] = ['Foods', 'Meals', 'Daily Values', 'Food Log'];

  return (
    <section className="w-full bg-slate-50 border-b border-slate-200/80 py-4 px-6">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        {/* Upload Data Button */}
        <button
          onClick={() => setShowUploadMenu(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-800 text-sm font-semibold rounded-lg border border-slate-300 hover:bg-slate-100 hover:border-slate-400 active:scale-[0.98] transition-all shadow-xs"
        >
          <Upload className="w-4 h-4 text-emerald-600" />
          <span>Upload Data</span>
        </button>

        {/* Download Data Button */}
        <button
          onClick={() => setShowDownloadMenu(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-800 text-sm font-semibold rounded-lg border border-slate-300 hover:bg-slate-100 hover:border-slate-400 active:scale-[0.98] transition-all shadow-xs"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Download Data</span>
        </button>
      </div>

      {/* Hidden file inputs for each file type */}
      {fileTypes.map((type) => (
        <input
          key={type}
          ref={fileInputRefs[type]}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => handleFileSelected(type, e)}
        />
      ))}

      {/* Upload Data Menu Modal */}
      {showUploadMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Upload Data</h2>
              <p className="text-sm text-slate-600 mt-1">
                Upload one or more files and click Accept Changes.
              </p>
            </div>

            <div className="p-6 space-y-4">
              {fileTypes.map((type) => {
                const staged = stagedFiles[type];
                const isUploaded = staged !== null;

                return (
                  <div
                    key={type}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border transition-colors ${
                      isUploaded
                        ? 'bg-emerald-50/80 border-emerald-400'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleTriggerUpload(type)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                          isUploaded
                            ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                            : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload</span>
                      </button>

                      <span className="text-sm font-semibold text-slate-800">{type}</span>

                      {isUploaded && (
                        <span className="text-xs font-mono text-emerald-800 font-medium truncate max-w-[180px] bg-emerald-100/70 px-2 py-0.5 rounded">
                          {staged.fileName}
                        </span>
                      )}
                    </div>

                    {isUploaded && (
                      <div className="flex items-center gap-4 mt-3 sm:mt-0 text-xs text-slate-700">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name={`merge-mode-${type}`}
                            value="merge"
                            checked={staged.mergeMode === 'merge'}
                            onChange={() =>
                              setStagedFiles((prev) => ({
                                ...prev,
                                [type]: { ...staged, mergeMode: 'merge' },
                              }))
                            }
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>Merge with existing</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name={`merge-mode-${type}`}
                            value="replace"
                            checked={staged.mergeMode === 'replace'}
                            onChange={() =>
                              setStagedFiles((prev) => ({
                                ...prev,
                                [type]: { ...staged, mergeMode: 'replace' },
                              }))
                            }
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>Replace existing</span>
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setStagedFiles({
                    Foods: null,
                    Meals: null,
                    'Daily Values': null,
                    'Food Log': null,
                  });
                  setShowUploadMenu(false);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-300 hover:bg-slate-100 active:scale-[0.98] transition-all"
              >
                <X className="w-4 h-4 text-slate-500" />
                <span>Cancel</span>
              </button>

              <button
                onClick={handleAcceptChanges}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 active:scale-[0.98] transition-all shadow-xs"
              >
                <Check className="w-4 h-4 text-white" />
                <span>Accept Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Data Menu Modal */}
      {showDownloadMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Download Data</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Click the Download button next to a file to download it.
                </p>
              </div>
              <button
                onClick={() => setShowDownloadMenu(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              {fileTypes.map((type) => (
                <div
                  key={type}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-semibold text-slate-800">{type}</span>
                  </div>
                  <button
                    onClick={() => handleDownloadFile(type)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-800 text-xs font-semibold rounded-md border border-slate-300 hover:bg-slate-100 active:scale-[0.98] transition-all shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Download</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowDownloadMenu(false)}
                className="px-4 py-2 bg-slate-200 text-slate-800 text-sm font-medium rounded-lg hover:bg-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "File not uploaded" Initial Validation Error Dialog */}
      {initialErrorModal.open && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-red-200 w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-red-100 bg-red-50/50 flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-600 shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-red-950">File not uploaded</h3>
                <p className="text-xs text-red-700 font-mono mt-0.5">
                  {initialErrorModal.fileName}
                </p>
              </div>
            </div>

            <div className="p-6 max-h-[340px] overflow-y-auto">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Validation Errors Detected ({initialErrorModal.errors.length}):
              </p>
              <ul className="space-y-2">
                {initialErrorModal.errors.map((err, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-red-700 bg-red-50 p-2.5 rounded border border-red-100 flex items-start gap-2"
                  >
                    <span className="text-red-500 font-bold">•</span>
                    <span>{err.message}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setInitialErrorModal({ open: false, errors: [], fileName: '' })}
                className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "Changes not accepted" Final Validation Error Dialog */}
      {finalErrorModal.open && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-red-200 w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-red-100 bg-red-50/50 flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-600 shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-red-950">Changes not accepted</h3>
                <p className="text-xs text-red-700 mt-0.5">
                  Final consistency validations failed across files.
                </p>
              </div>
            </div>

            <div className="p-6 max-h-[340px] overflow-y-auto">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Validation Errors Detected ({finalErrorModal.errors.length}):
              </p>
              <ul className="space-y-2">
                {finalErrorModal.errors.map((err, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-red-700 bg-red-50 p-2.5 rounded border border-red-100 flex items-start gap-2"
                  >
                    <span className="text-red-500 font-bold">•</span>
                    <div>
                      <span className="font-semibold text-slate-800">[{err.file}] </span>
                      <span>{err.message}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setFinalErrorModal({ open: false, errors: [] })}
                className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {successModal.open && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-emerald-200 w-full max-w-md overflow-hidden">
            <div className="p-6 flex items-start gap-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-slate-900">Success</h3>
                <p className="text-sm text-slate-600 mt-1">Your changes have been saved.</p>

                {successModal.warnings.length > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5 text-amber-900">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Data Merge Notices:</span>
                    </div>
                    {successModal.warnings.map((w, idx) => (
                      <p key={idx} className="leading-relaxed">
                        {w}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSuccessModal({ open: false, warnings: [] })}
                className="px-4 py-2 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

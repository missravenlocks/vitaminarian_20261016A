import React from 'react';
import { ShieldAlert, X } from 'lucide-react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  showDismissOnly?: boolean;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({
  isOpen,
  onClose,
  showDismissOnly = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Legal & Health Disclaimer</h2>
              <p className="text-xs text-slate-500">Please review before utilizing Vitaminarian</p>
            </div>
          </div>
          {showDismissOnly && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 font-semibold text-xs">
            Important: Vitaminarian is an informational tracking application and does not provide medical, diagnostic, or clinical dietary counsel.
          </div>

          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">1. Not Medical or Nutritional Advice</h4>
            <p>
              The calculations, nutritional metrics, dietary values, and food breakdown structures presented within this application are provided exclusively for general personal informational and educational reference. Under no circumstances should any output of Vitaminarian be construed as medical diagnosis, nutrition therapy, individualized diet planning, or professional health guidance.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">2. Consult Qualified Medical Professionals</h4>
            <p>
              Always consult with a licensed physician, registered dietitian (RD/RDN), or qualified health provider prior to initiating any new dietary pattern, implementing caloric restrictions, modifying micronutrient intake, or making lifestyle changes, particularly if you are pregnant, nursing, or managing acute or chronic medical conditions.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">3. Nutritional Data Variances</h4>
            <p>
              Default nutritional numbers in demonstration datasets represent generalized public agricultural estimates. Actual nutritional content of foods fluctuates substantially due to soil geochemistry, crop variety, geographic origin, agricultural climate, commercial brand formulations, and cooking methods. No warranty is expressed or implied as to the absolute precision or comprehensiveness of any data file.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">4. Limitation of Liability</h4>
            <p>
              To the fullest extent permitted by applicable law, the developers, creators, and distributors of Vitaminarian disclaim all liability for any direct, indirect, special, incidental, or consequential damages, personal health adverse events, or losses resulting from the use of, or inability to use, this application or reliance upon data tracked herein.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 active:scale-[0.98] transition-all shadow-xs"
          >
            I Understand &amp; Agree
          </button>
        </div>
      </div>
    </div>
  );
};

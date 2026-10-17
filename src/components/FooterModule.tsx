import React from 'react';
import { BookOpen, ShieldAlert } from 'lucide-react';

interface FooterModuleProps {
  onOpenTutorial: () => void;
  onOpenDisclaimer: () => void;
}

export const FooterModule: React.FC<FooterModuleProps> = ({
  onOpenTutorial,
  onOpenDisclaimer,
}) => {
  return (
    <footer className="w-full bg-slate-900 text-slate-400 border-t border-slate-800 py-10 px-6 mt-12">
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-6">
        {/* Tutorial Link (Stacked top) */}
        <div>
          <button
            type="button"
            onClick={onOpenTutorial}
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Open Application Tutorial &amp; Guide</span>
          </button>
        </div>

        {/* Disclaimer (Stacked on top of one another) */}
        <div className="max-w-3xl space-y-3 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-300">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>Disclaimer &amp; Legal Notice</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Vitaminarian is an educational and personal nutrition record-keeping tool. The application, including all default food databases, daily value targets, nutrient aggregations, and food breakdown visualizations, is provided solely for general informational purposes and does not constitute medical advice, clinical nutrition therapy, diagnosis, or treatment. Users must consult a qualified physician or registered dietitian before making dietary changes or managing health conditions.
          </p>

          <p className="text-[11px] text-slate-500">
            Nutritional metrics in demo files represent general agricultural benchmarks and vary based on soil, variety, and cooking preparation. To the extent permitted by law, the authors and distributors assume no liability for health decisions or damages arising from reliance upon tracked information.
          </p>

          <div>
            <button
              type="button"
              onClick={onOpenDisclaimer}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline transition-colors"
            >
              View Full Legal Disclaimer Popup
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-600 pt-2">
          &copy; {new Date().getFullYear()} Vitaminarian &middot; Professional Nutrition Tracking
        </div>
      </div>
    </footer>
  );
};

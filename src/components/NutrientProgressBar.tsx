import React from 'react';
import { cleanNumber } from '../utils/nutritionCalc';

interface NutrientProgressBarProps {
  label: string;
  unit: string;
  currentValue: number;
  targetValue?: number;
  isLimit?: boolean;
  indentDepth?: number; // 0, 1, 2
}

export const NutrientProgressBar: React.FC<NutrientProgressBarProps> = ({
  label,
  unit,
  currentValue,
  targetValue,
  isLimit = false,
  indentDepth = 0,
}) => {
  const hasTarget = targetValue !== undefined && targetValue > 0;
  const percentage = hasTarget ? (currentValue / targetValue!) * 100 : null;
  const roundedPercent = percentage !== null ? Math.round(percentage) : null;

  // Visual bar width capped at 100% for progress, or allow slight overflow indication
  const barWidth = percentage !== null ? Math.min(100, percentage) : 0;

  // Determine bar color:
  // For limits: green/teal when under 80%, amber when 80-100%, rose/red when > 100%
  // For regular goals: emerald
  let barColorClass = 'bg-emerald-600';
  if (isLimit && percentage !== null) {
    if (percentage > 100) {
      barColorClass = 'bg-rose-500';
    } else if (percentage >= 80) {
      barColorClass = 'bg-amber-500';
    } else {
      barColorClass = 'bg-emerald-600';
    }
  }

  const indentPadding = indentDepth === 2 ? 'pl-8' : indentDepth === 1 ? 'pl-4' : 'pl-0';

  return (
    <div className={`py-2 border-b border-slate-100 last:border-b-0 ${indentPadding}`}>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <div className="flex items-center gap-1.5">
          {indentDepth > 0 && <span className="text-slate-300">↳</span>}
          <span className={`font-medium ${indentDepth === 0 ? 'text-slate-900 font-semibold' : 'text-slate-700'}`}>
            {label}
          </span>
          {isLimit && (
            <span className="text-[10px] font-medium text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
              Limit
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 font-mono tabular-nums text-slate-700">
          <span className="font-semibold text-slate-900">
            {cleanNumber(Math.round(currentValue * 10) / 10)} {unit}
          </span>

          {hasTarget && (
            <>
              <span className="text-slate-400">/</span>
              <span className="text-slate-500 text-[11px]">
                {cleanNumber(targetValue!)} {unit}
              </span>
              <span
                className={`text-[11px] font-semibold px-1.5 py-0.2 rounded ${
                  isLimit && percentage! > 100
                    ? 'text-rose-700 bg-rose-50'
                    : 'text-slate-600 bg-slate-100'
                }`}
              >
                {roundedPercent}%
              </span>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar Track */}
      {hasTarget ? (
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColorClass}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      ) : (
        <div className="w-full h-1.5 bg-slate-100/60 rounded-full" />
      )}
    </div>
  );
};

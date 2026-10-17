import React from 'react';
import { CalculatedNutrients } from '../utils/nutritionCalc';
import { DailyValuesData } from '../types/nutrition';
import { NutrientProgressBar } from './NutrientProgressBar';

interface MicronutrientDashboardProps {
  calculated: CalculatedNutrients;
  dailyValues: DailyValuesData;
  foodHeaders: string[];
}

export const MicronutrientDashboard: React.FC<MicronutrientDashboardProps> = ({
  calculated,
  dailyValues,
  foodHeaders,
}) => {
  const MACRO_NAMES = new Set([
    'Fat',
    'Saturated Fat',
    'Trans Fat',
    'Carbohydrates',
    'Dietary Fiber',
    'Sugars',
    'Added Sugars',
    'Protein',
  ]);

  // Extract micronutrients in the order they appear in the Foods file
  const micronutrientHeaders = foodHeaders.slice(4).filter((header) => {
    const match = header.match(/^([a-zA-Z0-9 ]+)\s\(([a-zA-Zµμ]+)\)$/);
    if (!match) return false;
    const name = match[1].trim();
    return !MACRO_NAMES.has(name);
  });

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
      <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Micronutrient Dashboard</h3>
          <p className="text-xs text-slate-500">
            Vitamins, minerals, and essential micronutrient targets
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {micronutrientHeaders.length} micronutrients tracked
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
        {micronutrientHeaders.map((header) => {
          const match = header.match(/^([a-zA-Z0-9 ]+)\s\(([a-zA-Zµμ]+)\)$/);
          const name = match ? match[1].trim() : header;
          const unit = match ? match[2].trim() : '';

          const currentValue = calculated.nutrients[header] || 0;
          const targetValue = dailyValues.nutrients[header];
          const isLimit = name === 'Sodium';

          return (
            <NutrientProgressBar
              key={header}
              label={name}
              unit={unit}
              currentValue={currentValue}
              targetValue={targetValue}
              isLimit={isLimit}
              indentDepth={0}
            />
          );
        })}
      </div>
    </div>
  );
};

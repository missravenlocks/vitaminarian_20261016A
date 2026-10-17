import React from 'react';
import { CalculatedNutrients } from '../utils/nutritionCalc';
import { DailyValuesData } from '../types/nutrition';
import { NutrientProgressBar } from './NutrientProgressBar';
import { cleanNumber } from '../utils/nutritionCalc';

interface MacronutrientDashboardProps {
  calculated: CalculatedNutrients;
  dailyValues: DailyValuesData;
  foodHeaders: string[];
}

export const MacronutrientDashboard: React.FC<MacronutrientDashboardProps> = ({
  calculated,
  dailyValues,
  foodHeaders,
}) => {
  const { macroDistribution } = calculated;
  const {
    carbsGrams,
    proteinGrams,
    fatGrams,
    carbsKcal,
    proteinKcal,
    fatKcal,
    totalKcal,
    carbsPercent,
    proteinPercent,
    fatPercent,
  } = macroDistribution;

  // Build SVG Pie / Donut Chart
  // Radius = 60, Center = 80, 80
  const total = totalKcal > 0 ? totalKcal : 1;
  const carbsAngle = (carbsKcal / total) * 360;
  const proteinAngle = (proteinKcal / total) * 360;
  const fatAngle = (fatKcal / total) * 360;

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ) => {
    // If arc is full 360 deg, clamp slightly
    const adjustedEnd = endAngle - startAngle >= 360 ? startAngle + 359.99 : endAngle;
    const start = polarToCartesian(centerX, centerY, radius, adjustedEnd);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = adjustedEnd - startAngle <= 180 ? '0' : '1';

    return `M ${centerX} ${centerY} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
  };

  const carbsPath =
    carbsKcal > 0 ? describeArc(80, 80, 64, 0, carbsAngle) : '';
  const proteinPath =
    proteinKcal > 0 ? describeArc(80, 80, 64, carbsAngle, carbsAngle + proteinAngle) : '';
  const fatPath =
    fatKcal > 0 ? describeArc(80, 80, 64, carbsAngle + proteinAngle, carbsAngle + proteinAngle + fatAngle) : '';

  // Helper to extract nutrient name from header
  const getNutrientInfo = (header: string) => {
    const m = header.match(/^([a-zA-Z0-9 ]+)\s\(([a-zA-Zµμ]+)\)$/);
    if (!m) return null;
    return { name: m[1].trim(), unit: m[2].trim(), header };
  };

  // Map header by nutrient name
  const headerMap = new Map<string, { header: string; unit: string }>();
  foodHeaders.slice(4).forEach((h) => {
    const info = getNutrientInfo(h);
    if (info) {
      headerMap.set(info.name, { header: info.header, unit: info.unit });
    }
  });

  // Allowed macronutrients hierarchy:
  // Fat
  //   Saturated Fat
  //   Trans Fat
  // Carbohydrates
  //   Dietary Fiber
  //   Sugars
  //     Added Sugars
  // Protein
  //
  // Prompt rule:
  // "Progress bars are only shown for nutrients from the list below that appear in the Foods file.
  // Progress bars for Saturated Fat and Trans Fat are always indented under Fat,
  // progress bars for Dietary Fiber and Sugars are always indented under Carbohydrates,
  // and the progress bar for Added Sugars is always indented under Sugars,
  // but all progress bars are otherwise shown in the same order in which they appear in the Foods file.
  // Saturated Fat, Trans Fat, and Added Sugars are assumed to be the only macronutrients to limit."

  const macroOrderInFoods = foodHeaders
    .slice(4)
    .map((h) => getNutrientInfo(h)?.name)
    .filter((n): n is string => Boolean(n));

  // Determine appearance order of the three root families: Fat, Carbohydrates, Protein
  const rootOrder = ['Fat', 'Carbohydrates', 'Protein'].sort((a, b) => {
    return macroOrderInFoods.indexOf(a) - macroOrderInFoods.indexOf(b);
  });

  interface MacroRenderItem {
    name: string;
    header: string;
    unit: string;
    indentDepth: number;
    isLimit: boolean;
  }

  const itemsToRender: MacroRenderItem[] = [];

  rootOrder.forEach((root) => {
    if (root === 'Fat' && headerMap.has('Fat')) {
      const f = headerMap.get('Fat')!;
      itemsToRender.push({ name: 'Fat', header: f.header, unit: f.unit, indentDepth: 0, isLimit: false });
      if (headerMap.has('Saturated Fat')) {
        const sf = headerMap.get('Saturated Fat')!;
        itemsToRender.push({ name: 'Saturated Fat', header: sf.header, unit: sf.unit, indentDepth: 1, isLimit: true });
      }
      if (headerMap.has('Trans Fat')) {
        const tf = headerMap.get('Trans Fat')!;
        itemsToRender.push({ name: 'Trans Fat', header: tf.header, unit: tf.unit, indentDepth: 1, isLimit: true });
      }
    } else if (root === 'Carbohydrates' && headerMap.has('Carbohydrates')) {
      const c = headerMap.get('Carbohydrates')!;
      itemsToRender.push({ name: 'Carbohydrates', header: c.header, unit: c.unit, indentDepth: 0, isLimit: false });
      if (headerMap.has('Dietary Fiber')) {
        const df = headerMap.get('Dietary Fiber')!;
        itemsToRender.push({ name: 'Dietary Fiber', header: df.header, unit: df.unit, indentDepth: 1, isLimit: false });
      }
      if (headerMap.has('Sugars')) {
        const s = headerMap.get('Sugars')!;
        itemsToRender.push({ name: 'Sugars', header: s.header, unit: s.unit, indentDepth: 1, isLimit: false });
        if (headerMap.has('Added Sugars')) {
          const as = headerMap.get('Added Sugars')!;
          itemsToRender.push({ name: 'Added Sugars', header: as.header, unit: as.unit, indentDepth: 2, isLimit: true });
        }
      }
    } else if (root === 'Protein' && headerMap.has('Protein')) {
      const p = headerMap.get('Protein')!;
      itemsToRender.push({ name: 'Protein', header: p.header, unit: p.unit, indentDepth: 0, isLimit: false });
    }
  });

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6">
      <div className="border-b border-slate-100 pb-2">
        <h3 className="text-base font-bold text-slate-900">Macronutrient Dashboard</h3>
        <p className="text-xs text-slate-500">Distribution of calories and daily intake progress</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Macronutrient Pie Chart */}
        <div className="lg:col-span-5 flex flex-col items-center p-4 bg-slate-50/70 rounded-xl border border-slate-200/60">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3">
            Calorie Proportions
          </h4>

          <div className="relative w-40 h-40">
            {totalKcal > 0 ? (
              <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-xs">
                {carbsPath && <path d={carbsPath} fill="#10B981" />}
                {proteinPath && <path d={proteinPath} fill="#3B82F6" />}
                {fatPath && <path d={fatPath} fill="#F43F5E" />}
                {/* Donut hole for modern readable presence */}
                <circle cx="80" cy="80" r="38" fill="#FFFFFF" />
              </svg>
            ) : (
              <svg viewBox="0 0 160 160" className="w-full h-full">
                <circle cx="80" cy="80" r="64" fill="#F1F5F9" />
                <circle cx="80" cy="80" r="38" fill="#FFFFFF" />
              </svg>
            )}

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-medium text-slate-400">Total</span>
              <span className="text-xs font-bold font-mono text-slate-900">
                {cleanNumber(Math.round(totalKcal))} kcal
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="w-full mt-4 space-y-1.5 pt-2 border-t border-slate-200/60 text-xs">
            {/* Carbs */}
            <div className="flex items-center justify-between text-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 shrink-0" />
                <span className="font-medium">Carbohydrates (4 kcal/g)</span>
              </div>
              <div className="font-mono tabular-nums text-right">
                <span className="font-semibold text-slate-900">{cleanNumber(Math.round(carbsGrams * 10) / 10)}g</span>
                <span className="text-slate-400 ml-1">({Math.round(carbsPercent)}%)</span>
              </div>
            </div>

            {/* Protein */}
            <div className="flex items-center justify-between text-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 shrink-0" />
                <span className="font-medium">Protein (4 kcal/g)</span>
              </div>
              <div className="font-mono tabular-nums text-right">
                <span className="font-semibold text-slate-900">{cleanNumber(Math.round(proteinGrams * 10) / 10)}g</span>
                <span className="text-slate-400 ml-1">({Math.round(proteinPercent)}%)</span>
              </div>
            </div>

            {/* Fat */}
            <div className="flex items-center justify-between text-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 shrink-0" />
                <span className="font-medium">Fat (9 kcal/g)</span>
              </div>
              <div className="font-mono tabular-nums text-right">
                <span className="font-semibold text-slate-900">{cleanNumber(Math.round(fatGrams * 10) / 10)}g</span>
                <span className="text-slate-400 ml-1">({Math.round(fatPercent)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Macronutrient Progress Bars */}
        <div className="lg:col-span-7 space-y-0.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
            Target Goals & Limits
          </h4>

          {itemsToRender.map((item) => {
            const currentVal = calculated.nutrients[item.header] || 0;
            const targetVal = dailyValues.nutrients[item.header];

            return (
              <NutrientProgressBar
                key={item.header}
                label={item.name}
                unit={item.unit}
                currentValue={currentVal}
                targetValue={targetVal}
                isLimit={item.isLimit}
                indentDepth={item.indentDepth}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

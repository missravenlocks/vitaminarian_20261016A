import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Search, Check, Flame } from 'lucide-react';
import { AppData, BreakdownSelection, TreeNode } from '../types/nutrition';
import {
  buildFoodBreakdownTree,
  calculateNutrientsForItems,
  cleanNumber,
} from '../utils/nutritionCalc';
import { FoodBreakdownTree } from './FoodBreakdownTree';
import { MacronutrientDashboard } from './MacronutrientDashboard';
import { MicronutrientDashboard } from './MicronutrientDashboard';

interface NutrientBreakdownModuleProps {
  appData: AppData;
  breakdownSelection: BreakdownSelection;
  onBreakdownSelectionChange: (newSel: BreakdownSelection) => void;
}

export const NutrientBreakdownModule: React.FC<NutrientBreakdownModuleProps> = ({
  appData,
  breakdownSelection,
  onBreakdownSelectionChange,
}) => {
  // Dropdown UI states
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const unitRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSubmenuOpen(false);
      }
      if (unitRef.current && !unitRef.current.contains(e.target as Node)) {
        setUnitDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allFoods = Array.from(appData.foods.values());
  const allMeals = Array.from(appData.meals.values());
  const allSpecificItems = [
    ...allFoods.map((f) => ({ name: f.name, type: 'food' as const })),
    ...allMeals.map((m) => ({ name: m.name, type: 'meal' as const })),
  ];

  const filteredSpecificItems = allSpecificItems.filter((it) =>
    it.name.toLowerCase().includes(itemSearchQuery.toLowerCase())
  );

  const isFoodLog = breakdownSelection.type === 'food_log';
  const selectedItemIsFood = appData.foods.has(breakdownSelection.itemName);
  const selectedItemIsMeal = appData.meals.has(breakdownSelection.itemName);

  const numericQty = breakdownSelection.quantity;
  const isSingular = numericQty === 1;
  const servingsLabel = isSingular ? 'serving' : 'servings';

  // Format date for display: e.g. "September 23, 2026"
  const formattedDisplayDate = (() => {
    if (!breakdownSelection.date) return '';
    const [year, month, day] = breakdownSelection.date.split('-').map(Number);
    if (!year || !month || !day) return breakdownSelection.date;
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  })();

  // Handle selecting "Food Log"
  const handleSelectFoodLog = () => {
    onBreakdownSelectionChange({
      ...breakdownSelection,
      type: 'food_log',
    });
    setDropdownOpen(false);
    setSubmenuOpen(false);
  };

  // Handle selecting a specific item
  const handleSelectSpecificItem = (name: string) => {
    onBreakdownSelectionChange({
      ...breakdownSelection,
      type: 'specific_item',
      itemName: name,
      quantity: 1,
      unit: 'servings',
    });
    setDropdownOpen(false);
    setSubmenuOpen(false);
    setItemSearchQuery('');
  };

  // Convert current items into array of items to compute nutrients and tree
  const itemsToAnalyze: { itemName: string; quantity: number; unit: 'g' | 'servings' }[] = [];
  let rootTreeLabel = '';

  if (isFoodLog) {
    // Get items from Food Log on that date
    const [year, month, day] = breakdownSelection.date.split('-');
    const csvDateKey = `${parseInt(month, 10)}/${parseInt(day, 10)}/${year}`;
    const loggedMap = appData.foodLog.get(csvDateKey) || {};

    Object.entries(loggedMap).forEach(([name, storedQty]) => {
      if (storedQty > 0) {
        if (appData.foods.has(name)) {
          const food = appData.foods.get(name)!;
          // Remember Food Log stores values in food.unitUsedInLog
          itemsToAnalyze.push({
            itemName: name,
            quantity: storedQty,
            unit: food.unitUsedInLog,
          });
        } else if (appData.meals.has(name)) {
          itemsToAnalyze.push({
            itemName: name,
            quantity: storedQty,
            unit: 'servings',
          });
        }
      }
    });

    rootTreeLabel = `Food Breakdown for ${formattedDisplayDate}`;
  } else {
    // Specific item
    itemsToAnalyze.push({
      itemName: breakdownSelection.itemName,
      quantity: breakdownSelection.quantity,
      unit: breakdownSelection.unit,
    });

    const unitStr = breakdownSelection.unit === 'g' ? 'g' : isSingular ? 'serving' : 'servings';
    if (breakdownSelection.unit === 'g') {
      rootTreeLabel = `Food Breakdown for ${cleanNumber(breakdownSelection.quantity)}g ${breakdownSelection.itemName}`;
    } else {
      rootTreeLabel = `Food Breakdown for ${cleanNumber(breakdownSelection.quantity)} ${unitStr} ${breakdownSelection.itemName}`;
    }
  }

  // Calculate Nutrients
  const calculatedNutrients = calculateNutrientsForItems(
    itemsToAnalyze,
    appData.foods,
    appData.meals,
    appData.foodHeaders
  );

  // Build Breakdown Tree
  const treeRoot: TreeNode = buildFoodBreakdownTree(
    rootTreeLabel,
    itemsToAnalyze,
    appData.foods,
    appData.meals
  );

  // Calorie progress bar goal
  const calorieGoal = appData.dailyValues.calories || 0;
  const currentCalories = calculatedNutrients.calories;
  const caloriePercent = calorieGoal > 0 ? (currentCalories / calorieGoal) * 100 : 0;
  const roundedCaloriePercent = Math.round(caloriePercent);

  return (
    <section className="w-full py-6 px-6 max-w-7xl mx-auto space-y-6">
      {/* Nutrient Breakdown Selector Row */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-800">
          <span className="text-slate-700 whitespace-nowrap">
            Show nutrient breakdown for
          </span>

          {/* Nutrient Breakdown Dropdown */}
          <div className="relative inline-block" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-300 font-semibold text-slate-900 rounded-lg hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs transition-colors"
            >
              <span>
                {isFoodLog ? 'Food Log' : breakdownSelection.itemName || 'Select Item'}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute z-50 left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-xl py-1 text-xs animate-in fade-in duration-100">
                {/* Option 1: Food Log */}
                <button
                  type="button"
                  onClick={handleSelectFoodLog}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-emerald-50 hover:text-emerald-900 transition-colors ${
                    isFoodLog ? 'font-bold text-emerald-800 bg-emerald-50/50' : 'text-slate-800'
                  }`}
                >
                  <span>Food Log</span>
                  {isFoodLog && <Check className="w-4 h-4 text-emerald-600" />}
                </button>

                {/* Option 2: Specific Item (hover opens submenu) */}
                <div
                  className="relative group"
                  onMouseEnter={() => setSubmenuOpen(true)}
                  onMouseLeave={() => setSubmenuOpen(false)}
                >
                  <div
                    className={`w-full px-3 py-2 text-left flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors ${
                      !isFoodLog ? 'font-semibold text-slate-900' : 'text-slate-700'
                    }`}
                  >
                    <span>Specific Item</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>

                  {submenuOpen && (
                    <div className="absolute left-full top-0 ml-1 w-72 bg-white border border-slate-200 rounded-lg shadow-2xl overflow-hidden max-h-80 flex flex-col z-55">
                      <div className="p-2 border-b border-slate-100 bg-slate-50/90 flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          value={itemSearchQuery}
                          onChange={(e) => setItemSearchQuery(e.target.value)}
                          placeholder="Search foods & meals…"
                          autoFocus
                          className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-800"
                        />
                      </div>
                      <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
                        {filteredSpecificItems.length === 0 ? (
                          <div className="p-3 text-center text-slate-400">No items found</div>
                        ) : (
                          filteredSpecificItems.map((item) => (
                            <button
                              key={item.name}
                              type="button"
                              onClick={() => handleSelectSpecificItem(item.name)}
                              className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-emerald-50 hover:text-emerald-900 transition-colors ${
                                !isFoodLog && breakdownSelection.itemName === item.name
                                  ? 'bg-emerald-50 text-emerald-900 font-semibold'
                                  : 'text-slate-800'
                              }`}
                            >
                              <span>{item.name}</span>
                              <span className="text-[10px] uppercase font-mono text-slate-400">
                                {item.type}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* If Food Log is selected: "on" label + Date Picker */}
          {isFoodLog && (
            <div className="inline-flex items-center gap-2">
              <span className="text-slate-600">on</span>
              <input
                type="date"
                min="2000-01-01"
                value={breakdownSelection.date}
                onChange={(e) =>
                  onBreakdownSelectionChange({
                    ...breakdownSelection,
                    date: e.target.value,
                  })
                }
                className="bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-sm rounded-lg px-3 py-1 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-xs cursor-pointer"
              />
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {formattedDisplayDate}
              </span>
            </div>
          )}

          {/* If Specific Item is selected: Quantity Field + Unit Field */}
          {!isFoodLog && (
            <div className="inline-flex items-center gap-2">
              {/* Quantity Field */}
              <div className="inline-flex items-center gap-1.5">
                <label className="text-xs uppercase font-semibold text-slate-500">
                  Quantity
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={breakdownSelection.quantity}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) {
                      onBreakdownSelectionChange({
                        ...breakdownSelection,
                        quantity: val,
                      });
                    }
                  }}
                  className="w-20 bg-slate-50 border border-slate-300 font-mono text-sm rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-emerald-500 shadow-xs text-slate-900"
                />
              </div>

              {/* Unit Field */}
              <div className="inline-flex items-center gap-1.5 relative" ref={unitRef}>
                <label className="text-xs uppercase font-semibold text-slate-500">
                  Unit
                </label>
                {selectedItemIsMeal ? (
                  <span className="bg-slate-100 border border-slate-300 text-slate-700 font-medium text-xs px-2.5 py-1.5 rounded-lg cursor-not-allowed">
                    {servingsLabel}
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setUnitDropdownOpen(!unitDropdownOpen)}
                      className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-300 font-medium text-xs rounded-lg px-2.5 py-1.5 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs text-slate-900"
                    >
                      <span>
                        {breakdownSelection.unit === 'g' ? 'g' : servingsLabel}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {unitDropdownOpen && (
                      <div className="absolute z-50 left-0 top-full mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-xl py-1 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            onBreakdownSelectionChange({
                              ...breakdownSelection,
                              unit: 'g',
                            });
                            setUnitDropdownOpen(false);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-emerald-50 flex items-center justify-between"
                        >
                          <span>g</span>
                          {breakdownSelection.unit === 'g' && (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onBreakdownSelectionChange({
                              ...breakdownSelection,
                              unit: 'servings',
                            });
                            setUnitDropdownOpen(false);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-emerald-50 flex items-center justify-between border-t border-slate-100"
                        >
                          <span>{servingsLabel}</span>
                          {breakdownSelection.unit === 'servings' && (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Food Breakdown Tree */}
      <FoodBreakdownTree rootNode={treeRoot} />

      {/* Calorie Progress Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Calorie Progress</h3>
              <p className="text-[11px] text-slate-500">Daily energy balance tracking</p>
            </div>
          </div>

          <div className="text-right font-mono tabular-nums">
            <span className="text-base font-bold text-slate-900">
              {cleanNumber(Math.round(currentCalories))}
            </span>
            <span className="text-slate-400 mx-1">/</span>
            <span className="text-sm text-slate-500 font-medium">
              {calorieGoal > 0 ? `${calorieGoal} kcal` : 'Goal not set'}
            </span>
            {calorieGoal > 0 && (
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                {roundedCaloriePercent}%
              </span>
            )}
          </div>
        </div>

        {/* Progress bar track */}
        {calorieGoal > 0 ? (
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, caloriePercent)}%` }}
            />
          </div>
        ) : (
          <div className="w-full h-2 bg-slate-100 rounded-full" />
        )}
      </div>

      {/* Macronutrient Dashboard */}
      <MacronutrientDashboard
        calculated={calculatedNutrients}
        dailyValues={appData.dailyValues}
        foodHeaders={appData.foodHeaders}
      />

      {/* Micronutrient Dashboard */}
      <MicronutrientDashboard
        calculated={calculatedNutrients}
        dailyValues={appData.dailyValues}
        foodHeaders={appData.foodHeaders}
      />
    </section>
  );
};

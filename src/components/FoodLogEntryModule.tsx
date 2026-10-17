import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, ChevronDown, Check } from 'lucide-react';
import { AppData } from '../types/nutrition';
import { exportFoodLogToCSV } from '../utils/defaultData';

interface FoodLogEntryModuleProps {
  appData: AppData;
  onUpdateAppData: (newAppData: AppData) => void;
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (newDate: string) => void;
}

export const FoodLogEntryModule: React.FC<FoodLogEntryModuleProps> = ({
  appData,
  onUpdateAppData,
  selectedDate,
  onDateChange,
}) => {
  const [selectedItemName, setSelectedItemName] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [unit, setUnit] = useState<'g' | 'servings'>('servings');

  // Search dropdown states
  const [itemSearchOpen, setItemSearchOpen] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);

  const [addNotice, setAddNotice] = useState<string | null>(null);

  const itemDropdownRef = useRef<HTMLDivElement>(null);
  const unitDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (itemDropdownRef.current && !itemDropdownRef.current.contains(e.target as Node)) {
        setItemSearchOpen(false);
      }
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(e.target as Node)) {
        setUnitDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // All available foods and meals
  const allFoods = Array.from(appData.foods.values());
  const allMeals = Array.from(appData.meals.values());
  const allItems = [
    ...allFoods.map((f) => ({ name: f.name, type: 'food' as const })),
    ...allMeals.map((m) => ({ name: m.name, type: 'meal' as const })),
  ];

  // Filter items by search query
  const filteredItems = allItems.filter((it) =>
    it.name.toLowerCase().includes(itemSearchQuery.toLowerCase())
  );

  // When an item is selected from dropdown:
  const handleSelectItem = (itemName: string) => {
    setSelectedItemName(itemName);
    setItemSearchOpen(false);
    setItemSearchQuery('');

    const food = appData.foods.get(itemName);
    if (food) {
      if (food.unitUsedInLog === 'g') {
        // Automatically populate with serving size in grams and 'g'
        setQuantity(food.servingSizeGrams.toString());
        setUnit('g');
      } else {
        // Automatically populate with "1" and "serving"
        setQuantity('1');
        setUnit('servings');
      }
    } else {
      // Meal: populate with "1" and "serving"
      setQuantity('1');
      setUnit('servings');
    }
  };

  const selectedItemIsFood = appData.foods.has(selectedItemName);
  const selectedItemIsMeal = appData.meals.has(selectedItemName);

  // Unit display label: "serving" if quantity === 1, "servings" otherwise
  const numericQty = parseFloat(quantity);
  const isSingular = !isNaN(numericQty) && numericQty === 1;
  const servingsLabel = isSingular ? 'serving' : 'servings';

  // Format date for display: "September 23, 2026"
  const formattedDisplayDate = (() => {
    if (!selectedDate) return '';
    const [year, month, day] = selectedDate.split('-').map(Number);
    if (!year || !month || !day) return selectedDate;
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  })();

  const handleAdd = () => {
    if (!selectedItemName) return;
    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) return;

    // Convert selectedDate YYYY-MM-DD to CSV date MM/DD/YYYY
    const [year, month, day] = selectedDate.split('-');
    const csvDateKey = `${parseInt(month, 10)}/${parseInt(day, 10)}/${year}`;

    // Calculate value to store in foodLog according to Unit Used in Log / Meal rule
    let valueToStore = qtyNum;
    if (selectedItemIsFood) {
      const food = appData.foods.get(selectedItemName)!;
      if (food.unitUsedInLog === 'g') {
        if (unit === 'servings') {
          valueToStore = qtyNum * food.servingSizeGrams;
        } else {
          valueToStore = qtyNum;
        }
      } else {
        // unitUsedInLog is 'servings'
        if (unit === 'g') {
          valueToStore = food.servingSizeGrams > 0 ? qtyNum / food.servingSizeGrams : 0;
        } else {
          valueToStore = qtyNum;
        }
      }
    } else if (selectedItemIsMeal) {
      valueToStore = qtyNum; // always servings for meals
    }

    // Update Food Log in appData
    const updatedLog = new Map(appData.foodLog);
    if (!updatedLog.has(csvDateKey)) {
      updatedLog.set(csvDateKey, {});
    }
    const dayMap = { ...updatedLog.get(csvDateKey)! };
    dayMap[selectedItemName] = (dayMap[selectedItemName] || 0) + valueToStore;
    updatedLog.set(csvDateKey, dayMap);

    const newCsv = exportFoodLogToCSV(updatedLog);

    onUpdateAppData({
      ...appData,
      foodLog: updatedLog,
      foodLogRawCsv: newCsv,
    });

    const unitText = unit === 'g' ? 'g' : isSingular ? 'serving' : 'servings';
    setAddNotice(`Logged ${qtyNum} ${unitText} of ${selectedItemName}`);
    setTimeout(() => setAddNotice(null), 3000);
  };

  return (
    <section className="w-full bg-white border-b border-slate-200/80 py-5 px-6 shadow-xs">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Food Log Entry Selector Row */}
        <div className="flex flex-wrap items-center gap-2 text-base font-medium text-slate-800">
          <label htmlFor="log-date-picker" className="text-slate-700 whitespace-nowrap">
            Log foods for
          </label>
          <div className="relative inline-flex items-center">
            <input
              id="log-date-picker"
              type="date"
              min="2000-01-01"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer shadow-xs"
            />
          </div>
          <span className="text-sm font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
            {formattedDisplayDate}
          </span>
        </div>

        {/* Food Log Entry Row: Item Dropdown, Quantity Field, Unit Field, Add Button */}
        <div className="flex flex-wrap items-end gap-3 pt-1">
          {/* Item Dropdown */}
          <div className="flex-1 min-w-[240px] max-w-sm relative" ref={itemDropdownRef}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Item
            </label>
            <button
              type="button"
              onClick={() => setItemSearchOpen(!itemSearchOpen)}
              className="w-full flex items-center justify-between bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-left hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs transition-colors"
            >
              <span className={selectedItemName ? 'font-medium text-slate-900' : 'text-slate-400'}>
                {selectedItemName || 'Search for an item…'}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {itemSearchOpen && (
              <div className="absolute z-40 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in duration-100">
                <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50/70">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={itemSearchQuery}
                    onChange={(e) => setItemSearchQuery(e.target.value)}
                    placeholder="Search for an item…"
                    autoFocus
                    className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-800"
                  />
                </div>
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {filteredItems.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 text-center">No matching items</div>
                  ) : (
                    filteredItems.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => handleSelectItem(item.name)}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-emerald-50 hover:text-emerald-900 flex items-center justify-between transition-colors"
                      >
                        <span className="font-medium text-slate-800">{item.name}</span>
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

          {/* Quantity Field */}
          <div className="w-28">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="0.01"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="1"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
            />
          </div>

          {/* Unit Field */}
          <div className="w-36 relative" ref={unitDropdownRef}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Unit
            </label>
            {selectedItemIsMeal ? (
              // Meal: only option is servings and read only
              <div className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium cursor-not-allowed">
                {servingsLabel}
              </div>
            ) : (
              // Food or unselected: options are g and servings/serving
              <>
                <button
                  type="button"
                  onClick={() => setUnitDropdownOpen(!unitDropdownOpen)}
                  className="w-full flex items-center justify-between bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-left hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs transition-colors"
                >
                  <span className="font-medium text-slate-900">
                    {unit === 'g' ? 'g' : servingsLabel}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {unitDropdownOpen && (
                  <div className="absolute z-40 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in duration-100">
                    <button
                      type="button"
                      onClick={() => {
                        setUnit('g');
                        setUnitDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-emerald-50 hover:text-emerald-900 flex items-center justify-between"
                    >
                      <span>g (grams)</span>
                      {unit === 'g' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUnit('servings');
                        setUnitDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-emerald-50 hover:text-emerald-900 flex items-center justify-between border-t border-slate-100"
                    >
                      <span>{servingsLabel}</span>
                      {unit === 'servings' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Add Button */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!selectedItemName || !quantity || parseFloat(quantity) <= 0}
            className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-xs h-[38px]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add</span>
          </button>

          {/* Inline notification */}
          {addNotice && (
            <div className="flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg animate-in fade-in duration-150">
              {addNotice}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

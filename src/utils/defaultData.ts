import { parseCSV, toCSV } from './csv';
import { AppData, DailyValuesData, FoodMetadata, MealMetadata } from '../types/nutrition';

export const DEFAULT_FOODS_CSV = `Food Name,Unit Used in Log,Serving Size (g),Calories (kcal),Fat (g),Saturated Fat (g),Trans Fat (g),Carbohydrates (g),Dietary Fiber (g),Sugars (g),Added Sugars (g),Protein (g),Vitamin A (µg),Beta Carotene (µg),Vitamin C (mg),Vitamin E (mg),Vitamin K (µg),Vitamin B6 (mg),Vitamin B9 (µg),Vitamin B12 (µg),Choline (mg),Magnesium (mg),Phosphorus (mg),Calcium (mg),Sodium (mg),Iron (mg),Zinc (mg),Copper (mg),Manganese (mg),Selenium (µg)
Oats,g,40,133,1,0.2,0,25,5,0,0,5,0.4,0,0,0.3,1,0.1,10,0,11,46,138,14,1,1,1,0.2,1,18
Skim Milk,servings,245,83,0.2,0.1,0,12,0,12,0,8,149,0,0,0,0,0.1,12,1,38,27,247,299,103,0.1,1,0,0,8
Apple,g,182,95,0.3,0.1,0,25,4,19,0,0.5,5,49,8,0.3,4,0.1,5,0,6,9,20,11,2,0.2,0.1,0,0.1,0
Blueberries,g,148,84,0.5,0,0,21,4,15,0,1,4,47,14,1,29,0.1,9,0,9,9,18,9,1,0.4,0.2,0.1,0.5,0.1`;

export const DEFAULT_MEALS_CSV = `Meal Name,Component,Quantity,Unit
Oatmeal,Oats,1,servings
Oatmeal,Skim Milk,1,servings
Oatmeal with Fruits,Oatmeal,1,servings
Oatmeal with Fruits,Apple,0.5,servings
Oatmeal with Fruits,Blueberries,74,g`;

export const DEFAULT_DAILY_VALUES_CSV = `Calories (kcal),Fat (g),Saturated Fat (g),Trans Fat (g),Carbohydrates (g),Dietary Fiber (g),Sugars (g),Added Sugars (g),Protein (g),Vitamin A (µg),Beta Carotene (µg),Vitamin C (mg),Vitamin E (mg),Vitamin K (µg),Vitamin B6 (mg),Vitamin B9 (µg),Vitamin B12 (µg),Choline (mg),Magnesium (mg),Phosphorus (mg),Calcium (mg),Sodium (mg),Iron (mg),Zinc (mg),Copper (mg),Manganese (mg),Selenium (µg)
2000,78,20,2.2,275,28,,50,50,900,1300,90,15,120,1.7,400,2.4,550,420,1250,1300,2300,18,8,0.9,2.3,55`;

export const DEFAULT_FOOD_LOG_CSV = `Date`;

export function parseFoodsData(csvText: string): {
  foods: Map<string, FoodMetadata>;
  headers: string[];
} {
  const rows = parseCSV(csvText);
  const foods = new Map<string, FoodMetadata>();
  if (rows.length === 0) return { foods, headers: [] };

  const headers = rows[0];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 0 || !row[0]) continue;
    const name = row[0];
    const unitUsedInLog = (row[1] === 'g' ? 'g' : 'servings') as 'g' | 'servings';
    const servingSizeGrams = parseFloat(row[2]) || 0;
    const calories = parseFloat(row[3]) || 0;

    const nutrients: Record<string, number> = {};
    for (let c = 4; c < headers.length; c++) {
      const header = headers[c];
      nutrients[header] = parseFloat(row[c]) || 0;
    }

    foods.set(name, {
      name,
      unitUsedInLog,
      servingSizeGrams,
      calories,
      nutrients,
    });
  }

  return { foods, headers };
}

export function parseMealsData(csvText: string): Map<string, MealMetadata> {
  const rows = parseCSV(csvText);
  const meals = new Map<string, MealMetadata>();
  if (rows.length <= 1) return meals;

  // Header is: Meal Name, Component, Quantity, Unit
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length < 4 || !row[0]) continue;
    const mealName = row[0];
    const componentName = row[1];
    const quantity = parseFloat(row[2]) || 0;
    const unit = (row[3] === 'g' ? 'g' : 'servings') as 'g' | 'servings';

    if (!meals.has(mealName)) {
      meals.set(mealName, {
        name: mealName,
        components: [],
      });
    }

    meals.get(mealName)!.components.push({
      componentName,
      quantity,
      unit,
    });
  }

  return meals;
}

export function parseDailyValuesData(csvText: string): {
  dailyValues: DailyValuesData;
  headers: string[];
} {
  const rows = parseCSV(csvText);
  const dailyValues: DailyValuesData = {
    nutrients: {},
  };
  if (rows.length === 0) return { dailyValues, headers: [] };

  const headers = rows[0];
  const valueRow = rows.length > 1 ? rows[1] : [];

  for (let c = 0; c < headers.length; c++) {
    const header = headers[c];
    const rawVal = valueRow[c];
    const parsed = rawVal !== undefined && rawVal !== '' ? parseFloat(rawVal) : undefined;

    if (header.startsWith('Calories')) {
      dailyValues.calories = parsed;
    } else {
      dailyValues.nutrients[header] = parsed;
    }
  }

  return { dailyValues, headers };
}

export function parseFoodLogData(csvText: string): Map<string, Record<string, number>> {
  const rows = parseCSV(csvText);
  const foodLog = new Map<string, Record<string, number>>();
  if (rows.length <= 1) return foodLog;

  const headers = rows[0]; // first is 'Date', rest are item names
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 0 || !row[0]) continue;
    const date = row[0];
    if (!foodLog.has(date)) {
      foodLog.set(date, {});
    }
    const dayMap = foodLog.get(date)!;

    for (let c = 1; c < headers.length; c++) {
      const itemName = headers[c];
      const rawVal = row[c];
      if (rawVal !== undefined && rawVal !== '') {
        const qty = parseFloat(rawVal);
        if (!isNaN(qty) && qty > 0) {
          dayMap[itemName] = (dayMap[itemName] || 0) + qty;
        }
      }
    }
  }

  return foodLog;
}

export function exportFoodLogToCSV(foodLog: Map<string, Record<string, number>>): string {
  // Collect all unique item names across all dates
  const itemNamesSet = new Set<string>();
  foodLog.forEach((items) => {
    Object.keys(items).forEach((item) => itemNamesSet.add(item));
  });

  const headers = ['Date', ...Array.from(itemNamesSet)];
  const rows: (string | number)[][] = [];

  foodLog.forEach((items, date) => {
    const row: (string | number)[] = [date];
    for (let i = 1; i < headers.length; i++) {
      const itemName = headers[i];
      const qty = items[itemName];
      row.push(qty !== undefined ? qty : '');
    }
    rows.push(row);
  });

  return toCSV(headers, rows);
}

export function exportMealsToCSV(meals: Map<string, MealMetadata>): string {
  const headers = ['Meal Name', 'Component', 'Quantity', 'Unit'];
  const rows: (string | number)[][] = [];
  meals.forEach((meal) => {
    meal.components.forEach((comp) => {
      rows.push([meal.name, comp.componentName, comp.quantity, comp.unit]);
    });
  });
  return toCSV(headers, rows);
}

export function exportFoodsToCSV(foods: Map<string, FoodMetadata>, headers: string[]): string {
  const rows: (string | number)[][] = [];
  foods.forEach((food) => {
    const row: (string | number)[] = [
      food.name,
      food.unitUsedInLog,
      food.servingSizeGrams,
      food.calories,
    ];
    for (let c = 4; c < headers.length; c++) {
      const h = headers[c];
      row.push(food.nutrients[h] !== undefined ? food.nutrients[h] : 0);
    }
    rows.push(row);
  });
  return toCSV(headers, rows);
}

export function exportDailyValuesToCSV(
  dailyValues: DailyValuesData,
  headers: string[]
): string {
  const row: (string | number)[] = [];
  for (const h of headers) {
    if (h.startsWith('Calories')) {
      row.push(dailyValues.calories !== undefined ? dailyValues.calories : '');
    } else {
      const val = dailyValues.nutrients[h];
      row.push(val !== undefined ? val : '');
    }
  }
  return toCSV(headers, [row]);
}

export function getInitialAppData(): AppData {
  const { foods, headers: foodHeaders } = parseFoodsData(DEFAULT_FOODS_CSV);
  const meals = parseMealsData(DEFAULT_MEALS_CSV);
  const { dailyValues, headers: dailyValueHeaders } = parseDailyValuesData(DEFAULT_DAILY_VALUES_CSV);
  const foodLog = parseFoodLogData(DEFAULT_FOOD_LOG_CSV);

  return {
    foodsRawCsv: DEFAULT_FOODS_CSV,
    mealsRawCsv: DEFAULT_MEALS_CSV,
    dailyValuesRawCsv: DEFAULT_DAILY_VALUES_CSV,
    foodLogRawCsv: DEFAULT_FOOD_LOG_CSV,
    foods,
    meals,
    dailyValues,
    foodLog,
    foodHeaders,
    dailyValueHeaders,
  };
}

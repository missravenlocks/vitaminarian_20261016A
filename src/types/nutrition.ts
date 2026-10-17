/**
 * Types for Vitaminarian Nutrition Tracking Application
 */

export interface FoodMetadata {
  name: string;
  unitUsedInLog: 'g' | 'servings';
  servingSizeGrams: number;
  calories: number;
  nutrients: Record<string, number>; // nutrient header -> value per serving
}

export interface MealComponent {
  componentName: string;
  quantity: number;
  unit: 'g' | 'servings';
}

export interface MealMetadata {
  name: string;
  components: MealComponent[];
}

export interface DailyValuesData {
  calories?: number;
  nutrients: Record<string, number | undefined>; // nutrient header -> target value (undefined if empty/missing)
}

export interface FoodLogRow {
  date: string; // MM/DD/YYYY format
  items: Record<string, number>; // item name (Food or Meal) -> quantity
}

export interface AppData {
  foodsRawCsv: string;
  mealsRawCsv: string;
  dailyValuesRawCsv: string;
  foodLogRawCsv: string;

  foods: Map<string, FoodMetadata>;
  meals: Map<string, MealMetadata>;
  dailyValues: DailyValuesData;
  foodLog: Map<string, Record<string, number>>; // date string -> item map

  foodHeaders: string[]; // headers of Foods.csv
  dailyValueHeaders: string[]; // headers of Daily Values.csv
}

export interface ValidationError {
  file: 'Foods' | 'Meals' | 'Daily Values' | 'Food Log' | 'General';
  message: string;
  row?: number;
  column?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings?: string[];
}

export interface TreeNode {
  id: string;
  label: string; // e.g. "Food Breakdown for September 23, 2026" or "2 servings Oatmeal"
  calories: number;
  isExpandable: boolean;
  children?: TreeNode[];
}

export type BreakdownTargetType = 'food_log' | 'specific_item';

export interface BreakdownSelection {
  type: BreakdownTargetType;
  date: string; // YYYY-MM-DD
  itemName: string;
  quantity: number;
  unit: 'g' | 'servings';
}

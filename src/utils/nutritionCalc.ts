import { FoodMetadata, MealMetadata, TreeNode } from '../types/nutrition';

export interface CalculatedNutrients {
  calories: number;
  nutrients: Record<string, number>;
  macroDistribution: {
    carbsGrams: number;
    proteinGrams: number;
    fatGrams: number;
    carbsKcal: number;
    proteinKcal: number;
    fatKcal: number;
    totalKcal: number;
    carbsPercent: number;
    proteinPercent: number;
    fatPercent: number;
  };
}

/**
 * Format quantity and unit string (e.g., "1 serving Apple" or "2 servings Oatmeal" or "182g Apple")
 */
export function formatItemQuantityLabel(
  quantity: number,
  unit: 'g' | 'servings',
  name: string
): string {
  if (unit === 'g') {
    return `${cleanNumber(quantity)}g ${name}`;
  }
  const unitLabel = quantity === 1 ? 'serving' : 'servings';
  return `${cleanNumber(quantity)} ${unitLabel} ${name}`;
}

export function cleanNumber(num: number): string {
  // Format up to 2 decimal places if needed, trim trailing zeros
  if (Number.isInteger(num)) return num.toString();
  return parseFloat(num.toFixed(2)).toString();
}

/**
 * Calculate calories for a single food item with given quantity and unit
 */
export function getFoodCalories(
  food: FoodMetadata,
  quantity: number,
  unit: 'g' | 'servings'
): number {
  if (unit === 'g') {
    if (food.servingSizeGrams <= 0) return 0;
    return (quantity / food.servingSizeGrams) * food.calories;
  }
  return quantity * food.calories;
}

/**
 * Calculate calories for a meal recursively
 */
export function getMealCalories(
  meal: MealMetadata,
  mealQuantityInServings: number,
  foods: Map<string, FoodMetadata>,
  meals: Map<string, MealMetadata>
): number {
  let totalSingleServingCalories = 0;

  for (const comp of meal.components) {
    if (foods.has(comp.componentName)) {
      const food = foods.get(comp.componentName)!;
      totalSingleServingCalories += getFoodCalories(food, comp.quantity, comp.unit);
    } else if (meals.has(comp.componentName)) {
      const subMeal = meals.get(comp.componentName)!;
      totalSingleServingCalories += getMealCalories(subMeal, comp.quantity, foods, meals);
    }
  }

  return totalSingleServingCalories * mealQuantityInServings;
}

/**
 * Calculate item calories (handles both Food and Meal)
 */
export function getItemCalories(
  itemName: string,
  quantity: number,
  unit: 'g' | 'servings',
  foods: Map<string, FoodMetadata>,
  meals: Map<string, MealMetadata>
): number {
  if (foods.has(itemName)) {
    return getFoodCalories(foods.get(itemName)!, quantity, unit);
  }
  if (meals.has(itemName)) {
    return getMealCalories(meals.get(itemName)!, quantity, foods, meals);
  }
  return 0;
}

/**
 * Build recursive Food Breakdown Tree
 */
export function buildFoodBreakdownTree(
  rootLabel: string,
  items: { itemName: string; quantity: number; unit: 'g' | 'servings' }[],
  foods: Map<string, FoodMetadata>,
  meals: Map<string, MealMetadata>
): TreeNode {
  let rootCalories = 0;
  const children: TreeNode[] = [];

  for (const item of items) {
    const node = buildItemTreeNode(item.itemName, item.quantity, item.unit, foods, meals);
    rootCalories += node.calories;
    children.push(node);
  }

  return {
    id: 'root',
    label: rootLabel,
    calories: rootCalories,
    isExpandable: children.length > 0,
    children,
  };
}

let nodeCounter = 0;
function getNextId() {
  return `tree-node-${++nodeCounter}`;
}

export function buildItemTreeNode(
  itemName: string,
  quantity: number,
  unit: 'g' | 'servings',
  foods: Map<string, FoodMetadata>,
  meals: Map<string, MealMetadata>
): TreeNode {
  const isMeal = meals.has(itemName);
  const isFood = foods.has(itemName);

  if (isMeal) {
    const meal = meals.get(itemName)!;
    const mealCals = getMealCalories(meal, quantity, foods, meals);
    const childNodes: TreeNode[] = [];

    for (const comp of meal.components) {
      // Multiply component quantity by parent meal servings
      const effectiveQty = comp.quantity * quantity;
      childNodes.push(buildItemTreeNode(comp.componentName, effectiveQty, comp.unit, foods, meals));
    }

    return {
      id: getNextId(),
      label: formatItemQuantityLabel(quantity, 'servings', itemName),
      calories: mealCals,
      isExpandable: childNodes.length > 0,
      children: childNodes,
    };
  }

  if (isFood) {
    const food = foods.get(itemName)!;
    const foodCals = getFoodCalories(food, quantity, unit);

    if (unit === 'servings') {
      // Node e.g. "2 servings Oats", expands into "80g Oats"
      const grams = quantity * food.servingSizeGrams;
      const gramLeaf: TreeNode = {
        id: getNextId(),
        label: `${cleanNumber(grams)}g ${itemName}`,
        calories: foodCals,
        isExpandable: false,
      };

      return {
        id: getNextId(),
        label: formatItemQuantityLabel(quantity, 'servings', itemName),
        calories: foodCals,
        isExpandable: true,
        children: [gramLeaf],
      };
    } else {
      // Already measured in grams: "148g Blueberries" -> Leaf string!
      return {
        id: getNextId(),
        label: `${cleanNumber(quantity)}g ${itemName}`,
        calories: foodCals,
        isExpandable: false,
      };
    }
  }

  // Unknown item fallback
  return {
    id: getNextId(),
    label: formatItemQuantityLabel(quantity, unit, itemName),
    calories: 0,
    isExpandable: false,
  };
}

/**
 * Calculate complete nutrient totals and macro calorie distribution
 */
export function calculateNutrientsForItems(
  items: { itemName: string; quantity: number; unit: 'g' | 'servings' }[],
  foods: Map<string, FoodMetadata>,
  meals: Map<string, MealMetadata>,
  foodHeaders: string[]
): CalculatedNutrients {
  let totalCalories = 0;
  const nutrientTotals: Record<string, number> = {};

  // Initialize all nutrient columns
  for (let c = 4; c < foodHeaders.length; c++) {
    nutrientTotals[foodHeaders[c]] = 0;
  }

  const addFoodNutrients = (food: FoodMetadata, qty: number, unit: 'g' | 'servings') => {
    const multiplier =
      unit === 'g'
        ? food.servingSizeGrams > 0
          ? qty / food.servingSizeGrams
          : 0
        : qty;

    totalCalories += food.calories * multiplier;
    for (const [header, val] of Object.entries(food.nutrients)) {
      nutrientTotals[header] = (nutrientTotals[header] || 0) + val * multiplier;
    }
  };

  const addMealNutrients = (meal: MealMetadata, mealQtyServings: number) => {
    for (const comp of meal.components) {
      const effectiveQty = comp.quantity * mealQtyServings;
      if (foods.has(comp.componentName)) {
        addFoodNutrients(foods.get(comp.componentName)!, effectiveQty, comp.unit);
      } else if (meals.has(comp.componentName)) {
        addMealNutrients(meals.get(comp.componentName)!, effectiveQty);
      }
    }
  };

  for (const item of items) {
    if (foods.has(item.itemName)) {
      addFoodNutrients(foods.get(item.itemName)!, item.quantity, item.unit);
    } else if (meals.has(item.itemName)) {
      addMealNutrients(meals.get(item.itemName)!, item.quantity);
    }
  }

  // Find exact keys for macronutrients
  const findNutrientKey = (base: string): string => {
    return (
      foodHeaders.find((h) => {
        const match = h.match(/^([a-zA-Z0-9 ]+)\s\(([a-zA-Zµμ]+)\)$/);
        return match && match[1].trim() === base;
      }) || ''
    );
  };

  const carbsKey = findNutrientKey('Carbohydrates');
  const proteinKey = findNutrientKey('Protein');
  const fatKey = findNutrientKey('Fat');

  const carbsGrams = carbsKey ? nutrientTotals[carbsKey] || 0 : 0;
  const proteinGrams = proteinKey ? nutrientTotals[proteinKey] || 0 : 0;
  const fatGrams = fatKey ? nutrientTotals[fatKey] || 0 : 0;

  const carbsKcal = carbsGrams * 4;
  const proteinKcal = proteinGrams * 4;
  const fatKcal = fatGrams * 9;
  const totalMacroKcal = carbsKcal + proteinKcal + fatKcal;

  const carbsPercent = totalMacroKcal > 0 ? (carbsKcal / totalMacroKcal) * 100 : 0;
  const proteinPercent = totalMacroKcal > 0 ? (proteinKcal / totalMacroKcal) * 100 : 0;
  const fatPercent = totalMacroKcal > 0 ? (fatKcal / totalMacroKcal) * 100 : 0;

  return {
    calories: totalCalories,
    nutrients: nutrientTotals,
    macroDistribution: {
      carbsGrams,
      proteinGrams,
      fatGrams,
      carbsKcal,
      proteinKcal,
      fatKcal,
      totalKcal: totalMacroKcal,
      carbsPercent,
      proteinPercent,
      fatPercent,
    },
  };
}

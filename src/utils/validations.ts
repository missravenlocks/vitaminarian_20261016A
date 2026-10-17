import { parseCSV } from './csv';
import { ValidationError, ValidationResult } from '../types/nutrition';

// Allowed characters in Food and Meal names: English letters, digits, spaces, and '-,()/
const VALID_NAME_REGEX = /^[a-zA-Z0-9 '\-,()\/]+$/;

// Nutrient header pattern: <Nutrient Name> (<Unit>)
// Nutrient Name: nonempty, English letters, digits, spaces
// Unit: nonempty, English letters and μ/µ symbol
const NUTRIENT_HEADER_REGEX = /^([a-zA-Z0-9 ]+)\s\(([a-zA-Zµμ]+)\)$/;

// Date pattern: MM/DD/YYYY with optional leading zeros
const DATE_FORMAT_REGEX = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/\d{4}$/;

/**
 * Initial Validation for Foods file
 */
export function validateFoodsInitial(csvText: string): ValidationResult {
  const errors: ValidationError[] = [];
  if (!csvText.trim()) return { valid: true, errors: [] };

  const rows = parseCSV(csvText);
  if (rows.length === 0) return { valid: true, errors: [] };

  const headers = rows[0];

  // 1. The first 4 column headers must be "Food Name", "Unit Used in Log", "Serving Size (g)", and "Calories (kcal)", in that order.
  const expectedFirst4 = ['Food Name', 'Unit Used in Log', 'Serving Size (g)', 'Calories (kcal)'];
  for (let i = 0; i < expectedFirst4.length; i++) {
    if (headers[i] !== expectedFirst4[i]) {
      errors.push({
        file: 'Foods',
        message: `Column ${i + 1} header must be "${expectedFirst4[i]}", found "${headers[i] || ''}".`,
        row: 1,
        column: headers[i],
      });
    }
  }

  // 2. All column headers to the right of Calories must strictly follow "<Nutrient Name> (<Unit>)"
  const nutrientNames = new Set<string>();
  const nutrientUnits = new Map<string, string>();

  for (let c = 4; c < headers.length; c++) {
    const h = headers[c];
    const match = h.match(NUTRIENT_HEADER_REGEX);
    if (!match) {
      errors.push({
        file: 'Foods',
        message: `Column "${h}" does not follow the required format "<Nutrient Name> (<Unit>)" with valid characters.`,
        row: 1,
        column: h,
      });
    } else {
      const nutrientName = match[1].trim();
      const unit = match[2].trim();
      nutrientNames.add(nutrientName);
      nutrientUnits.set(nutrientName, unit);
    }
  }

  // 3. Nutrient columns "Fat", "Carbohydrates", and "Protein" must exist (in any order) and their units must be g.
  const requiredNutrients = ['Fat', 'Carbohydrates', 'Protein'];
  for (const req of requiredNutrients) {
    if (!nutrientNames.has(req)) {
      errors.push({
        file: 'Foods',
        message: `Required nutrient column "${req} (g)" is missing.`,
        row: 1,
      });
    } else {
      const unit = nutrientUnits.get(req);
      if (unit !== 'g') {
        errors.push({
          file: 'Foods',
          message: `Nutrient "${req}" must have unit "g", found "${unit}".`,
          row: 1,
          column: `${req} (${unit})`,
        });
      }
    }
  }

  // Row checks
  const foodNames = new Set<string>();

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 0 || (row.length === 1 && !row[0])) continue;
    const rowNum = r + 1;

    const foodName = row[0];
    // 4. All food names must be nonempty and only contain English letters, digits, spaces, and '-,()/
    if (!foodName || !foodName.trim()) {
      errors.push({
        file: 'Foods',
        message: `Food name at row ${rowNum} cannot be empty.`,
        row: rowNum,
      });
    } else if (!VALID_NAME_REGEX.test(foodName)) {
      errors.push({
        file: 'Foods',
        message: `Food name "${foodName}" at row ${rowNum} contains invalid characters. Only letters, digits, spaces, and '-,()/ are allowed.`,
        row: rowNum,
      });
    } else {
      // 8. There may not be duplicate food names.
      if (foodNames.has(foodName)) {
        errors.push({
          file: 'Foods',
          message: `Duplicate food name "${foodName}" found at row ${rowNum}.`,
          row: rowNum,
        });
      } else {
        foodNames.add(foodName);
      }
    }

    // 5. All values in "Unit Used in Log" must be either g or servings and may not be empty.
    const unitUsedInLog = row[1];
    if (unitUsedInLog !== 'g' && unitUsedInLog !== 'servings') {
      errors.push({
        file: 'Foods',
        message: `Unit Used in Log for "${foodName || 'row ' + rowNum}" must be either "g" or "servings", found "${unitUsedInLog || ''}".`,
        row: rowNum,
        column: 'Unit Used in Log',
      });
    }

    // 6. All serving sizes must be nonempty, numeric, and positive (> 0).
    const servingSizeStr = row[2];
    const servingSize = parseFloat(servingSizeStr);
    if (!servingSizeStr || isNaN(servingSize) || servingSize <= 0) {
      errors.push({
        file: 'Foods',
        message: `Serving Size for "${foodName || 'row ' + rowNum}" must be a positive number, found "${servingSizeStr || ''}".`,
        row: rowNum,
        column: 'Serving Size (g)',
      });
    }

    // 7. All quantity values other than serving size must either be empty or be numeric and nonnegative (>= 0).
    // This applies to Calories (col index 3) and all nutrient columns (col 4+).
    for (let c = 3; c < headers.length; c++) {
      const valStr = row[c];
      if (valStr !== undefined && valStr !== '') {
        const val = parseFloat(valStr);
        if (isNaN(val) || val < 0) {
          errors.push({
            file: 'Foods',
            message: `Value for column "${headers[c]}" in food "${foodName || 'row ' + rowNum}" must be numeric and non-negative, found "${valStr}".`,
            row: rowNum,
            column: headers[c],
          });
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Initial Validation for Meals file
 */
export function validateMealsInitial(csvText: string): ValidationResult {
  const errors: ValidationError[] = [];
  if (!csvText.trim()) return { valid: true, errors: [] };

  const rows = parseCSV(csvText);
  if (rows.length === 0) return { valid: true, errors: [] };

  const headers = rows[0];

  // 1. Column headers must be Meal Name, Component, Quantity, and Unit, in that order, with no additional columns.
  const expectedHeaders = ['Meal Name', 'Component', 'Quantity', 'Unit'];
  if (headers.length !== 4) {
    errors.push({
      file: 'Meals',
      message: `Meals file must have exactly 4 columns ("Meal Name", "Component", "Quantity", "Unit"), found ${headers.length} columns.`,
      row: 1,
    });
  } else {
    for (let i = 0; i < 4; i++) {
      if (headers[i] !== expectedHeaders[i]) {
        errors.push({
          file: 'Meals',
          message: `Column ${i + 1} header must be "${expectedHeaders[i]}", found "${headers[i] || ''}".`,
          row: 1,
        });
      }
    }
  }

  // Track meal components to enforce:
  // 3. Duplicate meal names check (ensure grouped/non-interleaved)
  // 4. A meal may not list the same component more than once.
  const mealComponents = new Map<string, Set<string>>();
  const seenMealOrder: string[] = [];
  const completedMeals = new Set<string>();
  let currentMealName = '';

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 0 || (row.length === 1 && !row[0])) continue;
    const rowNum = r + 1;

    const mealName = row[0];
    const component = row[1];
    const quantityStr = row[2];
    const unit = row[3];

    // 2. All meal names must be nonempty and contain valid characters
    if (!mealName || !mealName.trim()) {
      errors.push({
        file: 'Meals',
        message: `Meal name at row ${rowNum} cannot be empty.`,
        row: rowNum,
      });
    } else if (!VALID_NAME_REGEX.test(mealName)) {
      errors.push({
        file: 'Meals',
        message: `Meal name "${mealName}" at row ${rowNum} contains invalid characters.`,
        row: rowNum,
      });
    }

    if (mealName) {
      if (mealName !== currentMealName) {
        if (completedMeals.has(mealName)) {
          // Meal appeared previously and was interrupted by another meal
          errors.push({
            file: 'Meals',
            message: `Duplicate meal name definition for "${mealName}" at row ${rowNum}. Rows for a meal must be contiguous.`,
            row: rowNum,
          });
        }
        if (currentMealName) completedMeals.add(currentMealName);
        currentMealName = mealName;
        if (!mealComponents.has(mealName)) {
          mealComponents.set(mealName, new Set());
          seenMealOrder.push(mealName);
        }
      }

      // 4. A meal may not list the same component more than once.
      const compSet = mealComponents.get(mealName)!;
      if (!component || !component.trim()) {
        errors.push({
          file: 'Meals',
          message: `Component name for meal "${mealName}" at row ${rowNum} cannot be empty.`,
          row: rowNum,
        });
      } else {
        if (compSet.has(component)) {
          errors.push({
            file: 'Meals',
            message: `Meal "${mealName}" lists component "${component}" more than once (row ${rowNum}).`,
            row: rowNum,
          });
        } else {
          compSet.add(component);
        }
      }
    }

    // 5. All quantity values must be nonempty, numeric, and positive (> 0).
    const qty = parseFloat(quantityStr);
    if (!quantityStr || isNaN(qty) || qty <= 0) {
      errors.push({
        file: 'Meals',
        message: `Quantity for component "${component || 'row ' + rowNum}" in meal "${mealName}" must be a positive number, found "${quantityStr || ''}".`,
        row: rowNum,
      });
    }

    // 6 & 7. Unit must be either g or servings
    if (unit !== 'g' && unit !== 'servings') {
      errors.push({
        file: 'Meals',
        message: `Unit for component "${component || 'row ' + rowNum}" in meal "${mealName}" must be either "g" or "servings", found "${unit || ''}".`,
        row: rowNum,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Initial Validation for Daily Values file
 */
export function validateDailyValuesInitial(csvText: string): ValidationResult {
  const errors: ValidationError[] = [];
  if (!csvText.trim()) return { valid: true, errors: [] };

  const rows = parseCSV(csvText);
  if (rows.length === 0) return { valid: true, errors: [] };

  const headers = rows[0];
  const valueRow = rows.length > 1 ? rows[1] : [];

  // 1. All daily values must either be empty or be numeric and nonnegative (empty values indicate no daily intake goal).
  for (let c = 0; c < headers.length; c++) {
    const valStr = valueRow[c];
    if (valStr !== undefined && valStr !== '') {
      const val = parseFloat(valStr);
      if (isNaN(val) || val < 0) {
        errors.push({
          file: 'Daily Values',
          message: `Value for "${headers[c]}" must be numeric and non-negative, found "${valStr}".`,
          row: 2,
          column: headers[c],
        });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Initial Validation for Food Log file
 */
export function validateFoodLogInitial(csvText: string): ValidationResult {
  const errors: ValidationError[] = [];
  if (!csvText.trim()) return { valid: true, errors: [] };

  const rows = parseCSV(csvText);
  if (rows.length === 0) return { valid: true, errors: [] };

  const headers = rows[0];

  // 1. First column header must be "Date"
  if (headers[0] !== 'Date') {
    errors.push({
      file: 'Food Log',
      message: `First column header must be "Date", found "${headers[0] || ''}".`,
      row: 1,
      column: headers[0],
    });
  }

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 0 || (row.length === 1 && !row[0])) continue;
    const rowNum = r + 1;

    const dateStr = row[0];
    // 2. All values in Date column must follow format MM/DD/YYYY (leading zeroes optional)
    if (!dateStr || !DATE_FORMAT_REGEX.test(dateStr)) {
      errors.push({
        file: 'Food Log',
        message: `Date "${dateStr || ''}" at row ${rowNum} does not follow required MM/DD/YYYY format.`,
        row: rowNum,
        column: 'Date',
      });
    }

    // 3. All quantity values must either be empty or be numeric and nonnegative.
    for (let c = 1; c < headers.length; c++) {
      const valStr = row[c];
      if (valStr !== undefined && valStr !== '') {
        const val = parseFloat(valStr);
        if (isNaN(val) || val < 0) {
          errors.push({
            file: 'Food Log',
            message: `Quantity for "${headers[c]}" on date "${dateStr}" (row ${rowNum}) must be non-negative numeric, found "${valStr}".`,
            row: rowNum,
            column: headers[c],
          });
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Final Validations run before accepting changes:
 * 1. No name shared between Food in Foods and Meal in Meals
 * 2. If Foods merged, metadata column units match existing
 * 3. Meals components match Food in Foods or a Meal listed in a previous row of Meals
 * 4. Food Log column headers after "Date" match a Food in Foods or Meal in Meals
 * 5. Daily Values column headers exactly match Foods headers after "Serving Size" in same order
 */
export function runFinalValidations(
  foodsCsv: string,
  mealsCsv: string,
  dailyValuesCsv: string,
  foodLogCsv: string,
  existingFoodsCsv?: string,
  foodsWasMerged?: boolean
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  const foodRows = parseCSV(foodsCsv);
  const mealRows = parseCSV(mealsCsv);
  const dvRows = parseCSV(dailyValuesCsv);
  const logRows = parseCSV(foodLogCsv);

  const foodNames = new Set<string>();
  if (foodRows.length > 1) {
    for (let r = 1; r < foodRows.length; r++) {
      if (foodRows[r][0]) foodNames.add(foodRows[r][0]);
    }
  }

  const mealNames = new Set<string>();
  const mealOrder: string[] = [];
  if (mealRows.length > 1) {
    for (let r = 1; r < mealRows.length; r++) {
      const mName = mealRows[r][0];
      if (mName && !mealNames.has(mName)) {
        mealNames.add(mName);
        mealOrder.push(mName);
      }
    }
  }

  // 1. No name may be shared between a Food in the Foods file and a Meal in the Meals file.
  for (const fName of foodNames) {
    if (mealNames.has(fName)) {
      errors.push({
        file: 'General',
        message: `Name conflict: "${fName}" exists in both Foods and Meals. Food and Meal names must be distinct.`,
      });
    }
  }

  // 2. If the user uploads a Foods file and chooses to merge it with existing, units must match for common metadata columns.
  if (foodsWasMerged && existingFoodsCsv && existingFoodsCsv.trim() && foodsCsv.trim()) {
    const existingRows = parseCSV(existingFoodsCsv);
    if (existingRows.length > 0 && foodRows.length > 0) {
      const existingHeaders = existingRows[0];
      const newHeaders = foodRows[0];

      const getColMetadata = (h: string) => {
        const m = h.match(NUTRIENT_HEADER_REGEX);
        if (m) return { name: m[1].trim(), unit: m[2].trim() };
        return null;
      };

      const existingUnits = new Map<string, string>();
      for (let c = 4; c < existingHeaders.length; c++) {
        const meta = getColMetadata(existingHeaders[c]);
        if (meta) existingUnits.set(meta.name, meta.unit);
      }

      for (let c = 4; c < newHeaders.length; c++) {
        const meta = getColMetadata(newHeaders[c]);
        if (meta && existingUnits.has(meta.name)) {
          const oldUnit = existingUnits.get(meta.name);
          if (oldUnit !== meta.unit) {
            errors.push({
              file: 'Foods',
              message: `Unit mismatch in Foods merge: nutrient "${meta.name}" has unit "${meta.unit}" in uploaded file but "${oldUnit}" in existing file.`,
            });
          }
        }
      }
    }
  }

  // 3. For all rows in the Meals file, each component must match a food listed in the Foods file
  // or a meal listed in a previous row of the Meals file (after grouping all rows by meal without otherwise changing the order).
  // Also check rule 6 & 7: if component is food, unit must be g or servings; if component is meal, unit must be servings.
  if (mealRows.length > 1) {
    const declaredPreviousMeals = new Set<string>();
    let lastMeal = '';

    for (let r = 1; r < mealRows.length; r++) {
      const row = mealRows[r];
      if (row.length < 4 || !row[0]) continue;
      const mealName = row[0];
      const component = row[1];
      const unit = row[3];

      if (mealName !== lastMeal) {
        if (lastMeal) declaredPreviousMeals.add(lastMeal);
        lastMeal = mealName;
      }

      const isFood = foodNames.has(component);
      const isPreviousMeal = declaredPreviousMeals.has(component);

      if (!isFood && !isPreviousMeal) {
        if (mealName === component) {
          errors.push({
            file: 'Meals',
            message: `Meal "${mealName}" cannot contain itself as a component.`,
            row: r + 1,
          });
        } else if (mealNames.has(component)) {
          errors.push({
            file: 'Meals',
            message: `Component "${component}" in meal "${mealName}" is a meal defined later in the file or in the same meal. Meals may only reference foods or previously defined meals.`,
            row: r + 1,
          });
        } else {
          errors.push({
            file: 'Meals',
            message: `Component "${component}" in meal "${mealName}" does not exist in Foods or prior Meals.`,
            row: r + 1,
          });
        }
      } else if (isFood) {
        if (unit !== 'g' && unit !== 'servings') {
          errors.push({
            file: 'Meals',
            message: `Component "${component}" in meal "${mealName}" is a food, so its unit must be "g" or "servings", found "${unit}".`,
            row: r + 1,
          });
        }
      } else if (isPreviousMeal) {
        if (unit !== 'servings') {
          errors.push({
            file: 'Meals',
            message: `Component "${component}" in meal "${mealName}" is a meal, so its unit must be "servings", found "${unit}".`,
            row: r + 1,
          });
        }
      }
    }
  }

  // 4. In the Food Log file, each column header after "Date" must either be the name of a food in Foods or a meal in Meals.
  if (logRows.length > 0) {
    const logHeaders = logRows[0];
    for (let c = 1; c < logHeaders.length; c++) {
      const colName = logHeaders[c];
      if (!foodNames.has(colName) && !mealNames.has(colName)) {
        errors.push({
          file: 'Food Log',
          message: `Food Log column "${colName}" is neither a defined Food nor a defined Meal.`,
          column: colName,
        });
      }
    }
  }

  // 5. The list of column headers in the Daily Values file must exactly match the list of column headers
  // in Foods file after the "Serving Size" column and must appear in the same order.
  if (foodRows.length > 0 && dvRows.length > 0) {
    const foodHeaders = foodRows[0];
    const dvHeaders = dvRows[0];

    // Serving Size column index in Foods
    const servingSizeIdx = foodHeaders.findIndex((h) => h.startsWith('Serving Size'));
    if (servingSizeIdx !== -1) {
      const expectedDVHeaders = foodHeaders.slice(servingSizeIdx + 1);
      const isMatch =
        expectedDVHeaders.length === dvHeaders.length &&
        expectedDVHeaders.every((h, idx) => h === dvHeaders[idx]);

      if (!isMatch) {
        errors.push({
          file: 'Daily Values',
          message: `Daily Values columns must exactly match the columns in Foods after "Serving Size" in the same order. Expected ${expectedDVHeaders.length} columns starting with "${expectedDVHeaders[0] || ''}", found ${dvHeaders.length} columns starting with "${dvHeaders[0] || ''}".`,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

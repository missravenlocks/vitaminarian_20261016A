import { parseCSV, toCSV } from './csv';

export interface MergeResult {
  mergedCsv: string;
  warnings: string[];
}

/**
 * Merge Meals CSV files according to technical specification:
 * - Existing meals: Replace entire composition with uploaded, maintaining uploaded order.
 * - Missing meals: Do nothing (keep existing).
 * - New meals: Append rows of new meals in same order as in uploaded file.
 */
export function mergeMeals(existingCsv: string, uploadedCsv: string): MergeResult {
  const existingRows = parseCSV(existingCsv);
  const uploadedRows = parseCSV(uploadedCsv);

  if (existingRows.length === 0) return { mergedCsv: uploadedCsv, warnings: [] };
  if (uploadedRows.length === 0) return { mergedCsv: existingCsv, warnings: [] };

  const headers = existingRows[0];

  // Group existing meals
  const existingMealsMap = new Map<string, string[][]>();
  const existingMealOrder: string[] = [];

  for (let r = 1; r < existingRows.length; r++) {
    const row = existingRows[r];
    const mealName = row[0];
    if (!mealName) continue;
    if (!existingMealsMap.has(mealName)) {
      existingMealsMap.set(mealName, []);
      existingMealOrder.push(mealName);
    }
    existingMealsMap.get(mealName)!.push(row);
  }

  // Group uploaded meals
  const uploadedMealsMap = new Map<string, string[][]>();
  const uploadedMealOrder: string[] = [];

  for (let r = 1; r < uploadedRows.length; r++) {
    const row = uploadedRows[r];
    const mealName = row[0];
    if (!mealName) continue;
    if (!uploadedMealsMap.has(mealName)) {
      uploadedMealsMap.set(mealName, []);
      uploadedMealOrder.push(mealName);
    }
    uploadedMealsMap.get(mealName)!.push(row);
  }

  // Build merged rows:
  // First, existing meal order with replaced composition if present in uploaded
  const resultRows: string[][] = [];

  for (const mealName of existingMealOrder) {
    if (uploadedMealsMap.has(mealName)) {
      resultRows.push(...uploadedMealsMap.get(mealName)!);
    } else {
      resultRows.push(...existingMealsMap.get(mealName)!);
    }
  }

  // Next, new meals from uploaded (not in existing)
  for (const mealName of uploadedMealOrder) {
    if (!existingMealsMap.has(mealName)) {
      resultRows.push(...uploadedMealsMap.get(mealName)!);
    }
  }

  return {
    mergedCsv: toCSV(headers, resultRows),
    warnings: [],
  };
}

/**
 * Merge grid-based CSV files (Foods, Daily Values, Food Log)
 * - Existing cells: Replace current value with uploaded value, even if empty.
 * - Missing cells: Do nothing.
 * - New cells: Append necessary rows and/or columns to support new information and store uploaded values.
 */
export function mergeGridFile(
  existingCsv: string,
  uploadedCsv: string,
  keyColumnIndex: number, // 0 for Foods (Food Name), 0 for Food Log (Date)
  isFoodsFile: boolean = false
): MergeResult {
  const warnings: string[] = [];
  const existingRows = parseCSV(existingCsv);
  const uploadedRows = parseCSV(uploadedCsv);

  if (existingRows.length === 0) return { mergedCsv: uploadedCsv, warnings };
  if (uploadedRows.length === 0) return { mergedCsv: existingCsv, warnings };

  const existingHeaders = [...existingRows[0]];
  const uploadedHeaders = uploadedRows[0];

  // Identify new columns in uploaded
  const finalHeaders = [...existingHeaders];
  const newColumns: string[] = [];

  for (const uh of uploadedHeaders) {
    if (!finalHeaders.includes(uh)) {
      finalHeaders.push(uh);
      newColumns.push(uh);
    }
  }

  // Map existing rows by primary key
  const rowMap = new Map<string, Map<string, string>>();
  const rowOrder: string[] = [];

  for (let r = 1; r < existingRows.length; r++) {
    const row = existingRows[r];
    const key = row[keyColumnIndex];
    if (!key) continue;

    const cellMap = new Map<string, string>();
    for (let c = 0; c < existingHeaders.length; c++) {
      cellMap.set(existingHeaders[c], row[c] !== undefined ? row[c] : '');
    }
    rowMap.set(key, cellMap);
    rowOrder.push(key);
  }

  // Process uploaded rows
  const newRowKeys: string[] = [];

  for (let r = 1; r < uploadedRows.length; r++) {
    const row = uploadedRows[r];
    const key = row[keyColumnIndex];
    if (!key) continue;

    if (!rowMap.has(key)) {
      rowMap.set(key, new Map());
      rowOrder.push(key);
      newRowKeys.push(key);
    }

    const cellMap = rowMap.get(key)!;
    for (let c = 0; c < uploadedHeaders.length; c++) {
      const col = uploadedHeaders[c];
      cellMap.set(col, row[c] !== undefined ? row[c] : '');
    }
  }

  // Foods warnings:
  if (isFoodsFile) {
    // 1. If user adds new foods but does not include all metadata columns present in current file
    if (newRowKeys.length > 0) {
      const missingMetadataCols = existingHeaders.filter((h) => !uploadedHeaders.includes(h));
      if (missingMetadataCols.length > 0) {
        warnings.push(
          `Warning: The uploaded Foods file adds new food(s) (${newRowKeys.join(', ')}) but does not include all columns present in the current file. These foods will be assumed to have a value of zero for: ${missingMetadataCols.join(', ')}.`
        );
      }
    }

    // 2. If user adds a new nutrient but does not include all food rows present in current file
    if (newColumns.length > 0) {
      const existingFoodsNotUploaded = rowOrder.filter(
        (key) => !uploadedRows.slice(1).some((r) => r[keyColumnIndex] === key)
      );
      if (existingFoodsNotUploaded.length > 0) {
        warnings.push(
          `Warning: The uploaded Foods file introduces new nutrient column(s) (${newColumns.join(', ')}) but does not include all existing foods. All non-included foods will be assumed to have a value of zero for these nutrients.`
        );
      }
    }
  }

  // Build final rows
  const resultRows: string[][] = [];

  for (const key of rowOrder) {
    const cellMap = rowMap.get(key)!;
    const rowArr: string[] = [];
    for (const h of finalHeaders) {
      rowArr.push(cellMap.get(h) || (isFoodsFile ? '0' : ''));
    }
    // Make sure key column is intact
    rowArr[keyColumnIndex] = key;
    resultRows.push(rowArr);
  }

  return {
    mergedCsv: toCSV(finalHeaders, resultRows),
    warnings,
  };
}

/**
 * Merge Daily Values CSV (Single row target file)
 */
export function mergeDailyValues(existingCsv: string, uploadedCsv: string): MergeResult {
  const existingRows = parseCSV(existingCsv);
  const uploadedRows = parseCSV(uploadedCsv);

  if (existingRows.length === 0) return { mergedCsv: uploadedCsv, warnings: [] };
  if (uploadedRows.length === 0) return { mergedCsv: existingCsv, warnings: [] };

  const existingHeaders = existingRows[0];
  const uploadedHeaders = uploadedRows[0];

  const existingValues = existingRows[1] || [];
  const uploadedValues = uploadedRows[1] || [];

  const finalHeaders = [...existingHeaders];
  for (const uh of uploadedHeaders) {
    if (!finalHeaders.includes(uh)) {
      finalHeaders.push(uh);
    }
  }

  const valueMap = new Map<string, string>();
  for (let c = 0; c < existingHeaders.length; c++) {
    valueMap.set(existingHeaders[c], existingValues[c] !== undefined ? existingValues[c] : '');
  }

  for (let c = 0; c < uploadedHeaders.length; c++) {
    valueMap.set(uploadedHeaders[c], uploadedValues[c] !== undefined ? uploadedValues[c] : '');
  }

  const finalValues: string[] = [];
  for (const h of finalHeaders) {
    finalValues.push(valueMap.get(h) || '');
  }

  return {
    mergedCsv: toCSV(finalHeaders, [finalValues]),
    warnings: [],
  };
}

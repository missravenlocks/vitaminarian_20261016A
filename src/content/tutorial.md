# Vitaminarian User Guide & Tutorial

Welcome to **Vitaminarian**, a professional, highly customizable nutrition tracking platform designed to give you transparent, granular visibility into both macronutrients and essential micronutrients.

---

### Important Notice Regarding Sample Data
> **Please Note:** The sample **Foods**, **Meals**, and **Daily Values** files pre-loaded into this application contain limited demonstration data that may not accurately reflect your personal dietary requirements or specific food choices. 
> 
> You are strongly encouraged to customize and expand these files to suit your unique lifestyle. Use the **Download Data** button to export the current templates, edit or add your own items and nutritional targets in any spreadsheet editor, and upload them back using the **Upload Data** button.

---

## 1. Application Architecture & Workflow

Vitaminarian is organized into a clean vertical workspace with five primary sections:

### Header Module
- Displays the **Vitaminarian** brand mark and the spinach leaf insignia.
- Subtitle: *"Customizable nutrition tracking"*.

### Upload and Download Module
- **Upload Data**: Open the upload portal to load updated or custom CSV files for Foods, Meals, Daily Values, and Food Log.
  - Supports both **Merge with existing** and **Replace existing** operations.
  - Automatically runs real-time **Initial Validations** upon file selection.
  - Runs rigorous **Final Validations** upon clicking **Accept Changes** to guarantee referential integrity.
- **Download Data**: Instantly export any of your 4 data files (`Foods.csv`, `Meals.csv`, `Daily Values.csv`, `Food Log.csv`) in standard RFC-compliant CSV format.

---

## 2. Food Log Entry Module

Log everything you eat with exact portions:
1. **Date Picker**: Select any date starting from **January 1, 2000**, including today and future dates.
2. **Item Dropdown**: Search across your entire catalog of individual Foods and composite Meals.
3. **Smart Defaulting**:
   - If a selected Food specifies `g` as its *Unit Used in Log*, the quantity and unit automatically populate with that food's standard serving size in grams.
   - For all other items, the fields default to `1 serving`.
4. **Unit Handling**:
   - Individual foods can be logged in **g** (grams) or **servings**.
   - Meals are always measured in **servings** (read-only unit).
   - The label automatically adjusts between singular (*serving*) and plural (*servings*) depending on your entered quantity.
5. **Add Button**: Inserts the entry into your Food Log for that day.

---

## 3. Nutrient Breakdown Module

Explore the exact nutritional footprint of any single food, meal, or your complete daily intake:

### Nutrient Breakdown Selector Row
- Choose between **Food Log** (for a specific day) or **Specific Item** (hover over the menu to select any Food or Meal).
- Selecting a new date in the Food Log Entry module automatically syncs this breakdown view to the same date.

### Food Breakdown Tree
- Collapsible interactive hierarchy decomposing complex meals into their exact whole-food constituents measured in grams.
- Click the caret (`>`) to drill down through nested meal components.
- When expanded, shows the calorie contribution of each viewable node aligned along the right.

### Calorie Progress Bar
- Compares total calories consumed against your customized daily caloric goal.

### Macronutrient Dashboard
- **Macronutrient Pie Chart**: Visual breakdown of caloric intake distributed across Protein (4 kcal/g), Carbohydrates (4 kcal/g), and Fat (9 kcal/g).
- **Macronutrient Progress Bars**: Tracks progress towards daily targets.
  - Saturated Fat and Trans Fat are indented under Fat and flagged as **Limits**.
  - Dietary Fiber and Sugars are indented under Carbohydrates.
  - Added Sugars is indented under Sugars and flagged as a **Limit**.

### Micronutrient Dashboard
- **Micronutrient Progress Bars**: Tracks vitamins, minerals, and trace elements against your daily values.
- Identifies **Sodium** as a nutrient limit.
- If a daily target is undefined or set to 0, displays the raw ingested value cleanly without an arbitrary percentage.

---

## 4. File Formats & Merge Specifications

All 4 data files follow strict CSV specifications:
- **Foods.csv**: Contains `Food Name`, `Unit Used in Log`, `Serving Size (g)`, `Calories (kcal)`, and subsequent `<Nutrient Name> (<Unit>)` columns.
- **Meals.csv**: Contains `Meal Name`, `Component`, `Quantity`, and `Unit`. Supports nesting (meals within meals).
- **Daily Values.csv**: Single-row target values aligning exactly with columns in `Foods.csv` after `Serving Size (g)`.
- **Food Log.csv**: `Date` (MM/DD/YYYY) followed by dynamic columns for each consumed Food or Meal.

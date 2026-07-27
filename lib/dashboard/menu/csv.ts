import type { DashboardMenuItem, MenuFormData } from "./types";

const CSV_COLUMNS = [
  "nameEn",
  "nameAr",
  "category",
  "price",
  "discountPrice",
  "descriptionEn",
  "descriptionAr",
  "image",
  "status",
  "vegetarian",
  "vegan",
  "glutenFree",
  "halal",
  "spicy",
  "chefSpecial",
  "popular",
  "recommended",
  "preparationTime",
  "calories",
  "ingredients",
] as const;

function escapeCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function exportMenuItemsToCsv(
  items: DashboardMenuItem[],
  categoryLabel: (categoryId: string) => string,
): string {
  const rows = items.map((item) =>
    [
      item.nameEn,
      item.nameAr,
      categoryLabel(item.categoryId),
      String(item.price),
      item.discountPrice !== null ? String(item.discountPrice) : "",
      item.descriptionEn,
      item.descriptionAr,
      item.image,
      item.status,
      String(item.vegetarian),
      String(item.vegan),
      String(item.glutenFree),
      String(item.halal),
      String(item.spicy),
      String(item.chefSpecial),
      String(item.popular),
      String(item.recommended),
      item.preparationTime,
      item.calories,
      item.ingredients,
    ]
      .map((cell) => escapeCell(String(cell ?? "")))
      .join(","),
  );

  return [CSV_COLUMNS.join(","), ...rows].join("\n");
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

export type ParsedMenuCsvRow = Partial<MenuFormData> & { categoryLabel?: string };

/**
 * Parses a menu items CSV (matching the column order from `exportMenuItemsToCsv`)
 * into partial form data. The caller is responsible for resolving `category`
 * labels back into category IDs.
 */
export function parseMenuItemsCsv(text: string): ParsedMenuCsvRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows: ParsedMenuCsvRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i]);
    const record: Record<string, string> = {};
    header.forEach((key, index) => {
      record[key] = (cells[index] ?? "").trim();
    });

    if (!record.nameEn && !record.nameAr) continue;

    const toBool = (v: string | undefined) => v?.toLowerCase() === "true";

    rows.push({
      nameEn: record.nameEn ?? "",
      nameAr: record.nameAr ?? "",
      categoryLabel: record.category ?? "",
      price: record.price ?? "",
      discountPrice: record.discountPrice ?? "",
      descriptionEn: record.descriptionEn ?? "",
      descriptionAr: record.descriptionAr ?? "",
      image: record.image ?? "",
      status:
        record.status === "published" || record.status === "archived"
          ? record.status
          : "draft",
      vegetarian: toBool(record.vegetarian),
      vegan: toBool(record.vegan),
      glutenFree: toBool(record.glutenFree),
      halal: toBool(record.halal),
      spicy: toBool(record.spicy),
      chefSpecial: toBool(record.chefSpecial),
      popular: toBool(record.popular),
      recommended: toBool(record.recommended),
      preparationTime: record.preparationTime ?? "",
      calories: record.calories ?? "",
      ingredients: record.ingredients ?? "",
    });
  }

  return rows;
}

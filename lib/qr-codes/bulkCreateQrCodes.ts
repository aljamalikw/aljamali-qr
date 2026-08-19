import type { BulkQrGenerateFormData, QrCodeItem } from "@/lib/dashboard/qr/types";
import { createEmptyQrForm, parseTableNumberRanges } from "@/lib/dashboard/qr/utils";
import type { Restaurant } from "@/lib/restaurants/types";
import { createQrCode } from "./createQrCode";

export interface BulkCreateResult {
  ok: true;
  created: QrCodeItem[];
  failed: string[];
}

const BULK_ERROR = "Please enter at least one table number.";

export async function bulkCreateQrCodes(
  form: BulkQrGenerateFormData,
  restaurant?: Restaurant | null,
): Promise<BulkCreateResult | { ok: false; message: string }> {
  const tableNumbers = parseTableNumberRanges(form.tableNumbers);

  if (tableNumbers.length === 0) {
    return { ok: false, message: BULK_ERROR };
  }

  const created: QrCodeItem[] = [];
  const failed: string[] = [];

  for (const tableNumber of tableNumbers) {
    const name = form.area.trim()
      ? `${form.area.trim()} - Table ${tableNumber}`
      : `Table ${tableNumber}`;

    const result = await createQrCode({
      ...createEmptyQrForm(),
      name,
      type: form.type,
      tableNumber,
      area: form.area.trim(),
      mode: form.mode,
      status: "active",
    }, restaurant);

    if (result.ok) {
      created.push(result.data);
    } else {
      failed.push(tableNumber);
    }
  }

  return { ok: true, created, failed };
}

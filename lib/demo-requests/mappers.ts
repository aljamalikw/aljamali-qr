import { DEMO_REQUEST_STATUS_OPTIONS, PRIORITY_OPTIONS } from "./constants";
import type {
  DemoRequestEditableFields,
  DemoRequestFormData,
  DemoRequestInsert,
  DemoRequestItem,
  DemoRequestPriority,
  DemoRequestRow,
  DemoRequestStatus,
  DemoRequestUpdatePayload,
} from "./types";

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeStatus(status: string | null | undefined): DemoRequestStatus {
  const value = status?.trim() ?? "";
  if (DEMO_REQUEST_STATUS_OPTIONS.includes(value as DemoRequestStatus)) {
    return value as DemoRequestStatus;
  }
  return "New";
}

function normalizePriority(
  priority: string | null | undefined,
): DemoRequestPriority {
  const value = priority?.trim() ?? "";
  if (PRIORITY_OPTIONS.includes(value as DemoRequestPriority)) {
    return value as DemoRequestPriority;
  }
  return "Medium";
}

function toAssignedSalespersonSelectValue(
  value: string | null | undefined,
): string {
  const trimmed = value?.trim() ?? "";
  return trimmed || "Unassigned";
}

function fromAssignedSalespersonSelectValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "Unassigned") return null;
  return trimmed;
}

/** Convert an ISO timestamp to a value usable by datetime-local inputs. */
export function toDateTimeLocalValue(
  iso: string | null | undefined,
): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Convert a datetime-local value to an ISO string for Supabase. */
export function fromDateTimeLocalValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function mapDemoRequestFormToInsert(
  form: DemoRequestFormData,
): DemoRequestInsert {
  const branches = Number.parseInt(form.branches, 10);

  return {
    restaurant_name: form.restaurantName.trim(),
    contact_person: form.contactPerson.trim(),
    mobile_number: form.mobileNumber.trim(),
    email: toNullable(form.email),
    city: toNullable(form.city),
    restaurant_type: toNullable(form.restaurantType),
    branches: Number.isInteger(branches) && branches >= 1 ? branches : 1,
    preferred_date: form.preferredDate.trim(),
    preferred_time: form.preferredTime.trim(),
    alternate_date: toNullable(form.alternateDate),
    current_menu_type: toNullable(form.currentMenuType),
    notes: toNullable(form.notes),
  };
}

export function mapDemoRequestRowToItem(row: DemoRequestRow): DemoRequestItem {
  return {
    id: row.id,
    restaurantName: row.restaurant_name,
    contactPerson: row.contact_person,
    mobileNumber: row.mobile_number,
    email: row.email,
    city: row.city,
    restaurantType: row.restaurant_type,
    branches: row.branches ?? 1,
    preferredDate: row.preferred_date,
    preferredTime: row.preferred_time,
    alternateDate: row.alternate_date,
    currentMenuType: row.current_menu_type,
    notes: row.notes,
    status: normalizeStatus(row.status),
    priority: normalizePriority(row.priority),
    assignedSalesperson: row.assigned_salesperson ?? null,
    internalNotes: row.internal_notes ?? null,
    lastContactedAt: row.last_contacted_at ?? null,
    nextFollowUpAt: row.next_follow_up_at ?? null,
    followUpNotes: row.follow_up_notes ?? null,
    isArchived: Boolean(row.is_archived),
    archivedAt: row.archived_at ?? null,
    deletedAt: row.deleted_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapItemToEditableFields(
  item: DemoRequestItem,
): DemoRequestEditableFields {
  return {
    status: item.status,
    priority: item.priority,
    assignedSalesperson: toAssignedSalespersonSelectValue(
      item.assignedSalesperson,
    ),
    internalNotes: item.internalNotes ?? "",
    lastContactedAt: toDateTimeLocalValue(item.lastContactedAt),
    nextFollowUpAt: toDateTimeLocalValue(item.nextFollowUpAt),
    followUpNotes: item.followUpNotes ?? "",
  };
}

export function mapEditableFieldsToUpdatePayload(
  fields: DemoRequestEditableFields,
): DemoRequestUpdatePayload {
  return {
    status: fields.status,
    priority: fields.priority,
    assigned_salesperson: fromAssignedSalespersonSelectValue(
      fields.assignedSalesperson,
    ),
    internal_notes: toNullable(fields.internalNotes),
    last_contacted_at: fromDateTimeLocalValue(fields.lastContactedAt),
    next_follow_up_at: fromDateTimeLocalValue(fields.nextFollowUpAt),
    follow_up_notes: toNullable(fields.followUpNotes),
  };
}

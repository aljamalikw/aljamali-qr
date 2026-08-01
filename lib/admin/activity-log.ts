import { supabase } from "@/lib/supabase";
import { buildCsv } from "@/lib/utils/csv";

export const ACTIVITY_ACTIONS = [
  "restaurant_created",
  "restaurant_deleted",
  "restaurant_suspended",
  "restaurant_activated",
  "restaurant_archived",
  "subscription_changed",
  "plan_upgraded",
  "plan_downgraded",
  "login_as_restaurant",
  "exit_impersonation",
  "login_link_generated",
  "qr_created",
  "qr_deleted",
  "menu_updated",
  "owner_created",
  "owner_deleted",
  "admin_login",
  "trial_extended",
  "subscription_cancelled",
  "subscription_reactivated",
  "backup_exported",
  "email_template_updated",
  "test_email_queued",
] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number] | string;

export type ActivityLogRow = {
  id: string;
  createdAt: string;
  actorUserId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  restaurantId: string | null;
  restaurantName: string | null;
  action: string;
  details: Record<string, unknown>;
  reason: string | null;
  ipAddress: string | null;
};

export type ActivityLogFilters = {
  search?: string;
  action?: string | "all";
  restaurantId?: string | "all";
  actorEmail?: string | "all";
  dateFrom?: string;
  dateTo?: string;
};

type DbRow = {
  id: string;
  created_at: string;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  restaurant_id: string | null;
  restaurant_name: string | null;
  action: string;
  details: Record<string, unknown> | null;
  reason: string | null;
  ip_address: string | null;
};

function mapRow(row: DbRow): ActivityLogRow {
  return {
    id: row.id,
    createdAt: row.created_at,
    actorUserId: row.actor_user_id,
    actorEmail: row.actor_email,
    actorRole: row.actor_role,
    restaurantId: row.restaurant_id,
    restaurantName: row.restaurant_name,
    action: row.action,
    details: row.details ?? {},
    reason: row.reason,
    ipAddress: row.ip_address,
  };
}

export async function logAdminActivity(input: {
  action: ActivityAction;
  restaurantId?: string | null;
  restaurantName?: string | null;
  details?: Record<string, unknown>;
  reason?: string | null;
  ipAddress?: string | null;
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
}): Promise<void> {
  try {
    let actorUserId = input.actorUserId ?? null;
    let actorEmail = input.actorEmail ?? null;
    let actorRole = input.actorRole ?? null;

    if (!actorUserId) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      actorUserId = session?.user?.id ?? null;
      actorEmail = session?.user?.email ?? null;
      if (actorUserId && !actorRole) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", actorUserId)
          .maybeSingle();
        actorRole = (profile as { role?: string } | null)?.role ?? null;
      }
    }

    await supabase.from("admin_activity_logs").insert({
      actor_user_id: actorUserId,
      actor_email: actorEmail,
      actor_role: actorRole,
      restaurant_id: input.restaurantId ?? null,
      restaurant_name: input.restaurantName ?? null,
      action: input.action,
      details: input.details ?? {},
      reason: input.reason ?? null,
      ip_address: input.ipAddress ?? null,
    });
  } catch {
    // Audit logging must never break primary flows.
  }
}

export async function fetchActivityLogs(
  filters: ActivityLogFilters = {},
): Promise<
  { ok: true; data: ActivityLogRow[] } | { ok: false; message: string }
> {
  try {
    let query = supabase
      .from("admin_activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (filters.action && filters.action !== "all") {
      query = query.eq("action", filters.action);
    }
    if (filters.restaurantId && filters.restaurantId !== "all") {
      query = query.eq("restaurant_id", filters.restaurantId);
    }
    if (filters.actorEmail && filters.actorEmail !== "all") {
      query = query.eq("actor_email", filters.actorEmail);
    }
    if (filters.dateFrom) {
      query = query.gte("created_at", `${filters.dateFrom}T00:00:00.000Z`);
    }
    if (filters.dateTo) {
      query = query.lte("created_at", `${filters.dateTo}T23:59:59.999Z`);
    }

    const { data, error } = await query;
    if (error) {
      return { ok: false, message: error.message };
    }

    let rows = ((data ?? []) as DbRow[]).map(mapRow);
    const search = filters.search?.trim().toLowerCase();
    if (search) {
      rows = rows.filter(
        (row) =>
          row.action.toLowerCase().includes(search) ||
          (row.actorEmail?.toLowerCase().includes(search) ?? false) ||
          (row.restaurantName?.toLowerCase().includes(search) ?? false) ||
          (row.reason?.toLowerCase().includes(search) ?? false) ||
          JSON.stringify(row.details).toLowerCase().includes(search),
      );
    }

    return { ok: true, data: rows };
  } catch {
    return { ok: false, message: "Unable to load activity logs." };
  }
}

export function exportActivityLogsToCsv(rows: ActivityLogRow[]): string {
  return buildCsv(
    [
      "Timestamp",
      "Admin",
      "Role",
      "Restaurant",
      "Action",
      "IP",
      "Reason",
      "Details",
    ],
    rows.map((row) => [
      row.createdAt,
      row.actorEmail ?? "",
      row.actorRole ?? "",
      row.restaurantName ?? "",
      row.action,
      row.ipAddress ?? "",
      row.reason ?? "",
      JSON.stringify(row.details),
    ]),
  );
}

export function formatActivityAction(action: string): string {
  return action
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

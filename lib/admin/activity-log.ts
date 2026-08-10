import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { buildCsv } from "@/lib/utils/csv";

/** Canonical activity actions for filters and documentation. */
export const ACTIVITY_ACTIONS = [
  "restaurant_created",
  "restaurant_archived",
  "restaurant_restored",
  "restaurant_updated",
  "restaurant_deleted",
  "restaurant_suspended",
  "restaurant_activated",
  "restaurant_switched",
  "subscription_changed",
  "plan_upgraded",
  "plan_downgraded",
  "trial_extended",
  "subscription_cancelled",
  "subscription_reactivated",
  "qr_generated",
  "qr_created",
  "qr_deleted",
  "menu_item_created",
  "menu_item_updated",
  "menu_item_deleted",
  "menu_updated",
  "category_created",
  "category_updated",
  "category_deleted",
  "reservation_created",
  "reservation_updated",
  "order_status_changed",
  "support_ticket_created",
  "support_ticket_replied",
  "support_ticket_resolved",
  "owner_impersonation",
  "login_as_restaurant",
  "exit_impersonation",
  "login_link_generated",
  "owner_created",
  "owner_deleted",
  "admin_login",
  "backup_exported",
  "email_template_updated",
  "test_email_queued",
] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number] | string;

export type ActivityEntityType =
  | "restaurant"
  | "subscription"
  | "qr_code"
  | "menu_item"
  | "category"
  | "reservation"
  | "order"
  | "support_ticket"
  | "owner"
  | "session"
  | "email_template"
  | "backup"
  | string;

export type LogActivityInput = {
  action: ActivityAction;
  actorId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  ownerId?: string | null;
  restaurantId?: string | null;
  restaurantName?: string | null;
  entityType?: ActivityEntityType | null;
  entityId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  reason?: string | null;
  /** Optional client (e.g. service-role). Defaults to browser supabase. */
  client?: SupabaseClient;
};

export type ActivityLogRow = {
  id: string;
  createdAt: string;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  ownerId: string | null;
  ownerName: string | null;
  restaurantId: string | null;
  restaurantName: string | null;
  entityType: string | null;
  entityId: string | null;
  action: string;
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown>;
};

export type ActivityLogFilters = {
  search?: string;
  action?: string | "all";
  restaurantId?: string | "all";
  ownerId?: string | "all";
  actorEmail?: string | "all";
  actorRole?: string | "all";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export type ActivityFilterOptions = {
  restaurants: Array<{ id: string; name: string; ownerId: string | null }>;
  owners: Array<{ id: string; name: string }>;
  actors: Array<{ email: string; role: string | null }>;
  roles: string[];
};

type DbRow = {
  id: string;
  created_at: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  actor_role: string | null;
  owner_id: string | null;
  restaurant_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  action: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  restaurants?:
    | {
        restaurant_name: string | null;
        owner_name: string | null;
        owner_id: string | null;
        email: string | null;
      }
    | {
        restaurant_name: string | null;
        owner_name: string | null;
        owner_id: string | null;
        email: string | null;
      }[]
    | null;
};

type RestaurantLookup = {
  id: string;
  restaurant_name: string | null;
  owner_name: string | null;
  owner_id: string | null;
  email: string | null;
};

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function restaurantJoin(row: DbRow): {
  restaurantName: string | null;
  ownerName: string | null;
  ownerId: string | null;
} {
  const join = Array.isArray(row.restaurants)
    ? row.restaurants[0]
    : row.restaurants;
  const metadata = asObject(row.metadata);
  return {
    restaurantName:
      join?.restaurant_name ??
      (typeof metadata.restaurantName === "string"
        ? metadata.restaurantName
        : null),
    ownerName:
      join?.owner_name ??
      (typeof metadata.ownerName === "string" ? metadata.ownerName : null),
    ownerId: row.owner_id ?? join?.owner_id ?? null,
  };
}

function mapRow(row: DbRow): ActivityLogRow {
  const joined = restaurantJoin(row);
  const metadata = asObject(row.metadata);
  return {
    id: row.id,
    createdAt: row.created_at,
    actorId: row.actor_id,
    actorName: row.actor_name,
    actorEmail: row.actor_email,
    actorRole: row.actor_role,
    ownerId: joined.ownerId,
    ownerName: joined.ownerName,
    restaurantId: row.restaurant_id,
    restaurantName: joined.restaurantName,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    oldValues: asObject(row.old_values),
    newValues: asObject(row.new_values),
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    metadata,
  };
}

async function resolveActor(
  client: SupabaseClient,
  input: LogActivityInput,
): Promise<{
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  actorRole: string | null;
}> {
  let actorId = input.actorId ?? null;
  let actorName = input.actorName ?? null;
  let actorEmail = input.actorEmail ?? null;
  let actorRole = input.actorRole ?? null;

  if (!actorId || !actorEmail || !actorRole) {
    const {
      data: { session },
    } = await client.auth.getSession();
    actorId = actorId ?? session?.user?.id ?? null;
    actorEmail = actorEmail ?? session?.user?.email ?? null;
  }

  if (actorId && !actorRole) {
    const { data: profile } = await client
      .from("profiles")
      .select("role")
      .eq("id", actorId)
      .maybeSingle();
    actorRole = (profile as { role?: string } | null)?.role ?? "restaurant_owner";
  }

  if (!actorName && actorEmail) {
    actorName = actorEmail.split("@")[0] ?? actorEmail;
  }

  return { actorId, actorName, actorEmail, actorRole };
}

async function resolveRestaurantContext(
  client: SupabaseClient,
  restaurantId: string | null | undefined,
): Promise<RestaurantLookup | null> {
  if (!restaurantId) return null;
  const { data } = await client
    .from("restaurants")
    .select("id, restaurant_name, owner_name, owner_id, email")
    .eq("id", restaurantId)
    .maybeSingle();
  return (data as RestaurantLookup | null) ?? null;
}

/**
 * Primary audit helper. Safe to call fire-and-forget (`void logActivity(...)`).
 * Never throws; never breaks primary flows.
 */
export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    const client = input.client ?? supabase;
    const actor = await resolveActor(client, input);
    const restaurant = await resolveRestaurantContext(
      client,
      input.restaurantId,
    );

    const metadata: Record<string, unknown> = {
      ...(input.metadata ?? {}),
    };
    if (input.reason) metadata.reason = input.reason;
    if (input.restaurantName || restaurant?.restaurant_name) {
      metadata.restaurantName =
        input.restaurantName ?? restaurant?.restaurant_name ?? null;
    }
    if (restaurant?.owner_name) {
      metadata.ownerName = restaurant.owner_name;
    }

    const ownerId = input.ownerId ?? restaurant?.owner_id ?? null;

    await client.from("activity_logs").insert({
      actor_id: actor.actorId,
      actor_name: actor.actorName,
      actor_email: actor.actorEmail,
      actor_role: actor.actorRole,
      owner_id: ownerId,
      restaurant_id: input.restaurantId ?? null,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      action: input.action,
      old_values: input.oldValues ?? {},
      new_values: input.newValues ?? {},
      ip_address: input.ipAddress ?? null,
      user_agent:
        input.userAgent ??
        (typeof navigator !== "undefined" ? navigator.userAgent : null),
      metadata,
    });
  } catch {
    // Audit logging must never break primary flows.
  }
}

/**
 * Backward-compatible admin helper. Writes to `activity_logs` via `logActivity`
 * and best-effort mirrors into legacy `admin_activity_logs`.
 */
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
  ownerId?: string | null;
  entityType?: ActivityEntityType | null;
  entityId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  client?: SupabaseClient;
}): Promise<void> {
  const entityType =
    input.entityType ??
    (input.restaurantId ? ("restaurant" as const) : null);

  await logActivity({
    action: input.action,
    actorId: input.actorUserId,
    actorEmail: input.actorEmail,
    actorRole: input.actorRole,
    ownerId: input.ownerId,
    restaurantId: input.restaurantId,
    restaurantName: input.restaurantName,
    entityType,
    entityId: input.entityId ?? input.restaurantId ?? null,
    oldValues: input.oldValues,
    newValues: input.newValues ?? input.details ?? {},
    ipAddress: input.ipAddress,
    metadata: input.metadata,
    reason: input.reason,
    client: input.client,
  });

  // Legacy mirror for older tooling / dashboards (admin-only RLS; best-effort).
  try {
    const client = input.client ?? supabase;
    let actorUserId = input.actorUserId ?? null;
    let actorEmail = input.actorEmail ?? null;
    let actorRole = input.actorRole ?? null;

    if (!actorUserId) {
      const {
        data: { session },
      } = await client.auth.getSession();
      actorUserId = session?.user?.id ?? null;
      actorEmail = actorEmail ?? session?.user?.email ?? null;
    }

    await client.from("admin_activity_logs").insert({
      actor_user_id: actorUserId,
      actor_email: actorEmail,
      actor_role: actorRole,
      restaurant_id: input.restaurantId ?? null,
      restaurant_name: input.restaurantName ?? null,
      action: input.action,
      details: input.details ?? input.newValues ?? {},
      reason: input.reason ?? null,
      ip_address: input.ipAddress ?? null,
    });
  } catch {
    // ignore legacy mirror failures
  }
}

export async function fetchActivityLogs(
  filters: ActivityLogFilters = {},
): Promise<
  | { ok: true; data: ActivityLogRow[]; total: number }
  | { ok: false; message: string }
> {
  try {
    const pageSize = Math.min(Math.max(filters.pageSize ?? 25, 1), 100);
    const page = Math.max(filters.page ?? 1, 1);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("activity_logs")
      .select(
        "*, restaurants(restaurant_name, owner_name, owner_id, email)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (filters.action && filters.action !== "all") {
      query = query.eq("action", filters.action);
    }
    if (filters.restaurantId && filters.restaurantId !== "all") {
      query = query.eq("restaurant_id", filters.restaurantId);
    }
    if (filters.ownerId && filters.ownerId !== "all") {
      query = query.eq("owner_id", filters.ownerId);
    }
    if (filters.actorEmail && filters.actorEmail !== "all") {
      query = query.eq("actor_email", filters.actorEmail);
    }
    if (filters.actorRole && filters.actorRole !== "all") {
      query = query.eq("actor_role", filters.actorRole);
    }
    if (filters.dateFrom) {
      query = query.gte("created_at", `${filters.dateFrom}T00:00:00.000Z`);
    }
    if (filters.dateTo) {
      query = query.lte("created_at", `${filters.dateTo}T23:59:59.999Z`);
    }

    const search = filters.search?.trim();
    if (search) {
      const escaped = search.replace(/[%_,]/g, "");
      if (escaped) {
        query = query.or(
          [
            `action.ilike.%${escaped}%`,
            `actor_email.ilike.%${escaped}%`,
            `actor_name.ilike.%${escaped}%`,
            `entity_type.ilike.%${escaped}%`,
            `entity_id.ilike.%${escaped}%`,
          ].join(","),
        );
      }
    }

    const { data, error, count } = await query;
    if (error) {
      return { ok: false, message: error.message };
    }

    let rows = ((data ?? []) as DbRow[]).map(mapRow);

    // Client-side enrichment search for denormalized restaurant/owner names.
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (row) =>
          row.action.toLowerCase().includes(q) ||
          (row.actorEmail?.toLowerCase().includes(q) ?? false) ||
          (row.actorName?.toLowerCase().includes(q) ?? false) ||
          (row.restaurantName?.toLowerCase().includes(q) ?? false) ||
          (row.ownerName?.toLowerCase().includes(q) ?? false) ||
          (row.entityType?.toLowerCase().includes(q) ?? false),
      );
    }

    return { ok: true, data: rows, total: count ?? rows.length };
  } catch {
    return { ok: false, message: "Unable to load activity logs." };
  }
}

/** Load filter dropdown options in a small number of batch queries. */
export async function fetchActivityFilterOptions(): Promise<
  { ok: true; data: ActivityFilterOptions } | { ok: false; message: string }
> {
  try {
    const [restaurantsResult, actorResult] = await Promise.all([
      supabase
        .from("restaurants")
        .select("id, restaurant_name, owner_id, owner_name")
        .order("restaurant_name", { ascending: true })
        .limit(1000),
      supabase
        .from("activity_logs")
        .select("actor_email, actor_role")
        .not("actor_email", "is", null)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    if (restaurantsResult.error) {
      return { ok: false, message: restaurantsResult.error.message };
    }

    const restaurants = (
      (restaurantsResult.data ?? []) as Array<{
        id: string;
        restaurant_name: string | null;
        owner_id: string | null;
        owner_name: string | null;
      }>
    ).map((row) => ({
      id: row.id,
      name: row.restaurant_name?.trim() || "Unnamed restaurant",
      ownerId: row.owner_id,
    }));

    const ownerMap = new Map<string, string>();
    for (const row of (restaurantsResult.data ?? []) as Array<{
      owner_id: string | null;
      owner_name: string | null;
      restaurant_name: string | null;
    }>) {
      if (!row.owner_id || ownerMap.has(row.owner_id)) continue;
      ownerMap.set(
        row.owner_id,
        row.owner_name?.trim() || "Unnamed owner",
      );
    }

    const actorMap = new Map<string, string | null>();
    for (const row of (actorResult.data ?? []) as Array<{
      actor_email: string | null;
      actor_role: string | null;
    }>) {
      if (!row.actor_email || actorMap.has(row.actor_email)) continue;
      actorMap.set(row.actor_email, row.actor_role);
    }

    const roles = new Set<string>();
    for (const role of actorMap.values()) {
      if (role) roles.add(role);
    }

    return {
      ok: true,
      data: {
        restaurants,
        owners: [...ownerMap.entries()].map(([id, name]) => ({ id, name })),
        actors: [...actorMap.entries()].map(([email, role]) => ({
          email,
          role,
        })),
        roles: [...roles].sort(),
      },
    };
  } catch {
    return { ok: false, message: "Unable to load filter options." };
  }
}

export function exportActivityLogsToCsv(rows: ActivityLogRow[]): string {
  return buildCsv(
    [
      "Timestamp",
      "Actor",
      "Actor Email",
      "Role",
      "Restaurant",
      "Owner",
      "Action",
      "Entity Type",
      "Entity ID",
      "IP",
      "Old Values",
      "New Values",
      "Metadata",
    ],
    rows.map((row) => [
      row.createdAt,
      row.actorName ?? "",
      row.actorEmail ?? "",
      row.actorRole ?? "",
      row.restaurantName ?? "",
      row.ownerName ?? "",
      row.action,
      row.entityType ?? "",
      row.entityId ?? "",
      row.ipAddress ?? "",
      JSON.stringify(row.oldValues),
      JSON.stringify(row.newValues),
      JSON.stringify(row.metadata),
    ]),
  );
}

export function formatActivityAction(action: string): string {
  return action
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

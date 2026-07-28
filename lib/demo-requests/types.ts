export type RestaurantTypeOption =
  | "Restaurant"
  | "Cafe"
  | "Bakery"
  | "Hotel"
  | "Food Truck"
  | "Cloud Kitchen"
  | "Other";

export type CurrentMenuTypeOption =
  | "Paper Menu"
  | "QR Menu"
  | "Tablet Menu"
  | "No Menu";

export type DemoRequestStatus =
  | "New"
  | "Contacted"
  | "Scheduled"
  | "Completed"
  | "Customer"
  | "Closed";

export type DemoRequestPriority = "Low" | "Medium" | "High" | "Urgent";

export type DemoRequestStatusFilter = "all" | DemoRequestStatus;
export type DemoRequestPriorityFilter = "all" | DemoRequestPriority;
export type DemoRequestTypeFilter = "all" | RestaurantTypeOption;
export type DemoRequestSortOption = "newest" | "oldest";

/** Reserved for a future hard-delete admin tool. Soft-delete is the only supported path today. */
export const SUPPORTS_PERMANENT_DELETE = false;

export type DemoRequestFormData = {
  restaurantName: string;
  contactPerson: string;
  mobileNumber: string;
  email: string;
  city: string;
  restaurantType: string;
  branches: string;
  preferredDate: string;
  preferredTime: string;
  alternateDate: string;
  currentMenuType: string;
  notes: string;
};

export type DemoRequestInsert = {
  restaurant_name: string;
  contact_person: string;
  mobile_number: string;
  email: string | null;
  city: string | null;
  restaurant_type: string | null;
  branches: number;
  preferred_date: string;
  preferred_time: string;
  alternate_date: string | null;
  current_menu_type: string | null;
  notes: string | null;
};

export type DemoRequestRow = {
  id: string;
  restaurant_name: string;
  contact_person: string;
  mobile_number: string;
  email: string | null;
  city: string | null;
  restaurant_type: string | null;
  branches: number;
  preferred_date: string;
  preferred_time: string;
  alternate_date: string | null;
  current_menu_type: string | null;
  notes: string | null;
  status: string;
  priority: string;
  assigned_salesperson: string | null;
  internal_notes: string | null;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  follow_up_notes: string | null;
  is_archived: boolean;
  archived_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DemoRequestItem = {
  id: string;
  restaurantName: string;
  contactPerson: string;
  mobileNumber: string;
  email: string | null;
  city: string | null;
  restaurantType: string | null;
  branches: number;
  preferredDate: string;
  preferredTime: string;
  alternateDate: string | null;
  currentMenuType: string | null;
  notes: string | null;
  status: DemoRequestStatus;
  priority: DemoRequestPriority;
  assignedSalesperson: string | null;
  internalNotes: string | null;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  followUpNotes: string | null;
  isArchived: boolean;
  archivedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DemoRequestEditableFields = {
  status: DemoRequestStatus;
  priority: DemoRequestPriority;
  assignedSalesperson: string;
  internalNotes: string;
  lastContactedAt: string;
  nextFollowUpAt: string;
  followUpNotes: string;
};

export type DemoRequestUpdatePayload = {
  status: DemoRequestStatus;
  priority: DemoRequestPriority;
  assigned_salesperson: string | null;
  internal_notes: string | null;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  follow_up_notes: string | null;
};

export type DemoRequestKpis = {
  totalRequests: number;
  newRequests: number;
  scheduled: number;
  completed: number;
  convertedCustomers: number;
  conversionRate: number;
  archived: number;
};

export type DemoRequestFormErrors = Partial<
  Record<keyof DemoRequestFormData, string>
>;

export type DemoRequestFilterParams = {
  search: string;
  status: DemoRequestStatusFilter;
  priority: DemoRequestPriorityFilter;
  restaurantType: DemoRequestTypeFilter;
  dateFrom: string;
  dateTo: string;
  sort: DemoRequestSortOption;
  showArchived: boolean;
  showDeleted: boolean;
};

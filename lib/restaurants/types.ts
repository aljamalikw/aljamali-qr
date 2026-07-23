export type Restaurant = {
  id: string;
  owner_id: string;
  restaurant_name: string | null;
  slug: string | null;
  email: string | null;
  phone: string | null;
  logo_url: string | null;
  currency: string;
  timezone: string;
  created_at: string;
  updated_at: string;
};

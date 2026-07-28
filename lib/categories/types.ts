export type CategoryRow = {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CategoryInput = {
  nameEn: string;
  nameAr: string;
  icon: string;
  visible: boolean;
};

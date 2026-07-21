export interface DashboardCategory {
  id: string;
  nameEn: string;
  nameAr: string;
  icon: string;
  itemCount: number;
  visible: boolean;
  sortOrder: number;
}

export interface CategoryFormData {
  nameEn: string;
  nameAr: string;
  icon: string;
  visible: boolean;
}

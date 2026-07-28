export type AnnouncementStatus = "Draft" | "Published" | "Scheduled" | "Expired";

export type AnnouncementRow = {
  id: string;
  title: string;
  message: string;
  status: AnnouncementStatus;
  publish_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AnnouncementItem = {
  id: string;
  title: string;
  message: string;
  status: AnnouncementStatus;
  publishAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AnnouncementFormData = {
  title: string;
  message: string;
  status: AnnouncementStatus;
  publishAt: string;
  expiresAt: string;
};

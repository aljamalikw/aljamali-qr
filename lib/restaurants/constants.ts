export const DEFAULT_CURRENCY = "KWD";
export const DEFAULT_TIMEZONE = "Asia/Kuwait";

export const CURRENCY_OPTIONS = [
  { value: "KWD", label: "KWD — Kuwaiti Dinar" },
  { value: "SAR", label: "SAR — Saudi Riyal" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "QAR", label: "QAR — Qatari Riyal" },
  { value: "BHD", label: "BHD — Bahraini Dinar" },
  { value: "OMR", label: "OMR — Omani Rial" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
] as const;

export const TIMEZONE_OPTIONS = [
  { value: "Asia/Kuwait", label: "Kuwait (Asia/Kuwait)" },
  { value: "Asia/Riyadh", label: "Saudi Arabia (Asia/Riyadh)" },
  { value: "Asia/Dubai", label: "UAE (Asia/Dubai)" },
  { value: "Asia/Qatar", label: "Qatar (Asia/Qatar)" },
  { value: "Asia/Bahrain", label: "Bahrain (Asia/Bahrain)" },
  { value: "Asia/Muscat", label: "Oman (Asia/Muscat)" },
  { value: "Africa/Cairo", label: "Egypt (Africa/Cairo)" },
  { value: "Asia/Amman", label: "Jordan (Asia/Amman)" },
  { value: "Asia/Beirut", label: "Lebanon (Asia/Beirut)" },
] as const;

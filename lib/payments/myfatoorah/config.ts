export type MyFatoorahConfig = {
  apiKey: string;
  baseUrl: string;
};

export function getMyFatoorahConfig():
  | { ok: true; config: MyFatoorahConfig }
  | { ok: false; message: string } {
  const apiKey = process.env.MYFATOORAH_API_KEY?.trim();
  const baseUrlRaw = process.env.MYFATOORAH_BASE_URL?.trim();

  if (!apiKey) {
    return { ok: false, message: "MYFATOORAH_API_KEY is not configured." };
  }
  if (!baseUrlRaw) {
    return { ok: false, message: "MYFATOORAH_BASE_URL is not configured." };
  }

  const baseUrl = baseUrlRaw.replace(/\/+$/, "");

  return { ok: true, config: { apiKey, baseUrl } };
}

export function getAppBaseUrl(requestOrigin?: string | null): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  if (requestOrigin) return requestOrigin.replace(/\/+$/, "");
  return "http://localhost:3000";
}

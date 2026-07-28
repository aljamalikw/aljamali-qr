import type { MyFatoorahConfig } from "./config";

type InitiatePaymentMethod = {
  PaymentMethodId: number;
  PaymentMethodEn?: string;
  IsDirectPayment?: boolean;
};

type InitiatePaymentResponse = {
  IsSuccess?: boolean;
  Message?: string;
  ValidationErrors?: unknown;
  Data?: {
    PaymentMethods?: InitiatePaymentMethod[];
  };
};

type ExecutePaymentResponse = {
  IsSuccess?: boolean;
  Message?: string;
  ValidationErrors?: unknown;
  Data?: {
    InvoiceId?: number;
    PaymentURL?: string;
    CustomerReference?: string;
  };
};

export type ExecutePaymentInput = {
  invoiceValue: number;
  currencyIso: string;
  customerName: string;
  customerEmail: string;
  customerReference: string;
  callBackUrl: string;
  errorUrl: string;
  userDefinedField?: string;
  paymentMethodId?: number;
};

export type ExecutePaymentResult = {
  invoiceId: number;
  paymentUrl: string;
};

function authHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `MyFatoorah returned non-JSON response (${response.status}): ${text.slice(0, 300)}`,
    );
  }
}

/**
 * Resolve a PaymentMethodId via InitiatePayment (required by ExecutePayment).
 */
export async function resolvePaymentMethodId(
  config: MyFatoorahConfig,
  invoiceAmount: number,
  currencyIso: string,
): Promise<number> {
  const response = await fetch(`${config.baseUrl}/v2/InitiatePayment`, {
    method: "POST",
    headers: authHeaders(config.apiKey),
    body: JSON.stringify({
      InvoiceAmount: invoiceAmount,
      CurrencyIso: currencyIso,
    }),
  });

  const json = await parseJson<InitiatePaymentResponse>(response);

  if (!response.ok || !json.IsSuccess) {
    const detail =
      json.Message ||
      (json.ValidationErrors ? JSON.stringify(json.ValidationErrors) : null) ||
      `HTTP ${response.status}`;
    throw new Error(`MyFatoorah InitiatePayment failed: ${detail}`);
  }

  const methods = json.Data?.PaymentMethods ?? [];
  if (methods.length === 0) {
    throw new Error("MyFatoorah returned no payment methods.");
  }

  // Prefer a non-direct (hosted redirect) method when available.
  const hosted = methods.find((method) => method.IsDirectPayment === false);
  const chosen = hosted ?? methods[0];

  if (!chosen?.PaymentMethodId) {
    throw new Error("MyFatoorah payment method is missing PaymentMethodId.");
  }

  return chosen.PaymentMethodId;
}

/**
 * Create a MyFatoorah invoice via ExecutePayment and return the checkout URL.
 */
export async function executeMyFatoorahPayment(
  config: MyFatoorahConfig,
  input: ExecutePaymentInput,
): Promise<ExecutePaymentResult> {
  const paymentMethodId =
    input.paymentMethodId ??
    (await resolvePaymentMethodId(
      config,
      input.invoiceValue,
      input.currencyIso,
    ));

  const response = await fetch(`${config.baseUrl}/v2/ExecutePayment`, {
    method: "POST",
    headers: authHeaders(config.apiKey),
    body: JSON.stringify({
      PaymentMethodId: paymentMethodId,
      InvoiceValue: input.invoiceValue,
      DisplayCurrencyIso: input.currencyIso,
      CustomerName: input.customerName,
      CustomerEmail: input.customerEmail,
      CustomerReference: input.customerReference,
      CallBackUrl: input.callBackUrl,
      ErrorUrl: input.errorUrl,
      Language: "EN",
      ...(input.userDefinedField
        ? { UserDefinedField: input.userDefinedField }
        : {}),
    }),
  });

  const json = await parseJson<ExecutePaymentResponse>(response);

  if (!response.ok || !json.IsSuccess) {
    const detail =
      json.Message ||
      (json.ValidationErrors ? JSON.stringify(json.ValidationErrors) : null) ||
      `HTTP ${response.status}`;
    throw new Error(`MyFatoorah ExecutePayment failed: ${detail}`);
  }

  const invoiceId = json.Data?.InvoiceId;
  const paymentUrl = json.Data?.PaymentURL?.trim();

  if (!invoiceId || !paymentUrl) {
    throw new Error(
      "MyFatoorah ExecutePayment succeeded but InvoiceId/PaymentURL were missing.",
    );
  }

  return { invoiceId, paymentUrl };
}

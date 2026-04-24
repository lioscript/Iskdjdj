import crypto from "node:crypto";
import { logger } from "../lib/logger";
import { getCryptoBotAssets, getCryptoBotToken } from "./db";

// Crypto Pay API base. The same token also works on testnet (just change
// the host to testnet-pay.crypt.bot).
const CRYPTO_PAY_HOST =
  process.env["CRYPTOBOT_HOST"] || "https://pay.crypt.bot";

export type CryptoBotInvoice = {
  invoice_id: number;
  status: "active" | "paid" | "expired";
  hash: string;
  pay_url?: string;
  bot_invoice_url?: string;
  mini_app_invoice_url?: string;
  web_app_invoice_url?: string;
  amount: string;
  asset?: string;
  fiat?: string;
  paid_asset?: string;
  paid_amount?: string;
};

type ApiResponse<T> =
  | { ok: true; result: T }
  | { ok: false; error: { code: number; name: string } };

async function callApi<T>(
  method: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  const token = getCryptoBotToken();
  if (!token) {
    throw new Error("Crypto Pay token is not configured");
  }
  const url = `${CRYPTO_PAY_HOST}/api/${method}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Crypto-Pay-API-Token": token,
    },
    body: JSON.stringify(params),
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.ok) {
    throw new Error(
      `Crypto Pay API error: ${json.error?.name ?? "unknown"} (${json.error?.code ?? res.status})`,
    );
  }
  return json.result;
}

export type CreateInvoiceArgs = {
  amountUsd: number;
  description: string;
  payload: string;
  /** Seconds until the invoice expires; default 30 minutes. */
  expiresInSec?: number;
};

/**
 * Create a fiat-priced invoice payable in any of the configured crypto
 * assets. Crypto Pay shows the user a quote in the asset they choose
 * and locks the rate at payment time.
 */
export async function createInvoice(
  args: CreateInvoiceArgs,
): Promise<CryptoBotInvoice> {
  const acceptedAssets = getCryptoBotAssets()
    .split(/[,\s]+/)
    .map((a) => a.trim().toUpperCase())
    .filter(Boolean)
    .join(",");

  return callApi<CryptoBotInvoice>("createInvoice", {
    currency_type: "fiat",
    fiat: "USD",
    amount: args.amountUsd.toFixed(2),
    accepted_assets: acceptedAssets,
    description: args.description,
    payload: args.payload,
    allow_comments: false,
    allow_anonymous: true,
    expires_in: args.expiresInSec ?? 30 * 60,
  });
}

/** Fetch a batch of invoices by id (max 100). */
export async function getInvoices(
  invoiceIds: Array<string | number>,
): Promise<CryptoBotInvoice[]> {
  if (invoiceIds.length === 0) return [];
  const result = await callApi<{ items: CryptoBotInvoice[] }>("getInvoices", {
    invoice_ids: invoiceIds.join(","),
    count: invoiceIds.length,
  });
  return result.items ?? [];
}

/**
 * Verify a Crypto Pay webhook signature.
 *
 *   signature_hex = HMAC_SHA256(
 *     key   = SHA256(api_token),
 *     body  = raw_request_body_bytes,
 *   )
 */
export function verifyWebhookSignature(
  rawBody: Buffer | string,
  signatureHeader: string | undefined,
): boolean {
  const token = getCryptoBotToken();
  if (!token || !signatureHeader) return false;
  try {
    const secret = crypto.createHash("sha256").update(token).digest();
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(signatureHeader, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (err) {
    logger.warn({ err }, "Crypto Pay signature verification crashed");
    return false;
  }
}

export function isConfigured(): boolean {
  return getCryptoBotToken().length > 0;
}

const EXCHANGE_RATES_FROM_USD: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.2,
  NGN: 1520,
  CAD: 1.36,
  AUD: 1.52,
  JPY: 151,
  BRL: 5.02,
};

const ZERO_DECIMAL_CURRENCIES = new Set(["JPY"]);

const LOCALE_TO_CURRENCY: Record<string, string> = {
  "en-US": "USD",
  "en-GB": "GBP",
  "en-IN": "INR",
  "en-NG": "NGN",
  "en-CA": "CAD",
  "en-AU": "AUD",
  "en-JP": "JPY",
  "en-DE": "EUR",
  "en-FR": "EUR",
  "en-BR": "BRL",
};

function toNumber(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value;
}

export function normalizeCurrency(input: string | null | undefined): string {
  const code = String(input || "USD").toUpperCase();
  if (EXCHANGE_RATES_FROM_USD[code]) return code;
  return "USD";
}

export function getExchangeRateFromUsd(currency: string | null | undefined): number {
  const normalized = normalizeCurrency(currency);
  return EXCHANGE_RATES_FROM_USD[normalized] || 1;
}

export function currencyFromLocale(locale: string | null | undefined): string {
  if (!locale) return "USD";
  return LOCALE_TO_CURRENCY[locale] || "USD";
}

export function roundForCurrency(amount: number, currency: string | null | undefined): number {
  const normalized = normalizeCurrency(currency);
  const safeAmount = toNumber(amount);
  if (ZERO_DECIMAL_CURRENCIES.has(normalized)) {
    return Math.round(safeAmount);
  }
  return Number(safeAmount.toFixed(2));
}

export function convertUsdToCurrency(amountUsd: number, currency: string | null | undefined): number {
  const normalized = normalizeCurrency(currency);
  const rate = getExchangeRateFromUsd(normalized);
  return roundForCurrency(toNumber(amountUsd) * rate, normalized);
}

export function convertCurrency(amount: number, fromCurrency: string | null | undefined, toCurrency: string | null | undefined): number {
  const from = normalizeCurrency(fromCurrency);
  const to = normalizeCurrency(toCurrency);
  if (from === to) return roundForCurrency(amount, to);

  const amountInUsd = toNumber(amount) / getExchangeRateFromUsd(from);
  return convertUsdToCurrency(amountInUsd, to);
}

export function formatCurrency(amount: number, currency: string | null | undefined, locale = "en-US"): string {
  const normalized = normalizeCurrency(currency);
  const rounded = roundForCurrency(amount, normalized);

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: normalized,
    minimumFractionDigits: ZERO_DECIMAL_CURRENCIES.has(normalized) ? 0 : 2,
    maximumFractionDigits: ZERO_DECIMAL_CURRENCIES.has(normalized) ? 0 : 2,
  }).format(rounded);
}

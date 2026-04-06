/**
 * Lightweight input validation and sanitization utilities.
 * No external dependencies (no Zod to keep bundle small).
 */

// Email validation (RFC 5322 simplified)
export function validateEmail(email: unknown): email is string {
  if (typeof email !== "string") return false;
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) && trimmed.length <= 254;
}

// Password validation: min 8 chars
export function validatePassword(password: unknown): password is string {
  return typeof password === "string" && password.length >= 8 && password.length <= 128;
}

// Sanitize string: strip HTML tags, trim, limit length
export function sanitizeString(input: unknown, maxLength: number = 2000): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Strip control chars
    .trim()
    .slice(0, maxLength);
}

// Validate required fields exist and are non-empty strings
export function validateRequired(
  fields: string[],
  body: Record<string, unknown>
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  for (const field of fields) {
    const value = body[field];
    if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
      missing.push(field);
    }
  }
  return { valid: missing.length === 0, missing };
}

// Validate number in range
export function validateNumber(
  value: unknown,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER
): value is number {
  return typeof value === "number" && !isNaN(value) && value >= min && value <= max;
}

// Validate UUID format
export function validateUUID(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

// Sanitize user-generated content for safe DB storage
export function sanitizeUserContent(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Strip script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "") // Strip iframes
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "") // Strip event handlers
    .replace(/javascript:/gi, "") // Strip javascript: URIs
    .trim()
    .slice(0, 10000);
}

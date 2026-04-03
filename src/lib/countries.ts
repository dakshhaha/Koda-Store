// Full list of countries with calling codes, currency, and zip format
export const COUNTRIES = [
  { code: "AF", name: "Afghanistan", phone: "+93", currency: "AFN", symbol: "؋", zipRegex: /^\d{4}$/ },
  { code: "AL", name: "Albania", phone: "+355", currency: "ALL", symbol: "L", zipRegex: /^\d{4}$/ },
  { code: "DZ", name: "Algeria", phone: "+213", currency: "DZD", symbol: "د.ج", zipRegex: /^\d{5}$/ },
  { code: "AR", name: "Argentina", phone: "+54", currency: "ARS", symbol: "$", zipRegex: /^[A-Z]\d{4}[A-Z]{3}$/ },
  { code: "AU", name: "Australia", phone: "+61", currency: "AUD", symbol: "A$", zipRegex: /^\d{4}$/ },
  { code: "AT", name: "Austria", phone: "+43", currency: "EUR", symbol: "€", zipRegex: /^\d{4}$/ },
  { code: "BD", name: "Bangladesh", phone: "+880", currency: "BDT", symbol: "৳", zipRegex: /^\d{4}$/ },
  { code: "BE", name: "Belgium", phone: "+32", currency: "EUR", symbol: "€", zipRegex: /^\d{4}$/ },
  { code: "BR", name: "Brazil", phone: "+55", currency: "BRL", symbol: "R$", zipRegex: /^\d{5}-?\d{3}$/ },
  { code: "CA", name: "Canada", phone: "+1", currency: "CAD", symbol: "C$", zipRegex: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i },
  { code: "CL", name: "Chile", phone: "+56", currency: "CLP", symbol: "$", zipRegex: /^\d{7}$/ },
  { code: "CN", name: "China", phone: "+86", currency: "CNY", symbol: "¥", zipRegex: /^\d{6}$/ },
  { code: "CO", name: "Colombia", phone: "+57", currency: "COP", symbol: "$", zipRegex: /^\d{6}$/ },
  { code: "CZ", name: "Czech Republic", phone: "+420", currency: "CZK", symbol: "Kč", zipRegex: /^\d{3}\s?\d{2}$/ },
  { code: "DK", name: "Denmark", phone: "+45", currency: "DKK", symbol: "kr", zipRegex: /^\d{4}$/ },
  { code: "EG", name: "Egypt", phone: "+20", currency: "EGP", symbol: "E£", zipRegex: /^\d{5}$/ },
  { code: "FI", name: "Finland", phone: "+358", currency: "EUR", symbol: "€", zipRegex: /^\d{5}$/ },
  { code: "FR", name: "France", phone: "+33", currency: "EUR", symbol: "€", zipRegex: /^\d{5}$/ },
  { code: "DE", name: "Germany", phone: "+49", currency: "EUR", symbol: "€", zipRegex: /^\d{5}$/ },
  { code: "GH", name: "Ghana", phone: "+233", currency: "GHS", symbol: "₵", zipRegex: /^.+$/ },
  { code: "GR", name: "Greece", phone: "+30", currency: "EUR", symbol: "€", zipRegex: /^\d{5}$/ },
  { code: "HK", name: "Hong Kong", phone: "+852", currency: "HKD", symbol: "HK$", zipRegex: /^.+$/ },
  { code: "HU", name: "Hungary", phone: "+36", currency: "HUF", symbol: "Ft", zipRegex: /^\d{4}$/ },
  { code: "IN", name: "India", phone: "+91", currency: "INR", symbol: "₹", zipRegex: /^\d{6}$/ },
  { code: "ID", name: "Indonesia", phone: "+62", currency: "IDR", symbol: "Rp", zipRegex: /^\d{5}$/ },
  { code: "IE", name: "Ireland", phone: "+353", currency: "EUR", symbol: "€", zipRegex: /^[A-Z0-9]{3}\s?[A-Z0-9]{4}$/i },
  { code: "IL", name: "Israel", phone: "+972", currency: "ILS", symbol: "₪", zipRegex: /^\d{7}$/ },
  { code: "IT", name: "Italy", phone: "+39", currency: "EUR", symbol: "€", zipRegex: /^\d{5}$/ },
  { code: "JP", name: "Japan", phone: "+81", currency: "JPY", symbol: "¥", zipRegex: /^\d{3}-?\d{4}$/ },
  { code: "KE", name: "Kenya", phone: "+254", currency: "KES", symbol: "KSh", zipRegex: /^\d{5}$/ },
  { code: "KR", name: "South Korea", phone: "+82", currency: "KRW", symbol: "₩", zipRegex: /^\d{5}$/ },
  { code: "MY", name: "Malaysia", phone: "+60", currency: "MYR", symbol: "RM", zipRegex: /^\d{5}$/ },
  { code: "MX", name: "Mexico", phone: "+52", currency: "MXN", symbol: "$", zipRegex: /^\d{5}$/ },
  { code: "NL", name: "Netherlands", phone: "+31", currency: "EUR", symbol: "€", zipRegex: /^\d{4}\s?[A-Z]{2}$/i },
  { code: "NZ", name: "New Zealand", phone: "+64", currency: "NZD", symbol: "NZ$", zipRegex: /^\d{4}$/ },
  { code: "NG", name: "Nigeria", phone: "+234", currency: "NGN", symbol: "₦", zipRegex: /^\d{6}$/ },
  { code: "NO", name: "Norway", phone: "+47", currency: "NOK", symbol: "kr", zipRegex: /^\d{4}$/ },
  { code: "PK", name: "Pakistan", phone: "+92", currency: "PKR", symbol: "₨", zipRegex: /^\d{5}$/ },
  { code: "PE", name: "Peru", phone: "+51", currency: "PEN", symbol: "S/.", zipRegex: /^\d{5}$/ },
  { code: "PH", name: "Philippines", phone: "+63", currency: "PHP", symbol: "₱", zipRegex: /^\d{4}$/ },
  { code: "PL", name: "Poland", phone: "+48", currency: "PLN", symbol: "zł", zipRegex: /^\d{2}-?\d{3}$/ },
  { code: "PT", name: "Portugal", phone: "+351", currency: "EUR", symbol: "€", zipRegex: /^\d{4}-?\d{3}$/ },
  { code: "RO", name: "Romania", phone: "+40", currency: "RON", symbol: "lei", zipRegex: /^\d{6}$/ },
  { code: "RU", name: "Russia", phone: "+7", currency: "RUB", symbol: "₽", zipRegex: /^\d{6}$/ },
  { code: "SA", name: "Saudi Arabia", phone: "+966", currency: "SAR", symbol: "﷼", zipRegex: /^\d{5}$/ },
  { code: "SG", name: "Singapore", phone: "+65", currency: "SGD", symbol: "S$", zipRegex: /^\d{6}$/ },
  { code: "ZA", name: "South Africa", phone: "+27", currency: "ZAR", symbol: "R", zipRegex: /^\d{4}$/ },
  { code: "ES", name: "Spain", phone: "+34", currency: "EUR", symbol: "€", zipRegex: /^\d{5}$/ },
  { code: "LK", name: "Sri Lanka", phone: "+94", currency: "LKR", symbol: "Rs", zipRegex: /^\d{5}$/ },
  { code: "SE", name: "Sweden", phone: "+46", currency: "SEK", symbol: "kr", zipRegex: /^\d{3}\s?\d{2}$/ },
  { code: "CH", name: "Switzerland", phone: "+41", currency: "CHF", symbol: "CHF", zipRegex: /^\d{4}$/ },
  { code: "TW", name: "Taiwan", phone: "+886", currency: "TWD", symbol: "NT$", zipRegex: /^\d{3,5}$/ },
  { code: "TH", name: "Thailand", phone: "+66", currency: "THB", symbol: "฿", zipRegex: /^\d{5}$/ },
  { code: "TR", name: "Turkey", phone: "+90", currency: "TRY", symbol: "₺", zipRegex: /^\d{5}$/ },
  { code: "AE", name: "United Arab Emirates", phone: "+971", currency: "AED", symbol: "د.إ", zipRegex: /^.+$/ },
  { code: "GB", name: "United Kingdom", phone: "+44", currency: "GBP", symbol: "£", zipRegex: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i },
  { code: "US", name: "United States", phone: "+1", currency: "USD", symbol: "$", zipRegex: /^\d{5}(-\d{4})?$/ },
  { code: "VN", name: "Vietnam", phone: "+84", currency: "VND", symbol: "₫", zipRegex: /^\d{6}$/ },
];

export function getCountryByCode(code: string) {
  return COUNTRIES.find(c => c.code === code);
}

export function validateZip(countryCode: string, zip: string): boolean {
  const country = getCountryByCode(countryCode);
  if (!country) return true; // allow if unknown
  return country.zipRegex.test(zip.trim());
}

export function getCurrencySymbol(countryCode: string): string {
  const country = getCountryByCode(countryCode);
  return country?.symbol || "$";
}

export function getPhoneCode(countryCode: string): string {
  const country = getCountryByCode(countryCode);
  return country?.phone || "+1";
}

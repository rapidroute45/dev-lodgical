/** Normalize a phone number to digits only (drops +, spaces, dashes, parens). */
export function normalizePhone(phone) {
  if (!phone) return "";
  return String(phone).replace(/\D/g, "");
}

export function hasPhone(phone) {
  return normalizePhone(phone).length >= 7;
}

/** Open WhatsApp chat/call for a number in a new tab. Returns false if no usable number. */
export function openWhatsApp(phone) {
  const digits = normalizePhone(phone);
  if (digits.length < 7) return false;
  window.open(`https://wa.me/${digits}`, "_blank", "noopener,noreferrer");
  return true;
}

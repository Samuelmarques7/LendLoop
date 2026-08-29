const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function emailEhValido(email) {
  if (!email) return false;
  return REGEX_EMAIL.test(email.trim());
}
/**
 * Utilidades para validación de contraseñas
 * Usadas tanto en frontend como en backend
 */

export interface PasswordValidation {
  length: boolean; // Al menos 8 caracteres
  uppercase: boolean; // Al menos una mayúscula
  lowercase: boolean; // Al menos una minúscula
  number: boolean; // Al menos un número
}

/**
 * Valida que una contraseña cumpla con los requisitos de seguridad
 * Requisitos:
 * - Mínimo 8 caracteres
 * - Al menos una mayúscula (A-Z)
 * - Al menos una minúscula (a-z)
 * - Al menos un número (0-9)
 *
 * @param password - Contraseña a validar
 * @returns Objeto con el estado de cada validación
 */
export function validatePassword(password: string): PasswordValidation {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
}

/**
 * Verifica si una contraseña es válida (cumple todos los requisitos)
 *
 * @param password - Contraseña a validar
 * @returns true si cumple todos los requisitos, false en caso contrario
 */
export function isPasswordValid(password: string): boolean {
  const validation = validatePassword(password);
  return Object.values(validation).every(Boolean);
}

/**
 * Genera un mensaje de error descriptivo para contraseñas inválidas
 *
 * @param validation - Resultado de validatePassword()
 * @returns String con los requisitos no cumplidos
 */
export function getPasswordErrorMessage(validation: PasswordValidation): string {
  const missing: string[] = [];

  if (!validation.length) missing.push("mínimo 8 caracteres");
  if (!validation.uppercase) missing.push("una mayúscula");
  if (!validation.lowercase) missing.push("una minúscula");
  if (!validation.number) missing.push("un número");

  return `La contraseña debe tener: ${missing.join(", ")}`;
}

/**
 * Valida un email básico
 * (Validación más robusta se debe hacer en backend)
 *
 * @param email - Email a validar
 * @returns true si el formato es válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida que un nombre o apellido no esté vacío ni tenga solo espacios
 *
 * @param name - Nombre a validar
 * @param minLength - Longitud mínima (default: 2)
 * @returns true si es válido
 */
export function isValidName(name: string, minLength: number = 2): boolean {
  const trimmed = name.trim();
  return trimmed.length >= minLength;
}

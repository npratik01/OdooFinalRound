/**
 * Frontend validation helpers (yup-compatible patterns).
 */

export const isValidEmail = (email) =>
  /^\S+@\S+\.\S+$/.test(email)

export const isStrongPassword = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)

export const isPositiveNumber = (value) =>
  !isNaN(value) && Number(value) >= 0

export const isNonNegativeInteger = (value) =>
  Number.isInteger(Number(value)) && Number(value) >= 0

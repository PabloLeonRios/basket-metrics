export function isPasswordStrong(password: string): boolean {
  // Al menos 8 caracteres, 1 mayúscula, 1 número y 1 símbolo especial
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return (
    password.length >= minLength && hasUppercase && hasNumber && hasSpecialChar
  );
}

export const passwordPolicyMessage =
  'La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo especial.';

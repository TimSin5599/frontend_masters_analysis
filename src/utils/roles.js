/**
 * Проверяет, есть ли у пользователя указанная роль.
 * Поддерживает как массив ролей (новый формат), так и строку (обратная совместимость).
 */
export function hasRole(user, role) {
  if (!user) return false;
  if (Array.isArray(user.roles)) return user.roles.includes(role);
  if (typeof user.role === 'string') return user.role === role;
  return false;
}

/**
 * Проверяет, есть ли у пользователя хотя бы одна из указанных ролей.
 */
export function hasAnyRole(user, roles) {
  return roles.some((r) => hasRole(user, r));
}

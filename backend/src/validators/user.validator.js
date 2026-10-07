const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'OPERATOR'];

const validateCreateUser = (data) => {
  const errors = [];

  if (!data.username || typeof data.username !== 'string' || data.username.trim().length < 3) {
    errors.push('username lazima iwe herufi 3 au zaidi');
  }

  if (data.username && !/^[a-zA-Z0-9_]+$/.test(data.username)) {
    errors.push('username inaweza kuwa na herufi, namba, na underscore tu');
  }

  if (!data.full_name || typeof data.full_name !== 'string' || data.full_name.trim().length === 0) {
    errors.push('full_name inahitajika');
  }

  if (!data.password || typeof data.password !== 'string' || data.password.length < 6) {
    errors.push('password lazima iwe herufi 6 au zaidi');
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('email si sahihi');
  }

  if (data.role && !ALLOWED_ROLES.includes(data.role)) {
    errors.push(`role lazima iwe mojawapo ya: ${ALLOWED_ROLES.join(', ')}`);
  }

  return errors;
};

const validateUpdateUser = (data) => {
  const errors = [];

  if (data.email !== undefined && data.email !== null && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('email si sahihi');
  }

  if (data.role !== undefined && !ALLOWED_ROLES.includes(data.role)) {
    errors.push(`role lazima iwe mojawapo ya: ${ALLOWED_ROLES.join(', ')}`);
  }

  if (data.full_name !== undefined && (typeof data.full_name !== 'string' || data.full_name.trim().length === 0)) {
    errors.push('full_name si sahihi');
  }

  return errors;
};

const validateChangePassword = (data) => {
  const errors = [];

  if (!data.new_password || typeof data.new_password !== 'string' || data.new_password.length < 6) {
    errors.push('new_password lazima iwe herufi 6 au zaidi');
  }

  return errors;
};

module.exports = { validateCreateUser, validateUpdateUser, validateChangePassword };
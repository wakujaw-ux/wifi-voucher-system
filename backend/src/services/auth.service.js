const bcrypt = require("bcryptjs");
const db = require("../config/database");
const { signToken } = require("../utils/jwt");

const login = async (username, password) => {
  // 1. Tafuta user kwa username
  const result = await db.query(
    "SELECT id, username, full_name, email, password_hash, role, site_id, is_active FROM users WHERE username = $1 AND deleted_at IS NULL",
    [username],
  );

  if (result.rowCount === 0) {
    const err = new Error("Username au password si sahihi");
    err.code = "INVALID_CREDENTIALS";
    err.status = 401;
    throw err;
  }

  const user = result.rows[0];

  // 2. Angalia kama user active
  if (!user.is_active) {
    const err = new Error("Akaunti yako imezimwa");
    err.code = "ACCOUNT_DISABLED";
    err.status = 403;
    throw err;
  }

  // 3. Linganisha password
  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    const err = new Error("Username au password si sahihi");
    err.code = "INVALID_CREDENTIALS";
    err.status = 401;
    throw err;
  }

  // 4. Sasisha last_login_at
  await db.query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [
    user.id,
  ]);

  // 5. Tengeneza token
  const token = signToken({
    userId: user.id,
    username: user.username,
    role: user.role,
    siteId: user.site_id,
  });

  // 6. Rudisha data (bila password_hash)
  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      site_id: user.site_id,
    },
  };
};

module.exports = { login };

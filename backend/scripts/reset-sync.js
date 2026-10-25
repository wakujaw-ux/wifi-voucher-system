require("dotenv").config();
const db = require("../src/config/database");

const resetSync = async () => {
  try {
    console.log("⏳ Inasafisha Database...");

    // 1. Futa sessions zote zilizokwama
    await db.query("DELETE FROM sessions");

    // 2. Rudisha vocha zote kuwa AVAILABLE isipokuwa zile zilizokwisha tumika kihalali (USED)
    await db.query(
      "UPDATE vouchers SET status = 'AVAILABLE' WHERE status IN ('ACTIVE', 'SOLD')",
    );

    console.log(
      "✅ Database imesafishwa! Sessions zote zimefutwa, na vocha zote zimerudishwa AVAILABLE.",
    );
    process.exit(0);
  } catch (err) {
    console.error("❌ Kosa:", err.message);
    process.exit(1);
  }
};

resetSync();

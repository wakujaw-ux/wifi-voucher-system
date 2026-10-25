require("dotenv").config();
const db = require("../src/config/database");

const clearSessions = async () => {
  try {
    console.log("Inafuta sessions zote zilizokwama...");
    await db.query("DELETE FROM sessions");
    await db.query(
      "UPDATE vouchers SET status = 'AVAILABLE' WHERE status = 'USED'",
    );
    console.log("✅ Sessions zote zimefutwa na vocha zimerudishwa AVAILABLE!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Kosa:", err.message);
    process.exit(1);
  }
};

clearSessions();

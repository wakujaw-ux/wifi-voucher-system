require("dotenv").config();
const db = require("../src/config/database");

const resetAllData = async () => {
  try {
    console.log("⏳ Inasafisha Database kabisa (Clean Slate)...");

    // Tunafuta kuanzia vitu vidogo kwenda vikubwa (kuzingatia Foreign Keys)
    await db.query("DELETE FROM network_usage");
    await db.query("DELETE FROM sessions");
    await db.query("DELETE FROM payments");
    await db.query("DELETE FROM sales");
    await db.query("DELETE FROM vouchers");
    await db.query("DELETE FROM voucher_batches");

    console.log(
      "✅ Database imesafishwa! Vocha zote, mauzo, na sessions zimefutwa kabisa.",
    );
    process.exit(0);
  } catch (err) {
    console.error("❌ Kosa:", err.message);
    process.exit(1);
  }
};

resetAllData();

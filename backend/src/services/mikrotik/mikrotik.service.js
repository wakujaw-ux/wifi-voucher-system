const client = require("./mikrotik.client");

const healthCheck = async () => {
  try {
    const info = await client.getSystemInfo();
    return {
      online: true,
      identity: info.identity,
      version: info.version,
      uptime: info.uptime,
      cpu_load: info["cpu-load"],
      free_memory: info["free-memory"],
      total_memory: info["total-memory"],
    };
  } catch (err) {
    // Ongeza logging ili tuone kosa halisi
    console.error("❌ [MikroTik Health] Error:", err);
    console.error("❌ [MikroTik Health] Message:", err.message);
    console.error("❌ [MikroTik Health] Code:", err.code);

    return {
      online: false,
      error: err.message || "Unknown error",
      code: err.code || "UNKNOWN",
    };
  }
};

const getSystemInfo = async () => {
  return client.getSystemInfo();
};

module.exports = { healthCheck, getSystemInfo };

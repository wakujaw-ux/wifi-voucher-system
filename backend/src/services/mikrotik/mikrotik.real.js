const { RouterOSAPI } = require("node-routeros");
const config = require("../../config/mikrotik");

class MikroTikReal {
  constructor() {
    this.connected = false;
    this.conn = null;
    console.log("🔌 [MikroTik Real] Instance created");
  }

  async connect() {
    if (this.connected && this.conn) return true;

    this.conn = new RouterOSAPI({
      host: config.host,
      user: config.username,
      password: config.password,
      port: config.port,
      timeout: config.timeout,
    });

    // ============================================================
    // MUHIMU: Kamata makosa ya connection ili backend isicrash
    // ============================================================
    this.conn.on("error", (err) => {
      console.error(
        "🔌 [MikroTik Real] Connection error (handled):",
        err.message,
      );
      this.connected = false;
    });

    try {
      await this.conn.connect();
      this.connected = true;
      console.log("🔌 [MikroTik Real] Connected successfully");
      return true;
    } catch (err) {
      this.connected = false;
      // Badilisha hapa ili tuone kosa kamili:
      console.error("🔌 [MikroTik Real] Connection failed:", err);
      throw new Error(
        "Imeshindwa kuunganisha na MikroTik. Kagua kama VM inawaka.",
      );
    }
  }

  async disconnect() {
    if (this.conn) {
      try {
        await this.conn.close();
      } catch (err) {
        // Puuza makosa wakati wa kufunga
      }
      this.conn = null;
      this.connected = false;
    }
  }

  isConnected() {
    return this.connected;
  }

  async getSystemInfo() {
    if (!this.connected) await this.connect();
    try {
      const res = await this.conn.write("/system/resource/print");
      return res[0];
    } catch (err) {
      this.connected = false;
      throw err;
    }
  }

  // ============================================================
  // HOTSPOT USERS
  // ============================================================
  async createHotspotUser({ name, password, profile, limitUptime, comment }) {
    if (!this.connected) await this.connect();

    const params = [
      `=name=${name}`,
      `=password=${password}`,
      `=profile=${profile || config.defaultProfile || "default"}`,
      `=comment=${comment || ""}`,
    ];
    if (limitUptime) params.push(`=limit-uptime=${limitUptime}`);

    try {
      const res = await this.conn.write("/ip/hotspot/user/add", params);
      return res[0] || { name };
    } catch (err) {
      this.connected = false;
      throw err;
    }
  }

  async getHotspotUsers() {
    if (!this.connected) await this.connect();
    try {
      return await this.conn.write("/ip/hotspot/user/print");
    } catch (err) {
      this.connected = false;
      throw err;
    }
  }

  async getHotspotUserByName(name) {
    if (!this.connected) await this.connect();
    try {
      const users = await this.conn.write("/ip/hotspot/user/print", [
        `?name=${name}`,
      ]);
      return users.length > 0 ? users[0] : null;
    } catch (err) {
      this.connected = false;
      throw err;
    }
  }

  async removeHotspotUser(name) {
    if (!this.connected) await this.connect();
    try {
      const user = await this.getHotspotUserByName(name);
      if (!user) throw new Error("User not found");

      await this.conn.write("/ip/hotspot/user/remove", [`=.id=${user[".id"]}`]);
      return true;
    } catch (err) {
      this.connected = false;
      throw err;
    }
  }

  async disableHotspotUser(name) {
    if (!this.connected) await this.connect();
    try {
      const user = await this.getHotspotUserByName(name);
      if (!user) throw new Error("User not found");
      await this.conn.write("/ip/hotspot/user/disable", [
        `=.id=${user[".id"]}`,
      ]);
      return true;
    } catch (err) {
      this.connected = false;
      throw err;
    }
  }

  async enableHotspotUser(name) {
    if (!this.connected) await this.connect();
    try {
      const user = await this.getHotspotUserByName(name);
      if (!user) throw new Error("User not found");
      await this.conn.write("/ip/hotspot/user/enable", [`=.id=${user[".id"]}`]);
      return true;
    } catch (err) {
      this.connected = false;
      throw err;
    }
  }

  // ============================================================
  // ACTIVE SESSIONS
  // ============================================================
  async getActiveHotspotSessions() {
    if (!this.connected) await this.connect();
    try {
      return await this.conn.write("/ip/hotspot/active/print");
    } catch (err) {
      this.connected = false;
      throw err;
    }
  }

  async disconnectHotspotSession(sessionId) {
    if (!this.connected) await this.connect();
    try {
      await this.conn.write("/ip/hotspot/active/remove", [`=.id=${sessionId}`]);
      return true;
    } catch (err) {
      this.connected = false;
      throw err;
    }
  }
}

module.exports = MikroTikReal;

const { RouterOSAPI } = require("node-routeros");
const config = require("../../config/mikrotik");

class MikroTikReal {
  constructor() {
    this.connected = false;
    this.conn = null;
    console.log("🔌 [MikroTik Real] Instance created");
  }

  async connect() {
    if (this.connected) return true;

    this.conn = new RouterOSAPI({
      host: config.host,
      user: config.username,
      password: config.password,
      port: config.port,
      timeout: config.timeout,
    });

    try {
      await this.conn.connect();
      this.connected = true;
      console.log("🔌 [MikroTik Real] Connected successfully");
      return true;
    } catch (err) {
      this.connected = false;
      console.error("🔌 [MikroTik Real] Connection failed:", err.message);
      throw err;
    }
  }

  async disconnect() {
    if (this.conn) {
      await this.conn.close();
      this.connected = false;
    }
  }

  isConnected() {
    return this.connected;
  }

  async getSystemInfo() {
    if (!this.connected) await this.connect();
    const res = await this.conn.write("/system/resource/print");
    return res[0];
  }

  // ============================================================
  // HOTSPOT USERS
  // ============================================================
  async createHotspotUser({ name, password, profile, limitUptime, comment }) {
    if (!this.connected) await this.connect();

    const params = [
      `=name=${name}`,
      `=password=${password}`,
      `=profile=${profile || config.defaultProfile || 'default'}`,
      `=comment=${comment || ""}`,
    ];
    if (limitUptime) params.push(`=limit-uptime=${limitUptime}`);

    const res = await this.conn.write("/ip/hotspot/user/add", params);
    return res[0] || { name };
  }

  async getHotspotUsers() {
    if (!this.connected) await this.connect();
    return await this.conn.write("/ip/hotspot/user/print");
  }

  async getHotspotUserByName(name) {
    if (!this.connected) await this.connect();
    const users = await this.conn.write("/ip/hotspot/user/print", [
      `?name=${name}`,
    ]);
    return users.length > 0 ? users[0] : null;
  }

  async removeHotspotUser(name) {
    if (!this.connected) await this.connect();
    const user = await this.getHotspotUserByName(name);
    if (!user) throw new Error("User not found");

    await this.conn.write("/ip/hotspot/user/remove", [`=.id=${user[".id"]}`]);
    return true;
  }

  async disableHotspotUser(name) {
    if (!this.connected) await this.connect();
    const user = await this.getHotspotUserByName(name);
    if (!user) throw new Error("User not found");
    await this.conn.write("/ip/hotspot/user/disable", [`=.id=${user[".id"]}`]);
    return true;
  }

  async enableHotspotUser(name) {
    if (!this.connected) await this.connect();
    const user = await this.getHotspotUserByName(name);
    if (!user) throw new Error("User not found");
    await this.conn.write("/ip/hotspot/user/enable", [`=.id=${user[".id"]}`]);
    return true;
  }

  // ============================================================
  // ACTIVE SESSIONS
  // ============================================================
  async getActiveHotspotSessions() {
    if (!this.connected) await this.connect();
    return await this.conn.write("/ip/hotspot/active/print");
  }

  async disconnectHotspotSession(sessionId) {
    if (!this.connected) await this.connect();
    await this.conn.write("/ip/hotspot/active/remove", [`=.id=${sessionId}`]);
    return true;
  }
}

module.exports = MikroTikReal;

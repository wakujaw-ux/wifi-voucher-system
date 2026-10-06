// ============================================================
// MOCK MIKROTIK — Inaiga RouterOS kwa majaribio
// Data inahifadhiwa kwenye memory (Map)
// ============================================================

class MikroTikMock {
  constructor() {
    this.connected = false;
    this.hotspotUsers = new Map(); // username -> user data
    this.activeSessions = new Map(); // sessionId -> session data
    this.identity = 'MikroTik-Mock';
    this.version = '7.15 (mock)';
    this.uptime = 86400; // sekunde 1 siku
    console.log('🔧 [MikroTik Mock] Instance created');
  }

  // ============================================================
  // CONNECTION
  // ============================================================
  async connect() {
    this.connected = true;
    console.log('🔧 [MikroTik Mock] Connected');
    return true;
  }

  async disconnect() {
    this.connected = false;
    console.log('🔧 [MikroTik Mock] Disconnected');
    return true;
  }

  isConnected() {
    return this.connected;
  }

  // ============================================================
  // SYSTEM INFO
  // ============================================================
  async getSystemInfo() {
    if (!this.connected) throw new Error('Not connected');
    return {
      identity: this.identity,
      version: this.version,
      uptime: this.uptime,
      cpu_load: Math.floor(Math.random() * 30),
      free_memory: 128000000,
      total_memory: 256000000,
      board_name: 'CHR-Mock',
      architecture: 'x86_64',
    };
  }

  async getResource() {
    if (!this.connected) throw new Error('Not connected');
    return {
      'cpu-load': Math.floor(Math.random() * 30),
      'free-memory': 128000000,
      'total-memory': 256000000,
      'uptime': '1d0h0m0s',
      'version': this.version,
    };
  }

  // ============================================================
  // HOTSPOT USERS (Vouchers)
  // ============================================================
  async createHotspotUser({ name, password, profile, limitUptime, limitBytesIn, limitBytesOut, comment }) {
    if (!this.connected) throw new Error('Not connected');
    if (this.hotspotUsers.has(name)) {
      const err = new Error(`User "${name}" already exists`);
      err.code = 'USER_EXISTS';
      throw err;
    }

    const user = {
      '.id': `*${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
      name,
      password: password || name,
      profile: profile || 'default',
      'limit-uptime': limitUptime || null,
      'limit-bytes-in': limitBytesIn || null,
      'limit-bytes-out': limitBytesOut || null,
      comment: comment || '',
      disabled: 'false',
      'uptime-used': '0s',
      'bytes-in': '0',
      'bytes-out': '0',
      created_at: new Date().toISOString(),
    };

    this.hotspotUsers.set(name, user);
    console.log(`🔧 [MikroTik Mock] Hotspot user created: ${name}`);
    return user;
  }

  async getHotspotUsers() {
    if (!this.connected) throw new Error('Not connected');
    return Array.from(this.hotspotUsers.values());
  }

  async getHotspotUserByName(name) {
    if (!this.connected) throw new Error('Not connected');
    return this.hotspotUsers.get(name) || null;
  }

  async removeHotspotUser(name) {
    if (!this.connected) throw new Error('Not connected');
    const deleted = this.hotspotUsers.delete(name);
    if (!deleted) {
      const err = new Error(`User "${name}" not found`);
      err.code = 'USER_NOT_FOUND';
      throw err;
    }
    console.log(`🔧 [MikroTik Mock] Hotspot user removed: ${name}`);
    return true;
  }

  async disableHotspotUser(name) {
    const user = this.hotspotUsers.get(name);
    if (!user) throw new Error('User not found');
    user.disabled = 'true';
    this.hotspotUsers.set(name, user);
    return user;
  }

  async enableHotspotUser(name) {
    const user = this.hotspotUsers.get(name);
    if (!user) throw new Error('User not found');
    user.disabled = 'false';
    this.hotspotUsers.set(name, user);
    return user;
  }

  // ============================================================
  // ACTIVE SESSIONS
  // ============================================================
  async getActiveHotspotSessions() {
    if (!this.connected) throw new Error('Not connected');
    return Array.from(this.activeSessions.values());
  }

  async disconnectHotspotSession(sessionId) {
    if (!this.connected) throw new Error('Not connected');
    const removed = this.activeSessions.delete(sessionId);
    if (!removed) throw new Error('Session not found');
    return true;
  }

  // ============================================================
  // TEST: Simulate active session (kwa majaribio)
  // ============================================================
  _simulateActiveSession({ user, address, macAddress, uptime }) {
    const id = `*${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
    const session = {
      '.id': id,
      user,
      address: address || '192.168.88.100',
      'mac-address': macAddress || 'AA:BB:CC:DD:EE:FF',
      uptime: uptime || '5m0s',
      'bytes-in': '1024000',
      'bytes-out': '2048000',
    };
    this.activeSessions.set(id, session);
    return session;
  }
}

module.exports = MikroTikMock;
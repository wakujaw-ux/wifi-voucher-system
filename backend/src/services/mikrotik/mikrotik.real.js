// ====================================================================
// REAL MIKROTIK - Inaunganisha na RouterOS kupitia API
// Library: node-routeros
// ====================================================================
const config = require('../../config/mikrotik');

class MikroTikReal {
    constructor() {
        this.connected = false;
        this.conn = null;
        console.log(' [MikroTik Real] Instance created');
    }

    async connect() {
        // Tutaongeza library baadaye
        // const { RouterOSAPI } = require('node-routeros');
        // this.conn = new RouterOSAPI({
        // host: config.host,
        // port: config.port,
        // user: config.username,
        // password: config.password,
        // timeout: config.timeout,
        //});
        // await this.conn.connect();
        // this.connected = true;
        throw new Error('MikroTik Real mode haijatekelezwa bado. Tumia MIKROTIK_MODE=mock.');
    }

    async disconnect() {
        if (this.conn) {
            await this.conn.close();
            this.connected = false;
        }
    }

    isConnected() {
        return this.connected
    }

    // Njia zote hapa chini zitafanana na mock
    // Tutaandika mwili kamili tutakapokua na router.
}

module.exports = MikroTikReal;

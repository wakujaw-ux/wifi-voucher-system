const config = require('../../config/mikrotik');
const MikroTikMock = require('./mikrotik.mock');
const MikroTikReal = require('./mikrotik.real');

let instance = null;

const getClient = () => {
    if (!instance) {
        if (config.mode === 'real') {
            console.log(' [MikroTik Client] Using REAL mode');
            instance = new MikroTikReal();
        } else {
            console.log(' [MikroTik Client] Using MOCK mode');
            instance = new MikroTikMock();
        }
    }
    
    return instance;
};

// Wrapper functions
const connect = async () => {
    const client = getClient();
    if (!client.isConnected()) {
        await client.connect();
    }

    return client
};

const getSystemInfo = async () => {
    const client = await connect();
    return client.getSystemInfo();
};

// Hotspot users
const createHotspotUser = async (data) => {
    const client = await connect();
    return client.createHotspotUser(data);
};

const getHotspotUsers = async () => {
    const client = await connect();
    return client.getHotspotUsers();
};

const getHotspotUserByName = async (name) => {
    const client = await connect();
    return client.getHotspotUserByName(name);
};

const removeHotspotUser = async (name) => {
    const client = await connect();
    return client.removeHotspotUser(name);
};

const disableHotspotUser = async (name) => {
    const client = await connect();
    return client.disableHotspotUser(name);
};

const enableHotspotUser = async (name) => {
    const client = await connect();
    return client.enableHotspotUser(name);
};

// Active sessions
const getActiveHotspotSessions = async () => {
    const client = await connect();
    return client.getActiveHotspotSessions();
};

const disconnectHotspotSession = async (sessionId) => {
    const client = await connect();
    return client.disconnectHotspotSession(sessionId);
};

module.exports = {
    getClient, connect, getSystemInfo, createHotspotUser, getHotspotUsers, getHotspotUserByName, removeHotspotUser, disableHotspotUser, enableHotspotUser, getActiveHotspotSessions, disconnectHotspotSession,
};
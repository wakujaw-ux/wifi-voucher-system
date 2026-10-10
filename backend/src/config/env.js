const mikrotik = require('./mikrotik');
const { password } = require('./mikrotik');

require('dotenv').config();

const required = [
    'NODE_ENV', 'PORT', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'JWT_SECRET'
];

const missing = [];

for (const key of required) {
    if (!process.env[key] || process.env[key].trim() === '') {
        missing.push(key);
    }
}

if (missing.length > 0) {
    console.error('Missing required environment variables:');
    for (const key of missing) {
        console.error(` -${key}`);
    }
    console.error('\n Angalia file yako ya .env.');
    process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
    console.error('JWT_SECRET ni fupi sana. Tumia herufi 32 au zaidi.');
    process.exit(1);
}

module.exports = {
nodeEnv: process.env.NODE_ENV,
port: parseInt(process.env.PORT, 10) || 3000,
db: {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME,
},
jwtsecret: process.env.JWT_SECRET,
mikrotik: {
    mode: process.env.MIKROTIK_MODE || 'mock',
    host: process.env.MIKROTIK_HOST,
    port: parseInt(process.env.MIKROTIK_PORT, 10) || 8728,
    username: process.env.MIKROTIK_USERNAME,
    password: process.env.MIKROTIK_PASSWORD,
},
appUrl: process.env.APP_URL || 'http://localhost:3000',
};
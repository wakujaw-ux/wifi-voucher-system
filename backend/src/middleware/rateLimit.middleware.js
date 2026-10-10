const rateLimit = require('express');
const { success } = require('../utils/response');

// Global limiter (kwa routes zote)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // dakika 15
    max: 300,
    message: {
        success: false,
        message: 'Requests nyingi sana. Tafadhali jalibu tena baada ya dakika 15.',
        code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders:true,
    legacyHeaders: false,
});

// Auth limiter (kwa login - kali zaidi)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // dakika 15
    max: 10, // attempts 10 tu
    message: {
        success: false,
        message: 'Majaribio mengi ya login. Tafazali subiri dakika 15.',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Usihesabu requests zilizofanikiwa
});

//  Voucher generation limiter
const generateLimiter = rateLimit({
    windowMs: 60 * 1000, //dakika 1
    max: 5, // generate 5 batches kwa dakika
    message: {
        success: false,
        message: 'Umezalisha vocha nyingi. subiri dakika moja.',
        code: 'GENERATE_RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { globalLimiter, authLimiter, generateLimiter};
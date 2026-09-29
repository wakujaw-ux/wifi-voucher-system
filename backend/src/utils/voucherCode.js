const crypto = require('crypto');

// Characters ambazo hazichanganyiki
// Tumeondoa: 0, o, 1, I, L, 2, Z, 5, S
const SAFE_CHARS = 'ABCDEFGHJKMNPQRTUVWXY346789';

// Zalisha voucher code moja
const generateVoucherCode = (length = 6) => {
    let code = '';
    const bytes = crypto.randomBytes(length);
     for (let i = 0; i < length; i++) {
        code += SAFE_CHARS[bytes[i] % SAFE_CHARS.length];
     }
     return code;
};

// Zalisha codes nyingi unique kwa wakati mmoja
const generateBulkCodes = (quantity, length = 6) => {
    const codes = new Set();
    let attempts = 0;
    const maxAttempts = quantity * 10;

    while (codes.size < quantity && attempts < maxAttempts) {
        codes.add(generateVoucherCode(length));
        attempts++;
    }

    if (codes.size < quantity) {
        throw new Error('Imeshindwa kuzalisha codes za kutosha');
    }

    return Array.from(codes)
};

module.exports = { generateVoucherCode, generateBulkCodes, SAFE_CHARS };
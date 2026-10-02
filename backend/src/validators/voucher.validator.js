const validateGenerateVouchers = (data) => {
    const errors = [];

    if (!data.site_id) {
        errors.push('site_id inahitajika');
    }

    if (!data.package_id) {
        errors.push('package_id inahitajika');
    }

    if (!Number.isInteger(data.quantity) || data.quantity <= 0) {
        errors.push('quantity lazima iwe namba kamili zaidi ya 0');
    }

    if (data.quantity > 1000) {
        errors.push('quantity haiwezi kuzidi 1000 kwa batch moja');
    }

    if (data.prefix !== undefined && (typeof data.prefix !== 'string' || data.prefix.length > 10)) {
        errors.push('prefix lazima iwe string isiyozidi herufi 10');
    }

    return errors;
};

const validateSellVoucher = (data) => {
    const errors = [];
    if (!data.voucher_id) errors.push('voucher_id inahitajika');
    if (data.payment_method !== undefined) {
        const allowed = ['CASH', 'MPESA', 'AIRTEL_MONEY', 'TIGO_PESA', 'HALOPESA', 'BANK'];
        if (!allowed.includes(data.payment_method)) {
            errors.push(`payment_method lazima iwe moja ya: ${allowed.join(', ')}`);
        }
    }
    return errors;
};

const validateRevokeVoucher = (data) => {
    const errors = [];
    if (data.reason !== undefined && typeof data.reason !== 'string') {
        errors.push('reason lazima iwe mandishi');
    }
    return errors;
};

module.exports = { validateGenerateVouchers, validateSellVoucher, validateRevokeVoucher };
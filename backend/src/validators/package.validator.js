const validateCreatePackage = (data) => {
    const errors = [];

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('Jina la package linahitajika');
    }

    if (data.price === undefined || isNaN(data.price) || data.price <= 0) {
        errors.push('Bei lazima iwe namba zaidi ya 0');
    }

    if (!Number.isInteger(data.duration_minutes) || data.duration_minutes <= 0) {
        errors.push('Muda (duration_minutes) lazima iwe namba kamili zaidi ya 0');
    }

    if (data.validity_days !== undefined && (!Number.isInteger(data.validity_days) || data.validity_days <= 0)) {
        errors.push('validity_days lazima iwe namba kamili zaidi ya 0');
    }

    if (data.speed_limit_mbps !== undefined && (!Number.isInteger(data.speed_limit_mbps) || data.speed_limit_mbps <= 0)) {
        errors.push('speed_limit_mbps lazima iwe namba kamili zaidi ya 0');
    }

    if (data.device_limit !== undefined && (!Number.isInteger(data.device_limit) || data.device_limit <= 0)) {
        errors.push('device_limit lazima iwe namba kamili zaidi ya 0');
    }
    return errors;
};

const validateUpdatePackage = (data) => {
    const errors = [];

    if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim().length === 0)) {
        errors.push('Jina la package si sahihi');
    }

    if (data.price !== undefined && (isNaN(data.price) || data.price <= 0)) {
        errors.push('Bei lazima iwe namba zaidi ya 0');
    }

    if (data.duration_minutes !== undefined && (!Number.isInteger(data.duration_minutes) || data.duration_minutes <= 0)) {
        errors.push('duration_minutes lazima iwe namba kamili zaidi ya 0');
    }

    return errors;
};

module.exports = { validateCreatePackage, validateUpdatePackage };
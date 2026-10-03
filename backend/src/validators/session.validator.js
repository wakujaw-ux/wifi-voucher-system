const validateDisconnect = (data) => {
    const errors = [];

    if (data.reason !== undefined && typeof data.reason !== 'string') {
        errors.push('reason lazima iwe maandishi');
    }

    if (data.reason !== undefined && data.reason.length > 200) {
        errors.push('reason haipaswi kuzidi herufi 200');
    }

    return errors;
};

module.exports = { validateDisconnect };
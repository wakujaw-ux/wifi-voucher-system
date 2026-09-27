// Standard API response format
const success = (res, data = {}, message = 'OK', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

const error = (res, message = 'Error', code = 'ERROR', statusCode = 400) => {
    return res.status(statusCode).json({
        success: false,
        message,
        code,
    });
};

module.exports = { success, error };
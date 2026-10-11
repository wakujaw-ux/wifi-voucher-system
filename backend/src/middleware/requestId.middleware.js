const crypto = require('crypto');

const requestId = (req, res, next) => {
    // Tumia X-Request-ID kama ipo, au tengeneza mpya
    const id =  req.headers['x-request-id'] || crypto.randomUUID();

    req.id = id;
    res.setHeader('X-Request-ID', id);

    next()
};

module.exports = requestId;
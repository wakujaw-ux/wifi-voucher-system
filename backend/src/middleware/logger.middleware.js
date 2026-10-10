const morgan = require('morgan');

// Custom format
const format = ':method :url :status :response-time ms - :res[content-length]';

const logger = morgan(format, {
    skip: (req, res) => {
        // Usiandike logs za health check
        return req.url === '/api/health';
    },
});


// Kwa production, unaweza kuandika kwenye file
// const fs = require('fs');
// const path = require('path');
// const accessLogStream = fs.createWriteStream(path.join(__dirname, '../../logs/access.log'), { flags: 'a' });
// const logger = morgan('combined', { stream: accessLogStream });

module.exports = logger;
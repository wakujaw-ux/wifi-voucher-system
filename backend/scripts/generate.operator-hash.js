const bcrypt = require('bcryptjs');

const password = 'Operator@2025!';
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Hash:', hash);
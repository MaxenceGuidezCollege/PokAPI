
const crypto = require("crypto");
const salt = process.env.SALT || 'salt the cat in the hat';

const {Database} = require("../../database/database");
const database = new Database();

;(async () => {
    crypto.pbkdf2('admin', salt, 310000, 32,
        'sha256', (err, hashedPassword) => {

        database.addUser({
            username: 'PokAdmin',
            email: 'admin@pokapi.com',
            pwd_hash: hashedPassword,
            role: 'ADMIN',
        });
    });
})();

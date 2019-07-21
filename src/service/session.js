//// Core modules

//// External modules
const session = require('express-session'); // Session engine
const SQLiteStore = require('connect-sqlite3')(session); // Save session to sqlite db

module.exports = (container) => {
    let config = container.get('config');
    let cred = container.get('cred');

    // Use the session middleware
    // See options in https://github.com/expressjs/session
    return session({
        store: new SQLiteStore({
            db: config.session.store.db,
            dir: config.session.store.dir
        }),
        secret: cred.session.secret,
        cookie: config.session.cookie,
        resave: false,
        saveUninitialized: false
    });
};
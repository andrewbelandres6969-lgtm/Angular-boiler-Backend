const { Sequelize } = require('sequelize');

module.exports = db = {};

db.initialized = initialize();

async function initialize() {
    const host = process.env.DB_HOST;
    const port = parseInt(process.env.DB_PORT || '3306', 10);
    const user = process.env.DB_USER;
    const password = process.env.DB_PASSWORD;
    const database = process.env.DB_NAME;

    // TiDB Cloud (and most managed MySQL providers) require TLS. Toggle with DB_SSL=true.
    const useSsl = String(process.env.DB_SSL).toLowerCase() === 'true';
    const dialectOptions = useSsl
        ? {
              ssl: {
                  // TiDB serves a public cert chain; explicit minVersion avoids old TLS.
                  minVersion: 'TLSv1.2',
                  rejectUnauthorized: true,
              },
              connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '20000', 10),
          }
        : {
              connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '20000', 10),
          };

    if (!host || !user || !database) {
        throw new Error('Database configuration is incomplete. Expected DB_HOST, DB_USER, DB_NAME, and DB_PASSWORD.');
    }

    const sequelize = new Sequelize(database, user, password, {
        host,
        port,
        dialect: 'mysql',
        dialectOptions,
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
            idle: 10000,
        },
    });

    // init models and add them to the exported db object
    db.sequelize = sequelize;
    db.Account = require('../accounts/account.model')(sequelize);
    db.RefreshToken = require('../accounts/refresh-token.model')(sequelize);

    // define relationships
    db.Account.hasMany(db.RefreshToken, { onDelete: 'CASCADE' });
    db.RefreshToken.belongsTo(db.Account);

    // Fail fast during startup so deployment logs point at DB/network issues clearly.
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
}
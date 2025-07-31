// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-require-imports
require('dotenv').config();

const config = {
  local: {
    logging: false,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    define: {
      timestamps: true,
    },
    seederStorage: 'sequelize',
  },
};

module.exports = config;

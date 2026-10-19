require('dotenv').config();
const { Sequelize } = require('sequelize');

const dialect = process.env.DB_DIALECT || 'mysql';
const useSsl = String(process.env.DB_SSL).toLowerCase() === 'true';

const baseOptions = {
  dialect: 'mysql',
  logging: false,
  dialectOptions: useSsl ? { ssl: { rejectUnauthorized: false } } : {},
  define: {
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
};

let sequelize;

if (dialect === 'sqlite') {
  // Solo para pruebas locales sin MySQL (requiere: npm i sqlite3 --no-save)
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || ':memory:',
    logging: false,
    define: baseOptions.define,
  });
} else if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, baseOptions);
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      ...baseOptions,
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
    }
  );
}

module.exports = sequelize;

const { Sequelize } = require('sequelize');
const path = require('path');

// Configuração para diferentes ambientes
const env = process.env.NODE_ENV || 'development';

// Configuração SQLite (fallback para desenvolvimento)
const sqliteConfig = {
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database.sqlite'),
    logging: false,
    define: {
        timestamps: true,
        underscored: true
    }
};

// Configuração para desenvolvimento (PostgreSQL com fallback para SQLite)
const development = process.env.USE_SQLITE === 'true' ? sqliteConfig : {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'sistema_tickets',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    define: {
        timestamps: true,
        underscored: true
    }
};

// Configuração para teste
const test = process.env.USE_SQLITE === 'true' ? sqliteConfig : {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'sistema_tickets_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    define: {
        timestamps: true,
        underscored: true
    }
};

// Configuração para produção (sempre PostgreSQL)
const production = {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    define: {
        timestamps: true,
        underscored: true
    }
};

module.exports = {
    development,
    test,
    production
};

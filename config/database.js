const { Sequelize } = require('sequelize');

// Configuração para diferentes ambientes
const env = process.env.NODE_ENV || 'development';

// Configuração base para PostgreSQL
const baseConfig = {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
        timestamps: true,
        underscored: true
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
};

// Configuração para desenvolvimento (PostgreSQL)
const development = {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'sistema_tickets_dev',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    ...baseConfig
};



// Configuração para produção (PostgreSQL)
const production = {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    ...baseConfig
};

module.exports = {
    development,
    production
};

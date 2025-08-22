const { Sequelize } = require('sequelize');

// Configuração para diferentes ambientes
const env = process.env.NODE_ENV || 'development';

// Configuração base para PostgreSQL
const postgresConfig = {
    dialect: 'postgres',
    logging: false,
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

// Configuração base para Oracle
const oracleConfig = {
    dialect: 'oracle',
    logging: false,
    define: {
        timestamps: true,
        underscored: true
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    dialectOptions: {
        connectString: process.env.ORACLE_CONNECT_STRING,
        // Configurações específicas do Oracle
        oracleClient: {
            libDir: process.env.ORACLE_CLIENT_LIB_DIR || null
        }
    }
};

// Configuração para desenvolvimento (PostgreSQL)
const development = {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'sistema_tickets_dev',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    ...postgresConfig
};

// Configuração para Oracle Free Tier
const oracle = {
    username: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    database: process.env.ORACLE_DATABASE,
    host: process.env.ORACLE_HOST,
    port: process.env.ORACLE_PORT || 1521,
    serviceName: process.env.ORACLE_SERVICE_NAME,
    ...oracleConfig
};

// Configuração para produção (PostgreSQL)
const production = {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    ...postgresConfig
};

module.exports = {
    development,
    production,
    oracle
};

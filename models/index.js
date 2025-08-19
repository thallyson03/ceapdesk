// models/index.js
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: dbConfig.logging,
        pool: dbConfig.pool
    }
);

const db = {};

// Carregar modelos em ordem específica
const modelFiles = fs.readdirSync(__dirname)
    .filter(file => (file.indexOf('.') !== 0) && (file !== 'index.js') && (file.slice(-3) === '.js'))
    .sort((a, b) => {
        // UserSetor deve ser carregado primeiro, depois User, depois Setor
        if (a === 'UserSetor.js') return -1;
        if (b === 'UserSetor.js') return 1;
        if (a === 'User.js') return -1;
        if (b === 'User.js') return 1;
        return a.localeCompare(b);
    });

modelFiles.forEach(file => {
    try {
        const model = require(path.join(__dirname, file))(sequelize, DataTypes);
        db[model.name] = model;
    } catch (error) {
        console.error(`Erro ao carregar ${file}:`, error.message);
    }
});

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.Sequelize = Sequelize;
db.sequelize = sequelize;

module.exports = db;
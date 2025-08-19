// models/RegistroDeAlteracao.js

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const RegistroDeAlteracao = sequelize.define('RegistroDeAlteracao', {
        ticketId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        campo: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        valorAnterior: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        valorNovo: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        usuario: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        dataAlteracao: {
            type: DataTypes.DATE,
            allowNull: false
        }
    });

    return RegistroDeAlteracao;
};
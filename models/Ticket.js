// models/Ticket.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Ticket = sequelize.define('Ticket', {
        titulo: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        descricao: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: 'aberto',
        },
        prioridade: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: 'media'
        },
        setor: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: 'Geral'
        },
        solicitante: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: 'Usuário'
        },
        responsavel: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        dataLimiteSLA: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        diasSLA: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        statusSLA: {
            type: DataTypes.ENUM('dentro_prazo', 'proximo_vencimento', 'vencido'),
            allowNull: false,
            defaultValue: 'dentro_prazo'
        }
    });

    Ticket.associate = (models) => {
        Ticket.hasMany(models.HistoricoTicket, { as: 'historico', foreignKey: 'ticketId' });
        Ticket.hasMany(models.Anotacao, { as: 'anotacoes', foreignKey: 'ticketId' });
    };

    return Ticket;
};
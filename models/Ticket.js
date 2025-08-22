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
        cpfCnpj: {
            type: DataTypes.STRING(18),
            allowNull: true,
            comment: 'CPF ou CNPJ do cliente (formato: 000.000.000-00 ou 00.000.000/0000-00)'
        },
        nomeCliente: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: 'Nome completo do cliente'
        },
        numeroContato: {
            type: DataTypes.STRING(20),
            allowNull: true,
            comment: 'Número de telefone do cliente (formato: (11) 99999-9999)'
        },
        assuntoId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'ID do assunto relacionado ao ticket'
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
        
        // Relacionamento com Assunto (N:1)
        if (models.Assunto) {
            Ticket.belongsTo(models.Assunto, {
                foreignKey: 'assuntoId',
                as: 'assunto'
            });
        }
    };

    return Ticket;
};
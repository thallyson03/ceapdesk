// models/HistoricoTicket.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const HistoricoTicket = sequelize.define('HistoricoTicket', {
        ticketId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        alteracao: {
            type: DataTypes.STRING(255),
            allowNull: false
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

    HistoricoTicket.associate = (models) => {
        HistoricoTicket.belongsTo(models.Ticket, { foreignKey: 'ticketId' });
    };

    return HistoricoTicket;
};
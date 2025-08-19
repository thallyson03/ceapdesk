// models/Anotacao.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Anotacao = sequelize.define('Anotacao', {
        ticketId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        conteudo: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        autor: {
            type: DataTypes.STRING(255),
            allowNull: false
        }
    });

    Anotacao.associate = (models) => {
        Anotacao.belongsTo(models.Ticket, { foreignKey: 'ticketId' });
    };

    return Anotacao;
};
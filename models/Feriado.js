const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Feriado = sequelize.define('Feriado', {
        nome: {
            type: DataTypes.STRING(255),
            allowNull: false,
            comment: 'Nome do feriado'
        },
        data: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: 'Data do feriado (YYYY-MM-DD)'
        },
        tipo: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'nacional',
            comment: 'Tipo do feriado (nacional, estadual, municipal, empresa)'
        },
        ativo: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Se o feriado está ativo'
        },
        descricao: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Descrição opcional do feriado'
        }
    });

    return Feriado;
};

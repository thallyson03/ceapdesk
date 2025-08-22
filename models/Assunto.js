const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Assunto = sequelize.define('Assunto', {
        nome: {
            type: DataTypes.STRING(255),
            allowNull: false,
            comment: 'Nome do assunto'
        },
        descricao: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Descrição opcional do assunto'
        },
        ativo: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Se o assunto está ativo'
        }
    });

    Assunto.associate = (models) => {
        // Relacionamento com Setor (N:1)
        Assunto.belongsTo(models.Setor, {
            foreignKey: 'setorId',
            as: 'setor'
        });

        // Relacionamento com Ticket (1:N)
        if (models.Ticket) {
            Assunto.hasMany(models.Ticket, {
                foreignKey: 'assuntoId',
                as: 'tickets'
            });
        }
    };

    return Assunto;
};

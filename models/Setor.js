const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Setor = sequelize.define('Setor', {
        nome: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
    });

    Setor.associate = (models) => {
        Setor.hasOne(models.SLA, { foreignKey: 'setorId', as: 'sla' });
        
        // Relação muitos-para-muitos com User através da tabela UserSetor
        if (models.User && models.UserSetor) {
            Setor.belongsToMany(models.User, {
                through: models.UserSetor,
                foreignKey: 'setorId',
                otherKey: 'userId',
                as: 'usuarios'
            });
        }

        // Relação um-para-muitos com Assunto
        if (models.Assunto) {
            Setor.hasMany(models.Assunto, {
                foreignKey: 'setorId',
                as: 'assuntos'
            });
        }
    };

    return Setor;
};
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const SLA = sequelize.define('SLA', {
        setorId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Setors',
                key: 'id'
            }
        },
        diasSLA: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 3,
            validate: {
                min: 1,
                max: 365
            }
        },
        descricao: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: 'SLA padrão'
        },
        ativo: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    });

    SLA.associate = (models) => {
        SLA.belongsTo(models.Setor, { foreignKey: 'setorId', as: 'setor' });
    };

    return SLA;
};
















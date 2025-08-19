const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const UserSetor = sequelize.define('UserSetor', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        setorId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Setors',
                key: 'id'
            }
        }
    }, {
        tableName: 'UserSetors',
        timestamps: true
    });

    return UserSetor;
};

const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        username: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        role: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: 'user'
        }
    }, {
        hooks: {
            beforeCreate: async (user) => {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            }
        },
        tableName: 'users', // garante consistência no nome da tabela
        timestamps: true
    });

    User.associate = function(models) {
        User.belongsToMany(models.Setor, {
            through: models.UserSetor,
            foreignKey: 'userId',
            otherKey: 'setorId',
            as: 'setores'
        });
    };

    return User;
};

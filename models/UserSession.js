const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const UserSession = sequelize.define('UserSession', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        username: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        ip: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        userAgent: {
            type: DataTypes.STRING(512),
            allowNull: true
        },
        loginAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        lastActivityAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        logoutAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        tableName: 'user_sessions',
        timestamps: true
    });

    return UserSession;
};


